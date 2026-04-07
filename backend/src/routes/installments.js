const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/installmentController');

router.use(authenticate);

router.get('/', ctrl.listInstallments);
router.put('/:id/pay', ctrl.payInstallment);
router.put('/:id/unpay', ctrl.unpayInstallment);
router.delete('/:id', ctrl.deleteInstallment);

module.exports = router;
