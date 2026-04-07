const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/analyticsController');

router.use(authenticate);

router.get('/summary', ctrl.getSummary);
router.get('/by-category', ctrl.getByCategory);
router.get('/cash-vs-card', ctrl.getCashVsCard);
router.get('/pending-installments', ctrl.getPendingInstallments);

module.exports = router;
