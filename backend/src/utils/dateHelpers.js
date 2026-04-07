/**
 * Add months to a date
 */
const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

/**
 * Format date as YYYY-MM-DD
 */
const format = (date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

/**
 * Get first day of month
 */
const startOfMonth = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

/**
 * Get last day of month
 */
const endOfMonth = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
};

module.exports = { addMonths, format, startOfMonth, endOfMonth };
