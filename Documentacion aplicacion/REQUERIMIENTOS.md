# Especificación de Requerimientos - Aplicación de Control de Gastos

## 1. REQUERIMIENTOS FUNCIONALES

### 1.1 Gestión de Usuarios y Autenticación
- **RF-001**: El sistema debe permitir registro de nuevos usuarios con email y contraseña
- **RF-002**: El sistema debe implementar login con email y contraseña
- **RF-003**: El sistema debe mantener sesiones de usuario autenticado
- **RF-004**: El sistema debe permitir logout de usuarios
- **RF-005**: El sistema debe permitir recuperación de contraseña por email
- **RF-007**: El sistema debe generar tokens JWT para mantener sesiones
- **RF-008**: El sistema debe permitir perfil de usuario (nombre, email, foto)

### 1.2 Registro y Gestión de Gastos
- **RF-009**: El sistema debe permitir registrar un gasto con: fecha, descripción, monto, categoría, método de pago
- **RF-010**: El sistema debe permitir editar gastos registrados
- **RF-011**: El sistema debe permitir eliminar gastos
- **RF-012**: El sistema debe permitir ver listado de todos los gastos del usuario
- **RF-013**: El sistema debe permitir registrar gastos en efectivo
- **RF-014**: El sistema debe permitir registrar gastos con tarjeta de crédito
- **RF-015**: El sistema debe validar que el monto sea mayor a 0

### 1.3 Gastos en Cuotas (Tarjeta de Crédito)
- **RF-016**: El sistema debe permitir registrar un gasto en cuotas con número de cuotas (1-24)
- **RF-017**: El sistema debe permitir especificar la fecha de inicio de cuotas
- **RF-018**: El sistema debe distribuir automáticamente el monto entre las cuotas
- **RF-019**: El sistema debe generar registros de cada cuota como gasto separado
- **RF-020**: El sistema debe permitir editar el gasto principal y reflejar cambios en las cuotas
- **RF-021**: El sistema debe permitir pagar cuotas (marcar como pagadas)
- **RF-022**: El sistema debe mostrar estado de cuotas (pendiente/pagada)

### 1.4 Categorías de Gastos
- **RF-023**: El sistema debe permitir crear categorías de gastos personalizadas
- **RF-024**: El sistema debe tener categorías predeterminadas (Alimentación, Transporte, Entretenimiento, Servicios, Salud, Educación, Otros)
- **RF-025**: El sistema debe permitir editar categorías
- **RF-026**: El sistema debe permitir eliminar categorías (solo si no tienen gastos asociados)
- **RF-027**: El sistema debe asignar color a cada categoría para visualización
- **RF-028**: El sistema debe mostrar consumo total por categoría

### 1.5 Filtrado y Búsqueda
- **RF-029**: El sistema debe permitir filtrar gastos por fecha (rango)
- **RF-030**: El sistema debe permitir filtrar gastos por categoría
- **RF-031**: El sistema debe permitir filtrar gastos por método de pago (efectivo/tarjeta)
- **RF-032**: El sistema debe permitir filtrar gastos por rango de monto
- **RF-033**: El sistema debe permitir búsqueda por descripción del gasto
- **RF-034**: El sistema debe permitir combinar múltiples filtros simultáneamente

### 1.6 Análisis y Reportes
- **RF-035**: El sistema debe mostrar gasto total del período (mes/año/personalizado)
- **RF-036**: El sistema debe mostrar consumo por categoría con porcentaje
- **RF-037**: El sistema debe mostrar gasto total en efectivo
- **RF-038**: El sistema debe mostrar gasto total en tarjeta de crédito
- **RF-039**: El sistema debe calcular porcentaje de consumo: efectivo vs tarjeta
- **RF-040**: El sistema debe mostrar promedio diario de gastos
- **RF-041**: El sistema debe mostrar cuotas pendientes de pago
- **RF-042**: El system debe generar gráficos de gastos por categoría (pastel/barras)
- **RF-043**: El sistema debe generar gráficos de evolución de gastos en el tiempo
- **RF-044**: El sistema debe generar gráficos de efectivo vs tarjeta
- **RF-045**: El sistema debe permitir descargar reportes en PDF

### 1.7 Dashboard
- **RF-046**: El sistema debe mostrar resumen de gastos del mes actual
- **RF-047**: El sistema debe mostrar comparación con mes anterior
- **RF-048**: El sistema debe mostrar categoría con mayor gasto
- **RF-049**: El sistema debe mostrar cuotas próximas a vencer
- **RF-050**: El sistema debe mostrar widgets de efectivo/tarjeta

---

## 2. REQUERIMIENTOS TECNOLÓGICOS

### 2.1 Base de Datos
- **RT-001**: DBMS: MySQL 8.0 o superior
- **RT-002**: Estructura relacional con normalización a 3FN
- **RT-003**: Tablas: users, expenses, categories, credit_card_installments, expense_filters
- **RT-004**: Índices en campos frecuentemente consultados (user_id, category_id, date, payment_method)
- **RT-005**: Contraints de integridad referencial
- **RT-006**: Triggers para sincronizar datos de cuotas con gastos

### 2.2 Backend
- **RT-007**: Framework: Node.js + Express.js (recomendado por flexibilidad y rendimiento)
- **RT-008**: Lenguaje: JavaScript (ES6+)
- **RT-009**: ORM: Sequelize o TypeORM para mapeo objeto-relacional
- **RT-010**: Autenticación: JWT (JSON Web Tokens)
- **RT-011**: Validación: Joi o express-validator
- **RT-012**: Variables de entorno: dotenv
- **RT-013**: CORS habilitado para comunicación con frontend
- **RT-014**: Logging: winston o morgan
- **RT-015**: Manejo de errores centralizado
- **RT-016**: Rate limiting para endpoints sensibles
- **RT-017**: Compresión de respuestas (gzip)
- **RT-018**: Testing: Jest + Supertest

### 2.3 Frontend
- **RT-019**: Framework: React 18+ (componentes funcionales con hooks)
- **RT-020**: Lenguaje: JavaScript/TypeScript
- **RT-021**: Gestión de estado: Redux Toolkit o Context API
- **RT-022**: Ruteo: React Router v6
- **RT-023**: Estilos: Tailwind CSS o Material-UI
- **RT-024**: Gráficos: Chart.js o Recharts
- **RT-025**: Llamadas HTTP: Axios o Fetch API
- **RT-026**: Formularios: React Hook Form + Zod/Yup
- **RT-027**: Fechas: date-fns o Day.js
- **RT-028**: Notificaciones: React Toastify o Sonner
- **RT-029**: Testing: Vitest + React Testing Library
- **RT-030**: Build: Vite (más rápido que Create React App)

### 2.4 Seguridad
- **RT-031**: Encriptación de contraseñas: bcrypt
- **RT-032**: HTTPS en producción obligatorio
- **RT-033**: Validación de entrada en frontend y backend
- **RT-034**: Protección contra SQL Injection (usar ORM)
- **RT-035**: Protección contra XSS (sanitizar HTML)
- **RT-036**: CSRF tokens para formularios
- **RT-037**: Helmet.js para headers de seguridad
- **RT-038**: Renovación automática de tokens JWT
- **RT-039**: Timeout de sesión (30 minutos inactividad)

### 2.5 DevOps y Deployment
- **RT-040**: Control de versiones: Git con GitHub/GitLab
- **RT-041**: Node.js versión LTS estable (v18 o v20)
- **RT-042**: Package manager: npm o yarn
- **RT-043**: Variables de entorno separadas (dev/test/prod)
- **RT-044**: Testing automatizado en CI/CD
- **RT-045**: Docker para containerización (opcional pero recomendado)
- **RT-046**: Documentación de API: Swagger/OpenAPI

---

## 3. ARQUITECTURA PROPUESTA

### 3.1 Estructura del Proyecto

```
proyecto/
├── backend/
│   ├── src/
│   │   ├── controllers/       # Controladores de lógica
│   │   ├── services/          # Servicios de negocio
│   │   ├── models/            # Modelos de datos (Sequelize)
│   │   ├── routes/            # Rutas de API
│   │   ├── middleware/        # Middleware (auth, validación)
│   │   ├── utils/             # Utilidades
│   │   ├── config/            # Configuración
│   │   └── server.js          # Punto de entrada
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Componentes reutilizables
│   │   ├── pages/             # Páginas/vistas
│   │   ├── hooks/             # Hooks personalizados
│   │   ├── context/           # Context API
│   │   ├── services/          # Servicios HTTP
│   │   ├── utils/             # Utilidades
│   │   ├── styles/            # Estilos globales
│   │   └── App.jsx            # Componente raíz
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
│
├── docs/                      # Documentación del proyecto
│   ├── API.md                 # Documentación de API
│   ├── DATABASE.md            # Esquema de BD
│   └── SETUP.md               # Guía de instalación
│
└── README.md                  # README del proyecto
```

### 3.2 Patrones de Diseño
- **MVC**: Backend sigue patrón Model-View-Controller
- **Componentes**: Frontend basado en componentes reutilizables
- **Capas**: Separación clara entre datos, lógica, presentación
- **API REST**: Endpoints siguiendo convenciones REST

---

## 4. ENDPOINTS API (Backend)

### 4.1 Autenticación
```
POST   /api/auth/register        - Registro de usuario
POST   /api/auth/login           - Login de usuario
POST   /api/auth/logout          - Logout
POST   /api/auth/refresh-token   - Renovar token JWT
POST   /api/auth/forgot-password - Recuperar contraseña
```

### 4.2 Usuarios
```
GET    /api/users/profile        - Obtener perfil actual
PUT    /api/users/profile        - Actualizar perfil
PUT    /api/users/password       - Cambiar contraseña
```

### 4.3 Categorías
```
GET    /api/categories           - Listar categorías
POST   /api/categories           - Crear categoría
PUT    /api/categories/:id       - Editar categoría
DELETE /api/categories/:id       - Eliminar categoría
```

### 4.4 Gastos
```
GET    /api/expenses             - Listar gastos (con filtros)
POST   /api/expenses             - Crear gasto
PUT    /api/expenses/:id         - Editar gasto
DELETE /api/expenses/:id         - Eliminar gasto
GET    /api/expenses/:id         - Obtener gasto específico
```

### 4.5 Gastos en Cuotas
```
POST   /api/installments         - Crear cuotas
GET    /api/installments         - Listar cuotas por gasto
PUT    /api/installments/:id     - Marcar cuota como pagada
DELETE /api/installments/:id     - Eliminar cuota
```

### 4.6 Reportes y Análisis
```
GET    /api/analytics/summary    - Resumen del período
GET    /api/analytics/by-category - Consumo por categoría
GET    /api/analytics/cash-vs-card - Efectivo vs tarjeta
GET    /api/analytics/pending-installments - Cuotas pendientes
GET    /api/reports/download     - Descargar reporte PDF
```

---

## 5. ESQUEMA DE BASE DE DATOS

### 5.1 Tablas Principales

**users**
```
- id (PK)
- email (UNIQUE)
- password_hash
- name
- profile_picture_url
- created_at
- updated_at
- is_active
```

**categories**
```
- id (PK)
- user_id (FK)
- name
- color (hex)
- icon
- created_at
- updated_at
```

**expenses**
```
- id (PK)
- user_id (FK)
- category_id (FK)
- description
- amount
- date
- payment_method (enum: cash, credit_card)
- is_installment (boolean)
- installment_group_id (FK, nullable)
- created_at
- updated_at
```

**installments**
```
- id (PK)
- expense_id (FK)
- installment_number
- amount
- due_date
- is_paid (boolean)
- paid_date (nullable)
- created_at
- updated_at
```

---

## 6. FASES DE DESARROLLO

### Fase 1: Setup y Autenticación (Semana 1)
- Configurar estructura de proyecto
- Implementar autenticación JWT
- CRUD de usuarios

### Fase 2: Gestión de Gastos Básica (Semana 2)
- CRUD de categorías
- CRUD de gastos simples
- Filtrado básico

### Fase 3: Gastos en Cuotas (Semana 3)
- Lógica de cuotas
- Gestión de cuotas
- Cálculos de distribución

### Fase 4: Dashboard y Reportes (Semana 4)
- Dashboard principal
- Gráficos y análisis
- Descargas de reportes

### Fase 5: Pruebas y Deployment (Semana 5)
- Testing completo
- Optimización
- Documentación
- Deploy a producción

---

## 7. DEPENDENCIAS PRINCIPALES

### Backend (Node.js)
```
- express
- sequelize
- mysql2
- jsonwebtoken
- bcryptjs
- dotenv
- joi
- cors
- helmet
- morgan
- winston
```

### Frontend (React)
```
- react
- react-dom
- react-router-dom
- axios
- redux-toolkit
- chart.js / recharts
- tailwindcss
- react-hook-form
- date-fns
- react-toastify
```

---

## 8. CRITERIOS DE ACEPTACIÓN

- ✅ Aplicación funcional en localhost
- ✅ Todos los requerimientos funcionales implementados
- ✅ Tests unitarios e integración con cobertura >80%
- ✅ Documentación completa de API y setup
- ✅ Seguridad implementada (encriptación, validación, CORS)
- ✅ Interfaz responsiva (mobile/desktop)
- ✅ Base de datos normalizada y con índices
- ✅ Manejo de errores robusto
- ✅ Performance aceptable (<2s carga inicial)

