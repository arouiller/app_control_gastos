# Arquitectura - App Control de Gastos

## 📐 Visión General

La aplicación sigue una arquitectura **monorepo con separación clara entre capas frontend y backend**, siguiendo el patrón MVC en el backend y componentes en el frontend.

```
┌─────────────────────────────────────────────────────────┐
│                   USUARIO (Navegador)                   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│            FRONTEND (React + Vite)                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Pages │ Components │ Services │ Redux Store     │   │
│  └────────────────────┬────────────────────────────┘   │
│                       │ HTTPS + JWT                     │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│            BACKEND API (Node.js + Express)             │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Routes │ Controllers │ Models │ Middleware       │  │
│  └────────────────────┬─────────────────────────────┘  │
│                       │ SQL                            │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│            BASE DE DATOS (MySQL 8.0+)                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Users │ Expenses │ Categories │ Installments     │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## 🏗️ Arquitectura de Capas

### Capa Frontend (React 18 + Vite + Tailwind)

**Estructura de directorios:**
```
frontend/src/
├── pages/              # Vistas principales (Login, Dashboard, Expenses, etc.)
├── components/         # Componentes reutilizables (UI, Layout, Reports)
│   ├── UI/            # Componentes base (Button, Input, Modal, etc.)
│   ├── Layout/        # Componentes de layout (Navbar, Sidebar, etc.)
│   └── reports/       # Componentes especializados de reportes
├── store/             # Redux Toolkit slices (auth, expenses, categories)
├── services/          # API clients (authService, expenseService, etc.)
├── hooks/             # Custom hooks (useMonthlyReport, etc.)
├── utils/             # Helpers (formatters, constants)
└── App.jsx            # Componente raíz
```

**Flujo de datos:**
1. **User interactúa** con Page/Component
2. **Componente dispara** acción de Redux o llamada HTTP
3. **Service llamada API** del backend
4. **Respuesta actualiza** Redux store
5. **Componente re-renderiza** con datos nuevos

### Capa Backend (Node.js + Express + Sequelize)

**Estructura de directorios:**
```
backend/src/
├── routes/            # Definición de rutas REST
│   ├── auth.js       # Rutas de autenticación
│   ├── expenses.js   # Rutas de gastos
│   ├── categories.js # Rutas de categorías
│   └── ... otros
├── controllers/       # Lógica de negocio por recurso
│   ├── authController.js
│   ├── expenseController.js
│   └── ... otros
├── models/           # Modelos Sequelize (ORM)
│   ├── User.js
│   ├── Expense.js
│   ├── Category.js
│   └── ... otros
├── middleware/       # Middleware (auth, validación, errors)
│   ├── auth.js      # Validación JWT
│   ├── validate.js  # Validación de entrada
│   └── errorHandler.js
├── services/        # Servicios de negocio
│   └── exchangeRateService.js
├── migrations/      # Sistema de versionado de BD
└── server.js        # Punto de entrada
```

**Flujo de solicitud:**
1. **HTTP Request llega** a Express
2. **Router** dirige a controlador específico
3. **Middleware** valida autenticación y entrada
4. **Controlador** ejecuta lógica de negocio
5. **Modelos Sequelize** interactúan con BD
6. **Response JSON** es retornada

### Capa Base de Datos (MySQL 8.0+)

**Tablas principales:**
- `users` - Usuarios registrados
- `expenses` - Registro de gastos
- `categories` - Categorías personalizables
- `installments` - Desglose de cuotas
- `exchange_rates` - Tasas de cambio

**Características:**
- Índices en campos frecuentemente consultados
- Relaciones uno-a-muchos (User → Expenses, Category → Expenses)
- Triggers para cálculos automáticos
- Versionado con tabla de control de migraciones

## 🔐 Autenticación y Seguridad

```
┌─────────────────────────────────────────┐
│  Cliente: Almacena JWT en localStorage   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│ Cada request incluye header:             │
│ Authorization: Bearer <jwt_token>        │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│ Backend middleware (auth.js):            │
│ - Valida JWT                            │
│ - Extrae userId de token                │
│ - Verifica expiración                   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│ Controlador:                             │
│ - Acceso garantizado a datos del user    │
│ - Validación de permisos específicos    │
└─────────────────────────────────────────┘
```

## 📊 Patrón de Estado Global (Redux)

El frontend utiliza Redux Toolkit para gestionar:

```javascript
// store/
├── index.js              // Store configuration
├── authSlice.js         // Estado de autenticación
├── expensesSlice.js     // Estado de gastos
└── categoriesSlice.js   // Estado de categorías
```

**Ejemplo de flujo:**
```
User acción (ej: crear gasto)
    ↓
Component dispara action
    ↓
expenseService.createExpense() (API call)
    ↓
Dispatch expensesSlice action
    ↓
Redux store se actualiza
    ↓
Componentes subscritos re-renderizan
```

## 🔄 Flujos de Datos Clave

### 1. Autenticación (Login)
```
Frontend                    Backend              BD
   │                          │                  │
   ├─ POST /auth/login ──────>│                  │
   │                          ├─ findUser ──────>│
   │                          │<─ userData ──────┤
   │                          │ (bcrypt verify)  │
   │<─ JWT token ────────────┤                  │
   │ (almacena en store)      │                  │
```

### 2. Crear Gasto
```
Frontend                    Backend              BD
   │                          │                  │
   ├─ POST /expenses ────────>│                  │
   │ (con JWT header)         │ (auth.js check)  │
   │                          │                  │
   │                          ├─ create ────────>│
   │                          │<─ saved ────────┤
   │<─ expense JSON ─────────┤                  │
   │ (dispatch Redux)         │                  │
```

### 3. Reportes Mensuales
```
Frontend                    Backend              BD
   │                          │                  │
   ├─ GET /analytics/summary ─>│                 │
   │ (?month=2026-04)         │                  │
   │                          ├─ query (vistas)>│
   │                          │<─ datos ────────┤
   │<─ JSON con stats ───────┤                  │
   │ (update store)           │                  │
```

## 🏛️ Principios Arquitectónicos

### 1. **Separación de Responsabilidades**
- **Routes**: Mapeo de URLs a controladores
- **Controllers**: Orquestación de lógica
- **Models**: Acceso a datos (ORM)
- **Services**: Lógica de negocio reutilizable

### 2. **API RESTful**
- Endpoints siguen convención REST
- Métodos HTTP apropiados (GET, POST, PUT, DELETE)
- Status codes correctos (200, 201, 400, 401, 404, 500)
- Respuestas JSON consistentes

### 3. **Validación en Múltiples Capas**
- **Frontend**: Validación de formularios (Zod, React Hook Form)
- **Backend**: Validación de entrada en middleware
- **BD**: Constraints y tipos de datos

### 4. **Caching Inteligente**
- Redux store para estado de UI
- LocalStorage para JWT y preferences
- Headers de caché en respuestas API

### 5. **Error Handling Centralizado**
```
Frontend: interceptores de Axios
    ↓
Global error handler (Redux)
    ↓
Toast/Alert notificación al usuario
    ↓
Console logging en desarrollo

Backend: errorHandler middleware
    ↓
Log centralizado
    ↓
Response error JSON estándar
```

## 🔗 Integración Backend-Frontend

### Base URL y Endpoints
```javascript
// Frontend: .env
VITE_API_URL=http://localhost:5000/api

// Llamadas:
GET http://localhost:5000/api/expenses
POST http://localhost:5000/api/expenses
PUT http://localhost:5000/api/expenses/:id
DELETE http://localhost:5000/api/expenses/:id
```

### Headers y Autenticación
```javascript
// Todo request incluye:
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
}
```

### Response Format
```javascript
// Success (200)
{
  success: true,
  data: { /* datos */ }
}

// Error (4xx/5xx)
{
  success: false,
  message: "Descripción error",
  errors: { /* detalles */ }
}
```

## 📈 Escalabilidad Futura

### Posibles mejoras arquitectónicas:
1. **Microservicios**: Separar módulos en servicios independientes
2. **GraphQL**: Alternativa a REST para queries más eficientes
3. **WebSockets**: Real-time updates (cuotas próximas a vencer)
4. **Message Queues**: Para procesos asincronos (reportes PDF)
5. **Caché Distribuida**: Redis para mejorar performance
6. **CDN**: Para assets estáticos (JS, CSS, imágenes)

---

**Última actualización**: Abril 2026  
**Versión**: 1.0
