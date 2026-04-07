const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/categoryController');

router.use(authenticate);

router.get('/', ctrl.listCategories);
router.post('/',
  [
    body('name').trim().notEmpty().withMessage('El nombre es requerido'),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color inválido (formato #RRGGBB)'),
    body('icon').optional().trim(),
    body('description').optional().trim(),
  ],
  validate,
  ctrl.createCategory
);
router.put('/:id',
  [
    body('name').optional().trim().notEmpty(),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color inválido'),
    body('icon').optional().trim(),
    body('description').optional().trim(),
  ],
  validate,
  ctrl.updateCategory
);
router.delete('/:id', ctrl.deleteCategory);

module.exports = router;
