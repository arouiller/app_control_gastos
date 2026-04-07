const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/expenseController');

router.use(authenticate);

router.get('/', ctrl.listExpenses);
router.get('/:id', ctrl.getExpense);

router.post('/',
  [
    body('description').trim().notEmpty().withMessage('La descripción es requerida'),
    body('amount').isFloat({ gt: 0 }).withMessage('El monto debe ser mayor a 0'),
    body('date').isDate().withMessage('Fecha inválida'),
    body('categoryId').isInt({ gt: 0 }).withMessage('Categoría inválida'),
    body('paymentMethod').isIn(['cash', 'credit_card']).withMessage('Método de pago inválido'),
  ],
  validate,
  ctrl.createExpense
);

router.post('/installment',
  [
    body('description').trim().notEmpty().withMessage('La descripción es requerida'),
    body('amount').isFloat({ gt: 0 }).withMessage('El monto debe ser mayor a 0'),
    body('date').isDate().withMessage('Fecha inválida'),
    body('categoryId').isInt({ gt: 0 }).withMessage('Categoría inválida'),
    body('numberOfInstallments').isInt({ min: 2, max: 24 }).withMessage('El número de cuotas debe ser entre 2 y 24'),
  ],
  validate,
  ctrl.createInstallmentExpense
);

router.put('/:id',
  [
    body('description').optional().trim().notEmpty(),
    body('amount').optional().isFloat({ gt: 0 }),
    body('date').optional().isDate(),
    body('categoryId').optional().isInt({ gt: 0 }),
    body('paymentMethod').optional().isIn(['cash', 'credit_card']),
  ],
  validate,
  ctrl.updateExpense
);

router.delete('/:id', ctrl.deleteExpense);

module.exports = router;
