const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');
const { getDbInfo } = require('../controllers/adminController');

router.use(authenticate, requireAdmin);

router.get('/db-info', getDbInfo);

module.exports = router;
