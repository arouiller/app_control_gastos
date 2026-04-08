const { sequelize } = require('../models');
const logger = require('../utils/logger');

/**
 * Busca la cotización para una fecha específica.
 * Si no existe cotización exacta, busca la más cercana posterior.
 *
 * @param {string} expenseDate - Fecha del gasto (YYYY-MM-DD)
 * @returns {Object|null} { rate_date, ars_to_usd } o null si no existe
 */
async function getRateForConversion(expenseDate) {
  // Buscar cotización exacta
  let [rows] = await sequelize.query(
    'SELECT rate_date, ars_to_usd FROM exchange_rates WHERE rate_date = ? LIMIT 1',
    { replacements: [expenseDate] }
  );

  if (rows.length > 0) {
    return rows[0];
  }

  // Si no existe exacta, buscar la siguiente posterior
  [rows] = await sequelize.query(
    'SELECT rate_date, ars_to_usd FROM exchange_rates WHERE rate_date > ? ORDER BY rate_date ASC LIMIT 1',
    { replacements: [expenseDate] }
  );

  if (rows.length > 0) {
    logger.info(`[CurrencyConversion] Cotización no disponible para ${expenseDate}, usando ${rows[0].rate_date}`);
    return rows[0];
  }

  return null;
}

/**
 * Convierte un monto de una moneda a otra.
 *
 * @param {number} amount - Monto a convertir
 * @param {string} fromCurrency - Moneda origen ('ARS' o 'USD')
 * @param {string} toCurrency - Moneda destino ('ARS' o 'USD')
 * @param {string} expenseDate - Fecha del gasto (YYYY-MM-DD)
 * @returns {Promise<Object>} { convertedAmount, exchangeRate, exchangeRateDate }
 * @throws {Error} Si no hay cotización disponible
 */
async function convertAmount(amount, fromCurrency, toCurrency, expenseDate) {
  // Si las monedas son iguales, no convertir
  if (fromCurrency === toCurrency) {
    return {
      convertedAmount: parseFloat(amount),
      exchangeRate: 1,
      exchangeRateDate: expenseDate,
    };
  }

  // Validar monedas
  if (!['ARS', 'USD'].includes(fromCurrency) || !['ARS', 'USD'].includes(toCurrency)) {
    throw new Error(`Monedas inválidas: ${fromCurrency} → ${toCurrency}`);
  }

  // Obtener cotización
  const rate = await getRateForConversion(expenseDate);
  if (!rate) {
    throw new Error(`No hay cotización disponible para la fecha ${expenseDate} o posterior`);
  }

  const exchangeRate = parseFloat(rate.ars_to_usd);
  let convertedAmount;

  if (fromCurrency === 'ARS' && toCurrency === 'USD') {
    // ARS → USD: dividir por la cotización
    convertedAmount = amount / exchangeRate;
  } else if (fromCurrency === 'USD' && toCurrency === 'ARS') {
    // USD → ARS: multiplicar por la cotización
    convertedAmount = amount * exchangeRate;
  }

  // Redondear hacia arriba (CEILING) a 2 decimales
  convertedAmount = Math.ceil(convertedAmount * 100) / 100;

  return {
    convertedAmount,
    exchangeRate,
    exchangeRateDate: rate.rate_date,
  };
}

module.exports = {
  convertAmount,
};
