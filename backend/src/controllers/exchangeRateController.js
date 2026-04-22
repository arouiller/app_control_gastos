const {
  fetchAndSaveDailyRate,
  loadHistoricalRates,
  getRateByDate,
  getRecentRates,
  getLogs,
} = require('../services/exchangeRateService');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

// GET /api/exchange-rates/:date
const getRateByDateHandler = async (req, res, next) => {
  try {
    const { date } = req.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return error(res, 'Formato de fecha inválido. Use YYYY-MM-DD', 400);
    }
    const rate = await getRateByDate(date);
    if (!rate) return error(res, `Sin cotización para la fecha ${date}`, 404);
    return success(res, rate);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/exchange-rates/recent
const getRecentRatesHandler = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const rates = await getRecentRates(limit);
    return success(res, rates);
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/exchange-rates/load-historical
const loadHistoricalHandler = async (req, res, next) => {
  try {
    console.log('[ExchangeRateController] loadHistoricalHandler INICIADO');
    console.log('[ExchangeRateController] body:', req.body);

    const today = new Date().toISOString().split('T')[0];
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    const fechaDesde = req.body?.fecha_desde || oneYearAgo;
    const fechaHasta = req.body?.fecha_hasta || today;

    console.log('[ExchangeRateController] fecha_desde:', fechaDesde, 'fecha_hasta:', fechaHasta);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaDesde) || !/^\d{4}-\d{2}-\d{2}$/.test(fechaHasta)) {
      return error(res, 'Formato de fecha inválido. Use YYYY-MM-DD', 400);
    }
    if (fechaDesde > fechaHasta) {
      return error(res, 'fecha_desde debe ser menor o igual a fecha_hasta', 400);
    }

    const executedBy = req.user?.email || req.user?.id?.toString() || 'admin';
    const t0 = Date.now();

    console.log('[ExchangeRateController] Llamando loadHistoricalRates...');
    const summary = await loadHistoricalRates(fechaDesde, fechaHasta, executedBy);
    console.log('[ExchangeRateController] Resultado:', summary);

    return success(res, {
      status: 'success',
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
      summary,
      execution_time_ms: Date.now() - t0,
    });
  } catch (err) {
    console.error('[ExchangeRateController] Error en carga histórica:', err.message, err.stack);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Error interno del servidor',
        debug: {
          handler: 'loadHistoricalHandler',
          errorName: err.name,
          errorMessage: err.message,
          stack: err.stack?.split('\n').slice(0, 5),
        },
      },
    });
  }
};

// POST /api/admin/exchange-rates/trigger
const triggerDailyFetchHandler = async (req, res, next) => {
  try {
    res.on('error', (err) => console.error('[HANDLER_ERROR]', err));
    console.log('[ExchangeRateController] triggerDailyFetchHandler INICIADO');
    console.log('[ExchangeRateController] req.user exists:', !!req.user);

    const executedBy = req.user?.email || req.user?.id?.toString() || 'admin';
    console.log('[ExchangeRateController] executedBy:', executedBy);

    const result = await fetchAndSaveDailyRate('admin_interface', executedBy);
    console.log('[ExchangeRateController] fetchAndSaveDailyRate result:', result);

    return success(res, result);
  } catch (err) {
    console.error('[ExchangeRateController] Error en trigger:', err.message, err.stack);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Error interno del servidor',
        debug: {
          handler: 'triggerDailyFetchHandler',
          errorName: err.name,
          errorMessage: err.message,
          stack: err.stack?.split('\n').slice(0, 5),
        },
      },
    });
  }
};

// GET /api/admin/exchange-rates/logs
const getLogsHandler = async (req, res, next) => {
  try {
    const { type, status, from_date, to_date, limit } = req.query;
    const logs = await getLogs({ type, status, fromDate: from_date, toDate: to_date, limit });
    return success(res, logs);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRateByDateHandler,
  getRecentRatesHandler,
  loadHistoricalHandler,
  triggerDailyFetchHandler,
  getLogsHandler,
};
