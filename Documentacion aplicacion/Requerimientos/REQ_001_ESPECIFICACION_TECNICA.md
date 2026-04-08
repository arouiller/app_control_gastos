# REQ-001: Especificación Técnica - Reporte de Agrupamiento Mensual

**ID Requerimiento**: REQ-001  
**Versión Técnica**: 1.0  
**Fecha**: 2026-04-08  

---

## 1. ARQUITECTURA GENERAL

### 1.1 Componentes Principales

```
Frontend (React)
├── Página: ReportMonthlyGrouping.jsx
├── Componentes:
│   ├── FilterPanel.jsx           (Filtros de fecha y categorías)
│   ├── MonthlyChart.jsx          (Gráfico de barras agrupadas)
│   ├── ExpenseDetailModal.jsx    (Modal con listado de gastos)
│   └── ExpenseList.jsx           (Tabla de gastos dentro del modal)
└── Hooks: useMonthlyReport.js    (Lógica de datos y estado)

Backend (Node.js/Express)
├── Route: /api/reports/monthly-grouping
├── Controller: reportController.monthlyGrouping()
├── Service: reportService.getMonthlyGroupedExpenses()
├── Queries: optimizadas con índices
└── Validations: schema de filtros

Database (MySQL)
└── Queries complejas con GROUP BY y JOINs
```

---

## 2. ESPECIFICACIONES DE FRONTEND

### 2.1 Página Principal: `ReportMonthlyGrouping.jsx`

```javascript
// Path: frontend/src/pages/reports/ReportMonthlyGrouping.jsx

Componente raíz que:
- Importa y renderiza FilterPanel y MonthlyChart
- Maneja el estado global de filtros (Redux o Context)
- Llama al hook useMonthlyReport()
- Muestra indicadores de carga
- Gestiona errores de carga de datos
```

**Props/Estado esperado**:
```javascript
{
  filters: {
    dateFrom: Date,        // Fecha de inicio
    dateTo: Date,          // Fecha de fin
    categoryIds: [1,2,3]   // IDs de categorías seleccionadas
  },
  data: {
    months: ['2026-01', '2026-02', ...],
    categories: [{id, name, color, data: [amount, ...]}],
    totals: {
      byMonth: {
        '2026-01': 1500.00,
        '2026-02': 2100.00
      },
      byCategory: {
        '1': 3200.00,
        '2': 1900.00
      }
    }
  },
  loading: boolean,
  error: string | null
}
```

### 2.2 Componente: `FilterPanel.jsx`

```javascript
// Path: frontend/src/components/reports/FilterPanel.jsx

Funcionalidad:
- Inputs de fecha (desde/hasta)
- Checkboxes para categorías
- Botones de "Seleccionar todas" / "Deseleccionar todas"
- Actualización en tiempo real de filtros (onChange)

Props:
{
  filters: { dateFrom, dateTo, categoryIds },
  categories: [{ id, name, color }],
  onFilterChange: (newFilters) => {}
}

Validaciones:
- dateFrom no puede ser mayor que dateTo
- Al menos una categoría debe estar seleccionada
- Rango máximo: 5 años
```

### 2.3 Componente: `MonthlyChart.jsx`

```javascript
// Path: frontend/src/components/reports/MonthlyChart.jsx

Librería recomendada: Recharts (más moderna que Chart.js)

Estructura del gráfico:
- Tipo: Composite BarChart
- Eje X: Meses (formato: "Ene 2026")
- Eje Y: Monto ($)
- Series: Una por categoría con su color
- Tooltip: Muestra totales y detalles al pasar mouse
- Leyenda: Interactiva (clic para ocultar/mostrar series)

Props:
{
  data: [
    {
      month: '2026-01',
      monthLabel: 'Ene 2026',
      total: 1500,
      category_1: 500,
      category_2: 800,
      category_3: 200
    },
    ...
  ],
  categories: [{ id, name, color }],
  onBarClick: (month, categoryId) => {}
}

Evento de Click:
- Al hacer clic en una barra agrupada
- Extrae mes y categoría
- Dispara modal con detalles de gastos
```

### 2.4 Componente: `ExpenseDetailModal.jsx`

```javascript
// Path: frontend/src/components/reports/ExpenseDetailModal.jsx

Funcionalidad:
- Modal (usando Material-UI, Chakra UI o componente personalizado)
- Muestra total de categoría del mes seleccionado
- Contiene ExpenseList (tabla de gastos)
- Botón cerrar (X) y opción de cerrar al hacer clic afuera

Props:
{
  isOpen: boolean,
  month: '2026-01',
  monthLabel: 'Ene 2026',
  category: { id, name, color },
  expenses: [
    {
      id, description, amount, date, 
      paymentMethod, installmentInfo
    }
  ],
  onClose: () => {},
  onExpenseEdit: (id) => {},
  onExpenseDelete: (id) => {}
}

Estilos:
- Modal centrado en pantalla
- Ancho: 90% en móvil, 600px en desktop
- Máximo height: 80vh con scroll en tabla
```

### 2.5 Componente: `ExpenseList.jsx`

```javascript
// Path: frontend/src/components/reports/ExpenseList.jsx

Tabla con columnas:
| Descripción    | Monto    | Fecha      | Método    | Acciones |
|----------------|----------|------------|-----------|----------|
| Supermercado   | $200.00  | 08/02/2026 | Tarjeta   | E D      |
| Panadería      | $150.00  | 15/02/2026 | Efectivo  | E D      |

Funcionalidad:
- Sorteo por monto o fecha
- Editar gasto (modal de edición o redireccionar)
- Eliminar gasto (confirmación)
- Actualización automática del gráfico tras cambios

Props:
{
  expenses: Array,
  onEdit: (expenseId) => {},
  onDelete: (expenseId) => {}
}
```

### 2.6 Hook: `useMonthlyReport.js`

```javascript
// Path: frontend/src/hooks/useMonthlyReport.js

Hook personalizado que:
- Gestiona estado local del componente
- Realiza llamadas API al cambiar filtros
- Transforma datos de API al formato del gráfico
- Maneja loading y errores
- Debounce en cambios de filtro (300ms)

Funciones principales:
const {
  data,
  loading,
  error,
  selectedMonth,
  selectedCategory,
  selectedExpenses,
  openDetailModal,
  closeDetailModal,
  refetchData
} = useMonthlyReport(initialFilters);

Flujo:
1. useEffect escucha cambios en filtros
2. Debounce la llamada API
3. Transforma respuesta al formato esperado
4. Actualiza estado
5. Si hay cambios en gastos, refetch automático
```

### 2.7 Servicio API: `reportService.js`

```javascript
// Path: frontend/src/services/reportService.js

Función: getMonthlyGroupedExpenses(filters)
- URL: GET /api/reports/monthly-grouping
- Query params: ?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&categories=1,2,3
- Transformación de respuesta al formato del gráfico
- Manejo de errores y validaciones

Uso:
const response = await reportService.getMonthlyGroupedExpenses({
  dateFrom: '2026-01-01',
  dateTo: '2026-12-31',
  categoryIds: [1, 2, 3]
});
```

---

## 3. ESPECIFICACIONES DE BACKEND

### 3.1 Endpoint: `GET /api/reports/monthly-grouping`

```
Ruta: /api/reports/monthly-grouping
Método: GET
Autenticación: JWT requerido
Query Parameters:
  - dateFrom (YYYY-MM-DD): Fecha de inicio [requerido]
  - dateTo (YYYY-MM-DD): Fecha de fin [requerido]
  - categories (comma-separated IDs): Categorías [opcional, default: todas]

Response (200 OK):
{
  "success": true,
  "data": {
    "months": ["2026-01", "2026-02", "2026-03"],
    "categories": [
      {
        "id": 1,
        "name": "Alimentación",
        "color": "#FF5733",
        "data": [500, 600, 550]  // Monto por mes
      },
      {
        "id": 2,
        "name": "Transporte",
        "color": "#33FF57",
        "data": [200, 250, 300]
      }
    ],
    "monthlyTotals": {
      "2026-01": 700,
      "2026-02": 850,
      "2026-03": 850
    },
    "categoryTotals": {
      "1": 1650,  // ID categoría: total
      "2": 750
    }
  }
}

Error (400 Bad Request):
{
  "success": false,
  "message": "Rango de fechas inválido",
  "errors": {
    "dateFrom": "Debe ser anterior a dateTo",
    "dateTo": "No puede ser mayor a hoy"
  }
}
```

### 3.2 Controlador: `reportController.js`

```javascript
// Path: backend/src/controllers/reportController.js

exports.monthlyGrouping = async (req, res) => {
  try {
    // 1. Validar parámetros
    const { dateFrom, dateTo, categories } = req.query;
    const userId = req.user.id;
    
    // 2. Validar rango de fechas
    if (!dateFrom || !dateTo) {
      return res.status(400).json({ error: 'dateFrom y dateTo son requeridos' });
    }
    
    // 3. Llamar al servicio
    const data = await reportService.getMonthlyGroupedExpenses({
      userId,
      dateFrom,
      dateTo,
      categoryIds: categories ? categories.split(',').map(Number) : null
    });
    
    // 4. Retornar respuesta
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

### 3.3 Servicio: `reportService.js`

```javascript
// Path: backend/src/services/reportService.js

exports.getMonthlyGroupedExpenses = async (options) => {
  const { userId, dateFrom, dateTo, categoryIds } = options;
  
  // Query SQL (pseudocódigo)
  const query = `
    SELECT 
      DATE_FORMAT(e.date, '%Y-%m') as month,
      c.id as category_id,
      c.name,
      c.color,
      SUM(e.amount) as total
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    WHERE e.user_id = ?
      AND DATE(e.date) BETWEEN ? AND ?
      AND c.id IN (...)  -- categorías seleccionadas
    GROUP BY month, c.id
    ORDER BY month ASC, c.id ASC
  `;
  
  // Ejecutar query
  const rawData = await Expense.sequelize.query(query);
  
  // Transformar datos al formato esperado
  const transformed = transformDataForChart(rawData);
  
  return transformed;
};

// Función auxiliar de transformación
const transformDataForChart = (rawData) => {
  // Agrupar por meses
  // Pivot categorías a columnas
  // Calcular totales
  // Retornar formato esperado por frontend
};
```

### 3.4 Query SQL Optimizada

```sql
-- Query principal con mejores prácticas

SELECT 
  DATE_FORMAT(e.date, '%Y-%m') AS month_key,
  DATE_FORMAT(e.date, '%b %Y') AS month_label,
  c.id AS category_id,
  c.name AS category_name,
  c.color AS category_color,
  SUM(e.amount) AS monthly_total,
  COUNT(e.id) AS expense_count
FROM expenses e
INNER JOIN categories c ON e.category_id = c.id
WHERE 
  e.user_id = :userId
  AND DATE(e.date) BETWEEN :dateFrom AND :dateTo
  AND (
    :categoryIds IS NULL 
    OR c.id IN (:categoryIds)
  )
  AND e.deleted_at IS NULL  -- Soft delete support
GROUP BY 
  DATE_FORMAT(e.date, '%Y-%m'),
  c.id,
  c.name,
  c.color
ORDER BY 
  month_key ASC,
  c.id ASC;

-- Índices recomendados
CREATE INDEX idx_expenses_user_date ON expenses(user_id, date);
CREATE INDEX idx_expenses_category_date ON expenses(category_id, date);
CREATE INDEX idx_expenses_user_category_date ON expenses(user_id, category_id, date);
```

### 3.5 Endpoint para Listado de Gastos: `GET /api/reports/monthly-grouping/details`

```
Ruta: /api/reports/monthly-grouping/details
Método: GET
Autenticación: JWT requerido
Query Parameters:
  - month (YYYY-MM): Mes requerido
  - categoryId (number): Categoría requerida
  - page (number): Paginación [default: 1]
  - limit (number): Registros por página [default: 10]

Response (200 OK):
{
  "success": true,
  "data": {
    "month": "2026-01",
    "category": { "id": 1, "name": "Alimentación", "color": "#FF5733" },
    "total": 650.00,
    "expenses": [
      {
        "id": 123,
        "description": "Supermercado XYZ",
        "amount": 200.00,
        "date": "2026-01-08",
        "paymentMethod": "credit_card",
        "isInstallment": false,
        "createdAt": "2026-01-08T14:30:00Z"
      },
      ...
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 35
    }
  }
}
```

### 3.6 Rutas en Express

```javascript
// Path: backend/src/routes/reports.js

router.get('/monthly-grouping', 
  authenticateToken,
  validateQuery(monthlyGroupingSchema),
  reportController.monthlyGrouping
);

router.get('/monthly-grouping/details',
  authenticateToken,
  validateQuery(monthlyGroupingDetailsSchema),
  reportController.monthlyGroupingDetails
);

router.post('/monthly-grouping/:expenseId/delete',
  authenticateToken,
  reportController.deleteExpenseFromReport
);
```

---

## 4. ESPECIFICACIONES DE BASE DE DATOS

### 4.1 Cambios/Verifi​caciones en Esquema

**Tablas existentes utilizadas**:
- `expenses`: id, user_id, category_id, amount, date, payment_method, created_at, deleted_at
- `categories`: id, user_id, name, color, created_at, updated_at
- `users`: id

**No se requieren nuevas tablas**

**Índices necesarios**:
```sql
-- Si no existen
ALTER TABLE expenses 
ADD INDEX idx_user_date (user_id, date),
ADD INDEX idx_category_date (category_id, date),
ADD INDEX idx_user_category_date (user_id, category_id, date);

ALTER TABLE categories
ADD INDEX idx_user_id (user_id);
```

### 4.2 Consideraciones de Performance

- Query debe optimizarse con índices compuestos
- Limitar el rango de fechas a máximo 5 años
- Considerar caché de resultados (Redis) para reportes frecuentes
- Para usuarios con >10k gastos, implementar paginación en detalles

---

## 5. FLUJO DE DATOS

```
Usuario abre ReportMonthlyGrouping.jsx
    ↓
useMonthlyReport hook inicializa con últimos 12 meses
    ↓
GET /api/reports/monthly-grouping (con filtros)
    ↓
Backend: reportController.monthlyGrouping()
    ↓
reportService.getMonthlyGroupedExpenses() 
    ↓
Query SQL agrupada por mes y categoría
    ↓
Transformación de datos al formato Recharts
    ↓
Response JSON a frontend
    ↓
MonthlyChart renderiza gráfico de barras
    ↓
Usuario interactúa: cambia filtros o hace clic en barra
    ↓
Si cambian filtros: debounce (300ms) → nueva API call
Si hace clic en barra: 
    ↓
ExpenseDetailModal.jsx se abre
    ↓
GET /api/reports/monthly-grouping/details
    ↓
ExpenseList renderiza tabla de gastos
    ↓
Usuario puede editar o eliminar gastos
    ↓
Si elimina: DELETE /api/expenses/:id
    ↓
Refetch de datos y actualización del gráfico
```

---

## 6. VALIDACIONES Y SEGURIDAD

### 6.1 Validaciones de Entrada (Frontend)

```javascript
const monthlyGroupingSchema = {
  dateFrom: {
    type: 'date',
    required: true,
    min: '1900-01-01',
    max: 'today'
  },
  dateTo: {
    type: 'date',
    required: true,
    min: 'dateFrom',
    max: 'today'
  },
  categories: {
    type: 'array',
    items: { type: 'number', min: 1 },
    optional: true
  }
};
```

### 6.2 Validaciones de Entrada (Backend)

```javascript
const monthlyGroupingSchema = Joi.object({
  dateFrom: Joi.date().required().max('now'),
  dateTo: Joi.date().required().min(Joi.ref('dateFrom')).max('now'),
  categories: Joi.string()
    .pattern(/^\d+(,\d+)*$/)
    .optional()
});

// Limitar rango máximo
if (dateTo - dateFrom > 5 * 365 * 24 * 60 * 60 * 1000) {
  throw new Error('Rango máximo: 5 años');
}
```

### 6.3 Control de Acceso

- Verificar que userId del token pertenezca al usuario autenticado
- Verificar que categorías solicitadas pertenezcan al usuario
- No exponer datos de otros usuarios
- Auditar eliminaciones de gastos (soft delete)

---

## 7. CONSIDERACIONES DE PERFORMANCE

### 7.1 Caché

```javascript
// Pseudocódigo con Redis
const cacheKey = `monthly_report:${userId}:${dateFrom}:${dateTo}:${categoryIds}`;
const cachedData = await redis.get(cacheKey);

if (cachedData) {
  return JSON.parse(cachedData);
}

// Si no está en caché, obtener de BD
const data = await fetchFromDatabase(...);

// Guardar en caché por 1 hora
await redis.setex(cacheKey, 3600, JSON.stringify(data));

return data;
```

### 7.2 Paginación de Detalles

El endpoint `/monthly-grouping/details` debe paginar cuando hay >50 gastos en una categoría-mes:

```javascript
const ITEMS_PER_PAGE = 10;
const page = req.query.page || 1;
const offset = (page - 1) * ITEMS_PER_PAGE;

// SQL LIMIT y OFFSET
```

### 7.3 Limites de Datos

- Máximo 5 años de datos por solicitud
- Máximo 50 categorías por usuario
- Máximo 1000 gastos en detalle modal (con paginación)

---

## 8. TESTING

### 8.1 Tests Unitarios (Backend)

```javascript
describe('reportService.getMonthlyGroupedExpenses', () => {
  test('debe retornar datos agrupados por mes y categoría', async () => { ... });
  test('debe filtrar por rango de fechas correctamente', async () => { ... });
  test('debe retornar solo categorías seleccionadas', async () => { ... });
  test('debe manejar usuarios sin gastos', async () => { ... });
  test('debe performar bien con 10k gastos', async () => { ... });
});
```

### 8.2 Tests de Integración (Backend)

```javascript
describe('GET /api/reports/monthly-grouping', () => {
  test('debe retornar 200 con datos válidos', async () => { ... });
  test('debe retornar 400 con fechas inválidas', async () => { ... });
  test('debe retornar 401 sin autenticación', async () => { ... });
  test('debe filtrar datos por usuario autenticado', async () => { ... });
});
```

### 8.3 Tests de Componentes (Frontend - Vitest + React Testing Library)

```javascript
describe('MonthlyChart', () => {
  test('debe renderizar gráfico con datos', () => { ... });
  test('debe disparar onBarClick al hacer clic', () => { ... });
  test('debe mostrar tooltip al pasar mouse', () => { ... });
});

describe('FilterPanel', () => {
  test('debe actualizar filtros al cambiar fecha', () => { ... });
  test('debe permitir seleccionar/deseleccionar categorías', () => { ... });
});
```

---

## 9. CONFIGURACIÓN E INSTALACIÓN

### 9.1 Dependencias Nuevas (si aplica)

**Frontend**:
```json
{
  "recharts": "^2.12.0",
  "date-fns": "^3.0.0"
}
```

**Backend**:
- Ninguna nueva (usa las existentes)

### 9.2 Variables de Entorno

```
# .env (no se requieren nuevas)
```

### 9.3 Migración de Base de Datos

No se requieren migraciones, solo verificar índices:

```bash
# Command a ejecutar después del deploy
npm run db:verify-indexes

# Archivo: migrations/verify_report_indexes.js
```

---

## 10. MONITOREO Y LOGGING

### 10.1 Logs de Backend

```javascript
// Loguear llamadas al endpoint
logger.info('Monthly report requested', {
  userId: req.user.id,
  dateFrom,
  dateTo,
  categoryCount: categories?.length || 'all'
});

// Loguear performance
const startTime = Date.now();
const data = await reportService.getMonthlyGroupedExpenses(...);
const duration = Date.now() - startTime;
logger.info('Monthly report generated', { duration, userId });
```

### 10.2 Métricas

- Tiempo de respuesta del endpoint (target: <1s)
- Número de gastos procesados
- Caché hit/miss ratio
- Errores de validación

---

## 11. ROADMAP DE IMPLEMENTACIÓN

### Fase 1: Backend (Día 1-2)
- [ ] Crear endpoint `/api/reports/monthly-grouping`
- [ ] Implementar lógica de grouping en base de datos
- [ ] Agregar índices necesarios
- [ ] Escribir tests

### Fase 2: Frontend Gráfico (Día 3)
- [ ] Crear componentes React (FilterPanel, MonthlyChart)
- [ ] Integrar Recharts
- [ ] Implementar hook useMonthlyReport
- [ ] Tests de componentes

### Fase 3: Modal de Detalles (Día 4)
- [ ] Endpoint `/api/reports/monthly-grouping/details`
- [ ] Componentes ExpenseDetailModal y ExpenseList
- [ ] Funcionalidad de editar/eliminar desde modal
- [ ] Tests

### Fase 4: Pulida y Testing (Día 5)
- [ ] Tests de integración end-to-end
- [ ] Performance testing
- [ ] Optimizaciones
- [ ] Documentación

---

## 12. REFERENCIAS Y DEPENDENCIAS

- **Librería Gráficos**: [Recharts Docs](https://recharts.org/)
- **Formato Fechas**: [date-fns Docs](https://date-fns.org/)
- **Validación Backend**: [Joi Docs](https://joi.dev/)
- **Testing**: [Vitest](https://vitest.dev/), [React Testing Library](https://testing-library.com/react)

