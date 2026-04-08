# Buenas Prácticas - App Control de Gastos

## 🎯 Principios Fundamentales

### 1. **SOLID Principles**

#### S - Single Responsibility Principle
Cada clase/función debe tener una única responsabilidad.

```javascript
// ❌ MAL - Controller hace muchas cosas
async createExpense(req, res) {
  const { amount, category_id } = req.body;
  // Valida
  // Guarda en BD
  // Calcula cuotas
  // Envía email
  // Genera reporte
}

// ✅ BIEN - Separar responsabilidades
// expenseController.js
async createExpense(req, res) {
  const expense = await expenseService.create(req.body);
  res.json({ success: true, expense });
}

// expenseService.js
async create(data) {
  const expense = await Expense.create(data);
  if (data.is_installment) {
    await installmentService.generateInstallments(expense);
  }
  return expense;
}
```

#### O - Open/Closed Principle
Abierto para extensión, cerrado para modificación.

```javascript
// ❌ MAL - Modificar controlador para cada tipo de reporte
if (reportType === 'monthly') { /* lógica */ }
else if (reportType === 'weekly') { /* lógica */ }
else if (reportType === 'yearly') { /* lógica */ }

// ✅ BIEN - Factory pattern
const reportFactories = {
  monthly: new MonthlyReportFactory(),
  weekly: new WeeklyReportFactory(),
  yearly: new YearlyReportFactory(),
};

const report = reportFactories[type].generate(data);
```

#### I - Interface Segregation Principle
Las interfaces deben ser específicas y pequeñas.

```javascript
// ❌ MAL - Interface grande
interface ExpenseService {
  create()
  update()
  delete()
  getByCategory()
  getByPaymentMethod()
  generateReport()
  sendEmail()
  sendSlackNotification()
}

// ✅ BIEN - Interfaces pequeñas
interface ExpenseCRUD {
  create()
  update()
  delete()
}

interface ExpenseFilters {
  getByCategory()
  getByPaymentMethod()
}

interface ExpenseReporting {
  generateReport()
}

interface ExpenseNotification {
  sendEmail()
  sendSlackNotification()
}
```

#### D - Dependency Injection
Inyectar dependencias en lugar de crearlas dentro.

```javascript
// ❌ MAL - Crear dentro del constructor
class ExpenseController {
  constructor() {
    this.service = new ExpenseService();
    this.logger = new Logger();
  }
}

// ✅ BIEN - Inyectar
class ExpenseController {
  constructor(expenseService, logger) {
    this.service = expenseService;
    this.logger = logger;
  }
}

// En server.js
const controller = new ExpenseController(
  new ExpenseService(),
  new Logger()
);
```

---

## 💻 Backend - Buenas Prácticas

### 1. Estructura y Organización

```
✅ HACER:
- Una entidad por archivo
- Archivos máximo 300 líneas
- Funciones máximo 20 líneas
- Carpetas por dominio (auth, expenses, etc.)
- Índices claros en archivos de carpeta (index.js)

❌ NO HACER:
- 1000+ líneas en un archivo
- Mezclar dominios en una carpeta
- Lógica de negocio en routes
- Validación inconsistente
```

### 2. Controladores

```javascript
// ✅ BIEN - Controlador limpio
async createExpense(req, res, next) {
  try {
    const userId = req.user.id;
    const expense = await expenseService.create(
      { ...req.body, user_id: userId }
    );
    res.status(201).json({
      success: true,
      data: expense
    });
  } catch (error) {
    next(error); // Pasar a error handler
  }
}

// ❌ MAL - Controlador con demasiada lógica
async createExpense(req, res) {
  const { amount, category_id, is_installment, num_installments } = req.body;
  
  // Validación manual
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  
  // Lógica de negocio
  const expense = await Expense.create({...});
  
  if (is_installment) {
    for (let i = 1; i <= num_installments; i++) {
      // Calcula cuotas
      const installmentAmount = amount / num_installments;
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);
      
      await Installment.create({
        expense_id: expense.id,
        amount: installmentAmount,
        due_date: dueDate,
        installment_number: i
      });
    }
  }
  
  res.json(expense);
}
```

### 3. Manejo de Errores

```javascript
// ✅ BIEN - Error handler centralizado
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

// En middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  logger.error(`${statusCode}: ${message}`);
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// En controller
if (!user) {
  throw new AppError('User not found', 404);
}

// ❌ MAL - Sin error handler
async createExpense(req, res) {
  const expense = await Expense.create(req.body);
  res.json(expense); // Si falla, crash!
}
```

### 4. Validación de Input

```javascript
// ✅ BIEN - Validación centralizada con Joi
const expenseSchema = Joi.object({
  amount: Joi.number().positive().required(),
  description: Joi.string().max(500),
  category_id: Joi.number().integer().required(),
  payment_method: Joi.string().valid('cash', 'card').required(),
  is_installment: Joi.boolean(),
  num_installments: Joi.when('is_installment', {
    is: true,
    then: Joi.number().integer().min(2).max(24).required(),
    otherwise: Joi.number().integer().default(1)
  })
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, errors: error.details });
  }
  req.validated = value;
  next();
};

// En routes
router.post('/expenses',
  authenticate,
  validate(expenseSchema),
  expenseController.create
);
```

### 5. Queries Eficientes

```javascript
// ❌ MAL - N+1 problem
const expenses = await Expense.findAll({ where: { user_id } });
for (const expense of expenses) {
  expense.category = await Category.findByPk(expense.category_id); // N queries!
}

// ✅ BIEN - Eager loading
const expenses = await Expense.findAll({
  where: { user_id },
  include: [{ model: Category }] // 1 query!
});

// ✅ BIEN - Indexes para búsquedas frecuentes
// En migration:
// CREATE INDEX idx_expenses_user_date ON expenses(user_id, expense_date);
// Cuando buscas: WHERE user_id = ? AND expense_date BETWEEN ? AND ?
```

### 6. Seguridad

```javascript
// ✅ HACER:
- Validar TODAS las entradas
- Hashear contraseñas con bcrypt
- Usar JWT con expiración
- Sanitizar inputs (prevenir XSS)
- Rate limiting en endpoints sensibles
- HTTPS en producción
- CORS configurado correctamente
- SQL parameterizado (Sequelize lo hace)

// ❌ NO HACER:
- Guardar contraseñas en texto plano
- Confiar en datos del cliente
- Exponor IDs de BD en respuestas sensibles
- Logging de datos sensibles (contraseñas, tokens)
- Endpoints sin autenticación
- Magic strings hardcodeados
```

### 7. Logging

```javascript
// ✅ BIEN - Logger estructurado
class Logger {
  info(message, data) {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data);
  }
  
  error(message, error) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  }
  
  debug(message, data) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data);
    }
  }
}

// Uso
logger.info('Expense created', { expenseId, amount });
logger.error('Database connection failed', error);

// ❌ MAL - console.log sin estructura
console.log('expense created'); // ¿Cuándo? ¿Quién lo hizo?
console.log(password); // ¡Nunca loguees datos sensibles!
```

---

## ⚛️ Frontend - Buenas Prácticas

### 1. Componentes Funcionales

```javascript
// ✅ BIEN - Componente funcional simple
function ExpenseCard({ expense, onEdit }) {
  return (
    <div className="card">
      <h3>{expense.description}</h3>
      <p>${expense.amount.toFixed(2)}</p>
      <button onClick={() => onEdit(expense.id)}>Edit</button>
    </div>
  );
}

// ❌ MAL - Componente clase con muchas responsabilidades
class ExpenseCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isEditing: false, data: {} };
  }
  
  componentDidMount() {
    // Cargar datos
    // Subscrib a eventos
    // Inicializar timers
  }
  
  handleEdit = async () => {
    // Validar
    // Enviar a backend
    // Actualizar estado local
    // Mostrar toast
  }
  
  render() {
    // 200 líneas de JSX...
  }
}
```

### 2. Custom Hooks para Lógica Reutilizable

```javascript
// ✅ BIEN - Logic en custom hook
function useMonthlyExpenses(month) {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setIsLoading(true);
        const data = await expenseService.getMonthly(month);
        setExpenses(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExpenses();
  }, [month]);
  
  return { expenses, isLoading, error };
}

// Uso simple
function ExpensesDashboard() {
  const { expenses, isLoading } = useMonthlyExpenses('2026-04');
  
  if (isLoading) return <LoadingSpinner />;
  return <ExpensesList expenses={expenses} />;
}

// ❌ MAL - Logic en componente
function ExpensesDashboard() {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Todo el código acá...
  }, []);
  
  if (isLoading) return <LoadingSpinner />;
  return <ExpensesList expenses={expenses} />;
}
```

### 3. State Management con Redux

```javascript
// ✅ BIEN - Redux Toolkit (slice)
const expensesSlice = createSlice({
  name: 'expenses',
  initialState: {
    items: [],
    isLoading: false,
    error: null
  },
  reducers: {
    setLoading: (state) => { state.isLoading = true; },
    setExpenses: (state, action) => {
      state.items = action.payload;
      state.isLoading = false;
    },
    addExpense: (state, action) => {
      state.items.push(action.payload);
    },
    updateExpense: (state, action) => {
      const idx = state.items.findIndex(e => e.id === action.payload.id);
      if (idx !== -1) state.items[idx] = action.payload;
    }
  }
});

// Uso en componente
function ExpensesList() {
  const dispatch = useDispatch();
  const { items, isLoading } = useSelector(state => state.expenses);
  
  useEffect(() => {
    dispatch(setLoading());
    expenseService.getAll().then(data => {
      dispatch(setExpenses(data));
    });
  }, [dispatch]);
  
  return isLoading ? <Spinner /> : <List items={items} />;
}
```

### 4. Formularios

```javascript
// ✅ BIEN - React Hook Form + Zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const expenseSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().max(500),
  category_id: z.number(),
  payment_method: z.enum(['cash', 'card'])
});

function ExpenseForm({ onSubmit }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(expenseSchema)
  });
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('amount')} type="number" />
      {errors.amount && <span>{errors.amount.message}</span>}
      
      <input {...register('description')} />
      {errors.description && <span>{errors.description.message}</span>}
      
      <button type="submit">Save</button>
    </form>
  );
}
```

### 5. Manejo de Errores

```javascript
// ✅ BIEN - Error boundary
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    logger.error('React error:', errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}

// En App.jsx
<ErrorBoundary>
  <MainContent />
</ErrorBoundary>

// ✅ BIEN - Manejo de promise rejections
useEffect(() => {
  expenseService.getAll()
    .catch(err => {
      setError(err.message);
      toast.error('Failed to load expenses');
    });
}, []);
```

### 6. Performance

```javascript
// ✅ BIEN - useMemo para cálculos costosos
const totalByCategory = useMemo(() => {
  return expenses.reduce((acc, expense) => {
    acc[expense.category_id] = (acc[expense.category_id] || 0) + expense.amount;
    return acc;
  }, {});
}, [expenses]);

// ✅ BIEN - useCallback para funciones estables
const handleEdit = useCallback((id) => {
  dispatch(openEditModal(id));
}, [dispatch]);

// ✅ BIEN - React.memo para componentes puros
const ExpenseItem = React.memo(({ expense, onEdit }) => (
  <div onClick={() => onEdit(expense.id)}>{expense.description}</div>
));

// ❌ MAL - Crear función en cada render
<button onClick={() => handleEdit(id)}>Edit</button> // Nueva función cada render

// ✅ BIEN
<button onClick={() => handleEdit(id)}>Edit</button> // Función estable
```

---

## 🔄 General - Buenas Prácticas

### 1. Control de Versiones (Git)

```
✅ HACER:
- Commits frecuentes y pequeños
- Mensajes descriptivos en presente
- Ramas feature/*, fix/*, etc.
- Pull requests con descripción
- Code review antes de merge
- Squash commits innecesarios

❌ NO HACER:
- Commits gigantes con 20 cambios
- Mensajes vagos ("fix stuff", "changes")
- Push directo a main
- Merges sin revisar código
- Commits con datos sensibles
```

**Ejemplo de mensaje:**
```
feat: add monthly expense report with category breakdown

- Implement reportService.getMonthlyReport()
- Add ReportMonthlyGrouping page with charts
- Include PDF export functionality
- Add unit tests for calculations

Closes #45
```

### 2. Documentación

```
✅ HACER:
- README.md en carpetas principales
- JSDoc en funciones complejas
- Comentarios en lógica no obvia
- Ejemplos de uso en services
- Actualizar docs al cambiar código

❌ NO HACER:
- Comentarios que repiten el código
- Documentación desactualizada
- Magic numbers sin explicación
- Funciones sin parámetros documentados
```

**Ejemplo de JSDoc:**
```javascript
/**
 * Crea un gasto y sus cuotas asociadas
 * @param {Object} expenseData - Datos del gasto
 * @param {number} expenseData.amount - Monto total
 * @param {boolean} expenseData.is_installment - ¿Es en cuotas?
 * @param {number} expenseData.num_installments - Cantidad de cuotas (2-24)
 * @returns {Promise<Object>} Gasto creado con cuotas
 * @throws {Error} Si amount <= 0 o num_installments inválido
 */
async function createExpenseWithInstallments(expenseData) {
  // ...
}
```

### 3. Testing

```
✅ HACER:
- Tests para funciones críticas
- Tests de integración para APIs
- Coverage mínimo 70%
- Tests antes de deploy
- Mock datos externos

❌ NO HACER:
- Tests que solo verifica que código existe
- Tests sin assertions
- Tests frágiles que fallan por cambios menores
- Testar implementación en lugar de comportamiento
```

**Ejemplo:**
```javascript
describe('expenseService', () => {
  it('should create expense with installments', async () => {
    const expenseData = {
      amount: 1200,
      is_installment: true,
      num_installments: 12
    };
    
    const expense = await expenseService.create(expenseData);
    
    expect(expense).toBeDefined();
    expect(expense.id).toBeTruthy();
    
    const installments = await installmentService.getByExpense(expense.id);
    expect(installments).toHaveLength(12);
    expect(installments[0].amount).toBe(100); // 1200 / 12
  });
});
```

### 4. Seguridad

```
✅ HACER:
- Validar TODAS las entradas
- Usar bibliotecas establecidas (bcrypt, jwt)
- HTTPS en producción
- Rotación de secrets regularmente
- Logging de eventos sensibles
- Auditoría de cambios
- Principio de menor privilegio

❌ NO HACER:
- Guardar tokens en cookies sin HttpOnly
- Exponr APIs keys en frontend
- Logging de contraseñas/tokens
- SQL concatenado (siempre parametrizado)
- Confiar en autenticación del lado del cliente
```

---

## 📋 Checklist para Nuevas Funcionalidades

**Antes de implementar:**
- [ ] Feature está especificada en requerimientos
- [ ] Endpoints están documentados
- [ ] Modelos de BD diseñados
- [ ] Casos de error identificados

**Implementación:**
- [ ] Código sigue patrones del proyecto
- [ ] Validación en múltiples capas
- [ ] Manejo de errores completo
- [ ] Logs apropiados
- [ ] Tests incluidos (70%+ cobertura)

**Code Review:**
- [ ] Sigue SOLID principles
- [ ] Sin hardcoded values
- [ ] Sin código comentado
- [ ] Performance aceptable
- [ ] Seguridad validada

**Pre-Deploy:**
- [ ] Tests pasan
- [ ] Documentación actualizada
- [ ] Environment vars configuradas
- [ ] Migrations probadas
- [ ] Backups antes de deployment

---

**Última actualización**: Abril 2026  
**Versión**: 1.0
