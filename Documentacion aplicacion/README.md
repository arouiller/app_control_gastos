# Aplicación de Control de Gastos Personales

**Estado**: 📋 Fase de Planificación y Especificación

## 📋 Descripción General

Aplicación web moderna para registro, categorización y análisis de gastos personales. Permite a los usuarios llevar un control detallado de sus gastos en efectivo y tarjeta de crédito, con capacidad de registrar compras en cuotas y obtener análisis visuales de sus patrones de consumo.

## ✨ Características Principales

### 🔐 Autenticación y Usuarios
- Registro e login seguro con JWT
- Recuperación de contraseña por email
- Gestión de perfil de usuario
- Sesiones con timeout automático

### 💰 Gestión de Gastos
- Registro de gastos con categorías personalizables
- Gastos en efectivo y tarjeta de crédito
- Gastos en cuotas (hasta 24 cuotas)
- Edición y eliminación de gastos
- Búsqueda y filtrado avanzado

### 📊 Análisis y Reportes
- Dashboard con resumen de gastos
- Gráficos de consumo por categoría
- Análisis de efectivo vs tarjeta de crédito
- Porcentajes y tendencias de gasto
- Generación de reportes en PDF

### 🏷️ Categorización
- Categorías predeterminadas (Alimentación, Transporte, etc.)
- Creación de categorías personalizadas
- Asignación de colores e iconos
- Consumo total por categoría

---

## 📚 Documentación

Toda la especificación del proyecto está dividida en documentos:

| Documento | Descripción |
|-----------|-----------|
| **REQUERIMIENTOS.md** | Requerimientos funcionales y tecnológicos completos |
| **ESQUEMA_DB.sql** | Diseño de base de datos con tablas, índices y vistas |
| **SEGURIDAD_Y_MEJORES_PRACTICAS.md** | Implementación de seguridad OWASP Top 10 |
| **GUIA_INSTALACION.md** | Setup paso a paso del ambiente de desarrollo |

---

## 🛠️ Stack Tecnológico

### Backend
- **Runtime**: Node.js v18+ (LTS)
- **Framework**: Express.js
- **ORM**: Sequelize
- **Base de Datos**: MySQL 8.0+
- **Autenticación**: JWT (JSON Web Tokens)
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: React 18+
- **Build**: Vite
- **Routing**: React Router v6
- **State**: Redux Toolkit
- **Estilos**: Tailwind CSS
- **Gráficos**: Recharts
- **Formularios**: React Hook Form + Zod
- **HTTP**: Axios

### Herramientas
- Git (control de versiones)
- Docker (containerización, opcional)
- npm (gestor de paquetes)

---

## 🏗️ Estructura del Proyecto

```
APP web para control de socios/
├── backend/                          # Servidor Node.js + Express
│   ├── src/
│   │   ├── config/                  # Configuración (BD, env)
│   │   ├── controllers/             # Lógica de controladores
│   │   ├── models/                  # Modelos Sequelize
│   │   ├── routes/                  # Rutas de API
│   │   ├── middleware/              # Middleware (auth, validación)
│   │   ├── services/                # Servicios de negocio
│   │   ├── utils/                   # Utilidades
│   │   └── server.js                # Punto de entrada
│   ├── tests/                        # Tests unitarios e integración
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── frontend/                         # Aplicación React + Vite
│   ├── src/
│   │   ├── components/              # Componentes reutilizables
│   │   ├── pages/                   # Páginas/vistas
│   │   ├── hooks/                   # Custom hooks
│   │   ├── store/                   # Redux store
│   │   ├── services/                # Servicios HTTP
│   │   ├── utils/                   # Utilidades
│   │   └── App.jsx
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   └── README.md
│
├── docs/                             # Documentación general
│   ├── API.md                        # Documentación de endpoints
│   ├── DATABASE.md                   # Detalles de BD
│   └── DEPLOYMENT.md                # Guía de deployment
│
├── REQUERIMIENTOS.md                 # Este documento - Especificación completa
├── ESQUEMA_DB.sql                    # Script SQL de base de datos
├── SEGURIDAD_Y_MEJORES_PRACTICAS.md # Guía de seguridad
├── GUIA_INSTALACION.md               # Setup del ambiente
└── README.md                         # Este archivo
```

---

## 🚀 Inicio Rápido

### Requisitos
- Node.js v18+ (con npm 9+)
- MySQL 8.0+
- Git

### Setup en 5 minutos

```bash
# 1. Crear base de datos MySQL
# Ver GUIA_INSTALACION.md para detalles

# 2. Clonar o descargar el proyecto
cd "APP web para control de socios"

# 3. Backend
cd backend
cp .env.example .env          # Configurar .env
npm install
npm run dev                   # Puerto 5000

# 4. Frontend (en otra terminal)
cd frontend
cp .env.example .env          # Configurar .env
npm install
npm run dev                   # Puerto 5173

# ✅ Aplicación lista en http://localhost:5173
```

Ver **GUIA_INSTALACION.md** para detalles completos.

---

## 📋 Requerimientos Funcionales (Resumen)

### Autenticación (8 RF)
- RF-001: Registro de usuarios
- RF-002: Login con email/contraseña
- RF-003: Sesiones JWT
- RF-004: Logout
- ... (ver REQUERIMIENTOS.md para lista completa)

### Gastos (7 RF)
- Registrar, editar, eliminar gastos
- Efectivo y tarjeta de crédito
- Validación de montos

### Cuotas (7 RF)
- Registrar en 1-24 cuotas
- Distribución automática
- Marcar como pagadas

### Análisis (11 RF)
- Dashboard
- Gráficos por categoría
- Efectivo vs tarjeta
- Reportes PDF

Ver **REQUERIMIENTOS.md** para todos los 50+ requerimientos.

---

## 🔒 Seguridad Implementada

✅ **OWASP Top 10**
- Prevención de SQL Injection (ORM Sequelize)
- Protección XSS (React escapa HTML)
- CSRF tokens
- Control de acceso por usuario
- Validación de entrada (Joi, Zod)
- Rate limiting en endpoints sensibles

✅ **Autenticación**
- Contraseñas hasheadas con bcrypt
- JWT con expiración
- Refresh tokens
- Timeout de sesión (30 min)

✅ **Datos**
- HTTPS en producción
- Base de datos con credenciales limitadas
- Backups automáticos
- Logs de auditoría

Ver **SEGURIDAD_Y_MEJORES_PRACTICAS.md** para detalles.

---

## 📊 Esquema de Base de Datos

### Tablas Principales
- `users` - Usuarios registrados
- `expenses` - Registro de gastos
- `categories` - Categorías de gastos
- `installments` - Desglose de cuotas
- `sessions` - Control de sesiones (opcional)
- `audit_logs` - Auditoría de cambios (opcional)

### Vistas Útiles
- `v_monthly_summary` - Resumen mensual
- `v_spending_by_category` - Consumo por categoría
- `v_pending_installments` - Cuotas pendientes
- `v_cash_vs_card` - Efectivo vs tarjeta

Ver **ESQUEMA_DB.sql** para DDL completo.

---

## 🔄 Fases de Desarrollo

### Fase 1: Setup y Autenticación
- Estructura de proyecto
- Configuración de BD
- Autenticación JWT
- CRUD de usuarios

### Fase 2: Gestión de Gastos Básica
- CRUD de categorías
- CRUD de gastos
- Filtrado básico
- Validaciones

### Fase 3: Gastos en Cuotas
- Lógica de cuotas
- Cálculos de distribución
- Gestión de pagos

### Fase 4: Dashboard y Reportes
- Dashboard principal
- Gráficos y análisis
- Reportes PDF
- Estadísticas

### Fase 5: Pulido y Deployment
- Tests (80%+ cobertura)
- Optimización
- Documentación
- Deploy a producción

---

## 📌 API Endpoints (Resumen)

```
AUTENTICACIÓN
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh-token

USUARIOS
GET    /api/users/profile
PUT    /api/users/profile

CATEGORÍAS
GET    /api/categories
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id

GASTOS
GET    /api/expenses (con filtros)
POST   /api/expenses
PUT    /api/expenses/:id
DELETE /api/expenses/:id

CUOTAS
GET    /api/installments
POST   /api/installments
PUT    /api/installments/:id

REPORTES
GET    /api/analytics/summary
GET    /api/analytics/by-category
GET    /api/analytics/cash-vs-card
GET    /api/reports/download
```

Ver **REQUERIMIENTOS.md** para endpoints completos.

---

## 🧪 Testing

```bash
# Backend
npm run test                # Ejecutar tests
npm run test:watch         # Modo watch

# Frontend
npm run test               # Vitest
npm run test:watch        # Modo watch
```

**Objetivo**: 80%+ cobertura

---

## 📝 Convenciones de Código

### Nombrado
- Archivos: `camelCase` para archivos JS/JSX
- Variables: `camelCase`
- Constantes: `UPPER_SNAKE_CASE`
- Componentes React: `PascalCase`

### Estructura
- Una clase/función por archivo
- Máximo 300 líneas por archivo
- Funciones máximo 20 líneas (dividir si crece)

### Git
- Commits: commit message en presente
- Branches: `feature/nombre` o `fix/nombre`
- PRs: Descripción clara de cambios

---

## 🚢 Deployment

### Requisitos Producción
- Certificado SSL/TLS (HTTPS obligatorio)
- Dominio propio
- Servidor (AWS, DigitalOcean, Heroku, etc.)
- Variables de entorno seguras
- Backups automáticos

### Plataformas Recomendadas
- **Backend**: Railway, Render, AWS EC2
- **Frontend**: Vercel, Netlify, GitHub Pages
- **Base de Datos**: AWS RDS, DigitalOcean, PlanetScale

Ver **GUIA_INSTALACION.md** y docs para detalles.

---

## 📞 Soporte y Documentación

### Documentos Internos
- `REQUERIMIENTOS.md` - Especificación funcional y técnica
- `ESQUEMA_DB.sql` - Diseño de base de datos
- `SEGURIDAD_Y_MEJORES_PRACTICAS.md` - Guía de seguridad
- `GUIA_INSTALACION.md` - Setup y troubleshooting

### Recursos Externos
- [Express.js Docs](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Sequelize Docs](https://sequelize.org/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [OWASP Security](https://owasp.org/)

---

## 📄 Licencia

Este proyecto es privado. Todos los derechos reservados.

---

## ✅ Checklist Pre-Desarrollo

Antes de comenzar a codificar, asegúrate de:

- [ ] Leer REQUERIMIENTOS.md completo
- [ ] Revisar ESQUEMA_DB.sql y entender la estructura
- [ ] Leer SEGURIDAD_Y_MEJORES_PRACTICAS.md
- [ ] Seguir GUIA_INSTALACION.md para setup
- [ ] Verificar que MySQL y Node.js estén instalados
- [ ] Crear base de datos MySQL
- [ ] Hacer commit inicial del proyecto

---

**Última actualización**: Abril 2026

**Autor**: [Tu nombre]

**Versión**: 1.0.0 (Planificación)
