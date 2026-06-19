const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const gastoBorradorController = require('../controllers/gastoBorradorController');

router.use(authenticate);

// POST /api/gastos-borrador
router.post('/',
  [
    body('descripcion').trim().notEmpty().withMessage('Descripción es requerida'),
    body('monto_total').isFloat({ gt: 0 }).withMessage('Monto debe ser mayor a 0'),
    body('moneda').isIn(['ARS', 'USD']).withMessage('Moneda debe ser ARS o USD'),
    body('medio_de_pago').isIn(['cash', 'credit_card']).withMessage('Medio de pago inválido'),
    body('cantidad_de_cuotas').isInt({ min: 1, max: 24 }).withMessage('Cuotas debe estar entre 1 y 24'),
    body('valor_de_la_cuota').isFloat({ gt: 0 }).withMessage('Valor de cuota debe ser mayor a 0'),
    body('expense_date').isDate().withMessage('Fecha inválida'),
  ],
  validate,
  gastoBorradorController.create
);

// GET /api/gastos-borrador
router.get('/', gastoBorradorController.list);

// GET /api/gastos-borrador/:id
router.get('/:id', gastoBorradorController.getById);

// PUT /api/gastos-borrador/:id
router.put('/:id',
  [
    body('descripcion').optional().trim().notEmpty().withMessage('Descripción no puede estar vacía'),
    body('monto_total').optional().isFloat({ gt: 0 }).withMessage('Monto debe ser mayor a 0'),
    body('moneda').optional().isIn(['ARS', 'USD']).withMessage('Moneda debe ser ARS o USD'),
    body('medio_de_pago').optional().isIn(['cash', 'credit_card']).withMessage('Medio de pago inválido'),
    body('cantidad_de_cuotas').optional().isInt({ min: 1, max: 24 }).withMessage('Cuotas debe estar entre 1 y 24'),
    body('valor_de_la_cuota').optional().isFloat({ gt: 0 }).withMessage('Valor de cuota debe ser mayor a 0'),
    body('expense_date').optional().isDate().withMessage('Fecha inválida'),
  ],
  validate,
  gastoBorradorController.update
);

// DELETE /api/gastos-borrador/:id
router.delete('/:id', gastoBorradorController.delete);

// POST /api/gastos-borrador/:id/convertir
router.post('/:id/convertir',
  [
    body('category_id').isInt({ gt: 0 }).withMessage('Category ID debe ser un número positivo'),
  ],
  validate,
  gastoBorradorController.convertir
);

module.exports = router;
