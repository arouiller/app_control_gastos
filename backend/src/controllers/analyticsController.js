const { Expense, Category, sequelize } = require('../models');
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

    // Get expenses from view (with conversions)
    const expenses = await sequelize.query(
      `SELECT original_amount, amount_in_ars, amount_in_usd, payment_method
       FROM expenses_with_conversions
       WHERE user_id = ? AND expense_date BETWEEN ? AND ?
         AND (is_installment = FALSE OR installment_group_id IS NOT NULL)`,
      { replacements: [req.user.id, start, end], type: sequelize.QueryTypes.SELECT }
    );

    // Helper to aggregate by display type
    const aggregate = (expenseList, amountField) => {
      const total = expenseList.reduce((sum, e) => sum + parseFloat(e[amountField] || 0), 0);
      const cash = expenseList
        .filter((e) => e.payment_method === 'cash')
        .reduce((sum, e) => sum + parseFloat(e[amountField] || 0), 0);
      const card = expenseList
        .filter((e) => e.payment_method === 'credit_card')
        .reduce((sum, e) => sum + parseFloat(e[amountField] || 0), 0);
      return { totalExpenses: total, cashTotal: cash, cardTotal: card };
    };

    // Aggregate for all three currency representations
    const summaryByOriginal = aggregate(expenses, 'original_amount');
    const summaryInArs = aggregate(expenses, 'amount_in_ars');
    const summaryInUsd = aggregate(expenses, 'amount_in_usd');

    // Get previous month for comparison
    const prevStart = new Date(start);
    prevStart.setMonth(prevStart.getMonth() - 1);
    const prevEnd = new Date(end);
    prevEnd.setMonth(prevEnd.getMonth() - 1);

    const prevExpenses = await sequelize.query(
      `SELECT original_amount, amount_in_ars, amount_in_usd
       FROM expenses_with_conversions
       WHERE user_id = ? AND expense_date BETWEEN ? AND ?
         AND (is_installment = FALSE OR installment_group_id IS NOT NULL)`,
      { replacements: [req.user.id, format(prevStart), format(prevEnd)], type: sequelize.QueryTypes.SELECT }
    );

    const prevSummaryByOriginal = aggregate(prevExpenses, 'original_amount');
    const prevSummaryInArs = aggregate(prevExpenses, 'amount_in_ars');
    const prevSummaryInUsd = aggregate(prevExpenses, 'amount_in_usd');

    const startDate = new Date(start);
    const endDate = new Date(end);
    const days = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));

    // Helper to format summary with calculations
    const formatSummary = (summary, days) => ({
      totalExpenses: parseFloat(summary.totalExpenses.toFixed(2)),
      totalTransactions: expenses.length,
      averageDaily: parseFloat((summary.totalExpenses / days).toFixed(2)),
      cashTotal: parseFloat(summary.cashTotal.toFixed(2)),
      cardTotal: parseFloat(summary.cardTotal.toFixed(2)),
      cashPercentage: summary.totalExpenses > 0
        ? parseFloat(((summary.cashTotal / summary.totalExpenses) * 100).toFixed(2))
        : 0,
      cardPercentage: summary.totalExpenses > 0
        ? parseFloat(((summary.cardTotal / summary.totalExpenses) * 100).toFixed(2))
        : 0,
    });

    // Helper to calculate comparison
    const calculateComparison = (current, prev) => ({
      difference: parseFloat((current.totalExpenses - prev.totalExpenses).toFixed(2)),
      percentageChange: prev.totalExpenses > 0
        ? parseFloat((((current.totalExpenses - prev.totalExpenses) / prev.totalExpenses) * 100).toFixed(2))
        : 0,
    });

    return success(res, {
      period: { startDate: start, endDate: end },
      byOriginalCurrency: {
        ...formatSummary(summaryByOriginal, days),
        comparisonWithPreviousMonth: calculateComparison(summaryByOriginal, prevSummaryByOriginal),
      },
      inArs: {
        ...formatSummary(summaryInArs, days),
        comparisonWithPreviousMonth: calculateComparison(summaryInArs, prevSummaryInArs),
      },
      inUsd: {
        ...formatSummary(summaryInUsd, days),
        comparisonWithPreviousMonth: calculateComparison(summaryInUsd, prevSummaryInUsd),
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

    // Query view to get category breakdown for all currencies
    const results = await sequelize.query(
      `SELECT
        ewc.category_id,
        c.id as cat_id,
        c.name as cat_name,
        c.color as cat_color,
        SUM(ewc.original_amount) as total_original,
        SUM(ewc.amount_in_ars) as total_ars,
        SUM(ewc.amount_in_usd) as total_usd,
        COUNT(ewc.id) as trans_count,
        AVG(ewc.original_amount) as avg_original,
        AVG(ewc.amount_in_ars) as avg_ars,
        AVG(ewc.amount_in_usd) as avg_usd
      FROM expenses_with_conversions ewc
      LEFT JOIN categories c ON ewc.category_id = c.id
      WHERE ewc.user_id = ? AND ewc.expense_date BETWEEN ? AND ?
        AND (ewc.is_installment = FALSE OR ewc.installment_group_id IS NOT NULL)
      GROUP BY ewc.category_id, c.id, c.name, c.color
      ORDER BY total_original DESC`,
      { replacements: [req.user.id, start, end], type: sequelize.QueryTypes.SELECT }
    );

    // Calculate totals for each currency
    const totalByOriginal = results.reduce((sum, r) => sum + parseFloat(r.total_original || 0), 0);
    const totalInArs = results.reduce((sum, r) => sum + parseFloat(r.total_ars || 0), 0);
    const totalInUsd = results.reduce((sum, r) => sum + parseFloat(r.total_usd || 0), 0);

    // Format data for each currency view
    const formatByAmount = (amountField, totalAmount) => results.map((r) => ({
      categoryId: r.category_id,
      categoryName: r.cat_name,
      color: r.cat_color,
      totalAmount: parseFloat(parseFloat(r[amountField] || 0).toFixed(2)),
      percentage: totalAmount > 0
        ? parseFloat(((parseFloat(r[amountField]) / totalAmount) * 100).toFixed(2))
        : 0,
      transactionCount: parseInt(r.trans_count),
      averageTransaction: parseFloat(parseFloat(r[
        amountField.replace('total_', 'avg_')
      ] || 0).toFixed(2)),
    }));

    return success(res, {
      byOriginalCurrency: {
        categories: formatByAmount('total_original', totalByOriginal),
        totalExpenses: parseFloat(totalByOriginal.toFixed(2)),
      },
      inArs: {
        categories: formatByAmount('total_ars', totalInArs),
        totalExpenses: parseFloat(totalInArs.toFixed(2)),
      },
      inUsd: {
        categories: formatByAmount('total_usd', totalInUsd),
        totalExpenses: parseFloat(totalInUsd.toFixed(2)),
      },
    });
  } catch (err) {
    next(err);
  }
};

const getCashVsCard = async (req, res, next) => {
  try {
    const now = new Date();
    const start = req.query.startDate || format(startOfMonth(now));
    const end = req.query.endDate || format(endOfMonth(now));

    const expenses = await sequelize.query(
      `SELECT expense_date as date, original_amount, amount_in_ars, amount_in_usd, payment_method
       FROM expenses_with_conversions
       WHERE user_id = ? AND expense_date BETWEEN ? AND ?
         AND (is_installment = FALSE OR installment_group_id IS NOT NULL)
       ORDER BY expense_date ASC`,
      { replacements: [req.user.id, start, end], type: sequelize.QueryTypes.SELECT }
    );

    // Helper to calculate cash vs card totals for given amount field
    const calculateTotals = (expenseList, amountField) => {
      const cashTotal = expenseList
        .filter((e) => e.payment_method === 'cash')
        .reduce((sum, e) => sum + parseFloat(e[amountField] || 0), 0);
      const cardTotal = expenseList
        .filter((e) => e.payment_method === 'credit_card')
        .reduce((sum, e) => sum + parseFloat(e[amountField] || 0), 0);
      const grandTotal = cashTotal + cardTotal;
      return { cashTotal, cardTotal, grandTotal };
    };

    // Build timeline for each currency
    const buildTimeline = (expenseList, amountField) => {
      const timelineMap = {};
      expenseList.forEach((e) => {
        const day = e.date;
        if (!timelineMap[day]) timelineMap[day] = { date: day, cash: 0, card: 0, total: 0 };
        const amount = parseFloat(e[amountField] || 0);
        if (e.payment_method === 'cash') timelineMap[day].cash += amount;
        else timelineMap[day].card += amount;
        timelineMap[day].total += amount;
      });
      return Object.values(timelineMap).map((d) => ({
        date: d.date,
        cash: parseFloat(d.cash.toFixed(2)),
        card: parseFloat(d.card.toFixed(2)),
        total: parseFloat(d.total.toFixed(2)),
      }));
    };

    // Calculate for all three currencies
    const totalsByOriginal = calculateTotals(expenses, 'original_amount');
    const totalsInArs = calculateTotals(expenses, 'amount_in_ars');
    const totalsInUsd = calculateTotals(expenses, 'amount_in_usd');

    const timelineByOriginal = buildTimeline(expenses, 'original_amount');
    const timelineInArs = buildTimeline(expenses, 'amount_in_ars');
    const timelineInUsd = buildTimeline(expenses, 'amount_in_usd');

    // Helper to format summary
    const formatSummary = (totals) => ({
      cashTotal: parseFloat(totals.cashTotal.toFixed(2)),
      cardTotal: parseFloat(totals.cardTotal.toFixed(2)),
      grandTotal: parseFloat(totals.grandTotal.toFixed(2)),
      cashPercentage: totals.grandTotal > 0
        ? parseFloat(((totals.cashTotal / totals.grandTotal) * 100).toFixed(2))
        : 0,
      cardPercentage: totals.grandTotal > 0
        ? parseFloat(((totals.cardTotal / totals.grandTotal) * 100).toFixed(2))
        : 0,
    });

    return success(res, {
      byOriginalCurrency: {
        summary: formatSummary(totalsByOriginal),
        timeline: timelineByOriginal,
      },
      inArs: {
        summary: formatSummary(totalsInArs),
        timeline: timelineInArs,
      },
      inUsd: {
        summary: formatSummary(totalsInUsd),
        timeline: timelineInUsd,
      },
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

    // Query installments with expense data from view
    const installments = await sequelize.query(
      `SELECT
        i.id,
        i.expense_id,
        i.amount as installment_amount,
        i.due_date,
        i.installment_number,
        i.total_installments,
        ewc.description,
        ewc.original_amount,
        ewc.original_currency,
        ewc.amount_in_ars,
        ewc.amount_in_usd,
        c.id as cat_id,
        c.name as cat_name,
        c.color as cat_color
      FROM installments i
      JOIN expenses_with_conversions ewc ON i.expense_id = ewc.id
      LEFT JOIN categories c ON ewc.category_id = c.id
      WHERE i.is_paid = false AND i.due_date <= ? AND ewc.user_id = ?
      ORDER BY i.due_date ASC`,
      { replacements: [format(futureDate), req.user.id], type: sequelize.QueryTypes.SELECT }
    );

    // Helper to format installment data
    const formatInstallments = (list, amountField) => list.map((i) => ({
      id: i.id,
      expenseId: i.expense_id,
      description: i.description,
      categoryName: i.cat_name,
      amount: parseFloat(parseFloat(i[amountField] || 0).toFixed(2)),
      dueDate: i.due_date,
      daysUntilDue: Math.ceil((new Date(i.due_date) - today) / (1000 * 60 * 60 * 24)),
      installmentNumber: i.installment_number,
      totalInstallments: i.total_installments,
    }));

    // Format for all three currencies
    const dataByOriginal = formatInstallments(installments, 'original_amount');
    const dataInArs = formatInstallments(installments, 'amount_in_ars');
    const dataInUsd = formatInstallments(installments, 'amount_in_usd');

    const totalByOriginal = dataByOriginal.reduce((sum, i) => sum + i.amount, 0);
    const totalInArs = dataInArs.reduce((sum, i) => sum + i.amount, 0);
    const totalInUsd = dataInUsd.reduce((sum, i) => sum + i.amount, 0);

    return success(res, {
      byOriginalCurrency: {
        totalPending: dataByOriginal.length,
        totalAmount: parseFloat(totalByOriginal.toFixed(2)),
        installments: dataByOriginal,
      },
      inArs: {
        totalPending: dataInArs.length,
        totalAmount: parseFloat(totalInArs.toFixed(2)),
        installments: dataInArs,
      },
      inUsd: {
        totalPending: dataInUsd.length,
        totalAmount: parseFloat(totalInUsd.toFixed(2)),
        installments: dataInUsd,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary, getByCategory, getCashVsCard, getPendingInstallments };
