# Documentación para Automatización - Cómo un Agente debe Usar Esta Especificación

**Objetivo**: Guía para que otro agente automatizado pueda generar/crear la aplicación completa usando esta documentación como referencia.

---

## 📖 CÓMO PROCESAR ESTA DOCUMENTACIÓN

### Paso 1: Leer Documentos en Orden
El agente debe procesar la documentación en este orden:

1. `REQUERIMIENTOS.md` → Entender todas las funcionalidades (RF y RT)
2. `ESQUEMA_DB.sql` → Entender la estructura de datos
3. `API_ENDPOINTS_REFERENCIA.md` → Entender endpoints que debe crear
4. `SEGURIDAD_Y_MEJORES_PRACTICAS.md` → Entender requisitos de seguridad
5. `GUIA_INSTALACION.md` → Entender estructura de proyecto

### Paso 2: Extraer Información Estructurada

El agente debe extraer y estructurar:

#### A) Requerimientos Funcionales (RF)
```
Fuente: REQUERIMIENTOS.md - Sección 1

Extraer:
- Código RF (RF-001, RF-002, etc.)
- Descripción de funcionalidad
- Dependencias (qué otros RF requiere)

Resultado: Lista de funcionalidades a implementar en orden
```

#### B) Requerimientos Técnicos (RT)
```
Fuente: REQUERIMIENTOS.md - Sección 2

Extraer:
- Código RT (RT-001, RT-002, etc.)
- Tecnología específica
- Configuración requerida

Resultado: Stack tecnológico y configuraciones necesarias
```

#### C) Esquema de Base de Datos
```
Fuente: ESQUEMA_DB.sql

Extraer:
- Definición de cada tabla
- Campos y tipos de datos
- Relaciones y constraints
- Índices
- Vistas

Resultado: Script SQL a ejecutar y modelos ORM a generar
```

#### D) Endpoints API
```
Fuente: API_ENDPOINTS_REFERENCIA.md

Extraer:
- Método HTTP (GET, POST, PUT, DELETE)
- Ruta del endpoint
- Parámetros requeridos
- Estructura de request/response
- Códigos de error

Resultado: Rutas a implementar en backend
```

#### E) Requisitos de Seguridad
```
Fuente: SEGURIDAD_Y_MEJORES_PRACTICAS.md

Extraer:
- Librerías de seguridad (bcrypt, JWT, etc.)
- Validaciones requeridas
- Headers de seguridad
- Rate limiting
- Protección CORS

Resultado: Middleware y configuraciones de seguridad
```

---

## 🔄 FLUJO DE AUTOMATIZACIÓN RECOMENDADO

```
FASE 1: ANÁLISIS (Agente lee documentación)
├─ Leer REQUERIMIENTOS.md
├─ Leer ESQUEMA_DB.sql
├─ Leer API_ENDPOINTS_REFERENCIA.md
├─ Leer SEGURIDAD_Y_MEJORES_PRACTICAS.md
└─ Crear mapeo mental de toda la aplicación

FASE 2: PREPARACIÓN (Agente prepara estructura)
├─ Crear estructura de carpetas backend/frontend
├─ Crear archivos package.json
├─ Crear configuración inicial (.env.example)
└─ Crear archivos base

FASE 3: BACKEND (Agente crea APIs)
├─ Crear modelos Sequelize (basado en ESQUEMA_DB.sql)
├─ Crear rutas/endpoints (basado en API_ENDPOINTS_REFERENCIA.md)
├─ Crear controladores (lógica de negocio)
├─ Crear middleware de seguridad
├─ Crear servicios y utilidades
└─ Agregar tests

FASE 4: FRONTEND (Agente crea UI)
├─ Crear estructura de componentes
├─ Crear páginas principales
├─ Crear formularios (basado en endpoints)
├─ Crear servicios HTTP (consumir APIs)
├─ Agregar estilos minimalistas
└─ Agregar tests

FASE 5: INTEGRACIONES (Agente conecta todo)
├─ Base de datos con backend
├─ Backend con frontend
├─ Tests end-to-end
├─ Documentación generada automáticamente
└─ Verificación contra REQUERIMIENTOS.md

FASE 6: VALIDACIÓN (Agente verifica)
├─ Todos los RF implementados ✓
├─ Todos los RT cumplidos ✓
├─ Seguridad verificada ✓
├─ Tests pasando ✓
└─ Documentación actualizada ✓
```

---

## 📋 CHECKLIST PARA EL AGENTE

### Antes de Empezar
- [ ] Leí REQUERIMIENTOS.md completo
- [ ] Leí ESQUEMA_DB.sql completo
- [ ] Leí API_ENDPOINTS_REFERENCIA.md completo
- [ ] Leí SEGURIDAD_Y_MEJORES_PRACTICAS.md completo
- [ ] Tengo Node.js v18+ instalado
- [ ] Tengo MySQL 8.0+ instalado

### Backend
- [ ] Estructura de carpetas creada
- [ ] package.json configurado con dependencias
- [ ] .env.example creado
- [ ] Conexión a BD implementada
- [ ] Modelos Sequelize creados (RF-001 a RF-050+)
- [ ] Rutas/endpoints creados (30+ endpoints)
- [ ] Middleware de autenticación (JWT)
- [ ] Validaciones implementadas (Joi)
- [ ] Manejo de errores centralizado
- [ ] Logging configurado
- [ ] Tests unitarios (80%+ cobertura)
- [ ] Server inicia correctamente

### Frontend
- [ ] Estructura de carpetas creada
- [ ] package.json configurado
- [ ] .env.example creado
- [ ] Configuración Vite y Tailwind
- [ ] Componentes base creados
- [ ] Páginas principales creadas
- [ ] Autenticación funcional
- [ ] Consumo de APIs funciona
- [ ] Diseño minimalista implementado
- [ ] Responsive en móvil y PC
- [ ] Tests implementados
- [ ] Build produce bundles optimizados

### Base de Datos
- [ ] Script SQL ejecutado
- [ ] Todas las tablas creadas
- [ ] Todas las vistas creadas
- [ ] Índices creados
- [ ] Triggers configurados
- [ ] Datos de ejemplo insertados

### Seguridad
- [ ] Contraseñas hasheadas (bcrypt)
- [ ] JWT implementado
- [ ] Validación de entrada
- [ ] Rate limiting configurado
- [ ] CORS configurado
- [ ] Helmet.js activo
- [ ] HTTPS habilitado (producción)
- [ ] Variables de entorno seguras

### Documentación
- [ ] Documentación de API (Swagger/OpenAPI)
- [ ] README actualizado
- [ ] Guía de instalación actualizada
- [ ] Cambios documentados

### Testing
- [ ] Tests unitarios pasan
- [ ] Tests integración pasan
- [ ] Cobertura >80%
- [ ] Tests e2e pasan

### Validación Final
- [ ] Todos los RF implementados (50+)
- [ ] Todos los RT cumplidos (46)
- [ ] App inicia sin errores
- [ ] Endpoints responden correctamente
- [ ] BD sincronizada
- [ ] UI responsiva
- [ ] Seguridad verificada

---

## 🔍 MAPEO DOCUMENTO → ARCHIVOS A CREAR

| Documento | Información | Archivos a Generar |
|-----------|-------------|-------------------|
| REQUERIMIENTOS.md - Sección 1 | Funcionalidades (RF) | Controllers, Services, Models, Routes |
| REQUERIMIENTOS.md - Sección 2 | Requisitos técnicos (RT) | package.json, .env, config files |
| REQUERIMIENTOS.md - Sección 3 | Arquitectura | Estructura de carpetas |
| REQUERIMIENTOS.md - Sección 4.1-4.6 | Endpoints | routes/*, controllers/* |
| REQUERIMIENTOS.md - Sección 5 | Esquema BD | (ver ESQUEMA_DB.sql) |
| ESQUEMA_DB.sql | DDL completo | SQL a ejecutar, Models Sequelize |
| API_ENDPOINTS_REFERENCIA.md | Endpoints detallados | Routes, Controllers, Services |
| SEGURIDAD_Y_MEJORES_PRACTICAS.md | Seguridad | Middleware, Validaciones, Configuración |
| GUIA_INSTALACION.md | Setup | .env.example, docker-compose, scripts |

---

## 💾 ESTRUCTURA DE DIRECTORIOS A GENERAR

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          (Sequelize config)
│   │   ├── environment.js       (.env validation)
│   │   └── constants.js
│   ├── controllers/
│   │   ├── authController.js    (RF-001 a RF-008)
│   │   ├── expenseController.js (RF-009 a RF-015)
│   │   ├── categoryController.js(RF-023 a RF-028)
│   │   ├── installmentController.js (RF-016 a RF-022)
│   │   └── analyticsController.js (RF-035 a RF-045)
│   ├── models/
│   │   ├── User.js              (Tabla users)
│   │   ├── Expense.js           (Tabla expenses)
│   │   ├── Category.js          (Tabla categories)
│   │   └── Installment.js       (Tabla installments)
│   ├── routes/
│   │   ├── auth.js              (5 endpoints)
│   │   ├── users.js             (3 endpoints)
│   │   ├── expenses.js          (5 endpoints)
│   │   ├── categories.js        (4 endpoints)
│   │   ├── installments.js      (5 endpoints)
│   │   └── analytics.js         (4 endpoints)
│   ├── middleware/
│   │   ├── auth.js              (JWT verification)
│   │   ├── errorHandler.js      (Error handling)
│   │   ├── validation.js        (Joi validation)
│   │   └── security.js          (Helmet, CORS, etc.)
│   ├── services/
│   │   ├── expenseService.js    (Business logic)
│   │   └── analyticsService.js
│   ├── utils/
│   │   ├── logger.js            (Winston)
│   │   ├── validators.js        (Joi schemas)
│   │   └── formatters.js
│   ├── tests/
│   │   ├── auth.test.js
│   │   ├── expense.test.js
│   │   └── integration.test.js
│   └── server.js                (Entry point)
├── .env.example
├── .env.local (git-ignored)
├── package.json
├── package-lock.json
└── README.md

frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Forms/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── ExpenseForm.jsx
│   │   │   └── CategoryForm.jsx
│   │   ├── List/
│   │   │   ├── ExpenseList.jsx
│   │   │   └── InstallmentList.jsx
│   │   └── Charts/
│   │       ├── CategoryChart.jsx
│   │       └── CashVsCardChart.jsx
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── ExpensesPage.jsx
│   │   ├── CategoriesPage.jsx
│   │   └── ReportsPage.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useExpenses.js
│   │   └── useApi.js
│   ├── store/
│   │   ├── authSlice.js
│   │   ├── expenseSlice.js
│   │   └── store.js
│   ├── services/
│   │   ├── api.js               (Axios instance)
│   │   ├── authService.js
│   │   ├── expenseService.js
│   │   └── analyticsService.js
│   ├── styles/
│   │   ├── globals.css
│   │   └── tailwind.config.js
│   ├── utils/
│   │   ├── formatters.js
│   │   └── validators.js
│   ├── tests/
│   │   ├── components.test.jsx
│   │   └── integration.test.jsx
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── .env.local (git-ignored)
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

## 🔗 RELACIONES ENTRE DOCUMENTOS Y CÓDIGO

### Para Implementar RF-001 (Registro de usuarios):
```
1. Leer: REQUERIMIENTOS.md (RF-001)
2. Leer: API_ENDPOINTS_REFERENCIA.md (POST /auth/register)
3. Leer: ESQUEMA_DB.sql (tabla users)
4. Crear: 
   - models/User.js (Sequelize model)
   - controllers/authController.js (register function)
   - routes/auth.js (POST /auth/register)
   - Validaciones en middleware/validation.js
5. Leer: SEGURIDAD_Y_MEJORES_PRACTICAS.md (sección 1)
6. Agregar: bcrypt hashing, validación de contraseña
```

### Para Implementar RF-009 (Registrar gasto):
```
1. Leer: REQUERIMIENTOS.md (RF-009)
2. Leer: API_ENDPOINTS_REFERENCIA.md (POST /expenses)
3. Leer: ESQUEMA_DB.sql (tabla expenses)
4. Crear:
   - models/Expense.js
   - controllers/expenseController.js
   - routes/expenses.js
5. Agregar: validación, autenticación
```

### Para Implementar RF-016 (Gastos en cuotas):
```
1. Leer: REQUERIMIENTOS.md (RF-016 a RF-022)
2. Leer: API_ENDPOINTS_REFERENCIA.md (POST /expenses/installment)
3. Leer: ESQUEMA_DB.sql (tabla installments)
4. Crear:
   - models/Installment.js
   - services/expenseService.js (lógica de división)
   - controllers/installmentController.js
5. Agregar: lógica de distribución automática
```

---

## 🎯 CRITERIOS PARA VERIFICAR COMPLETITUD

El agente debe verificar que:

```javascript
// Pseudocódigo de verificación

function verificarCompletitud() {
  
  // 1. Requerimientos Funcionales
  const rfImplementados = contarRFEnCodigo();
  const rfEspecificados = 50; // RF-001 a RF-050+
  assert(rfImplementados >= rfEspecificados, "Faltan RFs");
  
  // 2. Endpoints
  const endpointsCreados = contarEndpointsEnRoutes();
  const endpointsEspecificados = 30; // De API_ENDPOINTS_REFERENCIA.md
  assert(endpointsCreados >= endpointsEspecificados, "Faltan endpoints");
  
  // 3. Modelos
  const modelosCreados = contarModelos();
  const modelosEspecificados = 6; // users, categories, expenses, etc.
  assert(modelosCreados >= modelosEspecificados, "Faltan modelos");
  
  // 4. Seguridad
  assert(bcryptImplementado, "bcrypt no implementado");
  assert(jwtImplementado, "JWT no implementado");
  assert(validacionEnInput, "Validación ausente");
  assert(rateLimitingActivo, "Rate limiting no implementado");
  
  // 5. Tests
  const cobertura = ejecutarTests();
  assert(cobertura >= 0.80, "Cobertura < 80%");
  
  // 6. BD
  assert(allTablesCreated(), "Tablas BD no creadas");
  assert(allViewsCreated(), "Vistas BD no creadas");
  
  // 7. Responsiveness
  assert(testResponsive(), "No es responsive");
  
  return true; // Todo cumple
}
```

---

## 📊 MATRIZ DE TRAZABILIDAD

El agente debe crear una matriz que vincula:

| RF | API Endpoint | Tabla BD | Componente Frontend | Tests |
|----|---|---|---|---|
| RF-001 | POST /auth/register | users | RegisterPage | auth.test.js |
| RF-002 | POST /auth/login | users | LoginPage | auth.test.js |
| RF-009 | POST /expenses | expenses | ExpenseForm | expense.test.js |
| RF-016 | POST /expenses/installment | installments | InstallmentForm | installment.test.js |
| ... | ... | ... | ... | ... |

Esta matriz ayuda a verificar que nada se olvidó.

---

## 🔄 REINTENTOS Y MANEJO DE ERRORES

Si el agente encuentra problemas:

1. **Error de compilación**: Volver a leer GUIA_INSTALACION.md
2. **Endpoint no funciona**: Validar contra API_ENDPOINTS_REFERENCIA.md
3. **BD tiene problemas**: Ejecutar script ESQUEMA_DB.sql nuevamente
4. **Tests fallan**: Verificar contra REQUERIMIENTOS.md sección 8
5. **No es seguro**: Leer SEGURIDAD_Y_MEJORES_PRACTICAS.md nuevamente

---

## 📝 DOCUMENTACIÓN GENERADA POR EL AGENTE

El agente debe generar automáticamente:

1. **Swagger/OpenAPI**: Basado en API_ENDPOINTS_REFERENCIA.md
2. **README del proyecto**: Resumen ejecutivo + GUIA_INSTALACION.md
3. **CHANGELOG**: Qué se implementó en cada fase
4. **Comentarios de código**: Vincular con RF correspondiente

Ejemplo:
```javascript
/**
 * Implementa RF-001: Registro de usuarios
 * API: POST /auth/register
 * Ver: REQUERIMIENTOS.md (RF-001)
 */
async function register(req, res) {
  // ...
}
```

---

## 🎯 SALIDA ESPERADA DEL AGENTE

Al terminar, el agente debe entregar:

```
✅ Backend funcionando en http://localhost:5000
✅ Frontend funcionando en http://localhost:5173
✅ Base de datos MySQL creada y poblada
✅ 50+ requerimientos funcionales implementados
✅ 30+ endpoints API creados
✅ Tests pasando (>80% cobertura)
✅ UI minimalista y responsive
✅ Seguridad según OWASP Top 10
✅ Documentación generada automáticamente
✅ Ready para deployment
```

---

## 📚 REFERENCIA RÁPIDA PARA EL AGENTE

| Necesito hacer... | Consulto documento... |
|---|---|
| Entender requerimientos | REQUERIMIENTOS.md |
| Crear tablas BD | ESQUEMA_DB.sql |
| Crear endpoints | API_ENDPOINTS_REFERENCIA.md |
| Implementar seguridad | SEGURIDAD_Y_MEJORES_PRACTICAS.md |
| Hacer setup | GUIA_INSTALACION.md |
| Entender arquitectura | REQUERIMIENTOS.md (sección 3) |
| Buscar algo específico | INDICE_DOCUMENTACION.md |

---

**Esta documentación es la "fuente única de verdad" para el agente automatizado.**

El agente no debe tomar decisiones de arquitectura, debe seguir esta especificación exactamente.
