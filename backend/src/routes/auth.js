const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { loginLimiter } = require('../middleware/rateLimiter');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/authController');

router.post('/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
    body('name').trim().notEmpty().withMessage('El nombre es requerido'),
  ],
  validate,
  ctrl.register
);

router.post('/login',
  loginLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('La contraseña es requerida'),
  ],
  validate,
  ctrl.login
);

router.post('/logout', authenticate, ctrl.logout);
router.post('/refresh-token', ctrl.refreshToken);
router.post('/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  validate,
  ctrl.forgotPassword
);

router.post('/google',
  [body('credential').notEmpty().withMessage('Token de Google requerido')],
  validate,
  ctrl.googleAuth
);

router.post('/google/link', authenticate, ctrl.linkGoogle);

module.exports = router;
