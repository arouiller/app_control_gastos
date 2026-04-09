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
