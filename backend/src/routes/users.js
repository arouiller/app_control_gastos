const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/userController');

router.use(authenticate);

router.get('/profile', ctrl.getProfile);
router.put('/profile',
  [
    body('name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('profile_picture_url').optional().isURL().withMessage('URL de imagen inválida'),
  ],
  validate,
  ctrl.updateProfile
);
router.put('/password',
  [
    body('currentPassword').notEmpty().withMessage('La contraseña actual es requerida'),
    body('newPassword').isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres'),
  ],
  validate,
  ctrl.changePassword
);

module.exports = router;
