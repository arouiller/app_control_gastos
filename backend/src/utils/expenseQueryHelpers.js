// Shared SELECT fields used in both listExpenses and getExpense
const EXPENSE_SELECT_FIELDS = `
  ewc.id, ewc.user_id, ewc.category_id, ewc.description,
  ewc.original_amount, ewc.original_currency, ewc.amount_in_ars, ewc.amount_in_usd,
  ewc.expense_date, ewc.payment_method, ewc.is_installment, ewc.total_installments,
  ewc.installment_number, ewc.installment_group_id, ewc.exchange_rate_used,
  ewc.exchange_rate_date, ewc.notes, ewc.created_at, ewc.updated_at,
  c.id as cat_id, c.name as cat_name, c.color as cat_color, c.icon as cat_icon
FROM expenses_with_conversions ewc
LEFT JOIN categories c ON ewc.category_id = c.id`;

// Format a raw SQL expense row into the standard API response shape
const formatExpenseRow = (exp) => ({
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
  total_installments: exp.total_installments ? parseInt(exp.total_installments) : null,
  installment_number: exp.installment_number ? parseInt(exp.installment_number) : null,
  installment_group_id: exp.installment_group_id,
  exchange_rate_used: exp.exchange_rate_used ? parseFloat(exp.exchange_rate_used) : null,
  exchange_rate_date: exp.exchange_rate_date,
  notes: exp.notes,
  category: exp.cat_id ? {
    id: exp.cat_id,
    name: exp.cat_name,
    color: exp.cat_color,
    icon: exp.cat_icon,
  } : null,
});

// Build WHERE clause and params array for expense list queries
const buildExpenseWhereClause = (query, userId) => {
  let whereClause = 'WHERE ewc.user_id = ?';
  const params = [userId];

  // RF-518: filter installment expenses to avoid double-counting
  if (query.showConsolidated === 'true') {
    whereClause += ' AND (ewc.is_installment = FALSE OR ewc.installment_group_id IS NULL)';
  } else {
    whereClause += ' AND (ewc.is_installment = FALSE OR ewc.installment_group_id IS NOT NULL)';
  }

  if (query.startDate) { whereClause += ' AND ewc.expense_date >= ?'; params.push(query.startDate); }
  if (query.endDate)   { whereClause += ' AND ewc.expense_date <= ?'; params.push(query.endDate); }
  if (query.categoryId) { whereClause += ' AND ewc.category_id = ?'; params.push(query.categoryId); }
  if (query.paymentMethod) { whereClause += ' AND ewc.payment_method = ?'; params.push(query.paymentMethod); }
  if (query.currency && ['ARS', 'USD'].includes(query.currency)) {
    whereClause += ' AND ewc.original_currency = ?';
    params.push(query.currency);
  }
  if (query.minAmount) { whereClause += ' AND ewc.original_amount >= ?'; params.push(parseFloat(query.minAmount)); }
  if (query.maxAmount) { whereClause += ' AND ewc.original_amount <= ?'; params.push(parseFloat(query.maxAmount)); }
  if (query.search)    { whereClause += ' AND ewc.description LIKE ?'; params.push(`%${query.search}%`); }

  return { whereClause, params };
};

module.exports = { EXPENSE_SELECT_FIELDS, formatExpenseRow, buildExpenseWhereClause };
