const router = require('express').Router();
const { generalLimiter } = require('../middleware/rateLimiter');

router.use(generalLimiter);

router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/categories', require('./categories'));
router.use('/expenses', require('./expenses'));
router.use('/installments', require('./installments'));
router.use('/analytics', require('./analytics'));
router.use('/reports', require('./reports'));
router.use('/exchange-rates', require('./exchangeRates'));
router.use('/admin', require('./admin'));

module.exports = router;
