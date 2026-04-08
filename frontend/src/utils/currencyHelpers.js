/**
 * Returns the amount to display based on displayCurrency preference
 * @param {Object} expense - Expense object from expenses_with_conversions view
 * @param {string} displayCurrency - 'original' | 'ARS' | 'USD'
 * @returns {number} The amount to display
 */
export function getDisplayAmount(expense, displayCurrency = 'original') {
  if (!expense) return 0;

  switch (displayCurrency) {
    case 'ARS':
      return expense.amount_in_ars ?? expense.original_amount;
    case 'USD':
      return expense.amount_in_usd ?? expense.original_amount;
    case 'original':
    default:
      return expense.original_amount;
  }
}

/**
 * Returns the currency label for display
 * @param {Object} expense - Expense object
 * @param {string} displayCurrency - Display preference
 * @returns {string} Currency code (ARS or USD)
 */
export function getDisplayCurrency(expense, displayCurrency = 'original') {
  if (!expense) return '';

  switch (displayCurrency) {
    case 'ARS':
      return 'ARS';
    case 'USD':
      return 'USD';
    case 'original':
    default:
      return expense.original_currency;
  }
}

/**
 * Format amount with currency for display
 * @param {Object} expense - Expense object
 * @param {string} displayCurrency - Display preference
 * @param {Function} formatCurrency - Formatter function (e.g., from formatters.js)
 * @returns {string} Formatted currency string
 */
export function formatDisplayAmount(expense, displayCurrency, formatCurrency) {
  const amount = getDisplayAmount(expense, displayCurrency);
  const currency = getDisplayCurrency(expense, displayCurrency);
  return `${formatCurrency(amount)} ${currency}`;
}
