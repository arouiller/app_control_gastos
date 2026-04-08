# Flujos de Procesos Detallados - App Control de Gastos

## 📊 Diagrama de Ciclo de Vida de un Gasto

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CREACIÓN DE GASTO                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Usuario completa formulario                               │
│         ↓                                                   │
│  Validación frontend (Zod)                                │
│         ↓                                                   │
│  POST /api/expenses                                        │
│         ↓                                                   │
│  Middleware auth (JWT válido?)                            │
│         ↓                                                   │
│  Middleware validate (schema)                             │
│         ↓                                                   │
│  Controller: Expense.create()                             │
│         ↓                                                   │
│  BD: INSERT INTO expenses                                 │
│         ↓                                                   │
│  Si is_installment=true:                                  │
│    ├─ Calcula monto por cuota                             │
│    ├─ Genera fechas de vencimiento                        │
│    └─ Installment.bulkCreate()                            │
│         ↓                                                   │
│  Response: { expense con id }                             │
│         ↓                                                   │
│  Frontend: dispatch(addExpense())                         │
│         ↓                                                   │
│  Toast: "Gasto creado exitosamente"                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Flujo Detallado de Actualización de Gasto

```
┌─────────────────────────────────────────────────────────────┐
│ 2. EDITAR GASTO EXISTENTE                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Usuario click Edit en lista                              │
│         ↓                                                   │
│  GET /api/expenses/:id                                    │
│         ↓                                                   │
│  Controller valida ownership (expense.user_id === userId) │
│         ↓                                                   │
│  Response con datos de gasto                              │
│         ↓                                                   │
│  Form carga datos en campos                               │
│         ↓                                                   │
│  Usuario modifica valores                                 │
│         ↓                                                   │
│  Validación frontend                                      │
│         ↓                                                   │
│  PUT /api/expenses/:id                                    │
│         ↓                                                   │
│  Backend valida nuevamente:                              │
│    ├─ JWT válido?                                         │
│    ├─ user_id del token = expense.user_id?               │
│    ├─ category_id pertenece al user?                      │
│    └─ Datos nuevos válidos?                              │
│         ↓                                                   │
│  BD: UPDATE expenses WHERE id = ? AND user_id = ?        │
│         ↓                                                   │
│  Si cambió is_installment o num_installments:            │
│    ├─ Elimina cuotas antiguas                             │
│    └─ Crea cuotas nuevas                                  │
│         ↓                                                   │
│  Response: gasto actualizado                              │
│         ↓                                                   │
│  Frontend: dispatch(updateExpense())                      │
│         ↓                                                   │
│  Lista se actualiza                                       │
│         ↓                                                   │
│  Toast: "Gasto actualizado"                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🗑️ Flujo Detallado de Eliminar Gasto

```
┌─────────────────────────────────────────────────────────────┐
│ 3. ELIMINAR GASTO                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Usuario click Delete                                     │
│         ↓                                                   │
│  Confirmación modal: "¿Estás seguro?"                     │
│         ↓                                                   │
│  Si no confirma: Cancelar                                 │
│  Si confirma:                                             │
│         ↓                                                   │
│  DELETE /api/expenses/:id                                 │
│         ↓                                                   │
│  Backend transacción:                                     │
│    ├─ Validar ownership                                   │
│    ├─ Eliminar cuotas asociadas                           │
│    │  DELETE FROM installments                            │
│    │  WHERE expense_id = ?                                │
│    └─ Eliminar gasto                                      │
│       DELETE FROM expenses WHERE id = ?                   │
│         ↓                                                   │
│  Si hay error: ROLLBACK transacción                       │
│         ↓                                                   │
│  Response: { success: true }                              │
│         ↓                                                   │
│  Frontend: dispatch(removeExpense(id))                    │
│         ↓                                                   │
│  Gasto desaparece de lista                                │
│         ↓                                                   │
│  Toast: "Gasto eliminado"                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 💰 Flujo Detallado de Cuotas

```
┌─────────────────────────────────────────────────────────────┐
│ 4. FLUJO DE CUOTAS                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  A. CREACIÓN DE CUOTAS                                    │
│     ────────────────────                                  │
│     Usuario crea gasto con is_installment=true            │
│              ↓                                              │
│     num_installments = 12 (ejemplo)                       │
│              ↓                                              │
│     monto_por_cuota = 1200 / 12 = 100                    │
│              ↓                                              │
│     Generator crea 12 registros:                          │
│     Cuota 1: 100, due_date=2026-05-01, is_paid=false    │
│     Cuota 2: 100, due_date=2026-06-01, is_paid=false    │
│     Cuota 3: 100, due_date=2026-07-01, is_paid=false    │
│     ... (hasta 12)                                        │
│              ↓                                              │
│  B. VER CUOTAS PENDIENTES                                 │
│     ──────────────────────                                │
│     GET /api/installments?status=pending                  │
│              ↓                                              │
│     BD Query:                                             │
│     SELECT * FROM installments                            │
│     WHERE user_id = ? AND is_paid = false                 │
│     ORDER BY due_date ASC                                 │
│              ↓                                              │
│     Response: Array de cuotas pendientes                  │
│              ↓                                              │
│     Frontend renderiza tabla                              │
│     Highlight: cuotas próximas a vencer (< 5 días)       │
│              ↓                                              │
│  C. MARCAR CUOTA COMO PAGADA                              │
│     ───────────────────────────                           │
│     Usuario click "Mark as Paid"                          │
│              ↓                                              │
│     PUT /api/installments/:id                             │
│     { is_paid: true, paid_date: now }                    │
│              ↓                                              │
│     BD: UPDATE installments                               │
│          SET is_paid = true, paid_date = now              │
│          WHERE id = ?                                     │
│              ↓                                              │
│     BD: Verifica si todas las cuotas del gasto            │
│          están pagadas                                    │
│          Si sí: Marcar gasto como "completed"             │
│              ↓                                              │
│     Response: Cuota actualizada                           │
│              ↓                                              │
│     Frontend: Refresca lista de cuotas                    │
│              ↓                                              │
│     Toast: "Cuota marcada como pagada"                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📈 Flujo de Generación de Reportes

```
┌─────────────────────────────────────────────────────────────┐
│ 5. GENERACIÓN DE REPORTES MENSUALES                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  A. SELECCIONAR PERÍODO                                   │
│     ────────────────────                                  │
│     Usuario selecciona month=2026-04 en date picker       │
│              ↓                                              │
│  B. FETCH DATA DESDE BACKEND                              │
│     ───────────────────────────                           │
│     GET /api/reports/monthly?month=2026-04                │
│              ↓                                              │
│     Backend ejecuta múltiples queries:                    │
│     │                                                      │
│     ├─ Resumen mensual:                                   │
│     │  SELECT SUM(amount) as total,                       │
│     │         COUNT(*) as count,                          │
│     │         AVG(amount) as avg                          │
│     │  FROM expenses WHERE user_id = ?                    │
│     │  AND DATE_FORMAT(expense_date, '%Y-%m') = '2026-04'│
│     │                                                      │
│     ├─ Por categoría:                                     │
│     │  SELECT c.name, c.color,                            │
│     │         SUM(e.amount) as total,                     │
│     │         COUNT(*) as count                           │
│     │  FROM categories c                                  │
│     │  LEFT JOIN expenses e ON c.id = e.category_id       │
│     │  WHERE e.user_id = ? AND ...                        │
│     │  GROUP BY c.id                                      │
│     │                                                      │
│     ├─ Gasto diario para gráfico de línea:               │
│     │  SELECT DATE(expense_date) as date,                 │
│     │         SUM(amount) as total                        │
│     │  FROM expenses WHERE ...                            │
│     │  GROUP BY DATE(expense_date)                        │
│     │                                                      │
│     └─ Cuotas vencidas en período:                        │
│        SELECT i.*, e.description                          │
│        FROM installments i                                │
│        JOIN expenses e ON i.expense_id = e.id             │
│        WHERE i.is_paid = false                            │
│        AND i.due_date BETWEEN ? AND ?                     │
│              ↓                                              │
│     Construye respuesta consolidada:                      │
│     {                                                      │
│       summary: { total, count, avg },                     │
│       byCategory: [                                        │
│         { category, total, percentage, color },           │
│         ...                                                │
│       ],                                                   │
│       dailyTotals: [                                       │
│         { date, amount },                                  │
│         ...                                                │
│       ],                                                   │
│       pendingInstallments: [...]                          │
│     }                                                      │
│              ↓                                              │
│  C. RENDERIZAR GRÁFICOS                                   │
│     ──────────────────────                                │
│     Frontend recibe datos                                 │
│              ↓                                              │
│     Recharts dibuja:                                      │
│     ├─ LineChart: Gasto diario                            │
│     ├─ PieChart: Por categoría                            │
│     ├─ BarChart: Top categorías                           │
│     └─ Tabla: Detalles                                    │
│              ↓                                              │
│  D. EXPORTAR PDF (Opcional)                               │
│     ──────────────────────────                            │
│     Usuario click "Download PDF"                          │
│              ↓                                              │
│     GET /api/reports/download?month=2026-04               │
│              ↓                                              │
│     Backend genera PDF con pdfkit:                        │
│     ├─ Encabezado                                         │
│     ├─ Tablas con datos                                   │
│     ├─ Gráficos como imágenes                             │
│     └─ Pie de página                                      │
│              ↓                                              │
│     Browser descarga archivo PDF                          │
│              ↓                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Flujo Detallado de Autenticación

```
┌─────────────────────────────────────────────────────────────┐
│ 6. CICLO DE AUTENTICACIÓN COMPLETO                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  A. REGISTRO                                              │
│     ────────                                              │
│     Usuario ingresa: email, password, name                │
│              ↓                                              │
│     Validación frontend                                   │
│              ↓                                              │
│     POST /api/auth/register                               │
│     { email, password, name }                             │
│              ↓                                              │
│     Backend:                                              │
│     ├─ Valida schema                                      │
│     ├─ Verifica email no existe:                          │
│     │  SELECT * FROM users WHERE email = ?               │
│     ├─ Hash password: bcrypt.hash(password, 10)           │
│     ├─ INSERT INTO users (email, password_hash, name)     │
│     └─ jwt.sign({ userId, email })                        │
│              ↓                                              │
│     Response: { token, user }                             │
│              ↓                                              │
│     Frontend:                                             │
│     ├─ localStorage.setItem('token', token)               │
│     ├─ dispatch(setAuth({ token, user }))                │
│     └─ navigate('/dashboard')                             │
│              ↓                                              │
│  B. LOGIN                                                 │
│     ──────                                                │
│     Usuario ingresa: email, password                      │
│              ↓                                              │
│     POST /api/auth/login                                  │
│              ↓                                              │
│     Backend:                                              │
│     ├─ SELECT * FROM users WHERE email = ?               │
│     ├─ bcrypt.compare(inputPassword, storedHash)          │
│     ├─ Si válido: jwt.sign(payload)                       │
│     └─ Response: { token, user }                          │
│              ↓                                              │
│     Frontend guarda token en localStorage                 │
│              ↓                                              │
│  C. PETICIONES AUTENTICADAS                               │
│     ────────────────────────────                          │
│     Cada request incluye JWT:                             │
│     Header: Authorization: Bearer <token>                 │
│              ↓                                              │
│     Middleware auth.js:                                   │
│     ├─ Extrae token de header                             │
│     ├─ jwt.verify(token, SECRET)                          │
│     │  Si falla: throw new AppError('Invalid', 401)      │
│     ├─ Extrae: userId, email, is_admin                    │
│     └─ req.user = payload                                 │
│              ↓                                              │
│     Controller accede a req.user.id                       │
│              ↓                                              │
│  D. TOKEN EXPIRADO                                        │
│     ────────────────                                      │
│     Si jwt.verify falla por expiración:                   │
│              ↓                                              │
│     Frontend detiene (401 response)                       │
│              ↓                                              │
│     localStorage.removeItem('token')                      │
│              ↓                                              │
│     dispatch(clearAuth())                                 │
│              ↓                                              │
│     navigate('/login')                                    │
│              ↓                                              │
│  E. LOGOUT                                                │
│     ──────                                                │
│     Usuario click Logout                                  │
│              ↓                                              │
│     POST /api/auth/logout                                 │
│              ↓                                              │
│     Frontend:                                             │
│     ├─ localStorage.removeItem('token')                   │
│     ├─ dispatch(clearAuth())                              │
│     └─ navigate('/login')                                 │
│              ↓                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Flujo Detallado del Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ 7. CARGA Y ACTUALIZACIÓN DEL DASHBOARD                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. COMPONENTE MONTA (useEffect)                           │
│     ───────────────────────────────                        │
│     Dashboard.jsx se renderiza                            │
│              ↓                                              │
│     useEffect detecta cambio                              │
│              ↓                                              │
│     Dispara Promise.all([...]) con 4 requests:            │
│     ├─ analyticsService.getSummary()                      │
│     ├─ analyticsService.getByCategory()                   │
│     ├─ analyticsService.getCashVsCard()                   │
│     └─ installmentService.getPending()                    │
│              ↓                                              │
│  2. PROCESA RESPUESTAS                                     │
│     ──────────────────                                    │
│     dispatch(setSummary(data1))                           │
│     dispatch(setByCategory(data2))                        │
│     dispatch(setCashVsCard(data3))                        │
│     dispatch(setPending(data4))                           │
│              ↓                                              │
│  3. COMPONENTES RE-RENDERIZAN                              │
│     ──────────────────────────                            │
│     Cada componente subscrito a su slice:                 │
│     │                                                      │
│     ├─ <SummaryCards> muestra totales                     │
│     ├─ <PieChart> renderiza por categoría                 │
│     ├─ <BarChart> renderiza cash vs card                  │
│     └─ <PendingInstallments> tabla con alertas            │
│              ↓                                              │
│  4. ALERTS DE VENCIMIENTO                                 │
│     ──────────────────────                                │
│     Für cada cuota en pending:                            │
│     │                                                      │
│     const daysUntilDue = daysUntil(installment.due_date) │
│     │                                                      │
│     if (daysUntilDue <= 5) {                              │
│     │  badge = "alert"                                    │
│     │  color = "red"                                      │
│     }                                                      │
│     if (daysUntilDue <= 10) {                             │
│     │  badge = "warning"                                  │
│     │  color = "yellow"                                   │
│     }                                                      │
│              ↓                                              │
│  5. ACTUALIZACIÓN EN TIEMPO REAL                           │
│     ───────────────────────────                           │
│     Usuario hace cambios en otra tab:                     │
│     ├─ Crea gasto                                         │
│     ├─ Edita cuota                                        │
│     └─ Actualiza categoría                                │
│              ↓                                              │
│     Redux store actualizado globalmente                   │
│              ↓                                              │
│     Dashboard se actualiza automáticamente                │
│     (componentes suscritos)                               │
│              ↓                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Flujo de Sincronización de Datos

```
┌─────────────────────────────────────────────────────────────┐
│ 8. SINCRONIZACIÓN ENTRE COMPONENTES                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Escenario: Usuario crea gasto mientras ve dashboard      │
│                                                             │
│  ExpenseForm (modal)          Expenses (lista)  Dashboard  │
│       │                              │               │    │
│       ├─ submit form                 │               │    │
│       │                              │               │    │
│       ├─ POST /api/expenses          │               │    │
│       │                              │               │    │
│       ├─ dispatch(addExpense())      │               │    │
│       │     │                        │               │    │
│       │     └──> Redux store actualizado             │    │
│       │              │               │               │    │
│       │              ├─> Expenses re-renderiza ──────┐   │
│       │              │   (nuevo gasto en lista)      │   │
│       │              │                               │   │
│       │              └─> Dashboard observa cambio    │   │
│       │                  Redux actualiza summary     │   │
│       │                  Re-calcula totales          │   │
│       │                  Charts se redibujan         │   │
│       │                                              │   │
│       ├─ Toast: "Gasto creado"                      │   │
│       │                                              │   │
│       └─ Modal cierra                               │   │
│                                                      │   │
│                              Datos consistentes      │   │
│                              en toda la app ◄────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🛡️ Flujo de Validación de Seguridad

```
┌─────────────────────────────────────────────────────────────┐
│ 9. CAPAS DE VALIDACIÓN Y SEGURIDAD                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  USER INTENT                                              │
│       ↓                                                    │
│  FRONTEND VALIDATION (Zod)                                │
│  ├─ Tipos válidos? (amount es number)                     │
│  ├─ Rangos válidos? (num_installments 1-24)              │
│  ├─ Formatos válidos? (email valid)                       │
│  └─ Si falla: Muestra error, no envía                     │
│       ↓                                                    │
│  HTTP REQUEST (con JWT en header)                         │
│       ↓                                                    │
│  BACKEND - AUTH MIDDLEWARE                                │
│  ├─ Header Authorization exists?                          │
│  ├─ Token válido? (jwt.verify)                            │
│  ├─ Token expirado?                                       │
│  └─ Si falla: 401 Unauthorized                            │
│       ↓                                                    │
│  BACKEND - VALIDATION MIDDLEWARE (Joi)                    │
│  ├─ Tipos de datos correctos?                             │
│  ├─ Valores dentro de rangos?                             │
│  ├─ Campos requeridos presentes?                          │
│  └─ Si falla: 400 Bad Request                             │
│       ↓                                                    │
│  BACKEND - AUTHORIZATION CHECK                            │
│  ├─ user_id del token = resource.user_id?                │
│  ├─ Es admin para datos sensibles?                        │
│  └─ Si falla: 403 Forbidden                               │
│       ↓                                                    │
│  BACKEND - BUSINESS LOGIC VALIDATION                      │
│  ├─ Category pertenece al user?                           │
│  ├─ Amount > 0?                                           │
│  ├─ Datos relacionados existen?                           │
│  └─ Si falla: 400/404                                     │
│       ↓                                                    │
│  DATABASE CONSTRAINTS                                     │
│  ├─ Unique constraints                                    │
│  ├─ Foreign key constraints                               │
│  ├─ Data type constraints                                 │
│  └─ Si falla: Rollback transacción                        │
│       ↓                                                    │
│  SUCCESS                                                  │
│  Response: { success: true, data }                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📌 Puntos Clave de Integración

### 1. Redux Store es Single Source of Truth
```
Todas las vistas obtienen datos de Redux
Cambios locales dispatcher actualizan Redux
Cambios en servidor actualizan Redux
→ Consistencia garantizada
```

### 2. Middleware Auth es Obligatorio
```
Todos los endpoints protegidos requieren JWT
Validación en cada request
No puede pasar sin token válido
```

### 3. Validación en Múltiples Capas
```
Frontend: Feedback inmediato al usuario
Backend: Seguridad y validación real
BD: Constraints finales
→ Máxima robustez
```

### 4. Error Handling Centralizado
```
Frontend: Global error handler + toast
Backend: errorHandler middleware
Logging: Structured logs para debugging
→ Visibilidad completa
```

---

**Última actualización**: Abril 2026  
**Versión**: 1.0
