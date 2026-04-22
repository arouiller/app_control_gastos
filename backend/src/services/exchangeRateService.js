const https = require('https');
const { sequelize } = require('../models');
const logger = require('../utils/logger');

const BCRA_BASE_URL = 'https://api.bcra.gob.ar/estadisticas/v4.0/monetarias/4';
const TIMEOUT_MS = 30000;

// ─── BCRA API ─────────────────────────────────────────────────────────────────

async function fetchFromBCRA(fechaDesde, fechaHasta, maxRetries = 3) {
  const url = `${BCRA_BASE_URL}?desde=${fechaDesde}&hasta=${fechaHasta}`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      logger.info(`[ExchangeRate] Consultando BCRA (intento ${attempt + 1}/${maxRetries}): ${url}`);

      return await new Promise((resolve, reject) => {
        const req = https.get(url, { rejectUnauthorized: true }, (res) => {
          let body = '';
          res.on('data', (chunk) => { body += chunk; });
          res.on('end', () => {
            if (res.statusCode === 404) {
              resolve([]);
              return;
            }
            if (res.statusCode !== 200) {
              reject(new Error(`BCRA respondió con HTTP ${res.statusCode}`));
              return;
            }
            try {
              const parsed = JSON.parse(body);
              // v4.0: { results: [{ idVariable, detalle: [{ fecha, valor }] }] }
              const detalle = parsed.results?.[0]?.detalle || [];
              resolve(detalle);
            } catch (e) {
              reject(new Error(`Error parseando respuesta BCRA: ${e.message}`));
            }
          });
        });

        req.setTimeout(TIMEOUT_MS, () => {
          req.destroy(new Error('Timeout: BCRA API no respondió en 30s'));
        });

        req.on('error', reject);
      });
    } catch (err) {
      logger.warn(`[ExchangeRate] Intento ${attempt + 1} falló: ${err.message}`);

      if (attempt < maxRetries - 1) {
        const delayMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        logger.info(`[ExchangeRate] Reintentando en ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        throw err;
      }
    }
  }
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function getRateForDate(rateDate) {
  const [rows] = await sequelize.query(
    'SELECT ars_to_usd FROM exchange_rates WHERE rate_date = ?',
    { replacements: [rateDate] }
  );
  return rows.length > 0 ? Number(rows[0].ars_to_usd) : null;
}

async function getLastKnownRate() {
  const [rows] = await sequelize.query(
    'SELECT rate_date, ars_to_usd FROM exchange_rates ORDER BY rate_date DESC LIMIT 1'
  );
  return rows.length > 0 ? rows[0] : null;
}

async function logOperation({ operationType, rateDate, oldRate, newRate, source, status, errorMessage, executedBy }) {
  await sequelize.query(
    `INSERT INTO exchange_rate_logs
     (operation_type, rate_date, old_rate, new_rate, source, status, error_message, executed_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    { replacements: [operationType, rateDate, oldRate ?? null, newRate ?? null, source, status, errorMessage ?? null, executedBy ?? null] }
  );
}

async function upsertRate({ rateDate, arsToUsd, operationType, source, executedBy }) {
  const oldRate = await getRateForDate(rateDate);

  try {
    if (oldRate !== null) {
      await sequelize.query(
        'UPDATE exchange_rates SET ars_to_usd = ? WHERE rate_date = ?',
        { replacements: [arsToUsd, rateDate] }
      );
    } else {
      await sequelize.query(
        'INSERT INTO exchange_rates (rate_date, ars_to_usd) VALUES (?, ?)',
        { replacements: [rateDate, arsToUsd] }
      );
    }

    await logOperation({ operationType, rateDate, oldRate, newRate: arsToUsd, source, status: 'success', executedBy });
    return { action: oldRate !== null ? 'updated' : 'inserted' };
  } catch (err) {
    await logOperation({ operationType, rateDate, oldRate, newRate: arsToUsd, source, status: 'failed', errorMessage: err.message, executedBy });
    throw err;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetches and saves today's rate. Returns { status, date, rate?, action? }
 * source: 'cron_job' | 'admin_interface'
 */
async function fetchAndSaveDailyRate(source = 'cron_job', executedBy = null) {
  const today = new Date().toISOString().split('T')[0];

  let results;
  try {
    results = await fetchFromBCRA(today, today);
  } catch (err) {
    logger.error(`[ExchangeRate] BCRA API failed, attempting fallback to last known rate: ${err.message}`);

    // Fallback: use last known rate
    const lastRate = await getLastKnownRate();
    if (lastRate) {
      logger.info(`[ExchangeRate] Fallback: using last known rate from ${lastRate.rate_date}: ${lastRate.ars_to_usd}`);
      await logOperation({
        operationType: 'daily_fetch',
        rateDate: today,
        source,
        status: 'skipped',
        errorMessage: `BCRA API no disponible. Usando tasa del ${lastRate.rate_date}`,
        executedBy,
      });
      return {
        status: 'skipped_with_fallback',
        date: today,
        fallback_date: lastRate.rate_date,
        fallback_rate: lastRate.ars_to_usd,
        message: 'BCRA no disponible, usando tasa anterior'
      };
    }

    // No fallback available
    await logOperation({
      operationType: 'daily_fetch',
      rateDate: today,
      source,
      status: 'failed',
      errorMessage: `BCRA API no disponible y sin datos históricos: ${err.message}`,
      executedBy,
    });
    throw err;
  }

  if (results.length === 0) {
    await logOperation({
      operationType: 'daily_fetch',
      rateDate: today,
      source,
      status: 'skipped',
      errorMessage: 'Sin datos disponibles para esta fecha (feriado/fin de semana)',
      executedBy,
    });
    return { status: 'skipped', date: today };
  }

  const arsToUsd = results[0].valor;
  const { action } = await upsertRate({ rateDate: today, arsToUsd, operationType: 'daily_fetch', source, executedBy });
  return { status: 'success', date: today, rate: arsToUsd, action };
}

/**
 * Loads historical rates for a date range from BCRA.
 * Returns summary { total_days, total_inserted, total_updated, total_skipped, total_failed }
 */
async function loadHistoricalRates(fechaDesde, fechaHasta, executedBy = null) {
  logger.info(`[ExchangeRate] Carga histórica ${fechaDesde} → ${fechaHasta}`);
  const t0 = Date.now();

  let results;
  try {
    results = await fetchFromBCRA(fechaDesde, fechaHasta);
  } catch (err) {
    logger.error(`[ExchangeRate] Error consultando BCRA para rango histórico: ${err.message}`);
    throw err;
  }

  const summary = { total_inserted: 0, total_updated: 0, total_skipped: 0, total_failed: 0 };

  for (const { fecha, valor } of results) {
    try {
      const { action } = await upsertRate({
        rateDate: fecha,
        arsToUsd: valor,
        operationType: 'historical_load',
        source: 'admin_interface',
        executedBy,
      });
      if (action === 'inserted') summary.total_inserted++;
      else summary.total_updated++;
    } catch (err) {
      logger.error(`[ExchangeRate] Error procesando ${fecha}: ${err.message}`);
      summary.total_failed++;
    }
  }

  // Days not returned by BCRA (weekends/holidays) = skipped
  const totalCalendarDays = getDaysBetween(fechaDesde, fechaHasta);
  summary.total_skipped = totalCalendarDays - results.length - summary.total_failed;
  summary.total_days_processed = results.length;

  logger.info(`[ExchangeRate] Carga histórica completada en ${Date.now() - t0}ms: ${JSON.stringify(summary)}`);
  return summary;
}

/**
 * Returns the rate for a given date, or null if not found.
 */
async function getRateByDate(rateDate) {
  const [rows] = await sequelize.query(
    'SELECT rate_date, ars_to_usd, updated_at FROM exchange_rates WHERE rate_date = ?',
    { replacements: [rateDate] }
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Returns the last N exchange rates.
 */
async function getRecentRates(limit = 30) {
  const [rows] = await sequelize.query(
    'SELECT rate_date, ars_to_usd, updated_at FROM exchange_rates ORDER BY rate_date DESC LIMIT ?',
    { replacements: [limit] }
  );
  return rows;
}

/**
 * Returns logs with optional filters.
 */
async function getLogs({ type, status, fromDate, toDate, limit = 50 }) {
  const conditions = [];
  const replacements = [];

  if (type) { conditions.push('operation_type = ?'); replacements.push(type); }
  if (status) { conditions.push('status = ?'); replacements.push(status); }
  if (fromDate) { conditions.push('rate_date >= ?'); replacements.push(fromDate); }
  if (toDate) { conditions.push('rate_date <= ?'); replacements.push(toDate); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const safeLimit = Math.min(Math.max(1, Number(limit) || 50), 500);
  replacements.push(safeLimit);

  const [rows] = await sequelize.query(
    `SELECT id, operation_type, rate_date, old_rate, new_rate, source, status,
            error_message, executed_at, executed_by
     FROM exchange_rate_logs ${where}
     ORDER BY executed_at DESC
     LIMIT ?`,
    { replacements }
  );
  return rows;
}

/**
 * Checks if the daily cron ran successfully today (idempotency check).
 */
async function hasSuccessfulFetchToday() {
  const today = new Date().toISOString().split('T')[0];
  const [rows] = await sequelize.query(
    `SELECT id FROM exchange_rate_logs
     WHERE operation_type = 'daily_fetch' AND rate_date = ? AND status = 'success'
     LIMIT 1`,
    { replacements: [today] }
  );
  return rows.length > 0;
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function getDaysBetween(from, to) {
  const d1 = new Date(from);
  const d2 = new Date(to);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
}

module.exports = {
  fetchAndSaveDailyRate,
  loadHistoricalRates,
  getRateByDate,
  getRecentRates,
  getLogs,
  hasSuccessfulFetchToday,
};
