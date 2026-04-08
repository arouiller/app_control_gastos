const router = require('express').Router();
const { getRateByDateHandler } = require('../controllers/exchangeRateController');

// Public route (authenticated users only via parent router)
router.get('/:date', getRateByDateHandler);

module.exports = router;
