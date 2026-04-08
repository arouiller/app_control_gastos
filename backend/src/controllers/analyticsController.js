const { Op, fn, col, literal } = require('sequelize');
const { Expense, Category, Installment } = require('../models');
const { success } = require('../utils/response');
const { startOfMonth, endOfMonth, format } = require('../utils/dateHelpers');
const { convertAmount } = require('../services/currencyConversionService');
const logger = require('../utils/logger');

// Note: No conversion logic in backend anymore
// Analytics always works with original amounts
// Frontend handles displayCurrency selection locally

const getSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const start = req.query.startDate || format(startOfMonth(now));
    const end = req.query.endDate || format(endOfMonth(now));

    const expenses = await Expense.findAll({
      where: {
        user_id: req.user.id,
        date: { [Op.between]: [start, end] },
      },
      attributes: ['amount', 'payment_method'],
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const cashTotal = expenses
      .filter((e) => e.payment_method === 'cash')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const cardTotal = expenses
      .filter((e) => e.payment_method === 'credit_card')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    // Previous month comparison
    const prevStart = new Date(start);
    prevStart.setMonth(prevStart.getMonth() - 1);
    const prevEnd = new Date(end);
    prevEnd.setMonth(prevEnd.getMonth() - 1);

    const prevExpenses = await Expense.findAll({
      where: {
        user_id: req.user.id,
        date: { [Op.between]: [format(prevStart), format(prevEnd)] },
      },
      attributes: ['amount'],
    });
    const prevTotal = prevExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const startDate = new Date(start);
    const endDate = new Date(end);
    const days = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));

    return success(res, {
      period: { startDate: start, endDate: end },
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      totalTransactions: expenses.length,
      averageDaily: parseFloat((totalExpenses / days).toFixed(2)),
      cashTotal: parseFloat(cashTotal.toFixed(2)),
      cardTotal: parseFloat(cardTotal.toFixed(2)),
      cashPercentage: totalExpenses > 0 ? parseFloat(((cashTotal / totalExpenses) * 100).toFixed(2)) : 0,
      cardPercentage: totalExpenses > 0 ? parseFloat(((cardTotal / totalExpenses) * 100).toFixed(2)) : 0,
      comparisonWithPreviousMonth: {
        difference: parseFloat((totalExpenses - prevTotal).toFixed(2)),
        percentageChange: prevTotal > 0
          ? parseFloat((((totalExpenses - prevTotal) / prevTotal) * 100).toFixed(2))
          : 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getByCategory = async (req, res, next) => {
  try {
    const now = new Date();
    const start = req.query.startDate || format(startOfMonth(now));
    const end = req.query.endDate || format(endOfMonth(now));

    const results = await Expense.findAll({
      where: {
        user_id: req.user.id,
        date: { [Op.between]: [start, end] },
      },
      attributes: [
        'category_id',
        [fn('SUM', col('amount')), 'totalAmount'],
        [fn('COUNT', col('Expense.id')), 'transactionCount'],
        [fn('AVG', col('amount')), 'averageAmount'],
      ],
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'color'],
      }],
      group: ['category_id', 'category.id', 'category.name', 'category.color'],
      order: [[literal('totalAmount'), 'DESC']],
    });

    const totalExpenses = results.reduce((sum, r) => sum + parseFloat(r.dataValues.totalAmount || 0), 0);

    const data = results.map((r) => ({
      categoryId: r.category_id,
      categoryName: r.category?.name,
      color: r.category?.color,
      totalAmount: parseFloat(parseFloat(r.dataValues.totalAmount || 0).toFixed(2)),
      percentage: totalExpenses > 0
        ? parseFloat(((parseFloat(r.dataValues.totalAmount) / totalExpenses) * 100).toFixed(2))
        : 0,
      transactionCount: parseInt(r.dataValues.transactionCount),
      averageTransaction: parseFloat(parseFloat(r.dataValues.averageAmount || 0).toFixed(2)),
    }));

    return success(res, { categories: data, totalExpenses: parseFloat(totalExpenses.toFixed(2)) });
  } catch (err) {
    next(err);
  }
};

const getCashVsCard = async (req, res, next) => {
  try {
    const now = new Date();
    const start = req.query.startDate || format(startOfMonth(now));
    const end = req.query.endDate || format(endOfMonth(now));

    const expenses = await Expense.findAll({
      where: {
        user_id: req.user.id,
        date: { [Op.between]: [start, end] },
      },
      attributes: ['date', 'amount', 'payment_method'],
      order: [['date', 'ASC']],
    });

    const cashTotal = expenses.filter((e) => e.payment_method === 'cash')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const cardTotal = expenses.filter((e) => e.payment_method === 'credit_card')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const grandTotal = cashTotal + cardTotal;

    // Build timeline grouped by day
    const timelineMap = {};
    expenses.forEach((e) => {
      const day = e.date;
      if (!timelineMap[day]) timelineMap[day] = { date: day, cash: 0, card: 0, total: 0 };
      const amount = parseFloat(e.amount);
      if (e.payment_method === 'cash') timelineMap[day].cash += amount;
      else timelineMap[day].card += amount;
      timelineMap[day].total += amount;
    });

    const timeline = Object.values(timelineMap).map((d) => ({
      date: d.date,
      cash: parseFloat(d.cash.toFixed(2)),
      card: parseFloat(d.card.toFixed(2)),
      total: parseFloat(d.total.toFixed(2)),
    }));

    return success(res, {
      summary: {
        cashTotal: parseFloat(cashTotal.toFixed(2)),
        cardTotal: parseFloat(cardTotal.toFixed(2)),
        grandTotal: parseFloat(grandTotal.toFixed(2)),
        cashPercentage: grandTotal > 0 ? parseFloat(((cashTotal / grandTotal) * 100).toFixed(2)) : 0,
        cardPercentage: grandTotal > 0 ? parseFloat(((cardTotal / grandTotal) * 100).toFixed(2)) : 0,
      },
      timeline,
    });
  } catch (err) {
    next(err);
  }
};

const getPendingInstallments = async (req, res, next) => {
  try {
    const daysAhead = parseInt(req.query.daysAhead || 30);
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const installments = await Installment.findAll({
      where: {
        is_paid: false,
        due_date: { [Op.lte]: format(futureDate) },
      },
      include: [{
        model: Expense,
        as: 'expense',
        where: { user_id: req.user.id },
        include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'color'] }],
      }],
      order: [['due_date', 'ASC']],
    });

    const data = installments.map((i) => ({
      id: i.id,
      expenseId: i.expense_id,
      description: i.expense?.description,
      categoryName: i.expense?.category?.name,
      amount: parseFloat(i.amount),
      dueDate: i.due_date,
      daysUntilDue: Math.ceil((new Date(i.due_date) - today) / (1000 * 60 * 60 * 24)),
      installmentNumber: i.installment_number,
      totalInstallments: i.total_installments,
    }));

    const totalAmount = data.reduce((sum, i) => sum + i.amount, 0);

    return success(res, {
      totalPending: data.length,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      installments: data,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary, getByCategory, getCashVsCard, getPendingInstallments };
