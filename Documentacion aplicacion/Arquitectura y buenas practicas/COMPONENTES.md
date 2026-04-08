# Componentes - App Control de Gastos

## 📚 Índice de Componentes

Documentación detallada de todos los componentes del sistema, su responsabilidad y relaciones.

---

## Backend - Componentes Principales

### 1. 🔐 Sistema de Autenticación (Auth Module)

**Archivos:**
- `routes/auth.js` - Rutas de autenticación
- `controllers/authController.js` - Lógica de auth
- `middleware/auth.js` - Validación JWT

**Responsabilidad:**
- Registrar nuevos usuarios
- Login con email y contraseña
- Generación y validación de JWT
- Logout y revocar tokens

**Endpoints:**
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh-token
```

**Flujo de datos:**
```
User (email, password)
    ↓
authController.register/login
    ↓
User.findOne/create (BD)
    ↓
bcrypt.hash/compare (contraseña)
    ↓
jwt.sign (generar token)
    ↓
Response con JWT
```

---

### 2. 👤 Gestión de Usuarios (Users Module)

**Archivos:**
- `routes/users.js`
- `controllers/userController.js`
- `models/User.js`

**Responsabilidad:**
- Obtener perfil del usuario
- Actualizar datos de perfil
- Cambiar contraseña
- Gestión de sesiones

**Endpoints:**
```
GET    /api/users/profile
PUT    /api/users/profile
POST   /api/users/change-password
```

**Modelo (User):**
```javascript
{
  id: Integer (PK),
  email: String (UNIQUE),
  password: String (hashed),
  name: String,
  is_admin: Boolean,
  created_at: DateTime,
  updated_at: DateTime
}
```

---

### 3. 💰 Gestión de Gastos (Expenses Module)

**Archivos:**
- `routes/expenses.js`
- `controllers/expenseController.js`
- `models/Expense.js`

**Responsabilidad:**
- CRUD de gastos
- Filtrado y búsqueda
- Asociación con categorías
- Cálculos de totales

**Endpoints:**
```
GET    /api/expenses          (con filtros)
POST   /api/expenses          (crear)
PUT    /api/expenses/:id      (actualizar)
DELETE /api/expenses/:id      (eliminar)
```

**Modelo (Expense):**
```javascript
{
  id: Integer (PK),
  user_id: Integer (FK),
  category_id: Integer (FK),
  amount: Decimal,
  description: String,
  payment_method: Enum (cash, card),
  expense_date: Date,
  is_installment: Boolean,
  num_installments: Integer (2-24),
  created_at: DateTime,
  updated_at: DateTime
}
```

**Filtros soportados:**
- Rango de fechas
- Categoría
- Método de pago
- Rango de monto
- Búsqueda por descripción

---

### 4. 🏷️ Gestión de Categorías (Categories Module)

**Archivos:**
- `routes/categories.js`
- `controllers/categoryController.js`
- `models/Category.js`

**Responsabilidad:**
- CRUD de categorías
- Categorías predeterminadas y personalizadas
- Asignación de colores e iconos
- Cálculos de consumo por categoría

**Endpoints:**
```
GET    /api/categories        (todas las categorías)
POST   /api/categories        (crear categoría)
PUT    /api/categories/:id    (actualizar)
DELETE /api/categories/:id    (eliminar)
```

**Modelo (Category):**
```javascript
{
  id: Integer (PK),
  user_id: Integer (FK, nullable para predeterminadas),
  name: String,
  color: String (hex, ej: #FF5733),
  icon: String (emoji o nombre),
  is_default: Boolean,
  created_at: DateTime,
  updated_at: DateTime
}
```

---

### 5 📦 Gestión de Cuotas (Installments Module)

**Archivos:**
- `routes/installments.js`
- `controllers/installmentController.js`
- `models/Installment.js`

**Responsabilidad:**
- Crear cuotas automáticas
- Gestionar pagos de cuotas
- Cálculos de distribución
- Alertas de vencimiento

**Endpoints:**
```
GET    /api/installments              (obtener cuotas pendientes)
POST   /api/installments              (crear)
PUT    /api/installments/:id          (marcar como pagada)
```

**Modelo (Installment):**
```javascript
{
  id: Integer (PK),
  expense_id: Integer (FK),
  installment_number: Integer,
  amount: Decimal,
  due_date: Date,
  is_paid: Boolean,
  paid_date: DateTime (nullable),
  created_at: DateTime,
  updated_at: DateTime
}
```

---

### 6. 📊 Analytics y Reportes (Analytics Module)

**Archivos:**
- `routes/analytics.js`
- `controllers/analyticsController.js`
- `routes/reports.js`
- `controllers/reportController.js`

**Responsabilidad:**
- Cálculos de totales y promedios
- Gráficos por categoría
- Análisis efectivo vs tarjeta
- Generación de reportes
- Exportación a PDF

**Endpoints:**
```
GET    /api/analytics/summary          (resumen general)
GET    /api/analytics/by-category      (consumo por categoría)
GET    /api/analytics/cash-vs-card     (efectivo vs tarjeta)
GET    /api/reports/monthly            (reporte mensual)
GET    /api/reports/download           (descargar PDF)
```

**Datos que proporciona:**
- Total gastado (período)
- Promedio por categoría
- Porcentajes
- Tendencias
- Pendientes

---

### 7. 💱 Gestión de Tasas de Cambio (Exchange Rates Module)

**Archivos:**
- `routes/exchangeRates.js`
- `controllers/exchangeRateController.js`
- `services/exchangeRateService.js`

**Responsabilidad:**
- Obtener tasas de cambio
- Convertir monedas
- Caché de tasas
- Integración con APIs externas

**Endpoints:**
```
GET    /api/exchange-rates             (obtener tasas)
POST   /api/exchange-rates/convert     (convertir monto)
```

---

### 8. 🛡️ Middleware

**Middleware de Autenticación (`auth.js`):**
- Valida JWT en headers
- Extrae `userId` del token
- Rechaza requests sin token válido
- Verifica expiración

**Middleware de Validación (`validate.js`):**
- Valida estructura de datos
- Valida tipos de campos
- Valida rangos y formatos
- Retorna errores específicos

**Middleware de Error Handler (`errorHandler.js`):**
- Captura errores no manejados
- Formatea respuesta de error
- Loguea errores
- Retorna status HTTP apropiado

**Middleware de Rate Limiter (`rateLimiter.js`):**
- Limita requests por IP
- Protege contra abuse
- Endpoints sensibles (login) tienen límites más estrictos

---

### 9. 🗄️ Sistema de Migraciones

**Archivos:**
- `migrations/migrationEngine.js` - Motor de ejecución
- `migrations/versionCheck.js` - Verificación de versión

**Responsabilidad:**
- Versionado de base de datos
- Ejecución de migraciones
- Tracking de cambios de esquema
- Rollback en caso de error

**Tabla de control:**
```javascript
{
  version: Integer,
  description: String,
  executed_at: DateTime
}
```

---

## Frontend - Componentes Principales

### 1. 🎨 Componentes UI Base

**Ubicación:** `components/UI/`

**Componentes:**
```
├── Button.jsx         - Botón reutilizable
├── Input.jsx          - Campo de entrada
├── Select.jsx         - Dropdown selector
├── Card.jsx           - Tarjeta contenedora
├── Modal.jsx          - Modal dialog
├── Alert.jsx          - Mensajes de alerta
├── LoadingSpinner.jsx - Indicador de carga
├── EmptyState.jsx     - Estado vacío
└── Badge.jsx          - Etiqueta badge
```

**Características:**
- Estilos consistentes con Tailwind CSS
- Props para personalización
- Accesibilidad (a11y)
- Estados (hover, active, disabled)

---

### 2. 📐 Componentes de Layout

**Ubicación:** `components/Layout/`

**Componentes:**
- **Navbar.jsx** - Barra de navegación superior
- **Sidebar.jsx** - Menú lateral
- **Layout.jsx** - Contenedor general
- **Footer.jsx** - Pie de página

**Responsabilidad:**
- Estructura común a todas las páginas
- Navegación
- Usuario info
- Logout

---

### 3. 📖 Páginas Principales

**Ubicación:** `pages/`

```
├── Login.jsx                    - Página de login
├── Register.jsx                 - Página de registro
├── Dashboard.jsx                - Panel principal
├── Expenses.jsx                 - Listado de gastos
├── ExpenseForm.jsx              - Formulario crear/editar
├── Categories.jsx               - Gestión de categorías
├── Installments.jsx             - Gestión de cuotas
├── Profile.jsx                  - Perfil de usuario
├── Reports.jsx                  - Centro de reportes
├── ReportMonthlyGrouping.jsx    - Reporte mensual
├── Admin.jsx                    - Panel admin
└── ExchangeRates.jsx            - Gestión de tasas
```

**Características por página:**
- State management con Redux
- Validación de formularios
- Manejo de errores
- Loading states
- Responsive design

---

### 4. 🔧 Services (API Clients)

**Ubicación:** `services/`

```
├── api.js                  - Configuración Axios
├── authService.js         - Autenticación
├── expenseService.js      - Operaciones de gastos
├── categoryService.js     - Operaciones de categorías
├── installmentService.js  - Operaciones de cuotas
├── analyticsService.js    - Datos analytics
├── reportService.js       - Generación de reportes
├── adminService.js        - Operaciones admin
└── exchangeRateService.js - Tasas de cambio
```

**Ejemplo de estructura:**
```javascript
// expenseService.js
export const expenseService = {
  getAll: (filters) => api.get('/expenses', { params: filters }),
  getById: (id) => api.get(`/expenses/${id}`),
  create: (expense) => api.post('/expenses', expense),
  update: (id, expense) => api.put(`/expenses/${id}`, expense),
  delete: (id) => api.delete(`/expenses/${id}`),
};
```

---

### 5. 🏪 Redux Store

**Ubicación:** `store/`

```
├── index.js               - Configuración del store
├── authSlice.js          - Estado de autenticación
├── expensesSlice.js      - Estado de gastos
├── categoriesSlice.js    - Estado de categorías
```

**Estados manejados:**
- Usuario actual
- JWT token
- Gastos listados
- Categorías disponibles
- Filtros activos
- Errors y loading states

---

### 6. 🪝 Custom Hooks

**Ubicación:** `hooks/`

```
└── useMonthlyReport.js   - Hook para reportes mensuales
```

**Responsabilidad:**
- Lógica reutilizable
- Efectos secundarios
- Cálculos complejos
- Sincronización con API

---

### 7. 🛠️ Utilities

**Ubicación:** `utils/`

```
├── constants.js    - Constantes de la app
├── formatters.js   - Funciones de formato
│   ├── formatCurrency()
│   ├── formatDate()
│   ├── formatNumber()
│   └── ...
```

---

### 8. 📈 Componentes Especializados

**Ubicación:** `components/reports/`

```
├── FilterPanel.jsx       - Panel de filtros
├── MonthlyChart.jsx      - Gráfico mensual
├── ExpenseList.jsx       - Lista de gastos
└── ExpenseDetailModal.jsx - Modal de detalles
```

**Responsabilidad:**
- Componentes complejos
- Integración de gráficos (Recharts)
- Filtros interactivos

---

## 🔗 Relaciones Entre Componentes

### Flujo de Datos - Crear Gasto

```
ExpenseForm (Page)
    │
    ├─> formSubmit event
    │
    ├─> expenseService.create()
    │
    ├─> dispatch(expenseSlice.addExpense())
    │
    └─> Redux store actualizado
         │
         └─> Expenses (Page) re-renderiza
              │
              └─> ExpensList (Component) muestra nuevo gasto
```

### Relaciones de Modelos de BD

```
User (1) ──── (N) Expense
           ├── payment_method: cash | card
           ├── is_installment: boolean
           └── category_id: FK
                  │
                  ▼
           Category (1) ─── (N) Expense
                             └── num_installments
                                    │
                                    ▼
                            Installment (1) ─── (N) per Expense
                                   ├── due_date
                                   └── is_paid
```

---

## 📋 Checklist para Nuevas Funcionalidades

Al agregar una nueva funcionalidad, asegúrate de:

- [ ] **Backend:**
  - [ ] Crear modelo (si es necesario)
  - [ ] Crear controller con lógica
  - [ ] Crear rutas REST
  - [ ] Agregar middleware de validación
  - [ ] Validar seguridad (auth, autorización)
  - [ ] Tests unitarios
  - [ ] Documentar endpoints

- [ ] **Frontend:**
  - [ ] Crear página o componente
  - [ ] Agregar service para API calls
  - [ ] Crear Redux slice (si maneja estado global)
  - [ ] Agregar validación de formularios
  - [ ] Manejo de errores y loading
  - [ ] Responsive design
  - [ ] Tests de componentes

- [ ] **General:**
  - [ ] Migración de BD (si cambios de esquema)
  - [ ] Documentación actualizada
  - [ ] Revisar seguridad (OWASP Top 10)
  - [ ] Testing manual
  - [ ] Code review

---

**Última actualización**: Abril 2026  
**Versión**: 1.0
