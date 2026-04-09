const { sequelize } = require('../models');
const { success, error, paginated } = require('../utils/response');

const MONTH_NAMES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const formatMonthLabel = (key) => {
  const [year, month] = key.split('-');
  return `${MONTH_NAMES_ES[parseInt(month, 10) - 1]} ${year}`;
};

const parseCategoryFilter = (categoryId, categoryIdsStr) => {
  const ids = categoryIdsStr
    ? categoryIdsStr.split(',').map(Number).filter(Boolean)
    : categoryId ? [parseInt(categoryId)] : [];
  return ids;
};

// Pending child installments (date > today), filtered by category, multi-currency
const listInstallments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, categoryId, categoryIds: categoryIdsStr } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const catIds = parseCategoryFilter(categoryId, categoryIdsStr);

    let where = `WHERE ewc.user_id = ?
      AND ewc.is_installment = TRUE
      AND ewc.installment_group_id IS NOT NULL
      AND ewc.expense_date > CURDATE()`;
    const params = [req.user.id];

    if (catIds.length > 0) {
      where += ` AND ewc.category_id IN (${catIds.map(() => '?').join(',')})`;
      params.push(...catIds);
    }

    const [[{ count }]] = await sequelize.query(
      `SELECT COUNT(*) as count FROM expenses_with_conversions ewc ${where}`,
      { replacements: params }
    );

    const dataParams = [...params, parseInt(limit), offset];
    const rows = await sequelize.query(
      `SELECT ewc.id, ewc.description, ewc.original_amount, ewc.original_currency,
        ewc.amount_in_ars, ewc.amount_in_usd, ewc.expense_date as date,
        ewc.installment_number, ewc.total_installments, ewc.installment_group_id,
        c.id as cat_id, c.name as cat_name, c.color as cat_color
       FROM expenses_with_conversions ewc
       LEFT JOIN categories c ON ewc.category_id = c.id
       ${where}
       ORDER BY ewc.expense_date ASC, ewc.installment_number ASC
       LIMIT ? OFFSET ?`,
      { replacements: dataParams, type: sequelize.QueryTypes.SELECT }
    );

    const formatted = rows.map((r) => ({
      id: r.id,
      description: r.description,
      original_amount: parseFloat(r.original_amount),
      original_currency: r.original_currency,
      amount_in_ars: r.amount_in_ars != null ? parseFloat(r.amount_in_ars) : null,
      amount_in_usd: r.amount_in_usd != null ? parseFloat(r.amount_in_usd) : null,
      date: r.date,
      installment_number: r.installment_number,
      total_installments: r.total_installments,
      installment_group_id: r.installment_group_id,
      category: r.cat_id ? { id: r.cat_id, name: r.cat_name, color: r.cat_color } : null,
    }));

    const totalPages = Math.ceil(count / parseInt(limit));
    return paginated(res, formatted, {
      page: parseInt(page), limit: parseInt(limit), total: count,
      pages: totalPages, hasNextPage: parseInt(page) < totalPages, hasPrevPage: parseInt(page) > 1,
    });
  } catch (err) {
    next(err);
  }
};

// Parent expenses grouped with paid/pending counts and amounts in all currencies
const getGrouped = async (req, res, next) => {
  try {
    const { categoryId, categoryIds: categoryIdsStr } = req.query;
    const catIds = parseCategoryFilter(categoryId, categoryIdsStr);
    const params = [req.user.id];
    let filter = '';

    if (catIds.length > 0) {
      filter = `AND parent.category_id IN (${catIds.map(() => '?').join(',')})`;
      params.push(...catIds);
    }

    const rows = await sequelize.query(
      `SELECT
        parent.id, parent.description, parent.date AS start_date,
        parent.total_installments, parent.category_id,
        parent.currency AS original_currency,
        c.name AS cat_name, c.color AS cat_color,
        COUNT(ewc.id) AS child_count,
        SUM(CASE WHEN ewc.expense_date <= CURDATE() THEN 1 ELSE 0 END) AS paid_count,
        SUM(CASE WHEN ewc.expense_date > CURDATE()  THEN 1 ELSE 0 END) AS pending_count,
        SUM(ewc.original_amount) AS total_original,
        SUM(CASE WHEN ewc.expense_date <= CURDATE() THEN ewc.original_amount ELSE 0 END) AS paid_original,
        SUM(CASE WHEN ewc.expense_date > CURDATE()  THEN ewc.original_amount ELSE 0 END) AS pending_original,
        SUM(ewc.amount_in_ars) AS total_ars,
        SUM(CASE WHEN ewc.expense_date <= CURDATE() THEN ewc.amount_in_ars ELSE 0 END) AS paid_ars,
        SUM(CASE WHEN ewc.expense_date > CURDATE()  THEN ewc.amount_in_ars ELSE 0 END) AS pending_ars,
        SUM(ewc.amount_in_usd) AS total_usd,
        SUM(CASE WHEN ewc.expense_date <= CURDATE() THEN ewc.amount_in_usd ELSE 0 END) AS paid_usd,
        SUM(CASE WHEN ewc.expense_date > CURDATE()  THEN ewc.amount_in_usd ELSE 0 END) AS pending_usd
       FROM expenses parent
       JOIN expenses_with_conversions ewc ON ewc.installment_group_id = parent.id
       LEFT JOIN categories c ON parent.category_id = c.id
       WHERE parent.user_id = ?
         AND parent.is_installment = TRUE
         AND parent.installment_group_id IS NULL
         ${filter}
       GROUP BY parent.id, parent.description, parent.date, parent.total_installments,
                parent.category_id, parent.currency, c.name, c.color
       ORDER BY parent.date ASC`,
      { replacements: params, type: sequelize.QueryTypes.SELECT }
    );

    const formatted = rows.map((r) => ({
      id: r.id,
      description: r.description,
      startDate: r.start_date,
      totalInstallments: parseInt(r.total_installments || 0),
      originalCurrency: r.original_currency,
      category: r.category_id ? { id: r.category_id, name: r.cat_name, color: r.cat_color } : null,
      counts: {
        total: parseInt(r.child_count || 0),
        paid: parseInt(r.paid_count || 0),
        pending: parseInt(r.pending_count || 0),
      },
      byOriginalCurrency: {
        total: parseFloat(r.total_original || 0),
        paid: parseFloat(r.paid_original || 0),
        pending: parseFloat(r.pending_original || 0),
      },
      inArs: {
        total: parseFloat(r.total_ars || 0),
        paid: parseFloat(r.paid_ars || 0),
        pending: parseFloat(r.pending_ars || 0),
      },
      inUsd: {
        total: parseFloat(r.total_usd || 0),
        paid: parseFloat(r.paid_usd || 0),
        pending: parseFloat(r.pending_usd || 0),
      },
    }));

    return success(res, formatted);
  } catch (err) {
    next(err);
  }
};

// Monthly pending installments by category (for chart)
const getMonthlyChart = async (req, res, next) => {
  try {
    const { categoryId, categoryIds: categoryIdsStr } = req.query;
    const catIds = parseCategoryFilter(categoryId, categoryIdsStr);
    const params = [req.user.id];
    let filter = '';

    if (catIds.length > 0) {
      filter = `AND ewc.category_id IN (${catIds.map(() => '?').join(',')})`;
      params.push(...catIds);
    }

    const rows = await sequelize.query(
      `SELECT
        DATE_FORMAT(ewc.expense_date, '%Y-%m') AS month_key,
        c.id AS category_id, c.name AS cat_name, c.color AS cat_color,
        SUM(ewc.original_amount) AS total_original,
        SUM(ewc.amount_in_ars) AS total_ars,
        SUM(ewc.amount_in_usd) AS total_usd
       FROM expenses_with_conversions ewc
       LEFT JOIN categories c ON ewc.category_id = c.id
       WHERE ewc.user_id = ?
         AND ewc.is_installment = TRUE
         AND ewc.installment_group_id IS NOT NULL
         AND ewc.expense_date > CURDATE()
         ${filter}
       GROUP BY month_key, c.id, c.name, c.color
       ORDER BY month_key ASC`,
      { replacements: params, type: sequelize.QueryTypes.SELECT }
    );

    return success(res, rows.map((r) => ({
      monthKey: r.month_key,
      monthLabel: formatMonthLabel(r.month_key),
      categoryId: r.category_id,
      categoryName: r.cat_name,
      categoryColor: r.cat_color,
      totalOriginal: parseFloat(r.total_original || 0),
      totalArs: parseFloat(r.total_ars || 0),
      totalUsd: parseFloat(r.total_usd || 0),
    })));
  } catch (err) {
    next(err);
  }
};

const payInstallment = async (req, res, next) =>
  error(res, 'Marcación de pago por cuota es una funcionalidad futura', 501);
const unpayInstallment = async (req, res, next) =>
  error(res, 'Marcación de pago por cuota es una funcionalidad futura', 501);
const deleteInstallment = async (req, res, next) =>
  error(res, 'Eliminá el gasto padre para eliminar todas las cuotas', 403);

module.exports = {
  listInstallments, getGrouped, getMonthlyChart,
  payInstallment, unpayInstallment, deleteInstallment,
};
