const https = require('https');
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

// POST /api/admin/exchange-rates/diagnostics
const diagnosticsHandler = async (req, res) => {
  console.log('[ExchangeRateController] INICIANDO DIAGNÓSTICOS DE BCRA');

  const BCRA_BASE_URL = 'https://api.bcra.gob.ar/estadisticas/v4.0/monetarias/4';
  const today = new Date().toISOString().split('T')[0];
  const testUrl = `${BCRA_BASE_URL}?desde=${today}&hasta=${today}`;

  const diagnostics = {
    timestamp: new Date().toISOString(),
    bcra_url: testUrl,
    attempts: [],
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    const attemptResult = {
      attempt: attempt + 1,
      timestamp: new Date().toISOString(),
      status: null,
      statusCode: null,
      responseLength: null,
      error: null,
      duration_ms: null,
    };

    const startTime = Date.now();

    try {
      await new Promise((resolve, reject) => {
        const options = {
          rejectUnauthorized: true,
          headers: {
            'User-Agent': 'App-Control-Gastos/1.0 (Node.js)',
          },
        };
        const req = https.get(testUrl, options, (res) => {
          let body = '';
          attemptResult.statusCode = res.statusCode;
          attemptResult.statusMessage = res.statusMessage;
          attemptResult.headers = {
            'content-type': res.headers['content-type'],
            'content-length': res.headers['content-length'],
            'server': res.headers['server'],
          };

          res.on('data', (chunk) => { body += chunk; });
          res.on('end', () => {
            attemptResult.responseLength = body.length;
            attemptResult.status = 'completed';

            if (res.statusCode === 200) {
              try {
                const parsed = JSON.parse(body);
                attemptResult.response_structure = {
                  has_results: !!parsed.results,
                  has_detalle: !!parsed.results?.[0]?.detalle,
                  detalle_length: parsed.results?.[0]?.detalle?.length || 0,
                };
              } catch (e) {
                attemptResult.parse_error = e.message;
              }
            } else {
              // Capturar respuesta de error para diagnóstico
              attemptResult.error_response = body.substring(0, 500);
            }

            attemptResult.duration_ms = Date.now() - startTime;
            resolve();
          });
        });

        req.setTimeout(10000, () => {
          attemptResult.status = 'timeout';
          attemptResult.duration_ms = Date.now() - startTime;
          req.destroy();
          reject(new Error('Timeout 10s'));
        });

        req.on('error', (err) => {
          attemptResult.status = 'error';
          attemptResult.error = {
            name: err.name,
            message: err.message,
            code: err.code,
          };
          attemptResult.duration_ms = Date.now() - startTime;
          reject(err);
        });
      });
    } catch (err) {
      if (!attemptResult.error) {
        attemptResult.error = {
          name: err.name,
          message: err.message,
        };
      }
      attemptResult.duration_ms = Date.now() - startTime;
    }

    diagnostics.attempts.push(attemptResult);

    // Wait before next attempt
    if (attempt < 2) {
      const delayMs = Math.pow(2, attempt) * 1000;
      console.log(`[Diagnostics] Waiting ${delayMs}ms before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // Summary
  const successAttempts = diagnostics.attempts.filter(a => a.statusCode === 200);
  const failedAttempts = diagnostics.attempts.filter(a => a.statusCode && a.statusCode !== 200);
  const errorAttempts = diagnostics.attempts.filter(a => a.error);

  diagnostics.summary = {
    total_attempts: diagnostics.attempts.length,
    successful: successAttempts.length,
    http_errors: failedAttempts.length,
    network_errors: errorAttempts.length,
    bcra_status: successAttempts.length > 0 ? 'ONLINE' : 'OFFLINE',
    recommendation: successAttempts.length > 0
      ? '✅ BCRA está disponible. El fallback debería funcionar.'
      : failedAttempts.length > 0
        ? `⚠️ BCRA retorna HTTP ${failedAttempts[0].statusCode}. Posible problema del servidor.`
        : '❌ No hay conectividad a BCRA. Problema de red o firewall.',
  };

  return res.status(200).json({
    success: true,
    data: diagnostics,
  });
};

module.exports = {
  getRateByDateHandler,
  getRecentRatesHandler,
  loadHistoricalHandler,
  triggerDailyFetchHandler,
  getLogsHandler,
  diagnosticsHandler,
};
