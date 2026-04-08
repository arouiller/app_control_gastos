# REQ-001: Reporte de Agrupamiento Mensual

**ID Requerimiento**: REQ-001  
**Versión**: 1.0  
**Fecha de Creación**: 2026-04-08  
**Estado**: En Diseño  
**Prioridad**: Alta  

---

## 1. DESCRIPCIÓN GENERAL

El sistema debe proporcionar un reporte que agrupe los gastos por mes, mostrando el total mensual y el desglose por categoría para cada mes. El usuario podrá filtrar por rango de fechas y categorías, visualizar los datos en un gráfico de barras e inspeccionar los gastos individuales al hacer clic en una categoría específica de un mes.

---

## 2. REQUERIMIENTOS FUNCIONALES

### 2.1 Visualización del Reporte

- **RF-101**: El sistema debe mostrar un gráfico de barras agrupadas que represente los gastos mensuales
  - El eje X debe contener los meses (formato: MMM YYYY, ej: "Ene 2026")
  - El eje Y debe representar el monto en unidades monetarias
  - Las barras deben ordenarse de forma ascendente por fecha

- **RF-102**: El gráfico debe incluir múltiples series, una por cada categoría activa
  - Cada categoría debe tener un color distintivo (según su configuración en la BD)
  - Las barras deben estar agrupadas por mes

- **RF-103**: El sistema debe mostrar el total mensual en valor numérico
  - El total debe ser visible al pasar el mouse sobre el mes (tooltip)
  - Alternativa: mostrar etiqueta en la parte superior de cada grupo de barras

### 2.2 Filtros

- **RF-104**: El sistema debe permitir filtrar por rango de fechas
  - Campo "Desde": fecha de inicio (tipo date)
  - Campo "Hasta": fecha de fin (tipo date)
  - Por defecto: últimos 12 meses

- **RF-105**: El sistema debe permitir filtrar por categorías
  - Selección múltiple con checkboxes
  - Por defecto: todas las categorías disponibles del usuario
  - Opción de "Seleccionar todas" / "Deseleccionar todas"

- **RF-106**: El sistema debe actualizar el reporte automáticamente al cambiar filtros
  - Sin necesidad de hacer clic en un botón "Aplicar"
  - Debe mostrar un indicador de carga mientras se procesan los datos

### 2.3 Interactividad

- **RF-107**: Al hacer clic sobre una categoría en un mes específico:
  - El sistema debe mostrar un modal o panel lateral con el listado de gastos
  - El listado debe contener:
    * Descripción del gasto
    * Monto
    * Fecha exacta
    * Método de pago (efectivo/tarjeta)
    * Opción de editar el gasto
    * Opción de eliminar el gasto

- **RF-108**: El usuario debe poder cerrar el modal/panel lateral sin cambios
  - Botón cerrar (X) en la esquina superior derecha
  - Clic fuera del modal (si aplica)

### 2.4 Formato de Datos

- **RF-109**: Los montos deben mostrarse con:
  - Símbolo de moneda (según configuración del sistema)
  - Dos decimales
  - Separador de miles (si aplica)

- **RF-110**: Las fechas deben mostrarse en formato consistente
  - Meses en el gráfico: "Ene 2026", "Feb 2026", etc.
  - Gastos individuales: "08/04/2026" o según preferencia regional

---

## 3. REQUERIMIENTOS NO FUNCIONALES

- **RNF-101**: El reporte debe cargar en menos de 3 segundos para 1 año de datos
- **RNF-102**: El gráfico debe ser responsivo y adaptarse a pantallas móviles
- **RNF-103**: El reporte debe soportar hasta 50 categorías simultáneamente
- **RNF-104**: Los datos deben ser precisos hasta el centavo
- **RNF-105**: El reporte debe funcionar sin necesidad de actualizaciones manuales

---

## 4. CASOS DE USO

### Caso 1: Análisis de gastos mensuales
1. El usuario navega al apartado de reportes
2. Selecciona "Reporte de Agrupamiento Mensual"
3. Ve el gráfico de los últimos 12 meses
4. El gráfico muestra todas las categorías con sus colores
5. El usuario identifica visualmente el patrón de gasto

### Caso 2: Filtrado por período específico
1. El usuario quiere analizar gastos de enero a marzo de 2026
2. Establece "Desde" en 01/01/2026 y "Hasta" en 31/03/2026
3. El reporte se actualiza automáticamente
4. Solo se muestran los 3 meses especificados

### Caso 3: Análisis por categoría
1. El usuario quiere ver solo gastos de "Alimentación" y "Transporte"
2. Deselecciona las demás categorías
3. El gráfico muestra solo las dos categorías seleccionadas
4. Observa que en Febrero tuvo más gastos en Transporte

### Caso 4: Inspeccionar gastos individuales
1. El usuario ve en el gráfico un pico en "Alimentación" en Marzo
2. Hace clic sobre la barra de Alimentación en Marzo
3. Se abre un panel con el listado de todos los gastos de Alimentación en Marzo
4. Puede editar o eliminar gastos individuales desde este listado
5. El gráfico se actualiza automáticamente si hace cambios

---

## 5. RESTRICCIONES Y CONSIDERACIONES

- Solo se mostrarán gastos del usuario autenticado
- Los gastos en cuotas deben reflejarse en el mes en que fueron registrados (no en el mes de vencimiento de la cuota)
- Las categorías eliminadas o inactivas no aparecerán en el filtro
- Si el usuario no tiene gastos en el período, mostrar un mensaje "No hay datos disponibles"

---

## 6. CRITERIOS DE ACEPTACIÓN

- ✅ Gráfico de barras se muestra correctamente con al menos 3 meses de datos
- ✅ Filtro de fechas funciona y actualiza el reporte en tiempo real
- ✅ Filtro de categorías funciona con selección múltiple
- ✅ Al hacer clic en una categoría-mes, se abre modal/panel con listado de gastos
- ✅ Los montos se muestran con formato correcto (moneda, decimales)
- ✅ El modal permite editar y eliminar gastos individuales
- ✅ Las actualizaciones en gastos se reflejan en el gráfico inmediatamente
- ✅ Reporte funciona correctamente en dispositivos móviles
- ✅ Tiempo de carga es menor a 3 segundos para 1 año de datos

---

## 7. MOCKUPS / REFERENCIAS

### Estructura Visual

```
┌─────────────────────────────────────────────────────────────────┐
│  REPORTE DE AGRUPAMIENTO MENSUAL                                │
├─────────────────────────────────────────────────────────────────┤
│ Filtros:                                                         │
│ [Desde: ____________]  [Hasta: ____________]                    │
│                                                                  │
│ Categorías: [✓ Alimentación] [✓ Transporte] [✓ Entretenimiento]│
│             [✓ Servicios]    [✓ Salud]      [✓ Educación]      │
│             [✓ Otros]        [Sel. Todo] [Desel. Todo]        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MONTO ($)                                                       │
│     │                                                            │
│ 500 │     ╭─╮         ╭─╮                                       │
│     │     │ │ ╭─╮     │ │ ╭─╮                                   │
│ 400 │  ╭─╮│ │ │ │  ╭─╮│ │ │ │ ╭─╮                            │
│     │  │ ││ │ │ │  │ ││ │ │ │ │ │                            │
│ 300 │  │ ││ │ │ │  │ ││ │ │ │ │ │                            │
│     │  │ ││ │ │ │  │ ││ │ │ │ │ │                            │
│ 200 │  │ ││ │ │ │  │ ││ │ │ │ │ │                            │
│     │  │ ││ │ │ │  │ ││ │ │ │ │ │                            │
│ 100 │  │ ││ │ │ │  │ ││ │ │ │ │ │                            │
│     │  │ ││ │ │ │  │ ││ │ │ │ │ │                            │
│   0 ├──┴─┴┴─┴─┴─┴──┴─┴┴─┴─┴─┴─┴─┴────────────────────        │
│     │  Ene  Feb  Mar  Abr  May  Jun                             │
│     │  2026                                                      │
│                                                                  │
│  Leyenda: █ Alimentación  █ Transporte  █ Entretenimiento     │
│           █ Servicios     █ Salud       █ Educación           │
│           █ Otros                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Modal de Gastos

```
┌────────────────────────────────────┐
│ Gastos - Alimentación (Mar 2026) X │
├────────────────────────────────────┤
│ Total: $450.00                     │
├────────────────────────────────────┤
│ Descripción          | Monto | Acción │
├──────────────────────┼───────┼────────┤
│ Supermercado XYZ     | $200  │ E D    │
│ Panadería Local      | $150  │ E D    │
│ Restaurante ABC      | $100  │ E D    │
├──────────────────────┴───────┴────────┤
│ E = Editar  D = Eliminar             │
└─────────────────────────────────────┘
```

---

## 8. RELACIÓN CON OTROS REQUERIMIENTOS

- Depende de **RF-029** (Filtro de fechas)
- Depende de **RF-030** (Filtro de categorías)
- Utiliza datos de **RF-012** (Listado de gastos)
- Complementa **RF-042** (Gráficos de gastos por categoría)

---

## 9. NOTAS TÉCNICAS

- Este requerimiento puede implementarse como una nueva página/componente en el menú de reportes
- Se recomienda usar Chart.js o Recharts para el gráfico
- Los datos deben obtenerse mediante un endpoint GET específico del backend
- Considerar caché de datos para mejorar rendimiento

