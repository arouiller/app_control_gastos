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
        DATE_FORMAT(ewc.expense_date, '%Y-%m') AS month_key,
        c.id AS category_id,
        c.name AS category_name,
        c.color AS category_color,
        SUM(ewc.amount_in_ars) AS monthly_ars,
        SUM(ewc.amount_in_usd) AS monthly_usd
      FROM expenses_with_conversions ewc
      INNER JOIN categories c ON ewc.category_id = c.id
      WHERE
        ewc.user_id = :userId
        AND DATE(ewc.expense_date) BETWEEN :dateFrom AND :dateTo
        AND c.user_id = :userId
        AND (ewc.is_installment = FALSE OR ewc.installment_group_id IS NOT NULL)
        ${categoryFilter}
      GROUP BY
        DATE_FORMAT(ewc.expense_date, '%Y-%m'),
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
        categoryMap[catId] = { id: catId, name: row.category_name, color: row.category_color, dataArs: {}, dataUsd: {} };
      }
      categoryMap[catId].dataArs[row.month_key] = parseFloat(row.monthly_ars || 0);
      categoryMap[catId].dataUsd[row.month_key] = parseFloat(row.monthly_usd || 0);
    }

    // Align data to month array
    const categoriesArray = Object.values(categoryMap).map((cat) => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      dataArs: months.map((m) => cat.dataArs[m] || 0),
      dataUsd: months.map((m) => cat.dataUsd[m] || 0),
    }));

    // Compute per-currency totals
    const monthlyTotalsArs = {};
    const monthlyTotalsUsd = {};
    const categoryTotalsArs = {};
    const categoryTotalsUsd = {};
    months.forEach((m) => { monthlyTotalsArs[m] = 0; monthlyTotalsUsd[m] = 0; });
    for (const cat of categoriesArray) {
      categoryTotalsArs[String(cat.id)] = 0;
      categoryTotalsUsd[String(cat.id)] = 0;
      cat.dataArs.forEach((amt, i) => {
        monthlyTotalsArs[months[i]] = parseFloat((monthlyTotalsArs[months[i]] + amt).toFixed(2));
        categoryTotalsArs[String(cat.id)] = parseFloat((categoryTotalsArs[String(cat.id)] + amt).toFixed(2));
      });
      cat.dataUsd.forEach((amt, i) => {
        monthlyTotalsUsd[months[i]] = parseFloat((monthlyTotalsUsd[months[i]] + amt).toFixed(2));
        categoryTotalsUsd[String(cat.id)] = parseFloat((categoryTotalsUsd[String(cat.id)] + amt).toFixed(2));
      });
    }

    return success(res, {
      months,
      monthLabels: months.map(formatMonthLabel),
      categories: categoriesArray,
      monthlyTotalsArs,
      monthlyTotalsUsd,
      categoryTotalsArs,
      categoryTotalsUsd,
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
          ewc.installment_group_id AS installmentGroupId,
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
        original_amount: parseFloat(e.amount || 0),
        amount_in_ars: parseFloat(e.amountInArs || 0),
        amount_in_usd: parseFloat(e.amountInUsd || 0),
        date: e.date,
        payment_method: e.paymentMethod,
        is_installment: !!e.isInstallment,
        installment_number: e.installmentNumber || null,
        total_installments: e.totalInstallments || null,
        installment_group_id: e.installmentGroupId || null,
        notes: e.notes,
      })),
      pagination: { page: pageNum, limit: limitNum, total: count },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { monthlyGrouping, monthlyGroupingDetails };
