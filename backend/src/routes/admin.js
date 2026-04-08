const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');
const { getDbInfo, getDbVersions, migrateToVersion } = require('../controllers/adminController');

router.use(authenticate, requireAdmin);

router.get('/db-info', getDbInfo);
router.get('/db-versions', getDbVersions);
router.post('/db-migrate', migrateToVersion);

module.exports = router;
