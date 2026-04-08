# Interacción Entre Componentes - App Control de Gastos

## 🔄 Flujos de Procesos Principales

### 1. Flujo de Autenticación (Login/Register)

#### A. Registro de Usuario Nuevo

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND - Página Register.jsx                              │
└─────────────────────────────────────────────────────────────┘
  │
  ├─ Usuario ingresa: email, password, name
  │
  ├─ Submit form
  │
  ├─ Validación local (Zod/React Hook Form)
  │
  └─> authService.register(credentials)
        │
        └─> HTTP POST /api/auth/register
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND - authController.register()                         │
└─────────────────────────────────────────────────────────────┘
  │
  ├─ Valida input (middleware validate.js)
  │
  ├─ Verifica email no existe: User.findOne({ email })
  │    │
  │    └──> BD: SELECT * FROM users WHERE email = ?
  │
  ├─ Hash password: bcrypt.hash(password, 10)
  │
  ├─ Crea usuario: User.create({...credenciales})
  │    │
  │    └──> BD: INSERT INTO users (email, password_hash, name)
  │
  └─> jwt.sign({ userId, email })
        │
        └──> Response: { token, user }
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND - Recibe respuesta                                 │
└─────────────────────────────────────────────────────────────┘
  │
  ├─ authService.register retorna { token, user }
  │
  ├─ dispatch(setAuth({ token, user })) [Redux]
  │
  ├─ localStorage.setItem('token', token)
  │
  └─> Redirige a Dashboard

```

#### B. Login de Usuario Existente

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND - Login.jsx                                        │
└─────────────────────────────────────────────────────────────┘
  │
  ├─ Usuario ingresa: email, password
  │
  └─> authService.login(email, password)
        │
        └─> HTTP POST /api/auth/login
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND - authController.login()                            │
└─────────────────────────────────────────────────────────────┘
  │
  ├─ Busca usuario: User.findOne({ email })
  │    │
  │    └──> BD: SELECT * FROM users WHERE email = ?
  │
  ├─ Verifica password: bcrypt.compare(input, hash)
  │
  ├─ Si válido: jwt.sign({ userId, email })
  │
  └─> Response: { token, user }
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND - Actualiza estado                                 │
└─────────────────────────────────────────────────────────────┘
  │
  ├─ dispatch(setAuth({ token, user }))
  │
  ├─ localStorage.setItem('token', token)
  │
  └─> Acceso a Dashboard autorizado
```

---

### 2. Flujo de Crear Gasto (Expense)

```
┌────────────────────────────────────────────┐
│ FRONTEND - Expenses Page / ExpenseForm     │
└────────────────────────────────────────────┘
  │
  ├─ Usuario completa formulario:
  │   - amount (decimal)
  │   - description (text)
  │   - category (select)
  │   - payment_method (cash/card)
  │   - expense_date (date)
  │   - is_installment (checkbox)
  │   - if installment: num_installments (1-24)
  │
  ├─ Validación local (React Hook Form + Zod)
  │
  ├─ submit
  │
  └─> expenseService.create(expense)
        │
        └─> HTTP POST /api/expenses
            headers: { Authorization: Bearer <token> }
                │
                ▼
┌────────────────────────────────────────────┐
│ BACKEND - Middleware                       │
└────────────────────────────────────────────┘
  │
  ├─ auth.js: Valida JWT
  │    └─> Extrae userId del token
  │
  └─> validate.js: Valida schema de expense
       └─> Verifica tipos, rangos, formatos
                │
                ▼
┌────────────────────────────────────────────┐
│ BACKEND - expenseController.create()       │
└────────────────────────────────────────────┘
  │
  ├─ Verifica que category pertenece al user
  │    │
  │    └──> BD: SELECT * FROM categories WHERE id = ? AND user_id = ?
  │
  ├─ Crea expense: Expense.create({...data, user_id})
  │    │
  │    └──> BD: INSERT INTO expenses (...)
  │         Retorna: { id, amount, ... }
  │
  ├─ Si es cuota (is_installment = true):
  │    │
  │    ├─ Calcula monto por cuota: amount / num_installments
  │    │
  │    ├─ Genera fecha de vencimientos (c/mes)
  │    │
  │    └─ Installment.bulkCreate([...cuotas])
  │         │
  │         └──> BD: INSERT INTO installments (...) x num_installments
  │
  └─> Response: { success: true, expense }
        │
        ▼
┌────────────────────────────────────────────┐
│ FRONTEND - Recibe respuesta                │
└────────────────────────────────────────────┘
  │
  ├─ dispatch(addExpense(expense)) [Redux]
  │    └─> Agrega a expensesSlice.items
  │
  ├─ Toast notificación "Gasto creado"
  │
  ├─ Limpia formulario
  │
  └─> Redirecciona a Expenses list

┌────────────────────────────────────────────┐
│ FRONTEND - Expenses.jsx se actualiza       │
└────────────────────────────────────────────┘
  │
  ├─ Subscrito a Redux expensesSlice
  │
  ├─ Re-renderiza lista
  │
  └─> Nuevo gasto visible en pantalla
```

---

### 3. Flujo de Ver Dashboard y Analytics

```
┌────────────────────────────────────────────┐
│ FRONTEND - Dashboard.jsx                   │
└────────────────────────────────────────────┘
  │
  ├─ useEffect en mount
  │
  ├─ Dispara múltiples requests en paralelo:
  │
  ├─ 1. analyticsService.getSummary(month)
  │ │   └─> GET /api/analytics/summary?month=2026-04
  │ │       Datos: total_spent, avg_per_category, ...
  │ │
  │ ├─ 2. analyticsService.getByCategory(month)
  │ │   └─> GET /api/analytics/by-category?month=2026-04
  │ │       Datos: [{ category, amount, percentage }, ...]
  │ │
  │ ├─ 3. analyticsService.getCashVsCard(month)
  │ │   └─> GET /api/analytics/cash-vs-card?month=2026-04
  │ │       Datos: { cash: amount, card: amount }
  │ │
  │ └─ 4. installmentService.getPending()
  │     └─> GET /api/installments?status=pending
  │         Datos: [{ id, amount, due_date }, ...]
  │
  └─ All promises: Promise.all([...])
        │
        ▼
┌────────────────────────────────────────────┐
│ BACKEND - analyticsController              │
└────────────────────────────────────────────┘
  │
  ├─ Validar JWT y userId
  │
  ├─ getSummary:
  │    ├─> BD: SELECT SUM(amount) FROM expenses
  │    │        WHERE user_id = ? AND DATE_FORMAT(expense_date, '%Y-%m') = ?
  │    │
  │    └─> Retorna totales
  │
  ├─ getByCategory:
  │    ├─> BD: SELECT c.name, SUM(e.amount) as total
  │    │        FROM categories c
  │    │        LEFT JOIN expenses e ON c.id = e.category_id
  │    │        GROUP BY c.id
  │    │
  │    └─> Retorna array por categoría
  │
  └─ getCashVsCard:
       ├─> BD: SELECT payment_method, SUM(amount)
       │        FROM expenses
       │        GROUP BY payment_method
       │
       └─> Retorna { cash, card }

        │
        ▼
┌────────────────────────────────────────────┐
│ FRONTEND - Actualiza estado                │
└────────────────────────────────────────────┘
  │
  ├─ dispatch(setAnalytics({ summary, byCategory, ... }))
  │
  ├─ dispatch(setPendingInstallments([...]))
  │
  ├─ setIsLoading(false)
  │
  └─> Dashboard re-renderiza con gráficos
       │
       └─> Recharts dibuja:
           - Pie chart (por categoría)
           - Bar chart (efectivo vs tarjeta)
           - Tabla con cuotas pendientes
```

---

### 4. Flujo de Reportes Mensuales

```
┌────────────────────────────────────────────┐
│ FRONTEND - ReportMonthlyGrouping.jsx       │
└────────────────────────────────────────────┘
  │
  ├─ Usuario selecciona: month (date picker)
  │
  ├─ Click "Generar Reporte"
  │
  └─> reportService.getMonthlyReport(month)
        │
        └─> GET /api/reports/monthly?month=2026-04
                │
                ▼
┌────────────────────────────────────────────┐
│ BACKEND - reportController.getMonthly()    │
└────────────────────────────────────────────┘
  │
  ├─ Query con vistas de BD para datos:
  │
  ├─ Obtiene resumen: SUM(amount), COUNT(expenses), AVG(amount)
  │
  ├─ Agrupa por categoría
  │    └─> SELECT category, SUM(amount) FROM v_spending_by_category
  │
  ├─ Obtiene cuotas del mes
  │
  └─> Response: {
       summary: { total, count, avg },
       byCategory: [{ category, amount, % }, ...],
       expenses: [{ date, category, amount, method }, ...],
       installments: [{ expense, amount, due_date }, ...]
      }
        │
        ▼
┌────────────────────────────────────────────┐
│ FRONTEND - Recibe datos complejos          │
└────────────────────────────────────────────┘
  │
  ├─ dispatch(setReportData(data))
  │
  ├─ Renderiza componentes:
  │
  ├─ FilterPanel: Usuario puede filtrar más
  │
  ├─ MonthlyChart: Gráficos principales
  │    ├─ Line chart: evolución diaria
  │    ├─ Bar chart: por categoría
  │    └─ Pie chart: distribución
  │
  ├─ ExpenseList: Tabla de gastos
  │
  └─ ExportButton: "Descargar PDF"
       │
       └─> reportService.downloadPDF()
           └─> GET /api/reports/download?month=...
               (Backend genera PDF con pdfkit)
               └─> Browser descarga archivo
```

---

### 5. Flujo de Editar Gasto

```
┌────────────────────────────────────────────┐
│ FRONTEND - Expenses list                   │
└────────────────────────────────────────────┘
  │
  ├─ Usuario hace click en "Edit" button
  │
  └─> navigate to ExpenseForm con expenseId
        │
        ▼
┌────────────────────────────────────────────┐
│ FRONTEND - ExpenseForm.jsx (edit mode)     │
└────────────────────────────────────────────┘
  │
  ├─ useEffect: expenseService.getById(id)
  │    └─> GET /api/expenses/:id
  │        │
  │        ▼ Datos previos cargan en form
  │
  ├─ Usuario modifica campos
  │
  ├─ Submit
  │
  └─> expenseService.update(id, newData)
        │
        └─> HTTP PUT /api/expenses/:id
            headers: { Authorization: Bearer <token> }
                │
                ▼
┌────────────────────────────────────────────┐
│ BACKEND - expenseController.update()       │
└────────────────────────────────────────────┘
  │
  ├─ Valida JWT (usuario propietario)
  │
  ├─ Busca expense: Expense.findByPk(id)
  │
  ├─ Verifica ownership: expense.user_id === userId
  │
  ├─ Actualiza: expense.update(newData)
  │    └─> BD: UPDATE expenses SET ... WHERE id = ?
  │
  ├─ Si cambió is_installment o num_installments:
  │    ├─ Elimina cuotas antiguas
  │    └─ Genera cuotas nuevas
  │
  └─> Response: { expense }
        │
        ▼
┌────────────────────────────────────────────┐
│ FRONTEND - Actualiza Redux                 │
└────────────────────────────────────────────┘
  │
  ├─ dispatch(updateExpense(expense))
  │
  ├─ Expenses.jsx re-renderiza
  │
  └─> Lista refleja cambios
```

---

### 6. Flujo de Pasar Cuota a Pagada

```
┌────────────────────────────────────────────┐
│ FRONTEND - Installments.jsx                │
└────────────────────────────────────────────┘
  │
  ├─ Tabla de cuotas pendientes
  │
  ├─ Usuario click "Mark as Paid"
  │
  └─> installmentService.markAsPaid(installmentId)
        │
        └─> HTTP PUT /api/installments/:id
            { is_paid: true }
                │
                ▼
┌────────────────────────────────────────────┐
│ BACKEND - installmentController.update()   │
└────────────────────────────────────────────┘
  │
  ├─ Valida que installment pertenece al user
  │    (verificando relación expense → user)
  │
  ├─ Actualiza: Installment.update({
  │    is_paid: true,
  │    paid_date: new Date()
  │  })
  │
  └─> Response: { success: true }
        │
        ▼
┌────────────────────────────────────────────┐
│ FRONTEND - Actualiza store                 │
└────────────────────────────────────────────┘
  │
  ├─ dispatch(updateInstallment(installmentId))
  │
  ├─ Remueve de lista de pendientes
  │
  └─> Toast "Cuota pagada"
```

---

## 🔐 Flujo de Autorización y Seguridad

```
Cada request a endpoint protegido:

1. FRONTEND:
   ├─ Obtiene token: localStorage.getItem('token')
   └─ Incluye en header: Authorization: Bearer <token>

2. BACKEND - auth middleware:
   ├─ Lee header Authorization
   ├─ Valida formato Bearer <token>
   ├─ jwt.verify(token, SECRET_KEY)
   │  └─ Si expira: rechaza con 401
   ├─ Extrae userId, email, is_admin
   └─ req.user = { userId, email, is_admin }

3. BACKEND - Controller:
   ├─ Accede a req.user.userId
   ├─ Verifica ownership (ej: expense.user_id === req.user.userId)
   │  └─ Si no pertenece: 403 Forbidden
   ├─ Ejecuta lógica
   └─ Retorna Response

4. FRONTEND - Response handler:
   ├─ Si status 401: Limpiar token, redirige a login
   ├─ Si status 403: Mostrar "Sin permiso"
   ├─ Si 4xx/5xx: Mostrar error a usuario
   └─ Si 200: Procesa datos normalmente
```

---

## 📊 Diagrama General de Interacción

```
┌─────────────────────────────────────┐
│      USUARIO (Navegador)            │
└─────────────────┬───────────────────┘
                  │
        ┌─────────▼──────────┐
        │   FRONTEND (React) │
        ├────────────────────┤
        │ Pages              │
        │ Components         │
        │ Services (API)     │
        │ Redux Store        │
        └─────────┬──────────┘
                  │
        HTTP/JSON │ JWT en headers
                  │
        ┌─────────▼──────────┐
        │  BACKEND (Express) │
        ├────────────────────┤
        │ Routes             │
        │ Middleware (Auth)  │
        │ Controllers        │
        │ Models (Sequelize) │
        └─────────┬──────────┘
                  │
        SQL       │
                  │
        ┌─────────▼──────────┐
        │  MySQL Database    │
        ├────────────────────┤
        │ Tables             │
        │ Indexes            │
        │ Views              │
        │ Triggers           │
        └────────────────────┘
```

---

**Última actualización**: Abril 2026  
**Versión**: 1.0
