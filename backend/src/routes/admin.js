const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');
const { getDbInfo, getDbVersions, migrateToVersion } = require('../controllers/adminController');
const {
  getRecentRatesHandler,
  loadHistoricalHandler,
  triggerDailyFetchHandler,
  getLogsHandler,
} = require('../controllers/exchangeRateController');

router.use(authenticate, requireAdmin);

router.get('/db-info', getDbInfo);
router.get('/db-versions', getDbVersions);
router.post('/db-migrate', migrateToVersion);

router.get('/exchange-rates/recent', getRecentRatesHandler);
router.get('/exchange-rates/logs', getLogsHandler);
router.post('/exchange-rates/load-historical', loadHistoricalHandler);
router.post('/exchange-rates/trigger', triggerDailyFetchHandler);

module.exports = router;
