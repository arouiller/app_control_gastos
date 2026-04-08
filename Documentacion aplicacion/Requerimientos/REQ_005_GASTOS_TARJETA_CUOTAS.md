# REQ-005: Gastos en Tarjeta de Crédito con Cuotas

**ID Requerimiento**: REQ-005  
**Versión**: 1.0  
**Fecha de Creación**: 2026-04-08  
**Estado**: En Diseño  
**Prioridad**: Alta  

---

## 1. DESCRIPCIÓN GENERAL

El sistema debe permitir registrar gastos en tarjeta de crédito que se dividen en múltiples cuotas. Los usuarios podrán ingresar estos gastos en ARS o USD, indicando la cantidad de cuotas y calculando automáticamente el valor de cada una. Los gastos en cuotas deben ser completamente editables y seguir los mismos lineamientos de visualización multimoneda que el resto del sistema, permitiendo ver el valor original y sus conversiones a otras monedas cuando sea necesario.

---

## 2. REQUERIMIENTOS FUNCIONALES

### 2.1 Modelo de Datos

- **RF-501**: Tabla `expenses` debe incluir campos para cuotas
  - Campo nuevo: `is_installment` (BOOLEAN) DEFAULT FALSE
  - Campo nuevo: `total_installments` (INT) — número total de cuotas (NULL si no es cuota)
  - Campo nuevo: `installment_number` (INT) — cuota actual (NULL si no es cuota)
  - Campo nuevo: `installment_parent_id` (INT) — referencia a gasto padre (NULL si no es cuota)
  - Foreign key: `installment_parent_id` → `expenses.id`
  - Índice: en `installment_parent_id` para búsquedas rápidas

- **RF-502**: El gasto padre debe almacenar información consolidada
  - El gasto con `installment_parent_id = NULL` e `is_installment = TRUE` es el padre
  - Almacena el total del gasto original
  - Los gastos hijo tienen el monto de cada cuota individual
  - La moneda es la misma para padre e hijos

- **RF-503**: Campo `amount` mantiene el monto de cada cuota
  - Para gastos padre: total a dividir
  - Para gastos hijo: monto de la cuota individual
  - DECIMAL(12, 2) mínimo para precisión
  - Validar que sea positivo (> 0)

### 2.2 Ingreso de Gastos en Cuotas

- **RF-504**: Formulario de ingreso debe incluir opción de cuotas
  - Checkbox: "¿Es un gasto en cuotas?"
  - Al marcar, se muestran campos adicionales de cuotas
  - Campos por defecto ocultos si no es cuota

- **RF-505**: Usuario puede especificar el monto de dos formas
  - **Opción A**: Ingresar cantidad de cuotas + total a dividir
    - Campo 1: "Número de cuotas" (INT, 2-36)
    - Campo 2: "Monto total" (DECIMAL)
    - Sistema calcula automáticamente: cuota = total / cuotas
  - **Opción B**: Ingresar cantidad de cuotas + valor de la cuota
    - Campo 1: "Número de cuotas" (INT, 2-36)
    - Campo 2: "Monto de cada cuota" (DECIMAL)
    - Sistema calcula automáticamente: total = cuota * cuotas

- **RF-506**: Selector de moneda aplica a todo el gasto
  - Campo desplegable: "Pesos (ARS)" / "Dólares (USD)"
  - Default: "Pesos (ARS)"
  - Aplica tanto al total como a cada cuota
  - La moneda se mantiene consistente entre padre e hijos

- **RF-507**: Validación de datos de cuotas
  - Número de cuotas: entero entre 2 y 36
  - Monto total/cuota: decimal positivo
  - Si ambos campos están llenos, usar el total (ignorar cuota individual)
  - Error si ninguno de los dos está lleno
  - Rechazar requests inválidas con status 400

- **RF-508**: Al crear gasto en cuotas, se generan automáticamente todos los registros hijo
  - Crear 1 registro padre (con `is_installment=TRUE`, `installment_parent_id=NULL`)
  - Crear N registros hijo (con `is_installment=TRUE`, `installment_number=1..N`)
  - Todos heredan: descripción, categoría, moneda, fecha del gasto
  - Cada hijo tiene el monto de la cuota individual
  - Timestamp de creación es el mismo para todos

### 2.3 Edición de Gastos en Cuotas

- **RF-509**: Gasto padre es editable, modificando toda la estructura
  - Permitir cambiar: descripción, categoría, fecha, moneda
  - Permitir cambiar: cantidad de cuotas
  - Permitir cambiar: monto total O monto de cuota
  - Al cambiar cantidad de cuotas:
    - Si total fue definido: recalcular `cuota = total / nuevas_cuotas`
    - Si cuota fue definida: recalcular `total = cuota * nuevas_cuotas`
  - Si aumentan las cuotas: crear registros hijo faltantes
  - Si disminuyen las cuotas: eliminar registros hijo al final
  - Actualizar todos los montos de cuotas individuales

- **RF-510**: Gastos hijo NO son editables individualmente
  - Mostrar mensaje: "No se puede editar una cuota individualmente"
  - Sugerir editar el gasto padre
  - Si usuario intenta edición directa, rechazar con status 403

- **RF-511**: Eliminación de gasto en cuotas
  - Eliminar padre también elimina todos los hijos
  - Implementar cascada de borrado o soft-delete coherente
  - Registrar eliminación en auditoría con referencia a todos los registros eliminados

### 2.4 Visualización de Gastos en Cuotas

- **RF-512**: En listado de gastos, se puede optar por ver padre o todos
  - Opción 1: mostrar solo el gasto padre (totales consolidados)
  - Opción 2: mostrar cada cuota por separado (una fila por cuota)
  - Selector de vista con toggle/radio button
  - Default: mostrar cuotas por separado

- **RF-513**: Vista detallada del gasto padre muestra estructura de cuotas
  - Encabezado: descripción, categoría, fecha original
  - Sección "Detalles de cuotas":
    - Cantidad de cuotas: X
    - Monto total: $XXXX.XX [ARS/USD]
    - Monto por cuota: $XX.XX [ARS/USD]
  - Listado de cuotas:
    - Cuota #1: vencimiento estimado (si aplica)
    - Cuota #2: estado (pagada/pendiente, si aplica)
    - ... hasta Cuota #N
  - Botón "Editar" aplica al gasto padre

- **RF-514**: Visualización multimoneda en cuotas
  - Mostrar moneda original (ARS o USD)
  - Permitir conversión a otra moneda (botón/toggle)
  - En conversión:
    - Mostrar monto total convertido
    - Mostrar monto de cuota convertido
    - Mostrar cotización utilizada (fecha y valor)
    - Indicar claramente que es una conversión
  - Mantener dos decimales en todas las visualizaciones

- **RF-515**: Desglose en reportes
  - Reportes pueden mostrar cuotas individuales o consolidadas
  - Opción de vista: "Mostrar cuotas consolidadas" / "Mostrar cuotas individuales"
  - Si consolidadas: mostrar el gasto padre como 1 línea
  - Si individuales: mostrar cada cuota en su propia fila
  - Subtotales correctos en ambos casos

- **RF-516**: Gráficos y dashboards
  - Los gastos en cuotas deben incluirse en totales/gráficos
  - Por defecto, contar cuota completa (no fraccionar por mes)
  - Opción avanzada: distribuir el gasto a lo largo de las cuotas (futuro)
  - El selector de moneda aplica a todos los valores mostrados

### 2.5 API REST

- **RF-517**: Endpoint POST `/api/expenses` maneja cuotas
  - Body extendido para cuotas:
    ```json
    {
      "description": "Compra en tienda",
      "amount": 1200.00,
      "currency": "ARS",
      "categoryId": 5,
      "date": "2026-04-08",
      "isInstallment": true,
      "totalInstallments": 12,
      "installmentAmount": 100.00
    }
    ```
  - Parámetro `isInstallment` (boolean): indica si es gasto en cuotas
  - Parámetro `totalInstallments` (int): cantidad de cuotas
  - Parámetro `installmentAmount` (decimal) O usar `amount` como total
  - Validar campos según lógica de RF-507
  - Response: retorna gasto padre (sin hijos por ahora)

- **RF-518**: Endpoint GET `/api/expenses` con filtro de cuotas
  - Query param: `includeInstallments` (boolean, default=true)
    - true: devuelve padre e hijos como registros separados
    - false: devuelve solo padres, ocultando estructura de cuotas
  - Query param: `installmentParentId` (int, opcional)
    - Si se proporciona: devuelve solo cuotas de ese padre
  - Response: array con todos los registros aplicables

- **RF-519**: Endpoint GET `/api/expenses/:id` para gastos padre
  - Si el ID es un gasto padre: devuelve estructura completa
    ```json
    {
      "id": 100,
      "description": "...",
      "isInstallment": true,
      "totalInstallments": 12,
      "totalAmount": 1200.00,
      "installmentAmount": 100.00,
      "installments": [
        {"id": 101, "installmentNumber": 1, "amount": 100.00, ...},
        {"id": 102, "installmentNumber": 2, "amount": 100.00, ...},
        ...
      ],
      "conversions": {...}
    }
    ```
  - Incluye array `installments` con todos los hijos
  - Incluye datos de conversión (ARS y USD)

- **RF-520**: Endpoint PUT `/api/expenses/:id` edita gasto padre
  - Body: puede incluir cambios en `totalInstallments`, `amount`, etc.
  - Sistema recalcula automáticamente la estructura
  - Si cambia de cuotas, ajusta hijos acordemente
  - Response: estructura actualizada completa

- **RF-521**: Endpoint DELETE `/api/expenses/:id` para gasto padre
  - Elimina padre e hijos en cascada
  - Rechaza intentos de eliminar hijo directo con status 403
  - Response: confirmación con IDs eliminados

### 2.6 Casos de Uso Específicos

- **RF-522**: Conversión en reportes con cuotas
  - Reportes multimoneda deben aplicar conversión coherente
  - Si usuario selecciona "Mostrar en USD":
    - Total del gasto: se convierte a USD
    - Monto por cuota: se divide por cantidad de cuotas
    - Cotización usada: la del día del gasto original
  - Mostrar siempre el valor original como referencia

---

## 3. REQUERIMIENTOS NO FUNCIONALES

- **RNF-501**: Creación de gasto en cuotas debe completarse en < 500ms (incluye creación de N registros)
- **RNF-502**: Listado de gastos con cuotas debe cargar en < 2 segundos (1000 registros)
- **RNF-503**: Edición de cuotas debe ser transaccional (todo o nada)
- **RNF-504**: Conversiones multimoneda en cuotas debe ser precisa a 2 decimales
- **RNF-505**: Sistema debe soportar hasta 36 cuotas por gasto

---

## 4. CASOS DE USO

### Caso 1: Registrar compra en cuotas
1. Usuario hace compra de $12,000 ARS en cuotas de 12 meses
2. Abre formulario de nuevo gasto
3. Marca "¿Es un gasto en cuotas?"
4. Ingresa: Descripción, Categoría, Monto total ($12,000), Cuotas (12)
5. Sistema calcula: $1,000 por cuota
6. Sistema crea: 1 gasto padre + 12 gastos hijo
7. En listado, usuario ve las 12 cuotas de $1,000 cada una
8. En vista padre, ve el desglose completo

### Caso 2: Ver gasto consolidado vs individual
1. Usuario abre reportes
2. Puede elegir "Mostrar cuotas consolidadas" o "Mostrar cuotas individuales"
3. Si consolidadas: ve una línea con "Compra en 12 cuotas - $12,000"
4. Si individuales: ve 12 líneas de $1,000 cada una
5. Ambas vistas suman correctamente a $12,000

### Caso 3: Editar cantidad de cuotas
1. Usuario registró gasto en 12 cuotas de $1,000
2. Abre el gasto padre para editar
3. Cambia cuotas a 6
4. Sistema recalcula: $2,000 por cuota
5. Sistema elimina cuotas 7-12
6. Sistema actualiza montos de cuotas 1-6
7. Gasto ahora es 6 × $2,000 = $12,000

### Caso 4: Ver gastos en cuotas en otra moneda
1. Usuario registró gasto en $12,000 ARS en 12 cuotas
2. Ve el gasto con monto total: $12,000 ARS
3. Hace clic en "Convertir a USD"
4. Sistema busca cotización del día del gasto
5. Muestra equivalente (ej: $9,600 USD @ 1.25)
6. Muestra cuota convertida: $800 USD
7. Botón "Mostrar original" vuelve a ARS

### Caso 5: Generar reporte multimoneda con cuotas
1. Usuario tiene:
   - Gasto 1: $5,000 ARS en 5 cuotas
   - Gasto 2: $500 USD en 10 cuotas
2. Genera reporte 2026-01-01 a 2026-04-08
3. Selecciona "Mostrar en: Original"
4. Ve subtotal ARS: $5,000 y subtotal USD: $500
5. Ve equivalente total en ARS (con conversión)
6. Selecciona "Mostrar en: USD"
7. Ve todo convertido a USD con conversión coherente

---

## 5. RESTRICCIONES Y CONSIDERACIONES

- Un gasto en cuotas siempre debe tener entre 2 y 36 cuotas
- Todos los hijos de un padre comparten: descripción, categoría, moneda, fecha
- Solo el padre es editable; los hijos se actualizan automáticamente
- Eliminar padre también elimina todos los hijos (cascada)
- La fecha del gasto aplica a todas las cuotas (se puede mejorar a futuro con vencimientos individuales)
- Conversiones multimoneda siempre usan la cotización del día del gasto padre
- El sistema debe evitar que un hijo sea huérfano (sin padre)

---

## 6. CRITERIOS DE ACEPTACIÓN

- ✅ Tabla `expenses` incluye campos de cuotas (`is_installment`, `total_installments`, `installment_number`, `installment_parent_id`)
- ✅ Formulario permite registrar gasto en cuotas con cantidad y monto
- ✅ Al crear cuota, se generan automáticamente registros hijo
- ✅ Se puede ver gasto consolidado (padre) o individual (hijos)
- ✅ Edición del padre actualiza automáticamente todos los hijos
- ✅ Intento de editar hijo individualmente es rechazado
- ✅ Eliminación del padre elimina todos los hijos en cascada
- ✅ Conversiones multimoneda funcionan correctamente en cuotas
- ✅ Reportes permiten vista consolidada e individual
- ✅ API endpoints soportan creación, lectura y edición de cuotas
- ✅ Validaciones funcionan correctamente (cantidad, moneda, etc.)

---

## 7. MOCKUPS / REFERENCIAS

### Formulario: Ingreso de Gasto en Cuotas

```
┌─────────────────────────────────────────────────────┐
│ NUEVO GASTO                                         │
├─────────────────────────────────────────────────────┤
│ Descripción: [Compra en tienda________________]    │
│ Categoría: [▼ Otros                           ]    │
│ Monto: [1200.00]     Moneda: [▼ ARS]               │
│ Fecha: [2026-04-08]                                │
│                                                    │
│ ☐ ¿Es un gasto en cuotas?                         │
│                                                    │
│ [Si marca se muestran...]                         │
│                                                    │
│ ○ Dividir monto total    ○ Por monto de cuota    │
│                                                    │
│ Cantidad de cuotas: [12]                          │
│ Monto total: [12000.00] O Monto por cuota: [   ] │
│                                                    │
│ Resumen: 12 cuotas de $1,000.00 ARS               │
│                                                    │
│             [ Guardar ]  [ Cancelar ]            │
└─────────────────────────────────────────────────────┘
```

### Vista Detallada: Gasto Padre con Cuotas

```
┌─────────────────────────────────────────────────────┐
│ Compra en tienda                              [✏️]  │
├─────────────────────────────────────────────────────┤
│ Categoría: Otros                                   │
│ Fecha: 08/04/2026                                  │
│                                                    │
│ 📋 DETALLES DE CUOTAS                             │
│ ├─ Cantidad de cuotas: 12                         │
│ ├─ Monto total: $12,000.00 ARS                    │
│ ├─ Monto por cuota: $1,000.00 ARS                 │
│ └─ [Convertir a USD]                              │
│                                                    │
│ 📅 CUOTAS                                         │
│ ├─ Cuota 1:  $1,000.00  (08/04/2026)              │
│ ├─ Cuota 2:  $1,000.00  (08/05/2026)              │
│ ├─ Cuota 3:  $1,000.00  (08/06/2026)              │
│ ├─ ...                                            │
│ └─ Cuota 12: $1,000.00  (08/15/2026)              │
│                                                    │
│ Total: $12,000.00 ARS                             │
└─────────────────────────────────────────────────────┘
```

### Listado: Modo Cuotas Individuales vs Consolidadas

```
MODO INDIVIDUAL (Mostrar cuotas separadas)
┌──────────────────────────────────────────────────┐
│ Descripción          Categoría  Monto     Fecha  │
├──────────────────────────────────────────────────┤
│ Compra en tienda     Otros      $1,000    04/04  │
│ (Cuota 1/12)                    ARS             │
│ Compra en tienda     Otros      $1,000    04/04  │
│ (Cuota 2/12)                    ARS             │
│ ...                                             │
└──────────────────────────────────────────────────┘

MODO CONSOLIDADO (Mostrar solo padre)
┌──────────────────────────────────────────────────┐
│ Descripción          Categoría  Monto     Fecha  │
├──────────────────────────────────────────────────┤
│ Compra en tienda     Otros      $12,000   04/04  │
│ (12 cuotas)                     ARS             │
└──────────────────────────────────────────────────┘
```

### Reporte: Multimoneda con Cuotas

```
REPORTE DE GASTOS (01/04/2026 - 30/04/2026)
Mostrar en: [▼ Moneda Original ]

Categoría: Otros
├─ Compra en tienda (12 cuotas)  $12,000.00 ARS
└─ Electrodoméstico (6 cuotas)   $600.00 USD

Subtotal ARS: $12,000.00
Subtotal USD: $600.00
TOTAL EQUIVALENTE: $13,680.00 ARS (@ cotización 1.11 del 01/04)

[Mostrar como consolidado] [Mostrar cuotas individuales]
```

---

## 8. RELACIÓN CON OTROS REQUERIMIENTOS

- Depende de **REQ-004** (Gastos Multimoneda - conversiones de cuotas)
- Depende de **REQ-003** (Control de Cotizaciones - para conversiones)
- Se integra con **REQ-001** (Reportes - deben mostrar cuotas correctamente)
- Complementa **REQ-002** (Migraciones - requiere cambios de schema)

---

## 9. NOTAS TÉCNICAS

### 9.1 Estructura de Base de Datos

```sql
-- Cambios a tabla expenses
ALTER TABLE expenses ADD COLUMN is_installment BOOLEAN DEFAULT FALSE;
ALTER TABLE expenses ADD COLUMN total_installments INT NULL;
ALTER TABLE expenses ADD COLUMN installment_number INT NULL;
ALTER TABLE expenses ADD COLUMN installment_parent_id INT NULL;

ALTER TABLE expenses ADD FOREIGN KEY (installment_parent_id) 
  REFERENCES expenses(id) ON DELETE CASCADE;

CREATE INDEX idx_installment_parent ON expenses(installment_parent_id);
CREATE INDEX idx_is_installment ON expenses(is_installment);
```

### 9.2 Pseudocódigo: Creación de Gasto en Cuotas

```javascript
async createExpenseWithInstallments(data) {
  // Validar datos
  if (data.isInstallment) {
    if (data.totalInstallments < 2 || data.totalInstallments > 36) {
      throw new Error('Cuotas entre 2 y 36');
    }
    // Calcular monto por cuota
    const installmentAmount = data.amount / data.totalInstallments;
    
    // Iniciar transacción
    const parent = await db.transaction(async () => {
      // Crear gasto padre
      const parent = await Expense.create({
        ...data,
        is_installment: true,
        installment_parent_id: null,
        amount: data.amount // total
      });
      
      // Crear gastos hijo
      for (let i = 1; i <= data.totalInstallments; i++) {
        await Expense.create({
          ...data,
          is_installment: true,
          installment_number: i,
          installment_parent_id: parent.id,
          amount: installmentAmount
        });
      }
      
      return parent;
    });
    
    return parent;
  }
  // ... crear gasto normal
}
```

### 9.3 Pseudocódigo: Edición de Gasto Padre

```javascript
async updateExpenseWithInstallments(id, data) {
  const parent = await Expense.findById(id);
  
  if (!parent.is_installment) {
    // Gasto normal, actualizar directamente
    return parent.update(data);
  }
  
  // Gasto en cuotas
  if (data.totalInstallments !== parent.totalInstallments) {
    // Cambio de cantidad de cuotas
    const newInstallmentAmount = data.amount / data.totalInstallments;
    
    await db.transaction(async () => {
      // Actualizar padre
      await parent.update({
        amount: data.amount,
        totalInstallments: data.totalInstallments,
        ...data
      });
      
      // Eliminar cuotas excedentes
      await Expense.destroy({
        where: {
          installment_parent_id: id,
          installment_number: { $gt: data.totalInstallments }
        }
      });
      
      // Actualizar/crear cuotas restantes
      for (let i = 1; i <= data.totalInstallments; i++) {
        const child = await Expense.findOne({
          where: { installment_parent_id: id, installment_number: i }
        });
        
        if (child) {
          await child.update({ amount: newInstallmentAmount, ...data });
        } else {
          await Expense.create({
            ...data,
            is_installment: true,
            installment_number: i,
            installment_parent_id: id,
            amount: newInstallmentAmount
          });
        }
      }
    });
  } else {
    // Solo cambios no estructurales
    await db.transaction(async () => {
      await parent.update(data);
      await Expense.update(data, {
        where: { installment_parent_id: id }
      });
    });
  }
  
  return parent;
}
```

### 9.4 Vista SQL para Conversiones de Cuotas

```sql
CREATE VIEW expenses_with_cuota_conversions AS
SELECT 
  e.id,
  e.description,
  e.amount as original_amount,
  e.currency as original_currency,
  e.is_installment,
  e.total_installments,
  e.installment_number,
  e.installment_parent_id,
  
  -- Conversión ARS
  CASE 
    WHEN e.currency = 'ARS' THEN e.amount
    WHEN e.currency = 'USD' THEN e.amount * er.ars_to_usd
    ELSE NULL
  END as amount_in_ars,
  
  -- Conversión USD
  CASE
    WHEN e.currency = 'USD' THEN e.amount
    WHEN e.currency = 'ARS' THEN e.amount / NULLIF(er.ars_to_usd, 0)
    ELSE NULL
  END as amount_in_usd,
  
  er.ars_to_usd as exchange_rate_used,
  er.rate_date as exchange_rate_date,
  
  e.created_at,
  e.updated_at
FROM expenses e
LEFT JOIN exchange_rates er ON DATE(e.date) = er.rate_date
ORDER BY e.installment_parent_id, e.installment_number;
```

---

## 10. PLAN DE IMPLEMENTACIÓN

### Fase 1: Cambios de Base de Datos
- [ ] Agregar columnas de cuotas a tabla `expenses`
- [ ] Crear índices necesarios
- [ ] Crear vista SQL para conversiones con cuotas
- [ ] Migración de datos existentes (marcar como no cuota)

### Fase 2: Backend - CRUD
- [ ] Endpoint POST `/api/expenses` con soporte de cuotas
- [ ] Endpoint GET `/api/expenses` con filtros de cuotas
- [ ] Endpoint GET `/api/expenses/:id` para padre con hijos
- [ ] Endpoint PUT `/api/expenses/:id` con recalcular cuotas
- [ ] Endpoint DELETE `/api/expenses/:id` con cascada

### Fase 3: Lógica de Negocio
- [ ] Función de creación de gastos con cuotas
- [ ] Función de edición de gastos padre (recalcular hijos)
- [ ] Validaciones de moneda y cantidad
- [ ] Transacciones para integridad de datos

### Fase 4: Frontend - UI
- [ ] Formulario de gasto con checkbox de cuotas
- [ ] Campos dinámicos para cantidad y monto
- [ ] Vista detallada de gasto padre con listado de cuotas
- [ ] Toggle para ver cuotas individuales vs consolidadas
- [ ] Conversión multimoneda en detalles

### Fase 5: Reportes y Gráficos
- [ ] Actualizar queries de reportes para cuotas
- [ ] Agregar opción de vista consolidada/individual
- [ ] Conversiones correctas en reportes multimoneda
- [ ] Gráficos que incluyan cuotas correctamente

### Fase 6: Testing
- [ ] Tests de creación de gastos en cuotas
- [ ] Tests de edición (cambio de cantidad)
- [ ] Tests de eliminación en cascada
- [ ] Tests de conversión multimoneda
- [ ] Tests de reportes con cuotas

---

## 11. VENTAJAS DE ESTE DISEÑO

- **Simplicidad**: Estructura plana con relación padre-hijo, fácil de entender
- **Flexibilidad**: Soporta edición de cantidad de cuotas sin perder datos
- **Auditoría**: Cada cuota es un registro, permite rastrear cambios individuales
- **Consultas**: Las views manejan conversiones, frontend no necesita cálculos
- **Escalabilidad**: Estructura normalizada, soporta hasta 36 cuotas sin problemas
- **Consistencia**: Transacciones garantizan que padre e hijos siempre están alineados

---

## 12. CONSIDERACIONES FUTURAS

- **Vencimientos individuales**: Permitir vencimiento distinto para cada cuota
- **Interés**: Agregar campo para tasa de interés aplicada
- **Marcación de pago**: Estado individual de pago por cuota
- **Distribución en meses**: Opción de distribuir gasto en cuotas a lo largo del tiempo
- **Historial de cambios**: Auditoría detallada de modificaciones en cuotas
