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

## Próximos Requerimientos (Planeados)

- REQ-002: Exportación de reportes a PDF
- REQ-003: Presupuestos por categoría
- REQ-004: Alertas de gastos excesivos
- REQ-005: Sincronización con cuentas bancarias

---

## Cómo Usar Esta Carpeta

1. **Para desarrolladores**: Lee primero la especificación funcional, luego la técnica
2. **Para QA/Testing**: Usa los criterios de aceptación en la especificación funcional
3. **Para Product Manager**: Mantén actualizado el estado y prioridad de cada requerimiento
4. **Para estimaciones**: Revisa el roadmap de implementación en la especificación técnica

---

## Cambios en esta Carpeta

- **2026-04-08**: Creación inicial con REQ-001 (Reporte de Agrupamiento Mensual)

