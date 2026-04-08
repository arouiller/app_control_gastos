const { Op } = require('sequelize');
const { Expense, Category, Installment } = require('../models');
const { success, created, error, paginated } = require('../utils/response');
const { addMonths, format } = require('../utils/dateHelpers');
const { convertAmount } = require('../services/currencyConversionService');
const logger = require('../utils/logger');
const { sequelize } = require('../models');

const listExpenses = async (req, res, next) => {
  try {
    const {
      startDate, endDate, categoryId, paymentMethod,
      minAmount, maxAmount, search,
      page = 1, limit = 20, sort = '-expense_date',
      currency,
    } = req.query;

    // Build WHERE clause
    let whereClause = 'WHERE ewc.user_id = ?';
    const params = [req.user.id];

    if (startDate || endDate) {
      if (startDate) {
        whereClause += ' AND ewc.expense_date >= ?';
        params.push(startDate);
      }
      if (endDate) {
        whereClause += ' AND ewc.expense_date <= ?';
        params.push(endDate);
      }
    }
    if (categoryId) {
      whereClause += ' AND ewc.category_id = ?';
      params.push(categoryId);
    }
    if (paymentMethod) {
      whereClause += ' AND ewc.payment_method = ?';
      params.push(paymentMethod);
    }
    if (currency && ['ARS', 'USD'].includes(currency)) {
      whereClause += ' AND ewc.original_currency = ?';
      params.push(currency);
    }
    if (minAmount || maxAmount) {
      if (minAmount) {
        whereClause += ' AND ewc.original_amount >= ?';
        params.push(parseFloat(minAmount));
      }
      if (maxAmount) {
        whereClause += ' AND ewc.original_amount <= ?';
        params.push(parseFloat(maxAmount));
      }
    }
    if (search) {
      whereClause += ' AND ewc.description LIKE ?';
      params.push(`%${search}%`);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM expenses_with_conversions ewc ${whereClause}`;
    const [countResult] = await sequelize.query(countQuery, { replacements: params });
    const count = countResult[0].count;

    // Determine sort
    const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
    const sortDir = sort.startsWith('-') ? 'DESC' : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get expenses from view with category data
    const dataQuery = `
      SELECT
        ewc.id,
        ewc.user_id,
        ewc.category_id,
        ewc.description,
        ewc.original_amount,
        ewc.original_currency,
        ewc.amount_in_ars,
        ewc.amount_in_usd,
        ewc.expense_date,
        ewc.payment_method,
        ewc.is_installment,
        ewc.installment_group_id,
        ewc.exchange_rate_used,
        ewc.exchange_rate_date,
        ewc.notes,
        ewc.created_at,
        ewc.updated_at,
        c.id as cat_id,
        c.name as cat_name,
        c.color as cat_color,
        c.icon as cat_icon
      FROM expenses_with_conversions ewc
      LEFT JOIN categories c ON ewc.category_id = c.id
      ${whereClause}
      ORDER BY ewc.${sortField} ${sortDir}
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), offset);

    const expenses = await sequelize.query(dataQuery, {
      replacements: params,
      type: sequelize.QueryTypes.SELECT,
    });

    // Format response with nested category
    const formattedExpenses = expenses.map(exp => ({
      id: exp.id,
      user_id: exp.user_id,
      category_id: exp.category_id,
      description: exp.description,
      original_amount: parseFloat(exp.original_amount),
      original_currency: exp.original_currency,
      amount_in_ars: exp.amount_in_ars ? parseFloat(exp.amount_in_ars) : null,
      amount_in_usd: exp.amount_in_usd ? parseFloat(exp.amount_in_usd) : null,
      date: exp.expense_date,
      payment_method: exp.payment_method,
      is_installment: exp.is_installment,
      exchange_rate_used: exp.exchange_rate_used ? parseFloat(exp.exchange_rate_used) : null,
      exchange_rate_date: exp.exchange_rate_date,
      notes: exp.notes,
      category: exp.cat_id ? {
        id: exp.cat_id,
        name: exp.cat_name,
        color: exp.cat_color,
        icon: exp.cat_icon,
      } : null,
    }));

    const totalPages = Math.ceil(count / parseInt(limit));
    return paginated(res, formattedExpenses, {
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
    // Get expense from view with conversions
    const expenseQuery = `
      SELECT
        ewc.id,
        ewc.user_id,
        ewc.category_id,
        ewc.description,
        ewc.original_amount,
        ewc.original_currency,
        ewc.amount_in_ars,
        ewc.amount_in_usd,
        ewc.expense_date,
        ewc.payment_method,
        ewc.is_installment,
        ewc.installment_group_id,
        ewc.exchange_rate_used,
        ewc.exchange_rate_date,
        ewc.notes,
        ewc.created_at,
        ewc.updated_at,
        c.id as cat_id,
        c.name as cat_name,
        c.color as cat_color,
        c.icon as cat_icon
      FROM expenses_with_conversions ewc
      LEFT JOIN categories c ON ewc.category_id = c.id
      WHERE ewc.id = ? AND ewc.user_id = ?
      LIMIT 1
    `;
    const [expenseData] = await sequelize.query(expenseQuery, {
      replacements: [req.params.id, req.user.id],
      type: sequelize.QueryTypes.SELECT,
    });

    if (!expenseData) return error(res, 'Gasto no encontrado', 404);

    // Get installments if applicable
    const installments = await Installment.findAll({
      where: { expense_id: req.params.id },
      order: [['installment_number', 'ASC']],
    });

    // Format response
    const response = {
      id: expenseData.id,
      user_id: expenseData.user_id,
      category_id: expenseData.category_id,
      description: expenseData.description,
      original_amount: parseFloat(expenseData.original_amount),
      original_currency: expenseData.original_currency,
      amount_in_ars: expenseData.amount_in_ars ? parseFloat(expenseData.amount_in_ars) : null,
      amount_in_usd: expenseData.amount_in_usd ? parseFloat(expenseData.amount_in_usd) : null,
      date: expenseData.expense_date,
      payment_method: expenseData.payment_method,
      is_installment: expenseData.is_installment,
      installment_group_id: expenseData.installment_group_id,
      exchange_rate_used: expenseData.exchange_rate_used ? parseFloat(expenseData.exchange_rate_used) : null,
      exchange_rate_date: expenseData.exchange_rate_date,
      notes: expenseData.notes,
      category: expenseData.cat_id ? {
        id: expenseData.cat_id,
        name: expenseData.cat_name,
        color: expenseData.cat_color,
        icon: expenseData.cat_icon,
      } : null,
      installments: installments.map(i => i.toJSON()),
    };

    return success(res, response);
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
