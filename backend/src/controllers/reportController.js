const { Op, QueryTypes } = require('sequelize');
const { Expense, Category } = require('../models');
const { success, error, paginated } = require('../utils/response');

const MONTH_NAMES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const formatMonthLabel = (monthKey) => {
  const [year, month] = monthKey.split('-');
  return `${MONTH_NAMES_ES[parseInt(month, 10) - 1]} ${year}`;
};

const monthlyGrouping = async (req, res, next) => {
  try {
    const { dateFrom, dateTo, categories } = req.query;
    const userId = req.user.id;

    if (!dateFrom || !dateTo) {
      return error(res, 'dateFrom y dateTo son requeridos', 400);
    }

    const from = new Date(dateFrom);
    const to = new Date(dateTo);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return error(res, 'Formato de fecha inválido', 400);
    }

    if (from > to) {
      return error(res, 'dateFrom debe ser anterior a dateTo', 400);
    }

    if (to - from > 5 * 365 * 24 * 60 * 60 * 1000) {
      return error(res, 'Rango máximo: 5 años', 400);
    }

    const replacements = { userId, dateFrom, dateTo };
    let categoryFilter = '';

    if (categories) {
      const categoryIds = categories.split(',').map(Number).filter((n) => !isNaN(n) && n > 0);
      if (categoryIds.length > 0) {
        categoryIds.forEach((id, i) => { replacements[`cat${i}`] = id; });
        categoryFilter = `AND c.id IN (${categoryIds.map((_, i) => `:cat${i}`).join(',')})`;
      }
    }

    // Exclude installment parent records to avoid double-counting:
    // parents have is_installment=1 AND installment_group_id IS NULL
    const query = `
      SELECT
        DATE_FORMAT(e.date, '%Y-%m') AS month_key,
        c.id AS category_id,
        c.name AS category_name,
        c.color AS category_color,
        SUM(e.amount) AS monthly_total
      FROM expenses e
      INNER JOIN categories c ON e.category_id = c.id
      WHERE
        e.user_id = :userId
        AND DATE(e.date) BETWEEN :dateFrom AND :dateTo
        AND c.user_id = :userId
        AND (e.is_installment = FALSE OR e.installment_group_id IS NOT NULL)
        ${categoryFilter}
      GROUP BY
        DATE_FORMAT(e.date, '%Y-%m'),
        c.id, c.name, c.color
      ORDER BY
        month_key ASC,
        c.id ASC
    `;

    const rows = await Expense.sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });

    // Build all months in range
    const months = [];
    const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
    const endMonth = new Date(to.getFullYear(), to.getMonth(), 1);
    while (cursor <= endMonth) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, '0');
      months.push(`${y}-${m}`);
      cursor.setMonth(cursor.getMonth() + 1);
    }

    // Build category map from rows
    const categoryMap = {};
    for (const row of rows) {
      const catId = row.category_id;
      if (!categoryMap[catId]) {
        categoryMap[catId] = {
          id: catId,
          name: row.category_name,
          color: row.category_color,
          data: {},
        };
      }
      categoryMap[catId].data[row.month_key] = parseFloat(row.monthly_total);
    }

    // Align data to month array
    const categoriesArray = Object.values(categoryMap).map((cat) => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      data: months.map((m) => cat.data[m] || 0),
    }));

    // Compute totals
    const monthlyTotals = {};
    const categoryTotals = {};
    months.forEach((m) => { monthlyTotals[m] = 0; });
    for (const cat of categoriesArray) {
      categoryTotals[String(cat.id)] = 0;
      cat.data.forEach((amount, i) => {
        monthlyTotals[months[i]] = parseFloat((monthlyTotals[months[i]] + amount).toFixed(2));
        categoryTotals[String(cat.id)] = parseFloat((categoryTotals[String(cat.id)] + amount).toFixed(2));
      });
    }

    return success(res, {
      months,
      monthLabels: months.map(formatMonthLabel),
      categories: categoriesArray,
      monthlyTotals,
      categoryTotals,
    });
  } catch (err) {
    next(err);
  }
};

const monthlyGroupingDetails = async (req, res, next) => {
  try {
    const { month, categoryId, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    if (!month || !categoryId) {
      return error(res, 'month y categoryId son requeridos', 400);
    }

    const catId = parseInt(categoryId, 10);
    if (isNaN(catId)) {
      return error(res, 'categoryId inválido', 400);
    }

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return error(res, 'Formato de month inválido, use YYYY-MM', 400);
    }

    const category = await Category.findOne({ where: { id: catId, user_id: userId } });
    if (!category) {
      return error(res, 'Categoría no encontrada', 404);
    }

    const [year, monthNum] = month.split('-').map(Number);
    const dateFrom = `${year}-${String(monthNum).padStart(2, '0')}-01`;
    const lastDay = new Date(year, monthNum, 0).getDate();
    const dateTo = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const [countRow] = await Expense.sequelize.query(
      `SELECT COUNT(*) AS cnt
       FROM expenses_with_conversions ewc
       WHERE ewc.user_id = ? AND ewc.category_id = ?
         AND ewc.expense_date BETWEEN ? AND ?
         AND (ewc.is_installment = FALSE OR ewc.installment_group_id IS NOT NULL)`,
      { replacements: [userId, catId, dateFrom, dateTo], type: QueryTypes.SELECT }
    );
    const count = parseInt(countRow.cnt, 10);

    const rows = await Expense.sequelize.query(
      `SELECT ewc.id, ewc.description,
          ewc.original_amount AS amount,
          ewc.amount_in_ars AS amountInArs,
          ewc.amount_in_usd AS amountInUsd,
          ewc.expense_date AS date,
          ewc.payment_method AS paymentMethod,
          ewc.is_installment AS isInstallment,
          ewc.installment_number AS installmentNumber,
          ewc.total_installments AS totalInstallments,
          ewc.notes, ewc.created_at AS createdAt
       FROM expenses_with_conversions ewc
       WHERE ewc.user_id = ? AND ewc.category_id = ?
         AND ewc.expense_date BETWEEN ? AND ?
         AND (ewc.is_installment = FALSE OR ewc.installment_group_id IS NOT NULL)
       ORDER BY ewc.expense_date DESC
       LIMIT ? OFFSET ?`,
      { replacements: [userId, catId, dateFrom, dateTo, limitNum, offset], type: QueryTypes.SELECT }
    );

    const totalArs = rows.reduce((s, e) => s + parseFloat(e.amountInArs || 0), 0);

    return success(res, {
      month,
      category: { id: category.id, name: category.name, color: category.color },
      total: parseFloat(totalArs.toFixed(2)),
      expenses: rows.map((e) => ({
        id: e.id,
        description: e.description,
        amount: parseFloat(e.amount || 0),
        amountInArs: parseFloat(e.amountInArs || 0),
        amountInUsd: parseFloat(e.amountInUsd || 0),
        date: e.date,
        paymentMethod: e.paymentMethod,
        isInstallment: !!e.isInstallment,
        installmentNumber: e.installmentNumber || null,
        totalInstallments: e.totalInstallments || null,
        notes: e.notes,
        createdAt: e.createdAt,
      })),
      pagination: { page: pageNum, limit: limitNum, total: count },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { monthlyGrouping, monthlyGroupingDetails };
