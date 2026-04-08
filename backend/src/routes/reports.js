const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/reportController');

router.use(authenticate);

router.get('/monthly-grouping', ctrl.monthlyGrouping);
router.get('/monthly-grouping/details', ctrl.monthlyGroupingDetails);

module.exports = router;
