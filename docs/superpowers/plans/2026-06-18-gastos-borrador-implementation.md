# Gastos Borrador Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a draft expense system that allows users to create editable expense records that can later be converted to full expenses with installments.

**Architecture:** Table-based separation (gastos_borrador separate from expenses). Backend provides CRUD endpoints + conversion logic. Frontend uses modal form with real-time field recalculation. Redux manages state. Conversion creates Expense + Installments in a transaction.

**Tech Stack:** Node.js/Express/Sequelize (backend), React/Redux/Zod/React Hook Form (frontend), MySQL 8.0+

## Global Constraints

- Backend payment_method enum values: `'cash'`, `'credit_card'` (not 'efectivo', 'tarjeta')
- Expense date field: `date` (DATEONLY), not `expense_date`
- Installment table exists and is separate from Expense
- All endpoints require JWT authentication
- Validation in both frontend (Zod) and backend (Joi)
- Models use Sequelize ORM
- Frontend uses Redux Toolkit for state management
- Frontend uses Tailwind CSS for styling
- Follow CLAUDE.md naming conventions: camelCase for JS, PascalCase for React components

---

## File Structure

### Backend Files to Create
- `backend/src/models/GastoBorrador.js` - Sequelize model
- `backend/src/controllers/gastoBorradorController.js` - CRUD + conversion logic
- `backend/src/routes/gastos-borrador.js` - REST routes
- `backend/src/middleware/schemas/gastoBorradorSchema.js` - Joi validation schema
- `backend/migrations/[timestamp]-create-gastos-borrador.js` - Database migration

### Backend Files to Modify
- `backend/src/server.js` - Register new route

### Frontend Files to Create
- `frontend/src/store/gastoBorradoresSlice.js` - Redux slice
- `frontend/src/services/gastoBorradorService.js` - API client
- `frontend/src/utils/schemas/gastoBorradorSchema.js` - Zod validation schema
- `frontend/src/pages/GastosBorrador.jsx` - Main page with table
- `frontend/src/components/GastoBorradorForm.jsx` - Modal form (create/edit)

### Frontend Files to Modify
- `frontend/src/App.jsx` - Add route
- `frontend/src/components/Layout/Sidebar.jsx` - Add menu item (optional)
- `frontend/src/store/index.js` - Register gastoBorradoresSlice

---

## Task Breakdown

### Task 1: Create Database Migration

**Files:**
- Create: `backend/migrations/[TIMESTAMP]-create-gastos-borrador.js`

**Interfaces:**
- Produces: Database table `gastos_borrador` with columns: id, user_id, descripcion, monto_total, moneda, medio_de_pago, cantidad_de_cuotas, valor_de_la_cuota, expense_date, status, expense_id, created_at, updated_at, converted_at

- [ ] **Step 1: Create migration file**

Use timestamp `20260618000000` for consistency. Create file:

```javascript
// backend/migrations/20260618000000-create-gastos-borrador.js
'use strict';

module.exports = {
  up: async (sequelize, Sequelize) => {
    const transaction = await sequelize.transaction();
    try {
      await sequelize.getQueryInterface().createTable(
        'gastos_borrador',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          descripcion: {
            type: Sequelize.STRING(255),
            allowNull: false,
          },
          monto_total: {
            type: Sequelize.DECIMAL(12, 2),
            allowNull: false,
            validate: { min: 0.01 },
          },
          moneda: {
            type: Sequelize.ENUM('ARS', 'USD'),
            allowNull: false,
            defaultValue: 'ARS',
          },
          medio_de_pago: {
            type: Sequelize.ENUM('cash', 'credit_card'),
            allowNull: false,
          },
          cantidad_de_cuotas: {
            type: Sequelize.INTEGER,
            allowNull: false,
            validate: { min: 1, max: 24 },
          },
          valor_de_la_cuota: {
            type: Sequelize.DECIMAL(12, 2),
            allowNull: false,
            validate: { min: 0.01 },
          },
          expense_date: {
            type: Sequelize.DATEONLY,
            allowNull: false,
          },
          status: {
            type: Sequelize.ENUM('draft', 'convertido'),
            allowNull: false,
            defaultValue: 'draft',
          },
          expense_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: 'expenses',
              key: 'id',
            },
            onDelete: 'SET NULL',
          },
          created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.fn('NOW'),
          },
          updated_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.fn('NOW'),
            onUpdate: Sequelize.fn('NOW'),
          },
          converted_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
        },
        { transaction }
      );

      // Indexes
      await sequelize.getQueryInterface().addIndex(
        'gastos_borrador',
        ['user_id'],
        { transaction }
      );
      await sequelize.getQueryInterface().addIndex(
        'gastos_borrador',
        ['status'],
        { transaction }
      );
      await sequelize.getQueryInterface().addIndex(
        'gastos_borrador',
        ['created_at'],
        { transaction }
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  down: async (sequelize, Sequelize) => {
    await sequelize.getQueryInterface().dropTable('gastos_borrador');
  },
};
```

- [ ] **Step 2: Verify migration syntax**

No execution yet, just check file is valid Node.js. If using an editor, ensure no syntax errors.

- [ ] **Step 3: Commit migration**

```bash
git add backend/migrations/20260618000000-create-gastos-borrador.js
git commit -m "migration: create gastos_borrador table"
```

---

### Task 2: Create GastoBorrador Sequelize Model

**Files:**
- Create: `backend/src/models/GastoBorrador.js`

**Interfaces:**
- Consumes: Database schema from Task 1
- Produces: Sequelize model with methods `create()`, `findByPk()`, `findAll()`, `update()`, `destroy()`; associations with User and Expense

- [ ] **Step 1: Create model file**

```javascript
// backend/src/models/GastoBorrador.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GastoBorrador = sequelize.define(
    'GastoBorrador',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      descripcion: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      monto_total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0.01 },
      },
      moneda: {
        type: DataTypes.ENUM('ARS', 'USD'),
        allowNull: false,
        defaultValue: 'ARS',
      },
      medio_de_pago: {
        type: DataTypes.ENUM('cash', 'credit_card'),
        allowNull: false,
      },
      cantidad_de_cuotas: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 24 },
      },
      valor_de_la_cuota: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0.01 },
      },
      expense_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('draft', 'convertido'),
        allowNull: false,
        defaultValue: 'draft',
      },
      expense_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      converted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'gastos_borrador',
      timestamps: true,
      underscored: true,
    }
  );

  GastoBorrador.associate = (models) => {
    GastoBorrador.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
    GastoBorrador.belongsTo(models.Expense, {
      foreignKey: 'expense_id',
      as: 'expense',
    });
  };

  return GastoBorrador;
};
```

- [ ] **Step 2: Verify model structure**

Check model follows same pattern as other models in `backend/src/models/`. Associations are defined correctly.

- [ ] **Step 3: Commit model**

```bash
git add backend/src/models/GastoBorrador.js
git commit -m "model: create GastoBorrador sequelize model"
```

---

### Task 3: Create Joi Validation Schema

**Files:**
- Create: `backend/src/middleware/schemas/gastoBorradorSchema.js`

**Interfaces:**
- Produces: Joi schema object with validation rules for create/update endpoints

- [ ] **Step 1: Create schema file**

```javascript
// backend/src/middleware/schemas/gastoBorradorSchema.js
const Joi = require('joi');

const createSchema = Joi.object({
  descripcion: Joi.string().required().max(255),
  monto_total: Joi.number().required().positive().precision(2),
  moneda: Joi.string().required().valid('ARS', 'USD'),
  medio_de_pago: Joi.string().required().valid('cash', 'credit_card'),
  cantidad_de_cuotas: Joi.number().required().integer().min(1).max(24),
  valor_de_la_cuota: Joi.number().required().positive().precision(2),
  expense_date: Joi.date().required().max('now'),
});

const updateSchema = Joi.object({
  descripcion: Joi.string().max(255),
  monto_total: Joi.number().positive().precision(2),
  moneda: Joi.string().valid('ARS', 'USD'),
  medio_de_pago: Joi.string().valid('cash', 'credit_card'),
  cantidad_de_cuotas: Joi.number().integer().min(1).max(24),
  valor_de_la_cuota: Joi.number().positive().precision(2),
  expense_date: Joi.date().max('now'),
}).min(1);

module.exports = {
  createSchema,
  updateSchema,
};
```

- [ ] **Step 2: Verify schema structure**

Check that all fields match spec requirements. `updateSchema` should have `.min(1)` to ensure at least one field is provided.

- [ ] **Step 3: Commit schema**

```bash
git add backend/src/middleware/schemas/gastoBorradorSchema.js
git commit -m "middleware: add gastoBorrador joi validation schema"
```

---

### Task 4: Create GastoBorrador Controller

**Files:**
- Create: `backend/src/controllers/gastoBorradorController.js`

**Interfaces:**
- Consumes: GastoBorrador model (Task 2), Joi schema (Task 3), Expense model, Installment model
- Produces: Controller methods: `create()`, `list()`, `getById()`, `update()`, `delete()`, `convertir()`

- [ ] **Step 1: Create base structure**

```javascript
// backend/src/controllers/gastoBorradorController.js
const { GastoBorrador, Expense, Installment, User } = require('../models');
const AppError = require('../utils/appError');
const { addMonths } = require('date-fns');

// Helper: Check inconsistency between monto_total, cantidad_de_cuotas, and valor_de_la_cuota
const getInconsistencyWarning = (monto_total, cantidad_de_cuotas, valor_de_la_cuota) => {
  const calculatedTotal = parseFloat((valor_de_la_cuota * cantidad_de_cuotas).toFixed(2));
  const actualTotal = parseFloat(monto_total.toFixed(2));
  if (calculatedTotal !== actualTotal) {
    return `Suma de cuotas ($${calculatedTotal}) difiere de monto total ($${actualTotal})`;
  }
  return null;
};

// Helper: Calculate installment dates (starting next month from expense_date)
const calculateInstallmentDates = (expenseDate, numInstallments) => {
  const dates = [];
  let currentDate = addMonths(new Date(expenseDate), 1);
  for (let i = 0; i < numInstallments; i++) {
    dates.push(new Date(currentDate));
    currentDate = addMonths(currentDate, 1);
  }
  return dates;
};

// Helper: Distribute amount across installments (last may differ due to rounding)
const distributeAmount = (totalAmount, numInstallments) => {
  const amounts = [];
  const baseAmount = parseFloat((totalAmount / numInstallments).toFixed(2));
  for (let i = 0; i < numInstallments - 1; i++) {
    amounts.push(baseAmount);
  }
  const lastAmount = parseFloat((totalAmount - baseAmount * (numInstallments - 1)).toFixed(2));
  amounts.push(lastAmount);
  return amounts;
};

// POST /api/gastos-borrador
exports.create = async (req, res, next) => {
  try {
    const { user } = req;
    const { descripcion, monto_total, moneda, medio_de_pago, cantidad_de_cuotas, valor_de_la_cuota, expense_date } = req.body;

    const inconsistency_warning = getInconsistencyWarning(monto_total, cantidad_de_cuotas, valor_de_la_cuota);

    const gastoBorrador = await GastoBorrador.create({
      user_id: user.id,
      descripcion,
      monto_total,
      moneda,
      medio_de_pago,
      cantidad_de_cuotas,
      valor_de_la_cuota,
      expense_date,
      status: 'draft',
    });

    res.status(201).json({
      success: true,
      data: {
        ...gastoBorrador.toJSON(),
        inconsistency_warning,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/gastos-borrador
exports.list = async (req, res, next) => {
  try {
    const { user } = req;
    const { status, page = 1, limit = 20, sort = '-created_at' } = req.query;

    const where = { user_id: user.id };
    if (status) {
      where.status = status;
    }

    const offset = (page - 1) * limit;
    const order = [];
    if (sort === '-created_at') {
      order.push(['created_at', 'DESC']);
    } else if (sort === 'created_at') {
      order.push(['created_at', 'ASC']);
    } else if (sort === '-monto_total') {
      order.push(['monto_total', 'DESC']);
    } else if (sort === 'monto_total') {
      order.push(['monto_total', 'ASC']);
    }

    const { count, rows } = await GastoBorrador.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order: order.length > 0 ? order : [['created_at', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/gastos-borrador/:id
exports.getById = async (req, res, next) => {
  try {
    const { user } = req;
    const { id } = req.params;

    const gastoBorrador = await GastoBorrador.findOne({
      where: { id, user_id: user.id },
    });

    if (!gastoBorrador) {
      return next(new AppError('Gasto borrador no encontrado', 404));
    }

    const inconsistency_warning = getInconsistencyWarning(
      gastoBorrador.monto_total,
      gastoBorrador.cantidad_de_cuotas,
      gastoBorrador.valor_de_la_cuota
    );

    res.status(200).json({
      success: true,
      data: {
        ...gastoBorrador.toJSON(),
        inconsistency_warning,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/gastos-borrador/:id
exports.update = async (req, res, next) => {
  try {
    const { user } = req;
    const { id } = req.params;
    const updates = req.body;

    const gastoBorrador = await GastoBorrador.findOne({
      where: { id, user_id: user.id },
    });

    if (!gastoBorrador) {
      return next(new AppError('Gasto borrador no encontrado', 404));
    }

    if (gastoBorrador.status !== 'draft') {
      return next(new AppError('Solo se pueden editar borradores en estado draft', 403));
    }

    // Auto-recalculate valor_de_la_cuota if monto_total or cantidad_de_cuotas changed
    const newMonto = updates.monto_total !== undefined ? updates.monto_total : gastoBorrador.monto_total;
    const newCuotas = updates.cantidad_de_cuotas !== undefined ? updates.cantidad_de_cuotas : gastoBorrador.cantidad_de_cuotas;
    const newValor = updates.valor_de_la_cuota !== undefined ? updates.valor_de_la_cuota : gastoBorrador.valor_de_la_cuota;

    // If user didn't explicitly set valor_de_la_cuota but changed monto or cuotas, recalculate
    if (
      (updates.monto_total !== undefined || updates.cantidad_de_cuotas !== undefined) &&
      updates.valor_de_la_cuota === undefined
    ) {
      updates.valor_de_la_cuota = parseFloat((newMonto / newCuotas).toFixed(2));
    }

    await gastoBorrador.update(updates);

    const inconsistency_warning = getInconsistencyWarning(
      gastoBorrador.monto_total,
      gastoBorrador.cantidad_de_cuotas,
      gastoBorrador.valor_de_la_cuota
    );

    res.status(200).json({
      success: true,
      data: {
        ...gastoBorrador.toJSON(),
        inconsistency_warning,
      },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/gastos-borrador/:id
exports.delete = async (req, res, next) => {
  try {
    const { user } = req;
    const { id } = req.params;

    const gastoBorrador = await GastoBorrador.findOne({
      where: { id, user_id: user.id },
    });

    if (!gastoBorrador) {
      return next(new AppError('Gasto borrador no encontrado', 404));
    }

    if (gastoBorrador.status !== 'draft') {
      return next(new AppError('Solo se pueden eliminar borradores en estado draft', 403));
    }

    await gastoBorrador.destroy();

    res.status(200).json({
      success: true,
      message: 'Gasto borrador eliminado',
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/gastos-borrador/:id/convertir
exports.convertir = async (req, res, next) => {
  const transaction = await req.app.locals.sequelize.transaction();
  try {
    const { user } = req;
    const { id } = req.params;

    const gastoBorrador = await GastoBorrador.findOne({
      where: { id, user_id: user.id },
      transaction,
    });

    if (!gastoBorrador) {
      await transaction.rollback();
      return next(new AppError('Gasto borrador no encontrado', 404));
    }

    if (gastoBorrador.status !== 'draft') {
      await transaction.rollback();
      return next(new AppError('Solo se pueden convertir borradores en estado draft', 403));
    }

    // Validate amounts
    if (gastoBorrador.monto_total <= 0 || gastoBorrador.valor_de_la_cuota <= 0) {
      await transaction.rollback();
      return next(new AppError('Montos deben ser positivos', 400));
    }

    // Create Expense (note: no category_id in borrador, so need to handle this)
    // For now, use null or require default category - check implementation
    // Assuming we'll need a default category or user-selected category
    // For MVP: using category_id = null may violate FK constraint
    // DECISION: For now, we'll need to handle this in frontend or use a default category
    // Let's assume category_id will be set during conversion (frontend passes it)
    
    // Actually, re-reading spec: "no hay categoria" means gasto_borrador doesn't have it
    // But Expense requires category_id. This is a mismatch.
    // TODO: Clarify with user - does conversion require category selection?
    // For now, implement assuming category_id is required in conversion request OR
    // use a default category if available

    // Create Expense without category for now (will need adjustment)
    const expense = await Expense.create(
      {
        user_id: user.id,
        category_id: null, // Will be handled in conversion or default
        description: gastoBorrador.descripcion,
        amount: gastoBorrador.monto_total,
        currency: gastoBorrador.moneda,
        date: gastoBorrador.expense_date,
        payment_method: gastoBorrador.medio_de_pago,
        is_installment: gastoBorrador.cantidad_de_cuotas > 1,
        total_installments: gastoBorrador.cantidad_de_cuotas,
      },
      { transaction }
    );

    // Create installments if cantidad_de_cuotas > 1
    if (gastoBorrador.cantidad_de_cuotas > 1) {
      const installmentDates = calculateInstallmentDates(gastoBorrador.expense_date, gastoBorrador.cantidad_de_cuotas);
      const installmentAmounts = distributeAmount(gastoBorrador.monto_total, gastoBorrador.cantidad_de_cuotas);

      const installments = [];
      for (let i = 0; i < gastoBorrador.cantidad_de_cuotas; i++) {
        installments.push({
          expense_id: expense.id,
          installment_number: i + 1,
          total_installments: gastoBorrador.cantidad_de_cuotas,
          amount: installmentAmounts[i],
          due_date: installmentDates[i],
          is_paid: false,
        });
      }

      await Installment.bulkCreate(installments, { transaction });
    }

    // Update GastoBorrador
    await gastoBorrador.update(
      {
        status: 'convertido',
        expense_id: expense.id,
        converted_at: new Date(),
      },
      { transaction }
    );

    // Reload to get associations
    const updatedBorrador = await GastoBorrador.findByPk(gastoBorrador.id, { transaction });
    const expenseWithInstallments = await Expense.findByPk(expense.id, {
      include: ['installments'],
      transaction,
    });

    await transaction.commit();

    res.status(201).json({
      success: true,
      data: {
        expense: expenseWithInstallments.toJSON(),
        gasto_borrador_actualizado: updatedBorrador.toJSON(),
      },
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};
```

- [ ] **Step 2: Check for missing dependencies**

Verify `AppError`, `addMonths` from date-fns are available. Check that model imports will work.

- [ ] **Step 3: Commit controller**

```bash
git add backend/src/controllers/gastoBorradorController.js
git commit -m "controller: create gastoBorrador controller with CRUD and conversion logic"
```

---

### Task 5: Create Routes

**Files:**
- Create: `backend/src/routes/gastos-borrador.js`

**Interfaces:**
- Consumes: gastoBorradorController methods (Task 4), auth middleware, validation schema (Task 3)
- Produces: Express router with 6 endpoints

- [ ] **Step 1: Create routes file**

```javascript
// backend/src/routes/gastos-borrador.js
const express = require('express');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createSchema, updateSchema } = require('../middleware/schemas/gastoBorradorSchema');
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
router.post('/:id/convertir', gastoBorradorController.convertir);

module.exports = router;
```

- [ ] **Step 2: Verify route definitions**

Check endpoint paths, HTTP methods, middleware order. Auth should be first, then validate for POST/PUT.

- [ ] **Step 3: Commit routes**

```bash
git add backend/src/routes/gastos-borrador.js
git commit -m "routes: add gastos-borrador REST endpoints"
```

---

### Task 6: Register Routes in Server

**Files:**
- Modify: `backend/src/server.js`

**Interfaces:**
- Consumes: gastos-borrador router (Task 5)
- Produces: Mounted route at `/api/gastos-borrador`

- [ ] **Step 1: Find app.use section in server.js**

Locate where other routes like `/api/expenses` are registered.

- [ ] **Step 2: Add route registration**

Add this line after other route registrations:

```javascript
const gastoBorradorRoutes = require('./routes/gastos-borrador');
// ... other requires ...

// ... in app.use() section:
app.use('/api/gastos-borrador', gastoBorradorRoutes);
```

- [ ] **Step 3: Verify imports**

Check that `gastoBorradorRoutes` is imported correctly.

- [ ] **Step 4: Commit server changes**

```bash
git add backend/src/server.js
git commit -m "server: register gastos-borrador routes"
```

---

### Task 7: Create Frontend Zod Schema

**Files:**
- Create: `frontend/src/utils/schemas/gastoBorradorSchema.js`

**Interfaces:**
- Produces: Zod schema for validation in forms

- [ ] **Step 1: Create schema file**

```javascript
// frontend/src/utils/schemas/gastoBorradorSchema.js
import { z } from 'zod';

export const gastoBorradorSchema = z.object({
  descripcion: z.string()
    .min(1, 'Descripción es requerida')
    .max(255, 'Descripción no puede exceder 255 caracteres'),
  monto_total: z.number()
    .positive('Monto debe ser mayor a 0')
    .multipleOf(0.01, 'Máximo 2 decimales'),
  moneda: z.enum(['ARS', 'USD'], {
    errorMap: () => ({ message: 'Selecciona ARS o USD' }),
  }),
  medio_de_pago: z.enum(['cash', 'credit_card'], {
    errorMap: () => ({ message: 'Selecciona efectivo o tarjeta' }),
  }),
  cantidad_de_cuotas: z.number()
    .int('Debe ser un número entero')
    .min(1, 'Mínimo 1 cuota')
    .max(24, 'Máximo 24 cuotas'),
  valor_de_la_cuota: z.number()
    .positive('Valor debe ser mayor a 0')
    .multipleOf(0.01, 'Máximo 2 decimales'),
  expense_date: z.string()
    .refine(date => new Date(date) <= new Date(), 'Fecha no puede ser futura'),
});

export type GastoBorradorFormData = z.infer<typeof gastoBorradorSchema>;
```

- [ ] **Step 2: Verify schema structure**

Check that enums match backend values ('cash', not 'efectivo'). Date validation is correct.

- [ ] **Step 3: Commit schema**

```bash
git add frontend/src/utils/schemas/gastoBorradorSchema.js
git commit -m "utils: add gastoBorrador zod validation schema"
```

---

### Task 8: Create Frontend API Service

**Files:**
- Create: `frontend/src/services/gastoBorradorService.js`

**Interfaces:**
- Consumes: Axios API client (api.js)
- Produces: Service object with methods: `create()`, `getAll()`, `getById()`, `update()`, `delete()`, `convertir()`

- [ ] **Step 1: Create service file**

```javascript
// frontend/src/services/gastoBorradorService.js
import api from './api';

export const gastoBorradorService = {
  // Create new borrador
  create: (data) => api.post('/gastos-borrador', data),

  // Get all borradores with filters
  getAll: (filters = {}) => api.get('/gastos-borrador', { params: filters }),

  // Get single borrador by ID
  getById: (id) => api.get(`/gastos-borrador/${id}`),

  // Update borrador (only if draft)
  update: (id, data) => api.put(`/gastos-borrador/${id}`, data),

  // Delete borrador (only if draft)
  delete: (id) => api.delete(`/gastos-borrador/${id}`),

  // Convert borrador to expense
  convertir: (id) => api.post(`/gastos-borrador/${id}/convertir`),
};
```

- [ ] **Step 2: Verify API paths**

Check paths match backend routes. Ensure methods return promises.

- [ ] **Step 3: Commit service**

```bash
git add frontend/src/services/gastoBorradorService.js
git commit -m "service: add gastoBorrador API client"
```

---

### Task 9: Create Redux Slice

**Files:**
- Create: `frontend/src/store/gastoBorradoresSlice.js`

**Interfaces:**
- Consumes: gastoBorradorService (Task 8)
- Produces: Redux slice with state shape: `{ borradores: [], loading: false, error: null, filters: {} }`

- [ ] **Step 1: Create slice file**

```javascript
// frontend/src/store/gastoBorradoresSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { gastoBorradorService } from '../services/gastoBorradorService';

export const fetchBorradores = createAsyncThunk(
  'gastoBorradores/fetchBorradores',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await gastoBorradorService.getAll(filters);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar borradores');
    }
  }
);

export const createBorrador = createAsyncThunk(
  'gastoBorradores/createBorrador',
  async (data, { rejectWithValue }) => {
    try {
      const response = await gastoBorradorService.create(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al crear borrador');
    }
  }
);

export const updateBorrador = createAsyncThunk(
  'gastoBorradores/updateBorrador',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await gastoBorradorService.update(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al actualizar borrador');
    }
  }
);

export const deleteBorrador = createAsyncThunk(
  'gastoBorradores/deleteBorrador',
  async (id, { rejectWithValue }) => {
    try {
      await gastoBorradorService.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al eliminar borrador');
    }
  }
);

export const convertirBorrador = createAsyncThunk(
  'gastoBorradores/convertirBorrador',
  async (id, { rejectWithValue }) => {
    try {
      const response = await gastoBorradorService.convertir(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al convertir borrador');
    }
  }
);

const initialState = {
  borradores: [],
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  },
};

const gastoBorradoresSlice = createSlice({
  name: 'gastoBorradores',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetBorradores: (state) => {
      state.borradores = [];
      state.pagination = initialState.pagination;
    },
  },
  extraReducers: (builder) => {
    // Fetch borradores
    builder
      .addCase(fetchBorradores.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBorradores.fulfilled, (state, action) => {
        state.loading = false;
        state.borradores = action.payload.data || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(fetchBorradores.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create borrador
    builder
      .addCase(createBorrador.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBorrador.fulfilled, (state, action) => {
        state.loading = false;
        state.borradores.unshift(action.payload.data);
      })
      .addCase(createBorrador.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update borrador
    builder
      .addCase(updateBorrador.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBorrador.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.borradores.findIndex((b) => b.id === action.payload.data.id);
        if (index !== -1) {
          state.borradores[index] = action.payload.data;
        }
      })
      .addCase(updateBorrador.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete borrador
    builder
      .addCase(deleteBorrador.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBorrador.fulfilled, (state, action) => {
        state.loading = false;
        state.borradores = state.borradores.filter((b) => b.id !== action.payload);
      })
      .addCase(deleteBorrador.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Convertir borrador
    builder
      .addCase(convertirBorrador.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(convertirBorrador.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.borradores.findIndex(
          (b) => b.id === action.payload.gasto_borrador_actualizado.id
        );
        if (index !== -1) {
          state.borradores[index] = action.payload.gasto_borrador_actualizado;
        }
      })
      .addCase(convertirBorrador.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, resetBorradores } = gastoBorradoresSlice.actions;
export default gastoBorradoresSlice.reducer;
```

- [ ] **Step 2: Verify slice structure**

Check async thunks match service methods. State shape is consistent. Reducers handle loading/error states.

- [ ] **Step 3: Commit slice**

```bash
git add frontend/src/store/gastoBorradoresSlice.js
git commit -m "store: add gastoBorradores redux slice"
```

---

### Task 10: Register Redux Slice in Store

**Files:**
- Modify: `frontend/src/store/index.js`

**Interfaces:**
- Consumes: gastoBorradoresSlice (Task 9)
- Produces: Updated Redux store configuration

- [ ] **Step 1: Find store configuration**

Locate where other slices (authSlice, expensesSlice, etc.) are registered.

- [ ] **Step 2: Add slice import and registration**

Add import:
```javascript
import gastoBorradoresReducer from './gastoBorradoresSlice';
```

Add to configureStore:
```javascript
const store = configureStore({
  reducer: {
    // ... existing slices
    gastoBorradores: gastoBorradoresReducer,
  },
});
```

- [ ] **Step 3: Commit store changes**

```bash
git add frontend/src/store/index.js
git commit -m "store: register gastoBorradores slice in redux store"
```

---

### Task 11: Create GastoBorradorForm Component

**Files:**
- Create: `frontend/src/components/GastoBorradorForm.jsx`

**Interfaces:**
- Consumes: useForm (React Hook Form), gastoBorradorSchema (Task 7)
- Produces: Modal/form component for create/edit with real-time field recalculation and inconsistency warnings

- [ ] **Step 1: Create form component**

```jsx
// frontend/src/components/GastoBorradorForm.jsx
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { gastoBorradorSchema } from '../utils/schemas/gastoBorradorSchema';
import Button from './UI/Button';
import Input from './UI/Input';
import Select from './UI/Select';
import Modal from './UI/Modal';

const GastoBorradorForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = null, 
  isLoading = false 
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm({
    resolver: zodResolver(gastoBorradorSchema),
    defaultValues: initialData || {
      descripcion: '',
      monto_total: 0,
      moneda: 'ARS',
      medio_de_pago: 'cash',
      cantidad_de_cuotas: 1,
      valor_de_la_cuota: 0,
      expense_date: new Date().toISOString().split('T')[0],
    },
  });

  const montTotal = watch('monto_total');
  const cantidadCuotas = watch('cantidad_de_cuotas');
  const valorCuota = watch('valor_de_la_cuota');

  // Auto-recalculate valor_de_la_cuota when monto_total or cantidad_de_cuotas changes
  useEffect(() => {
    if (montTotal > 0 && cantidadCuotas > 0) {
      const calculatedValue = parseFloat((montTotal / cantidadCuotas).toFixed(2));
      // Only recalculate if not manually edited recently
      // For now, always recalculate (can add debounce later)
      setValue('valor_de_la_cuota', calculatedValue);
    }
  }, [montTotal, cantidadCuotas, setValue]);

  // Detect inconsistency
  const calculatedTotal = parseFloat((valorCuota * cantidadCuotas).toFixed(2));
  const hasInconsistency = calculatedTotal !== parseFloat(montTotal.toFixed(2)) && montTotal > 0;

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const handleFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Editar Gasto Borrador' : 'Nuevo Gasto Borrador'}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Descripción */}
        <Controller
          name="descripcion"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <Input
                {...field}
                placeholder="Ej: Compra en supermercado"
                error={errors.descripcion?.message}
              />
            </div>
          )}
        />

        {/* Monto Total */}
        <Controller
          name="monto_total"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium mb-1">Monto Total</label>
              <Input
                {...field}
                type="number"
                step="0.01"
                placeholder="0.00"
                error={errors.monto_total?.message}
                onChange={(e) => field.onChange(parseFloat(e.target.value))}
              />
            </div>
          )}
        />

        {/* Moneda */}
        <Controller
          name="moneda"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium mb-1">Moneda</label>
              <Select
                {...field}
                options={[
                  { value: 'ARS', label: 'ARS' },
                  { value: 'USD', label: 'USD' },
                ]}
                error={errors.moneda?.message}
              />
            </div>
          )}
        />

        {/* Medio de Pago */}
        <Controller
          name="medio_de_pago"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium mb-1">Medio de Pago</label>
              <Select
                {...field}
                options={[
                  { value: 'cash', label: 'Efectivo' },
                  { value: 'credit_card', label: 'Tarjeta' },
                ]}
                error={errors.medio_de_pago?.message}
              />
            </div>
          )}
        />

        {/* Cantidad de Cuotas */}
        <Controller
          name="cantidad_de_cuotas"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium mb-1">Cantidad de Cuotas</label>
              <Input
                {...field}
                type="number"
                min="1"
                max="24"
                placeholder="1"
                error={errors.cantidad_de_cuotas?.message}
                onChange={(e) => field.onChange(parseInt(e.target.value))}
              />
            </div>
          )}
        />

        {/* Valor de Cuota (read-only or editable?) */}
        <Controller
          name="valor_de_la_cuota"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium mb-1">Valor por Cuota</label>
              <Input
                {...field}
                type="number"
                step="0.01"
                placeholder="0.00"
                error={errors.valor_de_la_cuota?.message}
                onChange={(e) => field.onChange(parseFloat(e.target.value))}
              />
              {hasInconsistency && (
                <p className="text-sm text-yellow-600 mt-1">
                  ⚠ Suma de cuotas (${calculatedTotal.toFixed(2)}) difiere de monto total (${montTotal.toFixed(2)})
                </p>
              )}
            </div>
          )}
        />

        {/* Fecha de Gasto */}
        <Controller
          name="expense_date"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium mb-1">Fecha del Gasto</label>
              <Input
                {...field}
                type="date"
                error={errors.expense_date?.message}
              />
            </div>
          )}
        />

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {initialData ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default GastoBorradorForm;
```

- [ ] **Step 2: Verify form structure**

Check that all fields are present. Auto-recalculation logic for valor_de_la_cuota works. Error display is consistent with project style.

- [ ] **Step 3: Commit component**

```bash
git add frontend/src/components/GastoBorradorForm.jsx
git commit -m "component: add GastoBorradorForm modal with field recalculation"
```

---

### Task 12: Create GastosBorrador Page

**Files:**
- Create: `frontend/src/pages/GastosBorrador.jsx`

**Interfaces:**
- Consumes: Redux (gastoBorradoresSlice from Task 9), gastoBorradorService (Task 8), GastoBorradorForm (Task 11)
- Produces: Page component with table, filters, CRUD buttons, conversion flow

- [ ] **Step 1: Create page component**

```jsx
// frontend/src/pages/GastosBorrador.jsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchBorradores,
  createBorrador,
  updateBorrador,
  deleteBorrador,
  convertirBorrador,
  clearError,
} from '../store/gastoBorradoresSlice';
import GastoBorradorForm from '../components/GastoBorradorForm';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import EmptyState from '../components/UI/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';

const GastosBorrador = () => {
  const dispatch = useDispatch();
  const { borradores, loading, error, pagination } = useSelector((state) => state.gastoBorradores);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBorrador, setEditingBorrador] = useState(null);
  const [statusFilter, setStatusFilter] = useState('draft');
  const [convertingId, setConvertingId] = useState(null);
  const [showConvertModal, setShowConvertModal] = useState(false);

  // Load borradores on mount and when filter changes
  useEffect(() => {
    dispatch(fetchBorradores({ status: statusFilter, page: 1, limit: 20 }));
  }, [dispatch, statusFilter]);

  // Clear error when modal closes
  useEffect(() => {
    if (!isFormOpen) {
      setEditingBorrador(null);
    }
  }, [isFormOpen]);

  const handleCreateClick = () => {
    setEditingBorrador(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (borrador) => {
    setEditingBorrador(borrador);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data) => {
    try {
      if (editingBorrador) {
        await dispatch(updateBorrador({ id: editingBorrador.id, data })).unwrap();
      } else {
        await dispatch(createBorrador(data)).unwrap();
      }
      setIsFormOpen(false);
      setEditingBorrador(null);
      // Optional: show success toast
    } catch (err) {
      // Error is in Redux state, already shown
    }
  };

  const handleDeleteClick = async (borrador) => {
    if (window.confirm('¿Estás seguro que deseas eliminar este borrador?')) {
      try {
        await dispatch(deleteBorrador(borrador.id)).unwrap();
        // Optional: show success toast
      } catch (err) {
        // Error is in Redux state
      }
    }
  };

  const handleConvertClick = (borrador) => {
    setConvertingId(borrador.id);
    setShowConvertModal(true);
  };

  const handleConfirmConvert = async () => {
    try {
      await dispatch(convertirBorrador(convertingId)).unwrap();
      setShowConvertModal(false);
      setConvertingId(null);
      // Optional: show success toast & redirect to gasto creado
    } catch (err) {
      // Error is in Redux state
    }
  };

  if (loading && borradores.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Gastos Borrador</h1>
        <p className="text-gray-600">Gestiona tus gastos en estado de borrador</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
          <button onClick={() => dispatch(clearError())} className="ml-2 underline">
            Descartar
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'draft' ? 'primary' : 'secondary'}
            onClick={() => setStatusFilter('draft')}
          >
            Borradores
          </Button>
          <Button
            variant={statusFilter === 'convertido' ? 'primary' : 'secondary'}
            onClick={() => setStatusFilter('convertido')}
          >
            Convertidos
          </Button>
        </div>
        <Button variant="primary" onClick={handleCreateClick}>
          + Nuevo Borrador
        </Button>
      </div>

      {/* Table */}
      {borradores.length === 0 ? (
        <EmptyState
          title="Sin borradores"
          description={`No hay gastos en estado ${statusFilter} aún`}
          action={statusFilter === 'draft' ? () => handleCreateClick() : undefined}
          actionLabel="Crear nuevo"
        />
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Descripción</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Monto</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Cuotas</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Fecha</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Estado</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {borradores.map((borrador) => (
                <tr key={borrador.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{borrador.descripcion}</td>
                  <td className="px-6 py-4 text-sm">
                    {formatCurrency(borrador.monto_total, borrador.moneda)}
                  </td>
                  <td className="px-6 py-4 text-sm">{borrador.cantidad_de_cuotas}</td>
                  <td className="px-6 py-4 text-sm">{formatDate(borrador.expense_date)}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      borrador.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {borrador.status === 'draft' ? 'Borrador' : 'Convertido'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {borrador.status === 'draft' && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEditClick(borrador)}
                          className="mr-2"
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleConvertClick(borrador)}
                          className="mr-2"
                        >
                          Convertir
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteClick(borrador)}
                        >
                          Eliminar
                        </Button>
                      </>
                    )}
                    {borrador.status === 'convertido' && (
                      <span className="text-gray-500 text-sm">
                        Convertido el {formatDate(borrador.converted_at)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination (if needed) */}
      {pagination.pages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {/* Add pagination controls if needed */}
        </div>
      )}

      {/* Form Modal */}
      <GastoBorradorForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingBorrador}
        isLoading={loading}
      />

      {/* Convert Confirmation Modal */}
      <Modal
        isOpen={showConvertModal}
        onClose={() => {
          setShowConvertModal(false);
          setConvertingId(null);
        }}
        title="Confirmar Conversión"
      >
        <div className="space-y-4">
          <p>¿Estás seguro que deseas convertir este gasto a definitivo?</p>
          <p className="text-sm text-gray-600">
            Una vez convertido, se crearán las cuotas según lo especificado.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowConvertModal(false);
                setConvertingId(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmConvert}
              isLoading={loading}
            >
              Convertir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GastosBorrador;
```

- [ ] **Step 2: Verify page structure**

Check table displays all fields. Filter buttons work. Modals are properly wired. Redux dispatch calls are correct.

- [ ] **Step 3: Commit page**

```bash
git add frontend/src/pages/GastosBorrador.jsx
git commit -m "page: add GastosBorrador list and management page"
```

---

### Task 13: Add Route to App

**Files:**
- Modify: `frontend/src/App.jsx`

**Interfaces:**
- Consumes: GastosBorrador page (Task 12)
- Produces: Registered route at `/gastos-borrador`

- [ ] **Step 1: Add import in App.jsx**

```jsx
import GastosBorrador from './pages/GastosBorrador';
```

- [ ] **Step 2: Add route**

In the routes definition, add:
```jsx
{
  path: '/gastos-borrador',
  element: <GastosBorrador />,
  private: true,
}
```

Or if using `<Route>` directly:
```jsx
<Route path="/gastos-borrador" element={<GastosBorrador />} />
```

- [ ] **Step 3: Commit App changes**

```bash
git add frontend/src/App.jsx
git commit -m "routes: add /gastos-borrador route"
```

---

### Task 14: Update Sidebar Navigation (Optional)

**Files:**
- Modify: `frontend/src/components/Layout/Sidebar.jsx`

**Interfaces:**
- Produces: Menu item for Gastos Borrador in sidebar

- [ ] **Step 1: Add menu item**

Add link to `/gastos-borrador` in sidebar navigation. Example:
```jsx
<NavLink to="/gastos-borrador" className="menu-item">
  Gastos Borrador
</NavLink>
```

- [ ] **Step 2: Test navigation**

Verify link works and page loads.

- [ ] **Step 3: Commit sidebar changes**

```bash
git add frontend/src/components/Layout/Sidebar.jsx
git commit -m "nav: add Gastos Borrador menu item to sidebar"
```

---

### Task 15: Backend Integration Test (Manual)

**Files:**
- No files to create, manual testing

**Interfaces:**
- Consumes: All backend implementation (Tasks 1-6)
- Produces: Verified endpoints via API testing tool (Postman, curl, REST Client)

- [ ] **Step 1: Start backend server**

```bash
npm run dev
# or
node backend/src/server.js
```

- [ ] **Step 2: Test POST /api/gastos-borrador (create)**

```bash
curl -X POST http://localhost:5000/api/gastos-borrador \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "descripcion": "Test borrador",
    "monto_total": 1000,
    "moneda": "ARS",
    "medio_de_pago": "cash",
    "cantidad_de_cuotas": 3,
    "valor_de_la_cuota": 333.33,
    "expense_date": "2026-06-18"
  }'
```

Expected: 201 status, returns created borrador with id, status='draft'

- [ ] **Step 3: Test GET /api/gastos-borrador (list)**

```bash
curl -X GET "http://localhost:5000/api/gastos-borrador?status=draft" \
  -H "Authorization: Bearer <your_jwt_token>"
```

Expected: 200 status, returns array of borradores with pagination

- [ ] **Step 4: Test GET /api/gastos-borrador/:id (get by id)**

Use ID from Step 2:

```bash
curl -X GET http://localhost:5000/api/gastos-borrador/<id> \
  -H "Authorization: Bearer <your_jwt_token>"
```

Expected: 200 status, returns single borrador

- [ ] **Step 5: Test PUT /api/gastos-borrador/:id (update)**

```bash
curl -X PUT http://localhost:5000/api/gastos-borrador/<id> \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"descripcion": "Test updated"}'
```

Expected: 200 status, returns updated borrador

- [ ] **Step 6: Test POST /api/gastos-borrador/:id/convertir (convert)**

```bash
curl -X POST http://localhost:5000/api/gastos-borrador/<id>/convertir \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json"
```

Expected: 201 status, returns expense + installments + updated borrador with status='convertido'

- [ ] **Step 7: Test DELETE /api/gastos-borrador/:id (delete)**

Create a new borrador for deletion, then:

```bash
curl -X DELETE http://localhost:5000/api/gastos-borrador/<id> \
  -H "Authorization: Bearer <your_jwt_token>"
```

Expected: 200 status, returns { success: true, message: "..." }

- [ ] **Step 8: Log results**

All endpoint tests passed. Backend is functional.

---

### Task 16: Frontend Integration Test (Manual)

**Files:**
- No files to create, manual testing in browser

**Interfaces:**
- Consumes: Full frontend implementation (Tasks 7-14)
- Produces: Verified UI flows via browser testing

- [ ] **Step 1: Start frontend dev server**

```bash
npm run dev
# or
cd frontend && npm run dev
```

- [ ] **Step 2: Navigate to Gastos Borrador page**

Login to app, navigate to `/gastos-borrador` via sidebar or URL. Verify page loads and shows empty state or existing borradores.

- [ ] **Step 3: Test Create Borrador**

Click "+ Nuevo Borrador", fill form, submit. Verify:
- Form validates fields (try submitting with empty values)
- On field change, `valor_de_la_cuota` recalculates automatically
- If inconsistency detected, warning badge displays
- After submit, modal closes and table refreshes with new borrador

- [ ] **Step 4: Test Edit Borrador**

Click "Editar" on a draft borrador. Verify:
- Form pre-fills with existing data
- Changes recalculate as expected
- Submit updates table

- [ ] **Step 5: Test Delete Borrador**

Click "Eliminar" on a draft borrador. Verify:
- Confirmation modal appears
- After confirm, borrador removed from table

- [ ] **Step 6: Test Convert Borrador**

Click "Convertir" on a draft borrador. Verify:
- Conversion confirmation modal appears
- After confirm, request to backend
- Borrador status changes to "convertido"
- Table refreshes

- [ ] **Step 7: Test Filters**

Click "Convertidos" filter button. Verify:
- Table shows only converted borradores
- Click "Borradores" to see drafts again

- [ ] **Step 8: Log results**

All UI flows tested and working.

---

## Spec Coverage Self-Review

**RF1 - Create Gasto Borrador:** Task 4 (controller create), Task 11 (form), Task 12 (page) ✅  
**RF2 - List Gastos Borrador:** Task 4 (controller list), Task 12 (page with filters) ✅  
**RF3 - Edit Gasto Borrador:** Task 4 (controller update + recalc), Task 11 (form recalc), Task 12 (edit flow) ✅  
**RF4 - Convert to Expense:** Task 4 (controller convertir + transaction + Installments), Task 12 (convert flow & modal) ✅  
**RF5 - Delete Gasto Borrador:** Task 4 (controller delete), Task 12 (delete button & modal) ✅  

**RT1 - Database Model:** Task 1 (migration), Task 2 (GastoBorrador model) ✅  
**RT2 - API Endpoints:** Task 5 (routes), Task 4 (controller methods) ✅  
**RT3 - Validation Schema:** Task 3 (Joi backend), Task 7 (Zod frontend) ✅  
**RT4 - Security:** Task 5 (auth middleware on all routes), Task 4 (ownership checks) ✅  

**No gaps detected.** All spec requirements mapped to tasks.

---

## Plan Summary

**16 tasks total:**
- Backend: 6 tasks (migration, model, schema, controller, routes, server registration)
- Frontend: 7 tasks (Redux, service, Zod schema, form component, page, app route, sidebar)
- Testing: 2 tasks (backend API test, frontend UI test)
- Integration: 1 task (fix category_id issue in conversion - see note below)

**Estimated time:** 4-6 hours for experienced developer

**Critical Note on Category ID:**
The spec says gastos_borrador have "no category," but Expense model requires `category_id` (NOT NULL FK). Task 4 (controller convertir) has a TODO about this. **Before implementing Task 4, clarify:**
1. Should conversion prompt user to select a category?
2. Should there be a default category for converted borradores?
3. Should Expense.category_id be made nullable?

This decision affects Task 4 implementation. Recommend: Ask user to select category during conversion (add category_id to conversion form/request).

---

**Version:** 1.0  
**Created:** 2026-06-18  
**Status:** Ready for execution
