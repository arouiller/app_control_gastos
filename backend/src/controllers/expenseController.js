const { Op } = require('sequelize');
const { Expense, Category, Installment } = require('../models');
const { success, created, error, paginated } = require('../utils/response');
const { addMonths, format } = require('../utils/dateHelpers');
const { convertAmount } = require('../services/currencyConversionService');
const logger = require('../utils/logger');

const listExpenses = async (req, res, next) => {
  try {
    const {
      startDate, endDate, categoryId, paymentMethod,
      minAmount, maxAmount, search,
      page = 1, limit = 20, sort = '-date',
      currency, displayCurrency = 'original',
    } = req.query;

    const where = { user_id: req.user.id };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }
    if (categoryId) where.category_id = categoryId;
    if (paymentMethod) where.payment_method = paymentMethod;
    if (currency && ['ARS', 'USD'].includes(currency)) {
      where.currency = currency;
    }
    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount[Op.gte] = parseFloat(minAmount);
      if (maxAmount) where.amount[Op.lte] = parseFloat(maxAmount);
    }
    if (search) {
      where.description = { [Op.like]: `%${search}%` };
    }

    const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
    const sortDir = sort.startsWith('-') ? 'DESC' : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows, count } = await Expense.findAndCountAll({
      where,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'color', 'icon'] }],
      order: [[sortField, sortDir]],
      limit: parseInt(limit),
      offset,
    });

    // Apply conversions if displayCurrency is requested
    let expenses = rows;
    if (displayCurrency && displayCurrency !== 'original') {
      expenses = await Promise.all(
        rows.map(async (expense) => {
          const exp = expense.toJSON();

          // Only convert if the currency is different from the display currency
          if (exp.currency !== displayCurrency) {
            try {
              const conversion = await convertAmount(
                exp.amount,
                exp.currency,
                displayCurrency,
                exp.date
              );
              exp.converted_amount = conversion.convertedAmount;
              exp.converted_currency = displayCurrency;
              exp.exchange_rate = conversion.exchangeRate;
              exp.exchange_rate_date = conversion.exchangeRateDate;
            } catch (convErr) {
              // Log the error but continue (RNF-405: no bloquear si falta cotización)
              logger.warn(`[ListExpenses] Error convirtiendo gasto ${exp.id}: ${convErr.message}`);
            }
          }

          return exp;
        })
      );
    }

    const totalPages = Math.ceil(count / parseInt(limit));
    return paginated(res, expenses, {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: totalPages,
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1,
    });
  } catch (err) {
    next(err);
  }
};

const getExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'color', 'icon'] },
        { model: Installment, as: 'installments', order: [['installment_number', 'ASC']] },
      ],
    });
    if (!expense) return error(res, 'Gasto no encontrado', 404);

    const expenseData = expense.toJSON();

    // Add conversions to the response
    try {
      if (expenseData.currency === 'ARS') {
        const convToUsd = await convertAmount(expenseData.amount, 'ARS', 'USD', expenseData.date);
        expenseData.converted_to_usd = convToUsd.convertedAmount;
        expenseData.exchange_rate_used = convToUsd.exchangeRate;
        expenseData.exchange_rate_date = convToUsd.exchangeRateDate;
      } else if (expenseData.currency === 'USD') {
        const convToArs = await convertAmount(expenseData.amount, 'USD', 'ARS', expenseData.date);
        expenseData.converted_to_ars = convToArs.convertedAmount;
        expenseData.exchange_rate_used = convToArs.exchangeRate;
        expenseData.exchange_rate_date = convToArs.exchangeRateDate;
      }
    } catch (convErr) {
      logger.warn(`[GetExpense] Error convirtiendo gasto ${expenseData.id}: ${convErr.message}`);
    }

    return success(res, expenseData);
  } catch (err) {
    next(err);
  }
};

const createExpense = async (req, res, next) => {
  try {
    const { description, amount, date, categoryId, paymentMethod, notes, currency = 'ARS' } = req.body;

    // Verify category belongs to user
    const category = await Category.findOne({
      where: { id: categoryId, user_id: req.user.id },
    });
    if (!category) return error(res, 'Categoría no encontrada', 404);

    const expense = await Expense.create({
      user_id: req.user.id,
      category_id: categoryId,
      description,
      amount,
      currency,
      date,
      payment_method: paymentMethod,
      notes,
    });

    return created(res, expense, 'Gasto registrado');
  } catch (err) {
    next(err);
  }
};

const createInstallmentExpense = async (req, res, next) => {
  try {
    const { description, amount, date, categoryId, paymentMethod, numberOfInstallments, notes, currency = 'ARS' } = req.body;

    const category = await Category.findOne({
      where: { id: categoryId, user_id: req.user.id },
    });
    if (!category) return error(res, 'Categoría no encontrada', 404);

    const numInstallments = parseInt(numberOfInstallments);
    if (numInstallments < 1 || numInstallments > 24) {
      return error(res, 'El número de cuotas debe ser entre 1 y 24', 400);
    }

    const installmentAmount = parseFloat((parseFloat(amount) / numInstallments).toFixed(2));

    // Create main expense
    const mainExpense = await Expense.create({
      user_id: req.user.id,
      category_id: categoryId,
      description,
      amount,
      currency,
      date,
      payment_method: paymentMethod || 'credit_card',
      is_installment: true,
      notes,
    });

    // Create installments
    const startDate = new Date(date);
    const installmentsData = [];
    for (let i = 1; i <= numInstallments; i++) {
      const dueDate = addMonths(startDate, i);
      installmentsData.push({
        expense_id: mainExpense.id,
        installment_number: i,
        total_installments: numInstallments,
        amount: installmentAmount,
        due_date: format(dueDate),
        is_paid: false,
      });
    }

    const installments = await Installment.bulkCreate(installmentsData);

    return res.status(201).json({
      success: true,
      message: 'Gasto en cuotas registrado',
      data: {
        installmentGroupId: mainExpense.id,
        mainExpense,
        installments,
      },
    });
  } catch (err) {
    next(err);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!expense) return error(res, 'Gasto no encontrado', 404);

    const { description, amount, date, categoryId, paymentMethod, notes, currency } = req.body;
    const updates = {};
    if (description !== undefined) updates.description = description;
    if (amount !== undefined) updates.amount = amount;
    if (date !== undefined) updates.date = date;
    if (currency !== undefined) updates.currency = currency;
    if (categoryId !== undefined) {
      const category = await Category.findOne({ where: { id: categoryId, user_id: req.user.id } });
      if (!category) return error(res, 'Categoría no encontrada', 404);
      updates.category_id = categoryId;
    }
    if (paymentMethod !== undefined) updates.payment_method = paymentMethod;
    if (notes !== undefined) updates.notes = notes;

    await expense.update(updates);
    return success(res, expense, 'Gasto actualizado');
  } catch (err) {
    next(err);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!expense) return error(res, 'Gasto no encontrado', 404);

    await expense.destroy();
    return success(res, null, 'Gasto eliminado');
  } catch (err) {
    next(err);
  }
};

const convertAdhoc = async (req, res, next) => {
  try {
    const { amount, from_currency, to_currency, date } = req.query;

    // Validate required parameters
    if (!amount || !from_currency || !to_currency || !date) {
      return error(res, 'Parámetros requeridos: amount, from_currency, to_currency, date', 400);
    }

    // Validate currencies
    if (!['ARS', 'USD'].includes(from_currency) || !['ARS', 'USD'].includes(to_currency)) {
      return error(res, "Monedas inválidas. Use 'ARS' o 'USD'", 400);
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return error(res, 'El monto debe ser un número positivo', 400);
    }

    const conversion = await convertAmount(parsedAmount, from_currency, to_currency, date);

    return success(res, {
      original_amount: parsedAmount,
      original_currency: from_currency,
      converted_amount: conversion.convertedAmount,
      converted_currency: to_currency,
      exchange_rate: conversion.exchangeRate,
      exchange_rate_date: conversion.exchangeRateDate,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { listExpenses, getExpense, createExpense, createInstallmentExpense, updateExpense, deleteExpense, convertAdhoc };
