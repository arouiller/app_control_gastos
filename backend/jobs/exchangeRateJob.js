const cron = require('node-cron');
const logger = require('../src/utils/logger');
const {
  fetchAndSaveDailyRate,
  hasSuccessfulFetchToday,
} = require('../src/services/exchangeRateService');

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5 * 60 * 1000; // 5 minutos

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runDailyFetch() {
  logger.info('[ExchangeRateJob] Iniciando tarea de cotización diaria');

  // Idempotencia: no ejecutar si ya se obtuvo cotización hoy
  const alreadyDone = await hasSuccessfulFetchToday();
  if (alreadyDone) {
    logger.info('[ExchangeRateJob] Cotización de hoy ya registrada. Saltando ejecución.');
    return;
  }

  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    attempt++;
    logger.info(`[ExchangeRateJob] Intento ${attempt}/${MAX_RETRIES}`);

    try {
      const result = await fetchAndSaveDailyRate('cron_job', null);
      if (result.status === 'skipped') {
        logger.info(`[ExchangeRateJob] Sin cotización disponible hoy (feriado/fin de semana). Finalizando.`);
        return;
      }
      logger.info(`[ExchangeRateJob] Cotización guardada: ${result.rate} ARS/USD (${result.action})`);
      return;
    } catch (err) {
      logger.error(`[ExchangeRateJob] Intento ${attempt} fallido: ${err.message}`);

      if (attempt < MAX_RETRIES) {
        logger.info(`[ExchangeRateJob] Reintentando en ${RETRY_DELAY_MS / 60000} minutos...`);
        await delay(RETRY_DELAY_MS);
      } else {
        logger.error('[ExchangeRateJob] ALERTA: Los 3 intentos fallaron. Se requiere intervención manual.');
      }
    }
  }
}

function startExchangeRateJob() {
  // Ejecutar diariamente a las 22:00
  cron.schedule('0 22 * * *', runDailyFetch, {
    timezone: 'America/Argentina/Buenos_Aires',
  });
  logger.info('[ExchangeRateJob] Cron job de cotización programado para las 22:00 (Argentina)');
}

module.exports = { startExchangeRateJob, runDailyFetch };
