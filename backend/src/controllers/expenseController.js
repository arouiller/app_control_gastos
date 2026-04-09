const { Op } = require('sequelize');
const { Expense, Category } = require('../models');
const { sequelize } = require('../models');
const { success, created, error, paginated } = require('../utils/response');
const { addMonths, format } = require('../utils/dateHelpers');
const { convertAmount } = require('../services/currencyConversionService');
const { EXPENSE_SELECT_FIELDS, formatExpenseRow, buildExpenseWhereClause } = require('../utils/expenseQueryHelpers');

const listExpenses = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sort = '-expense_date' } = req.query;
    const { whereClause, params } = buildExpenseWhereClause(req.query, req.user.id);

    const [countResult] = await sequelize.query(
      `SELECT COUNT(*) as count FROM expenses_with_conversions ewc ${whereClause}`,
      { replacements: params }
    );
    const count = countResult[0].count;

    const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
    const sortDir = sort.startsWith('-') ? 'DESC' : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const queryParams = [...params, parseInt(limit), offset];
    const expenses = await sequelize.query(
      `SELECT ${EXPENSE_SELECT_FIELDS} ${whereClause} ORDER BY ewc.${sortField} ${sortDir} LIMIT ? OFFSET ?`,
      { replacements: queryParams, type: sequelize.QueryTypes.SELECT }
    );

    const totalPages = Math.ceil(count / parseInt(limit));
    return paginated(res, expenses.map(formatExpenseRow), {
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
    const [expenseData] = await sequelize.query(
      `SELECT ${EXPENSE_SELECT_FIELDS} WHERE ewc.id = ? AND ewc.user_id = ? LIMIT 1`,
      { replacements: [req.params.id, req.user.id], type: sequelize.QueryTypes.SELECT }
    );

    if (!expenseData) return error(res, 'Gasto no encontrado', 404);

    // RF-519: if parent installment expense, return children
    let installments = [];
    if (expenseData.is_installment && !expenseData.installment_group_id) {
      const children = await Expense.findAll({
        where: { installment_group_id: expenseData.id },
        order: [['installment_number', 'ASC']],
        attributes: ['id', 'installment_number', 'total_installments', 'amount', 'currency', 'date', 'notes'],
      });
      installments = children.map(i => i.toJSON());
    }

    const base = formatExpenseRow(expenseData);
    const installmentAmount = base.total_installments
      ? parseFloat((base.original_amount / base.total_installments).toFixed(2))
      : null;

    return success(res, { ...base, installment_amount: installmentAmount, installments });
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

const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!expense) return error(res, 'Gasto no encontrado', 404);

    // RF-510: child installment expenses are not directly editable
    if (expense.installment_group_id !== null) {
      return error(res, 'No se puede editar una cuota individualmente. Edita el gasto padre.', 403);
    }

    const { description, amount, date, categoryId, paymentMethod, notes, currency, numberOfInstallments, isInstallment } = req.body;
    const updates = {};
    if (description !== undefined) updates.description = description;
    if (amount !== undefined) updates.amount = parseFloat(amount);
    if (date !== undefined) updates.date = date;
    if (currency !== undefined) updates.currency = currency;
    if (categoryId !== undefined) {
      const category = await Category.findOne({ where: { id: categoryId, user_id: req.user.id } });
      if (!category) return error(res, 'Categoría no encontrada', 404);
      updates.category_id = categoryId;
    }
    if (paymentMethod !== undefined) updates.payment_method = paymentMethod;
    if (notes !== undefined) updates.notes = notes;

    // Case: converting installment → regular expense
    if (expense.is_installment && expense.installment_group_id === null && isInstallment === false) {
      await sequelize.transaction(async (t) => {
        await Expense.destroy({ where: { installment_group_id: expense.id }, transaction: t });
        updates.is_installment = false;
        updates.total_installments = null;
        updates.installment_number = null;
        await expense.update(updates, { transaction: t });
      });
      await expense.reload();
      return success(res, expense, 'Gasto actualizado');
    }

    // Case: converting regular expense → installment
    if (!expense.is_installment && isInstallment === true) {
      const numInstallments = parseInt(numberOfInstallments);
      if (!numInstallments || numInstallments < 2 || numInstallments > 36) {
        return error(res, 'El número de cuotas debe ser entre 2 y 36', 400);
      }
      const totalAmount = updates.amount !== undefined ? updates.amount : parseFloat(expense.amount);
      const installmentAmount = parseFloat((totalAmount / numInstallments).toFixed(2));
      const baseDate = updates.date || expense.date;

      await sequelize.transaction(async (t) => {
        updates.is_installment = true;
        updates.total_installments = numInstallments;
        await expense.update(updates, { transaction: t });
        const childrenData = [];
        for (let i = 1; i <= numInstallments; i++) {
          childrenData.push({
            user_id: req.user.id,
            category_id: updates.category_id || expense.category_id,
            description: updates.description || expense.description,
            amount: installmentAmount,
            currency: updates.currency || expense.currency,
            date: format(addMonths(new Date(baseDate), i - 1)),
            payment_method: updates.payment_method || expense.payment_method,
            is_installment: true,
            total_installments: numInstallments,
            installment_number: i,
            installment_group_id: expense.id,
            notes: updates.notes !== undefined ? updates.notes : expense.notes,
          });
        }
        await Expense.bulkCreate(childrenData, { transaction: t });
      });
      await expense.reload();
      return success(res, expense, 'Gasto actualizado');
    }

    // RF-509: if it's a parent installment, update all children too
    if (expense.is_installment && expense.installment_group_id === null) {
      const newTotalInstallments = numberOfInstallments
        ? parseInt(numberOfInstallments)
        : expense.total_installments;

      if (newTotalInstallments < 2 || newTotalInstallments > 36) {
        return error(res, 'El número de cuotas debe ser entre 2 y 36', 400);
      }

      const newTotal = updates.amount || parseFloat(expense.amount);
      const newInstallmentAmount = parseFloat((newTotal / newTotalInstallments).toFixed(2));

      updates.total_installments = newTotalInstallments;

      await sequelize.transaction(async (t) => {
        await expense.update(updates, { transaction: t });

        if (newTotalInstallments !== expense.total_installments) {
          // Delete excess children (if reducing installments)
          await Expense.destroy({
            where: {
              installment_group_id: expense.id,
              installment_number: { [Op.gt]: newTotalInstallments },
            },
            transaction: t,
          });
        }

        // Update or create children 1..newTotalInstallments
        const existingChildren = await Expense.findAll({
          where: { installment_group_id: expense.id },
          transaction: t,
        });
        const existingByNumber = {};
        existingChildren.forEach(c => { existingByNumber[c.installment_number] = c; });

        const baseDate = updates.date || expense.date;

        const childUpdates = {};
        if (description !== undefined) childUpdates.description = description;
        if (currency !== undefined) childUpdates.currency = currency;
        if (categoryId !== undefined) childUpdates.category_id = categoryId;
        if (paymentMethod !== undefined) childUpdates.payment_method = paymentMethod;
        if (notes !== undefined) childUpdates.notes = notes;
        childUpdates.amount = newInstallmentAmount;
        childUpdates.total_installments = newTotalInstallments;

        for (let i = 1; i <= newTotalInstallments; i++) {
          // Each child gets its own date: base date + (i-1) months
          const childDate = format(addMonths(new Date(baseDate), i - 1));
          if (existingByNumber[i]) {
            await existingByNumber[i].update({ ...childUpdates, date: childDate }, { transaction: t });
          } else {
            // Create new child if adding installments
            await Expense.create({
              user_id: req.user.id,
              category_id: updates.category_id || expense.category_id,
              description: updates.description || expense.description,
              amount: newInstallmentAmount,
              currency: updates.currency || expense.currency,
              date: childDate,
              payment_method: updates.payment_method || expense.payment_method,
              is_installment: true,
              total_installments: newTotalInstallments,
              installment_number: i,
              installment_group_id: expense.id,
              notes: updates.notes !== undefined ? updates.notes : expense.notes,
            }, { transaction: t });
          }
        }
      });

      await expense.reload();
      return success(res, expense, 'Gasto actualizado');
    }

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

    // RF-521: reject direct deletion of child installment
    if (expense.installment_group_id !== null) {
      return error(res, 'No se puede eliminar una cuota individualmente. Eliminá el gasto padre.', 403);
    }

    await expense.destroy(); // CASCADE FK deletes children automatically
    return success(res, null, 'Gasto eliminado');
  } catch (err) {
    next(err);
  }
};

const getDateRange = async (req, res, next) => {
  try {
    const [result] = await sequelize.query(
      `SELECT MIN(DATE(date)) as firstDate, MAX(DATE(date)) as lastDate
       FROM expenses WHERE user_id = ?`,
      { replacements: [req.user.id], type: sequelize.QueryTypes.SELECT }
    );
    return success(res, { firstDate: result.firstDate, lastDate: result.lastDate });
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

module.exports = { listExpenses, getExpense, createExpense, updateExpense, deleteExpense, convertAdhoc, getDateRange };
