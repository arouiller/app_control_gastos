# Carpeta de Requerimientos

Esta carpeta contiene las especificaciones detalladas de los requerimientos de la aplicación de control de gastos.

## Requerimientos Actuales

### REQ-001: Reporte de Agrupamiento Mensual

**Estado**: En Diseño  
**Prioridad**: Alta  
**Estimado**: 5 días de desarrollo

Un reporte visual que agrupa los gastos mensuales por categoría, permitiendo filtros de fecha y categoría, con capacidad de inspeccionar los gastos individuales.

**Archivos relacionados**:
- [`REQ_001_REPORTE_AGRUPAMIENTO_MENSUAL.md`](REQ_001_REPORTE_AGRUPAMIENTO_MENSUAL.md) - Especificación Funcional
- [`REQ_001_ESPECIFICACION_TECNICA.md`](REQ_001_ESPECIFICACION_TECNICA.md) - Especificación Técnica

**Características principales**:
- ✅ Gráfico de barras agrupadas por mes y categoría
- ✅ Filtros por rango de fechas (desde/hasta)
- ✅ Filtro por categorías (selección múltiple)
- ✅ Modal con listado de gastos al hacer clic en una categoría-mes
- ✅ Capacidad de editar/eliminar gastos desde el modal
- ✅ Actualización automática del reporte al cambiar filtros

**Componentes necesarios**:
```
Frontend:
  - ReportMonthlyGrouping.jsx (página)
  - FilterPanel.jsx
  - MonthlyChart.jsx
  - ExpenseDetailModal.jsx
  - ExpenseList.jsx
  - useMonthlyReport.js (hook)

Backend:
  - GET /api/reports/monthly-grouping
  - GET /api/reports/monthly-grouping/details
  - reportController.monthlyGrouping()
  - reportService.getMonthlyGroupedExpenses()
```

---

## Estructura de Documentación

Cada requerimiento debe incluir:

1. **Especificación Funcional** (`REQ_XXX_REQUERIMIENTO_NOMBRE.md`)
   - Descripción del requerimiento
   - Requerimientos funcionales (RF-XXX)
   - Requerimientos no funcionales (RNF-XXX)
   - Casos de uso
   - Restricciones y consideraciones
   - Criterios de aceptación
   - Mockups/referencias visuales

2. **Especificación Técnica** (`REQ_XXX_ESPECIFICACION_TECNICA.md`)
   - Arquitectura general
   - Especificaciones de Frontend
   - Especificaciones de Backend
   - Especificaciones de Base de Datos
   - Flujo de datos
   - Validaciones y seguridad
   - Consideraciones de performance
   - Testing
   - Roadmap de implementación

---

## Guía de Referencia Rápida - REQ-001

### Funcionalidades
| Funcionalidad | Estado | Componente Frontend | Endpoint Backend |
|---|---|---|---|
| Gráfico mensual | ✅ Diseño | `MonthlyChart.jsx` | GET /api/reports/monthly-grouping |
| Filtro fechas | ✅ Diseño | `FilterPanel.jsx` | (mismo endpoint) |
| Filtro categorías | ✅ Diseño | `FilterPanel.jsx` | (mismo endpoint) |
| Modal detalles | ✅ Diseño | `ExpenseDetailModal.jsx` | GET /api/reports/monthly-grouping/details |
| Editar gastos | ✅ Diseño | `ExpenseList.jsx` | Reutiliza DELETE /api/expenses/:id |

### Stack Tecnológico
- **Frontend**: React, Recharts, date-fns, Axios
- **Backend**: Node.js, Express, Sequelize
- **BD**: MySQL (sin cambios de esquema)
- **Testing**: Vitest, React Testing Library, Jest

### Métricas de Éxito
- ✅ Gráfico carga en <3s con 1 año de datos
- ✅ Responsivo en móvil y desktop
- ✅ Soporta hasta 50 categorías
- ✅ Precisión hasta el centavo
- ✅ Cobertura de tests >80%

### API Endpoints Nuevos
```
GET /api/reports/monthly-grouping
  Query: ?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&categories=1,2,3
  Response: { months, categories, totals }

GET /api/reports/monthly-grouping/details
  Query: ?month=YYYY-MM&categoryId=1&page=1&limit=10
  Response: { month, category, total, expenses[], pagination }
```

### Base de Datos
**Nuevas tablas**: Ninguna
**Nuevos índices** (si no existen):
- `idx_user_date` en `expenses`
- `idx_category_date` en `expenses`
- `idx_user_category_date` en `expenses`

---

## Requerimientos Completados

### REQ-002: Versionado de BD y Migraciones

**Estado**: En Diseño  
**Prioridad**: Alta

Sistema de control de versiones y migraciones de base de datos.

**Archivo**: [`REQ_002_VERSIONADO_BD_Y_MIGRACIONES.md`](REQ_002_VERSIONADO_BD_Y_MIGRACIONES.md)

---

### REQ-003: Control de Cotizaciones ARS/USD

**Estado**: En Diseño  
**Prioridad**: Alta

Mantener histórico de cotizaciones diarias de ARS/USD, obtención automática diaria, carga histórica manual y auditoría.

**Archivo**: [`REQ_003_CONTROL_COTIZACIONES.md`](REQ_003_CONTROL_COTIZACIONES.md)

**Características principales**:
- ✅ Tabla de cotizaciones diarias con histórico
- ✅ Obtención automática diaria a las 22:00
- ✅ Carga histórica manual desde admin panel
- ✅ Logging y auditoría de todas las operaciones
- ✅ Fallback a cotización anterior si API falla
- ✅ Endpoint para consultar logs con filtros

---

### REQ-004: Gastos en Múltiples Monedas (ARS/USD)

**Estado**: En Diseño  
**Prioridad**: Alta  
**Estimado**: 8 días de desarrollo

Permitir ingreso de gastos en ARS o USD con conversión automática usando cotizaciones del día. Visualización flexible en cualquier moneda con reportes y gráficos que soportan conversión.

**Archivo**: [`REQ_004_GASTOS_MULTIMONEDA.md`](REQ_004_GASTOS_MULTIMONEDA.md)

**Características principales**:
- ✅ Campo `currency` en tabla `expenses` (ARS/USD)
- ✅ Formulario permite seleccionar moneda al ingresar gasto
- ✅ Conversión ARS ↔ USD usando cotización del día
- ✅ Listados filtran y visualizan en cualquier moneda
- ✅ Reportes incluyen opciones de conversión
- ✅ Gráficos soportan cambio dinámico de moneda
- ✅ Dashboard muestra totales en ARS y USD
- ✅ Si no existe cotización exacta, usa siguiente disponible

**Componentes necesarios**:
```
Backend:
  - Campo currency en modelo Expense
  - Servicio currencyConversionService.js
  - Endpoint GET /api/expenses/convert
  - Actualizar controladores de gastos y reportes
  
Frontend:
  - Actualizar ExpenseForm con selector de moneda
  - Agregar filtro de moneda en listados
  - Selector "Mostrar en" para conversión de visualización
  - Actualizar reportes con opciones de conversión
  - Actualizar gráficos con selector de moneda
  - Dashboard con totales por moneda
```

**Dependencias**:
- Depende de **REQ-003** (tabla de cotizaciones)
- Integración con **REQ-001** (reportes)

---

## Próximos Requerimientos (Planeados)

- REQ-005: Exportación de reportes a PDF
- REQ-006: Presupuestos por categoría
- REQ-007: Alertas de gastos excesivos
- REQ-008: Sincronización con cuentas bancarias

---

## Cómo Usar Esta Carpeta

1. **Para desarrolladores**: Lee primero la especificación funcional, luego la técnica
2. **Para QA/Testing**: Usa los criterios de aceptación en la especificación funcional
3. **Para Product Manager**: Mantén actualizado el estado y prioridad de cada requerimiento
4. **Para estimaciones**: Revisa el roadmap de implementación en la especificación técnica

---

## Cambios en esta Carpeta

- **2026-04-08**: Agregado REQ-004 (Gastos en Múltiples Monedas)
- **2026-04-08**: Agregado REQ-003 (Control de Cotizaciones)
- **2026-04-08**: Agregado REQ-002 (Versionado de BD y Migraciones)
- **2026-04-08**: Creación inicial con REQ-001 (Reporte de Agrupamiento Mensual)

