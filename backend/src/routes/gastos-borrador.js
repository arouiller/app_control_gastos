const express = require('express');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createSchema, updateSchema, convertirSchema } = require('../middleware/schemas/gastoBorradorSchema');
const gastoBorradorController = require('../controllers/gastoBorradorController');

const router = express.Router();

// Protect all routes with auth middleware
router.use(authenticate);

// POST /api/gastos-borrador
router.post('/', validate(createSchema), gastoBorradorController.create);

// GET /api/gastos-borrador
router.get('/', gastoBorradorController.list);

// GET /api/gastos-borrador/:id
router.get('/:id', gastoBorradorController.getById);

// PUT /api/gastos-borrador/:id
router.put('/:id', validate(updateSchema), gastoBorradorController.update);

// DELETE /api/gastos-borrador/:id
router.delete('/:id', gastoBorradorController.delete);

// POST /api/gastos-borrador/:id/convertir
router.post('/:id/convertir', validate(convertirSchema), gastoBorradorController.convertir);

module.exports = router;
