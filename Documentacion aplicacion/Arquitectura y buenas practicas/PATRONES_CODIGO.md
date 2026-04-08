# Patrones de Código - App Control de Gastos

## 📋 Convenciones de Nombres

### Backend

#### Archivos y Carpetas
```
✅ BIEN:
- controllers/expenseController.js
- routes/expenses.js
- models/Expense.js
- middleware/auth.js
- services/emailService.js
- utils/dateHelpers.js

❌ MAL:
- controllers/expense_controller.js (snake_case)
- routes/expenseRoutes.js (redundante)
- models/ExpenseModel.js (redundante)
- middleware/authMiddleware.js (redundante)
```

#### Variables y Funciones
```javascript
// ✅ BIEN - camelCase
const userId = 123;
const userEmail = 'user@example.com';
function calculateMonthlyTotal() { }
const getTotalByCategory = (expenses) => { };

// ❌ MAL
const user_id = 123; // snake_case
const UserEmail = 'user@example.com'; // PascalCase
function calculate_monthly_total() { } // snake_case
```

#### Clases y Constructores
```javascript
// ✅ BIEN - PascalCase
class ExpenseController { }
class CategoryService { }
class ValidationError extends Error { }

// ❌ MAL
class expenseController { } // camelCase
class expense_controller { } // snake_case
```

#### Constantes
```javascript
// ✅ BIEN - UPPER_SNAKE_CASE
const MAX_INSTALLMENTS = 24;
const DEFAULT_PAGE_SIZE = 10;
const JWT_SECRET = process.env.JWT_SECRET;
const PAYMENT_METHODS = ['cash', 'card'];

// ❌ MAL
const maxInstallments = 24; // variable, no constante
const max_installments = 24; // variable, no constante
```

### Frontend

#### Archivos y Carpetas
```
✅ BIEN:
- pages/Dashboard.jsx (PascalCase - componentes)
- components/UI/Button.jsx (PascalCase - componentes)
- services/expenseService.js (camelCase - funciones)
- store/expensesSlice.js (camelCase - funciones)
- hooks/useMonthlyReport.js (camelCase con prefijo use)
- utils/formatters.js (camelCase - funciones)

❌ MAL:
- pages/dashboard.jsx (minúsculas)
- components/ui/Button.jsx (subcarpeta innecesaria)
- services/ExpenseService.js (PascalCase para servicio)
- hooks/monthlyReportHook.js (sufijo, no prefijo)
```

#### Variables React
```javascript
// ✅ BIEN
const [expenses, setExpenses] = useState([]);
const [isLoading, setIsLoading] = useState(false);
const handleSubmit = () => { };
const onEdit = (id) => { };

// ❌ MAL
const [expensesList, setExpensesList] = useState([]); // redundante
const [loading, setLoading] = useState(false); // ambiguo
const submit = () => { }; // no indica handler
const edit = (id) => { }; // no indica prop
```

---

## 🔧 Patrones de Código Específicos

### Backend - Patrón de Controlador

```javascript
// ✅ PATRÓN ESTÁNDAR
const expenseController = {
  // GET - obtener lista
  async getAll(req, res, next) {
    try {
      const { skip = 0, limit = 10 } = req.query;
      const expenses = await Expense.findAll({
        where: { user_id: req.user.id },
        offset: parseInt(skip),
        limit: parseInt(limit),
        include: [{ model: Category }]
      });
      
      res.json({ success: true, data: expenses });
    } catch (error) {
      next(error);
    }
  },
  
  // GET - obtener uno
  async getById(req, res, next) {
    try {
      const expense = await Expense.findOne({
        where: { id: req.params.id, user_id: req.user.id }
      });
      
      if (!expense) {
        return res.status(404).json({ success: false, message: 'Not found' });
      }
      
      res.json({ success: true, data: expense });
    } catch (error) {
      next(error);
    }
  },
  
  // POST - crear
  async create(req, res, next) {
    try {
      const data = req.validated; // Validado por middleware
      const expense = await Expense.create({
        ...data,
        user_id: req.user.id
      });
      
      res.status(201).json({ success: true, data: expense });
    } catch (error) {
      next(error);
    }
  },
  
  // PUT - actualizar
  async update(req, res, next) {
    try {
      const expense = await Expense.findOne({
        where: { id: req.params.id, user_id: req.user.id }
      });
      
      if (!expense) {
        return res.status(404).json({ success: false, message: 'Not found' });
      }
      
      await expense.update(req.validated);
      
      res.json({ success: true, data: expense });
    } catch (error) {
      next(error);
    }
  },
  
  // DELETE - eliminar
  async delete(req, res, next) {
    try {
      const result = await Expense.destroy({
        where: { id: req.params.id, user_id: req.user.id }
      });
      
      if (!result) {
        return res.status(404).json({ success: false, message: 'Not found' });
      }
      
      res.json({ success: true, message: 'Deleted' });
    } catch (error) {
      next(error);
    }
  }
};

export default expenseController;
```

### Backend - Patrón de Ruta

```javascript
// ✅ PATRÓN ESTÁNDAR
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import expenseController from '../controllers/expenseController.js';
import { expenseSchema } from '../schemas/expenseSchema.js';

const router = express.Router();

// CRUD básico
router.get('/', authenticate, expenseController.getAll);
router.get('/:id', authenticate, expenseController.getById);
router.post('/', authenticate, validate(expenseSchema), expenseController.create);
router.put('/:id', authenticate, validate(expenseSchema), expenseController.update);
router.delete('/:id', authenticate, expenseController.delete);

// Endpoints especiales (después del CRUD)
router.get('/:id/installments', authenticate, expenseController.getInstallments);
router.post('/:id/duplicate', authenticate, expenseController.duplicate);

export default router;
```

### Frontend - Patrón de Componente Page

```javascript
// ✅ PATRÓN ESTÁNDAR
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import expenseService from '../services/expenseService';
import { setExpenses, setLoading } from '../store/expensesSlice';
import ExpenseList from '../components/ExpenseList';
import LoadingSpinner from '../components/UI/LoadingSpinner';

function ExpensesPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: expenses, isLoading } = useSelector(state => state.expenses);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchExpenses();
  }, []);
  
  const fetchExpenses = async () => {
    try {
      dispatch(setLoading());
      const data = await expenseService.getAll();
      dispatch(setExpenses(data));
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load expenses');
    }
  };
  
  const handleEdit = (id) => {
    navigate(`/expenses/${id}/edit`);
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    
    try {
      await expenseService.delete(id);
      fetchExpenses(); // Reload list
    } catch (err) {
      setError(err.message);
    }
  };
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <AlertError message={error} />;
  
  return (
    <div className="container mx-auto">
      <h1>Expenses</h1>
      <button onClick={() => navigate('/expenses/new')}>New Expense</button>
      <ExpenseList
        expenses={expenses}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default ExpensesPage;
```

### Frontend - Patrón de Service

```javascript
// ✅ PATRÓN ESTÁNDAR
import api from './api';

const expenseService = {
  // Obtener lista
  async getAll(filters = {}) {
    const response = await api.get('/expenses', { params: filters });
    return response.data.data;
  },
  
  // Obtener uno
  async getById(id) {
    const response = await api.get(`/expenses/${id}`);
    return response.data.data;
  },
  
  // Crear
  async create(expense) {
    const response = await api.post('/expenses', expense);
    return response.data.data;
  },
  
  // Actualizar
  async update(id, expense) {
    const response = await api.put(`/expenses/${id}`, expense);
    return response.data.data;
  },
  
  // Eliminar
  async delete(id) {
    await api.delete(`/expenses/${id}`);
  },
  
  // Endpoints especiales
  async getMonthly(month) {
    const response = await api.get('/expenses/monthly', {
      params: { month }
    });
    return response.data.data;
  },
  
  async getByCategory(categoryId) {
    const response = await api.get('/expenses/category', {
      params: { category_id: categoryId }
    });
    return response.data.data;
  }
};

export default expenseService;
```

### Frontend - Patrón de Redux Slice

```javascript
// ✅ PATRÓN ESTÁNDAR
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  isLoading: false,
  error: null,
  filters: {
    category: null,
    paymentMethod: null,
    dateFrom: null,
    dateTo: null
  }
};

const expensesSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    // Loading states
    setLoading: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    
    // Set data
    setExpenses: (state, action) => {
      state.items = action.payload;
      state.isLoading = false;
    },
    
    // CRUD
    addExpense: (state, action) => {
      state.items.unshift(action.payload);
    },
    
    updateExpense: (state, action) => {
      const idx = state.items.findIndex(e => e.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = action.payload;
      }
    },
    
    removeExpense: (state, action) => {
      state.items = state.items.filter(e => e.id !== action.payload);
    },
    
    // Filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    
    // Error
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    }
  }
});

export const {
  setLoading,
  setExpenses,
  addExpense,
  updateExpense,
  removeExpense,
  setFilters,
  clearFilters,
  setError
} = expensesSlice.actions;

export default expensesSlice.reducer;
```

---

## 🎨 Patrones de UI

### Componentes de Formulario

```javascript
// ✅ PATRÓN ESTÁNDAR
function ExpenseForm({ initialData, onSubmit, isLoading }) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: initialData
  });
  
  const handleFormSubmit = async (data) => {
    try {
      await onSubmit(data);
      reset(); // Limpiar después de éxito
    } catch (err) {
      // Error manejado por componente padre
    }
  };
  
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Amount */}
      <div>
        <label htmlFor="amount">Amount</label>
        <input
          {...register('amount', { valueAsNumber: true })}
          id="amount"
          type="number"
          step="0.01"
        />
        {errors.amount && <span className="error">{errors.amount.message}</span>}
      </div>
      
      {/* Category */}
      <div>
        <label htmlFor="category">Category</label>
        <select {...register('category_id', { valueAsNumber: true })} id="category">
          <option value="">Select...</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        {errors.category_id && <span className="error">{errors.category_id.message}</span>}
      </div>
      
      {/* Buttons */}
      <div className="flex gap-2">
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save'}
        </button>
        <button type="button" onClick={() => reset()}>Cancel</button>
      </div>
    </form>
  );
}
```

### Componentes de Modal

```javascript
// ✅ PATRÓN ESTÁNDAR
function ExpenseDetailModal({ expense, isOpen, onClose, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  
  if (!isOpen) return null;
  
  return (
    <Modal onClose={onClose}>
      <Modal.Header>
        <h2>Expense Details</h2>
        <button onClick={onClose}>×</button>
      </Modal.Header>
      
      <Modal.Body>
        {!isEditing ? (
          // View mode
          <div className="space-y-2">
            <p><strong>Amount:</strong> ${expense.amount}</p>
            <p><strong>Category:</strong> {expense.category.name}</p>
            <p><strong>Date:</strong> {formatDate(expense.expense_date)}</p>
          </div>
        ) : (
          // Edit mode
          <ExpenseForm
            initialData={expense}
            onSubmit={onSave}
          />
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <button onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
        <button onClick={onClose}>Close</button>
      </Modal.Footer>
    </Modal>
  );
}
```

---

## 🔐 Patrones de Seguridad

### Validación Backend

```javascript
// ✅ PATRÓN - Joi Schema
import Joi from 'joi';

export const expenseSchema = Joi.object({
  amount: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.positive': 'Amount must be greater than 0',
      'number.base': 'Amount must be a number'
    }),
  
  category_id: Joi.number()
    .integer()
    .positive()
    .required(),
  
  description: Joi.string()
    .max(500)
    .trim(),
  
  payment_method: Joi.string()
    .valid('cash', 'card')
    .required(),
  
  is_installment: Joi.boolean(),
  
  num_installments: Joi.when('is_installment', {
    is: true,
    then: Joi.number()
      .integer()
      .min(2)
      .max(24)
      .required(),
    otherwise: Joi.number().integer().default(1)
  })
});
```

### Validación Frontend

```javascript
// ✅ PATRÓN - Zod Schema
import { z } from 'zod';

export const expenseSchema = z.object({
  amount: z.number()
    .positive('Amount must be greater than 0'),
  
  category_id: z.number()
    .positive(),
  
  description: z.string()
    .max(500)
    .optional(),
  
  payment_method: z.enum(['cash', 'card']),
  
  is_installment: z.boolean(),
  
  num_installments: z.number()
    .min(1)
    .max(24)
    .default(1)
});
```

---

## 📊 Patrones de Datos

### Respuestas API Estándar

```javascript
// ✅ Éxito
{
  success: true,
  data: { /* datos */ },
  pagination?: {
    total: 100,
    page: 1,
    limit: 10
  }
}

// ✅ Error
{
  success: false,
  message: "Descripción del error",
  errors?: {
    field1: "Error specific to field1",
    field2: "Error specific to field2"
  }
}
```

### Paginación

```javascript
// Backend
router.get('/', authenticate, async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;
  
  const { count, rows } = await Expense.findAndCountAll({
    where: { user_id: req.user.id },
    limit: parseInt(limit),
    offset: skip
  });
  
  res.json({
    success: true,
    data: rows,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(count / limit)
    }
  });
});

// Frontend
const [page, setPage] = useState(1);
const { data, pagination } = useExpensesWithPagination(page);
```

---

**Última actualización**: Abril 2026  
**Versión**: 1.0
