const { Op, fn, col, literal } = require('sequelize');
const { Expense, Category, Installment } = require('../models');
const { success } = require('../utils/response');
const { startOfMonth, endOfMonth, format } = require('../utils/dateHelpers');
const { convertAmount } = require('../services/currencyConversionService');
const logger = require('../utils/logger');

// Helper to convert expense amount if needed
async function convertExpenseAmountIfNeeded(expense, displayCurrency) {
  if (!displayCurrency || displayCurrency === 'original') {
    return parseFloat(expense.amount);
  }

  if (expense.currency === displayCurrency) {
    return parseFloat(expense.amount);
  }

  try {
    const conversion = await convertAmount(
      parseFloat(expense.amount),
      expense.currency || 'ARS',
      displayCurrency,
      expense.date
    );
    return conversion.convertedAmount;
  } catch (err) {
    logger.warn(`[Analytics] Error convirtiendo gasto ${expense.id}: ${err.message}`);
    return parseFloat(expense.amount); // fallback to original
  }
}

const getSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const start = req.query.startDate || format(startOfMonth(now));
    const end = req.query.endDate || format(endOfMonth(now));
    const displayCurrency = req.query.displayCurrency || 'original';

    const expenses = await Expense.findAll({
      where: {
        user_id: req.user.id,
        date: { [Op.between]: [start, end] },
      },
      attributes: ['amount', 'payment_method', 'currency', 'date'],
    });

    // Convert amounts if needed
    const convertedExpenses = await Promise.all(
      expenses.map(async (e) => ({
        ...e.toJSON(),
        convertedAmount: await convertExpenseAmountIfNeeded(e, displayCurrency),
      }))
    );

    const totalExpenses = convertedExpenses.reduce((sum, e) => sum + e.convertedAmount, 0);
    const cashTotal = convertedExpenses
      .filter((e) => e.payment_method === 'cash')
      .reduce((sum, e) => sum + e.convertedAmount, 0);
    const cardTotal = convertedExpenses
      .filter((e) => e.payment_method === 'credit_card')
      .reduce((sum, e) => sum + e.convertedAmount, 0);

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
      attributes: ['amount', 'currency', 'date'],
    });

    const convertedPrevExpenses = await Promise.all(
      prevExpenses.map(async (e) => ({
        ...e.toJSON(),
        convertedAmount: await convertExpenseAmountIfNeeded(e, displayCurrency),
      }))
    );
    const prevTotal = convertedPrevExpenses.reduce((sum, e) => sum + e.convertedAmount, 0);

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
    const displayCurrency = req.query.displayCurrency || 'original';

    const expenses = await Expense.findAll({
      where: {
        user_id: req.user.id,
        date: { [Op.between]: [start, end] },
      },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'color'],
      }],
      attributes: ['category_id', 'amount', 'currency', 'date'],
    });

    // Convert amounts if needed
    const convertedExpenses = await Promise.all(
      expenses.map(async (e) => ({
        category_id: e.category_id,
        categoryName: e.category?.name,
        categoryColor: e.category?.color,
        amount: await convertExpenseAmountIfNeeded(e, displayCurrency),
      }))
    );

    // Group by category
    const categoryMap = {};
    convertedExpenses.forEach((e) => {
      if (!categoryMap[e.category_id]) {
        categoryMap[e.category_id] = {
          categoryId: e.category_id,
          categoryName: e.categoryName,
          color: e.categoryColor,
          totalAmount: 0,
          transactionCount: 0,
          amounts: [],
        };
      }
      categoryMap[e.category_id].totalAmount += e.amount;
      categoryMap[e.category_id].transactionCount += 1;
      categoryMap[e.category_id].amounts.push(e.amount);
    });

    const results = Object.values(categoryMap);
    const totalExpenses = results.reduce((sum, r) => sum + r.totalAmount, 0);

    const data = results.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      color: r.color,
      totalAmount: parseFloat(r.totalAmount.toFixed(2)),
      percentage: totalExpenses > 0
        ? parseFloat(((r.totalAmount / totalExpenses) * 100).toFixed(2))
        : 0,
      transactionCount: r.transactionCount,
      averageTransaction: parseFloat((r.totalAmount / r.transactionCount).toFixed(2)),
    })).sort((a, b) => b.totalAmount - a.totalAmount);

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
    const displayCurrency = req.query.displayCurrency || 'original';

    const expenses = await Expense.findAll({
      where: {
        user_id: req.user.id,
        date: { [Op.between]: [start, end] },
      },
      attributes: ['date', 'amount', 'payment_method', 'currency'],
      order: [['date', 'ASC']],
    });

    // Convert amounts if needed
    const convertedExpenses = await Promise.all(
      expenses.map(async (e) => ({
        date: e.date,
        amount: await convertExpenseAmountIfNeeded(e, displayCurrency),
        payment_method: e.payment_method,
      }))
    );

    const cashTotal = convertedExpenses.filter((e) => e.payment_method === 'cash')
      .reduce((sum, e) => sum + e.amount, 0);
    const cardTotal = convertedExpenses.filter((e) => e.payment_method === 'credit_card')
      .reduce((sum, e) => sum + e.amount, 0);
    const grandTotal = cashTotal + cardTotal;

    // Build timeline grouped by day
    const timelineMap = {};
    convertedExpenses.forEach((e) => {
      const day = e.date;
      if (!timelineMap[day]) timelineMap[day] = { date: day, cash: 0, card: 0, total: 0 };
      const amount = e.amount;
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
    const displayCurrency = req.query.displayCurrency || 'original';
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
        attributes: ['id', 'description', 'currency', 'date'],
        include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'color'] }],
      }],
      attributes: ['id', 'expense_id', 'amount', 'due_date', 'installment_number', 'total_installments'],
      order: [['due_date', 'ASC']],
    });

    const data = await Promise.all(
      installments.map(async (i) => ({
        id: i.id,
        expenseId: i.expense_id,
        description: i.expense?.description,
        categoryName: i.expense?.category?.name,
        amount: displayCurrency && displayCurrency !== 'original'
          ? (await convertExpenseAmountIfNeeded({ amount: i.amount, currency: i.expense?.currency || 'ARS', date: i.expense?.date }, displayCurrency))
          : parseFloat(i.amount),
        dueDate: i.due_date,
        daysUntilDue: Math.ceil((new Date(i.due_date) - today) / (1000 * 60 * 60 * 24)),
        installmentNumber: i.installment_number,
        totalInstallments: i.total_installments,
      }))
    );

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
