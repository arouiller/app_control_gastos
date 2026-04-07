# App Control de Gastos

Aplicación web para control y gestión de gastos personales.

## Stack
- **Backend**: Node.js + Express + Sequelize + MySQL
- **Frontend**: React 18 + Vite + Redux Toolkit + Tailwind CSS

## Instalación Rápida

### 1. Crear base de datos MySQL

```sql
CREATE DATABASE control_gastos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configurar Backend

```bash
cd backend
npm install
```

Editar `backend/.env` con tus credenciales de MySQL (campo `DB_PASSWORD`).

```bash
npm run dev
```

El backend sincroniza la base de datos automáticamente en modo `development`.

### 3. Configurar Frontend

```bash
cd frontend
npm install
npm run dev
```

### URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health check: http://localhost:5000/health

## Estructura

```
├── backend/
│   └── src/
│       ├── config/       # Configuración BD
│       ├── controllers/  # Lógica de negocio
│       ├── middleware/   # Auth, validación, errores
│       ├── models/       # Modelos Sequelize
│       ├── routes/       # Rutas API REST
│       └── utils/        # Helpers
└── frontend/
    └── src/
        ├── components/   # UI + Layout
        ├── pages/        # Vistas
        ├── services/     # HTTP calls
        ├── store/        # Redux
        └── utils/        # Formatters, constantes
```

## Funcionalidades

- Registro e inicio de sesión con JWT
- CRUD de gastos (efectivo y tarjeta)
- Gastos en cuotas (2-24 cuotas)
- Categorías personalizadas
- Filtros avanzados (fecha, categoría, método de pago, monto, búsqueda)
- Dashboard con gráficos (pie chart categorías, efectivo vs tarjeta)
- Cuotas pendientes con alertas de vencimiento
- Reportes por período con gráficos de barras y líneas
- Perfil de usuario con cambio de contraseña
