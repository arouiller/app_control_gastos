# REQ-004: Gastos en Múltiples Monedas (ARS/USD)

**ID Requerimiento**: REQ-004  
**Versión**: 1.0  
**Fecha de Creación**: 2026-04-08  
**Estado**: En Diseño  
**Prioridad**: Alta  

---

## 1. DESCRIPCIÓN GENERAL

El sistema debe permitir que los gastos puedan ser registrados en dos monedas: Pesos Argentinos (ARS) o Dólares Estadounidenses (USD). Los gastos deben ser visualizables y reportables en cualquiera de las dos monedas, con conversiones automáticas utilizando las cotizaciones del día del gasto proporcionadas por el módulo de control de cotizaciones (REQ-003).

Los usuarios podrán:
- Ingresar gastos en ARS o USD
- Visualizar sus gastos indistintamente en ARS o USD
- Generar reportes con conversión automática a la moneda deseada
- Ver el tipo de cambio utilizado en cada conversión

---

## 2. REQUERIMIENTOS FUNCIONALES

### 2.1 Modelo de Datos

- **RF-401**: Tabla `expenses` debe incluir campo de moneda
  - Campo nuevo: `currency` (ENUM: 'ARS', 'USD') NOT NULL
  - Default: 'ARS' para retrocompatibilidad
  - Índice: en `currency` para filtrados por moneda
  - El monto (`amount`) siempre se almacena en la moneda especificada

- **RF-402**: Campo `amount` debe poder almacenar valores en cualquier moneda
  - Mantener precisión decimal (DECIMAL(12, 2) mínimo)
  - Validar que sea positivo (> 0)
  - No permite NULL

### 2.2 Ingreso de Gastos

- **RF-403**: Formulario de ingreso debe permitir seleccionar moneda
  - Campo desplegable con opciones: "Pesos (ARS)" / "Dólares (USD)"
  - Default: "Pesos (ARS)" para usuarios argentinos
  - Campo de monto aceptará números positivos
  - Validación: monto > 0

- **RF-404**: El backend debe validar la moneda ingresada
  - Solo permitir 'ARS' o 'USD'
  - Rechazar requests con monedas inválidas con status 400
  - Mensaje de error: "Moneda inválida. Use 'ARS' o 'USD'"

- **RF-405**: El gasto se almacena con el monto y moneda original
  - No convertir en el momento de ingreso
  - Guardar exactamente el valor ingresado por el usuario
  - Registrar la moneda junto con el monto

### 2.3 Visualización de Gastos (Individual)

- **RF-406**: Vista de detalle de gasto debe mostrar moneda original
  - Mostrar: "Monto: $1,250.50 ARS"
  - Mostrar: "Monto: $150.00 USD"
  - Indicar claramente la moneda

- **RF-407**: Vista de detalle debe permitir ver conversión a otra moneda
  - Botón o selector: "Convertir a [otra moneda]"
  - Mostrar: "Equivalente en [moneda]: $XXX.XX"
  - Mostrar cotización utilizada: "Cotización [fecha del gasto]: X.XX"
  - Mostrar fecha de cotización para referencia

### 2.4 Conversión de Monedas

- **RF-408**: Conversion ARS → USD
  - Fórmula: `monto_usd = monto_ars / ars_to_usd`
  - Usar cotización del día del gasto de tabla `exchange_rates`
  - Si no existe cotización exacta, usar inmediatamente posterior
  - Redondeo: 2 decimales hacia arriba (CEILING)

- **RF-409**: Conversión USD → ARS
  - Fórmula: `monto_ars = monto_usd * ars_to_usd`
  - Usar cotización del día del gasto de tabla `exchange_rates`
  - Si no existe cotización exacta, usar inmediatamente posterior
  - Redondeo: 2 decimales hacia arriba (CEILING)

- **RF-410**: Búsqueda de cotización para una fecha
  - Si existe cotización exacta para la fecha, usarla
  - Si no existe, buscar la primera cotización posterior a esa fecha
  - Si no existe anterior ni posterior, retornar error
  - Registrar en log si se usa cotización de fecha diferente

### 2.5 Listados y Reportes

- **RF-411**: Listado de gastos debe permitir filtrado por moneda
  - Checkbox/select: "Mostrar gastos en: ARS / USD / Ambas"
  - Default: Ambas
  - Filtro se aplica al cargar la lista
  - Persiste la selección en el estado de usuario

- **RF-412**: Listado debe permitir ver monto en moneda original O convertida
  - Selector en encabezado: "Mostrar montos en: [Moneda original] / [ARS] / [USD]"
  - Si selecciona "Moneda original": cada gasto muestra su moneda nativa
  - Si selecciona ARS/USD: convierte todos los gastos a esa moneda
  - Columna de moneda puede ocultarse si muestran todos en la misma moneda

- **RF-413**: Reportes deben incluir opciones de conversión
  - Parámetro: `display_currency` ('original', 'ARS', 'USD')
  - Reportes de período pueden mezclar monedas
  - Subtotales por moneda si `display_currency='original'`
  - Un subtotal único si `display_currency='ARS'` o `'USD'`

- **RF-414**: Totales en reportes
  - Si se muestran monedas originales: mostrar subtotal por moneda
    ```
    Subtotal ARS: $5,000.00
    Subtotal USD: $300.00
    Equivalente total en ARS: $8,750.00
    ```
  - Si se muestra una sola moneda: total único
    ```
    Total: $8,750.00 ARS
    ```

### 2.6 Gráficos y Dashboards

- **RF-415**: Gráficos (torta, barra) deben permitir moneda
  - Selector en el gráfico: "Mostrar en: [Moneda original] / [ARS] / [USD]"
  - Cambio dinámico sin recargar página
  - Valores se recalculan automáticamente

- **RF-416**: Dashboard debe mostrar resumen por moneda
  - Cartas con totales:
    - Total en ARS (incluyendo conversión de USD)
    - Total en USD (incluyendo conversión de ARS)
    - Total en moneda original (separado por moneda)

### 2.7 API REST

- **RF-417**: Endpoint GET `/api/expenses` debe soportar filtro de moneda
  - Query param: `currency` ('ARS', 'USD', o ambas)
  - Query param: `display_currency` ('original', 'ARS', 'USD')
  - Response: array de gastos con `amount` y `currency` originales
  - Si `display_currency` != 'original': incluir campo `converted_amount` y `converted_currency`

- **RF-418**: Endpoint POST `/api/expenses` debe aceptar moneda
  - Body: `{ ..., amount: 1250.50, currency: 'ARS' }`
  - Validar que `currency` sea 'ARS' o 'USD'
  - Almacenar exactamente como se envía
  - Response: gasto creado con moneda confirmada

- **RF-419**: Endpoint GET `/api/expenses/:id` debe mostrar conversiones
  - Response include: `amount`, `currency` (moneda original)
  - Incluir: `converted_to_usd` (si currency es ARS), `exchange_rate_used`, `exchange_rate_date`
  - Incluir: `converted_to_ars` (si currency es USD)
  - Mostrar: qué cotización se usó y de qué fecha

- **RF-420**: Endpoint GET `/api/expenses/convert` para conversión ad-hoc
  - Parámetros: `amount` (number), `from_currency` ('ARS'|'USD'), `to_currency` ('ARS'|'USD'), `date` (YYYY-MM-DD)
  - Response: `{ converted_amount, exchange_rate, exchange_rate_date }`
  - Permite conversión de cualquier monto, no solo gastos existentes

### 2.8 Edición de Gastos

- **RF-421**: Al editar un gasto, se puede cambiar monto y/o moneda
  - Si solo cambia monto en misma moneda: actualizar normalmente
  - Si cambia moneda pero no monto: actualizar moneda, gasto mantiene su valor
    - Ejemplo: gasto de 1000 ARS → cambiar a USD = 0.80 USD (conversión al día del cambio)
    - O permitir que usuario reingrese el monto en nueva moneda
  - Registrar cambio en auditoria

---

## 3. REQUERIMIENTOS NO FUNCIONALES

- **RNF-401**: Conversiones deben completarse en < 100ms (consulta a tabla + cálculo)
- **RNF-402**: Precisión de conversión: mínimo 4 decimales en cotización
- **RNF-403**: Listados con 1000+ gastos mixtos deben cargar en < 2 segundos
- **RNF-404**: Reportes con conversión deben procesar en < 5 segundos
- **RNF-405**: No bloquear funcionalidad si una cotización no existe (fallback a siguiente)

---

## 4. CASOS DE USO

### Caso 1: Ingreso de gasto en pesos
1. Usuario hace clic en "Nuevo Gasto"
2. Ingresa: Descripción "Almuerzo", Monto "250", Categoría "Comida"
3. Selecciona moneda: **"Pesos (ARS)"**
4. Hace clic en "Guardar"
5. Sistema almacena: `{ amount: 250, currency: 'ARS', date: '2026-04-08' }`

### Caso 2: Ingreso de gasto en dólares
1. Usuario hace clic en "Nuevo Gasto"
2. Ingresa: Descripción "Hotel", Monto "120"
3. Selecciona moneda: **"Dólares (USD)"**
4. Hace clic en "Guardar"
5. Sistema almacena: `{ amount: 120, currency: 'USD', date: '2026-04-08' }`

### Caso 3: Ver conversión de un gasto
1. Usuario navega a "Mis Gastos"
2. Ve gasto: "Almuerzo - $250.00 ARS"
3. Hace clic en detalles
4. Ve detalles:
   ```
   Descripción: Almuerzo
   Monto: $250.00 ARS
   Categoría: Comida
   Fecha: 2026-04-08
   
   [Convertir a USD]
   
   (Si hace clic...)
   Equivalente en USD: $0.20 USD
   Cotización del día: 1 USD = 1250.50 ARS
   ```

### Caso 4: Reporte con mezcla de monedas
1. Usuario genera reporte: Marzo 2026
2. Tiene gastos:
   - 2026-03-15: $1,000 ARS
   - 2026-03-18: $50 USD
   - 2026-03-22: $500 ARS
3. Selecciona: "Mostrar todo en: ARS"
4. Sistema convierte:
   - $1,000.00 ARS
   - $62,525.00 ARS (equivalente de 50 USD a cotización del 2026-03-18)
   - $500.00 ARS
5. Total: $64,025.00 ARS

### Caso 5: Reporte mostrando moneda original
1. Usuario genera reporte: Marzo 2026
2. Selecciona: "Mostrar moneda original"
3. Sistema muestra:
   ```
   MARZO 2026
   
   Subtotal ARS: $1,500.00
   Subtotal USD: $50.00
   
   Equivalente total en ARS: $1,562.50 ARS
   Equivalente total en USD: $1.25 USD
   ```

### Caso 6: Gasto con cotización de fecha posterior
1. Usuario ingresa gasto: 2026-03-15, $100 USD
2. No existe cotización para 2026-03-15
3. Sistema busca cotización posterior: encuentra 2026-03-16
4. Al convertir, usa cotización de 2026-03-16
5. En detalles muestra: "Cotización utilizada: 2026-03-16 (1 USD = 1248.75 ARS)"

---

## 5. RESTRICCIONES Y CONSIDERACIONES

- Los gastos nunca se convierten en la BD; siempre se almacenan en moneda original
- Las conversiones son cálculos en tiempo de lectura, no precálculos
- Si un gasto se editó, mantiene su moneda original a menos que se cambie explícitamente
- Las cotizaciones deben estar disponibles (REQ-003) antes de visualizar gastos en otra moneda
- Si no hay cotización para una fecha, el sistema debe permitir usar la más cercana posterior
- Redondeo: siempre hacia arriba (CEILING) para ser conservador con conversiones
- En caso de edición de moneda, validar que el usuario confirme la conversión

---

## 6. CRITERIOS DE ACEPTACIÓN

- ✅ Campo `currency` en tabla `expenses` funciona correctamente
- ✅ Formulario de ingreso permite seleccionar ARS o USD
- ✅ Backend valida moneda en requests POST
- ✅ Gastos se almacenan en moneda original (no convertidos)
- ✅ Visualización muestra moneda original claramente
- ✅ Conversión ARS → USD funciona correctamente con cotización del día
- ✅ Conversión USD → ARS funciona correctamente con cotización del día
- ✅ Si no existe cotización exacta, sistema usa cotización posterior
- ✅ Listados permiten filtrar por moneda
- ✅ Listados permiten visualizar en otra moneda
- ✅ Reportes incluyen opciones de conversión
- ✅ Reportes muestran subtotales por moneda cuando aplica
- ✅ Gráficos pueden cambiarse de moneda dinámicamente
- ✅ Dashboard muestra totales en ARS y USD
- ✅ Conversiones completan en < 100ms
- ✅ No existen datos convertidos duplicados en BD

---

## 7. MOCKUPS / REFERENCIAS

### Pantalla: Nuevo Gasto con Selector de Moneda

```
┌──────────────────────────────────────────────┐
│  ➕ NUEVO GASTO                              │
├──────────────────────────────────────────────┤
│                                              │
│  Descripción                                 │
│  [Almuerzo en restaurante          ]        │
│                                              │
│  Monto                    Moneda             │
│  [250.50            ] [▼ Pesos (ARS)    ]   │
│                                              │
│  Categoría                 Fecha             │
│  [▼ Comida            ]  [2026-04-08]       │
│                                              │
│  Notas (opcional)                           │
│  [                                    ]    │
│                                              │
│                  [ Guardar ]  [ Cancelar ]   │
│                                              │
└──────────────────────────────────────────────┘
```

### Pantalla: Detalle de Gasto con Conversión

```
┌──────────────────────────────────────────────┐
│  📋 DETALLES DEL GASTO                       │
├──────────────────────────────────────────────┤
│                                              │
│  Descripción: Almuerzo en restaurante       │
│                                              │
│  Monto Original                              │
│  💰 $250.50 ARS                             │
│                                              │
│  Categoría: Comida                          │
│  Fecha: 2026-04-08                          │
│                                              │
│  Notas: Con colegas del trabajo             │
│                                              │
├──────────────────────────────────────────────┤
│  🔄 VER EN OTRA MONEDA                       │
│                                              │
│  [Convertir a USD]                          │
│                                              │
│  (Si hace clic:)                             │
│  Equivalente en USD: $0.20 USD              │
│  Cotización utilizada: 1 USD = 1250.50 ARS │
│  Fecha de cotización: 2026-04-08            │
│                                              │
│  [Editar] [Eliminar]                        │
│                                              │
└──────────────────────────────────────────────┘
```

### Pantalla: Listado de Gastos con Opciones de Conversión

```
┌────────────────────────────────────────────────────────────┐
│  📊 MIS GASTOS                                             │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Filtros:                                                 │
│  ☑ ARS  ☑ USD                                             │
│                                                            │
│  Mostrar montos en: [▼ Moneda Original]                   │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ Fecha      │ Descripción   │ Categoría │ Monto           │
├─────────────┼───────────────┼──────────┼─────────────────┤
│ 2026-04-08 │ Almuerzo      │ Comida   │ $250.50 ARS     │
│ 2026-04-07 │ Gasolina      │ Transporte│ $2,000.00 ARS  │
│ 2026-04-06 │ Hotel         │ Viaje    │ $120.00 USD     │
│ 2026-04-05 │ Supermercado  │ Comida   │ $1,500.50 ARS   │
│                                                            │
│ Totales por moneda:                                       │
│ ARS: $3,751.00  |  USD: $120.00                           │
│ Equivalente total: $3,846.28 ARS                          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Pantalla: Reporte con Conversión

```
┌────────────────────────────────────────────────────────────┐
│  📈 REPORTE MARZO 2026                                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Período: 1 - 31 Marzo 2026                              │
│  Mostrar en: [▼ Pesos (ARS)]                             │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  GASTOS DETALLADOS                                        │
│                                                            │
│  2026-03-15  Almuerzo        Comida      $250 ARS        │
│  2026-03-18  Hotel           Viaje       $62,512.50 ARS  │
│  2026-03-22  Supermercado    Comida      $1,500 ARS      │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  RESUMEN                                                   │
│                                                            │
│  Total Comida:      $1,750.00 ARS                         │
│  Total Viaje:       $62,512.50 ARS                        │
│                                                            │
│  ═════════════════════════════════════════════════        │
│  TOTAL GENERAL:     $64,262.50 ARS                        │
│  ═════════════════════════════════════════════════        │
│                                                            │
│  (Nota: Incluye conversión de 50 USD @ 1250.25 ARS/USD)  │
│                                                            │
│  [Exportar PDF] [Imprimir]                                │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Pantalla: Dashboard con Resumen por Moneda

```
┌─────────────────────────────────────────────────────┐
│  📊 DASHBOARD                                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────┐  ┌──────────────────┐       │
│  │ 💰 TOTAL EN ARS │  │ 💵 TOTAL EN USD  │       │
│  │                 │  │                  │       │
│  │   $64,500.00    │  │   $51.60         │       │
│  │                 │  │                  │       │
│  │ (incluyendo USD)│  │ (incluyendo ARS) │       │
│  └─────────────────┘  └──────────────────┘       │
│                                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │ GASTO POR CATEGORÍA (en ARS)                 │ │
│  │                                              │ │
│  │ Comida      ████████████░░░░░  $2,250 (5%)  │ │
│  │ Transporte  ██████████████░░░  $5,000 (10%) │ │
│  │ Viaje       ████████████████  $37,250 (85%)│ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
│  Moneda Original (Últimos 30 días):                │
│  • En ARS: $27,000                                │
│  • En USD: $150                                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 8. ESPECIFICACIÓN TÉCNICA

### 8.1 Cambios en Modelo `Expense`

```javascript
// backend/src/models/Expense.js

const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' }
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: { min: 0.01 }
  },
  // NUEVO CAMPO:
  currency: {
    type: DataTypes.ENUM('ARS', 'USD'),
    allowNull: false,
    defaultValue: 'ARS'
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'expenses',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['date'] },
    { fields: ['currency'] }  // NUEVO ÍNDICE
  ]
});
```

### 8.2 Servicio de Conversión

```javascript
// backend/src/services/currencyConversionService.js

async function convertAmount(amount, fromCurrency, toCurrency, expenseDate) {
  // Si las monedas son iguales, retornar sin cambios
  if (fromCurrency === toCurrency) {
    return { convertedAmount: amount, exchangeRate: 1, exchangeRateDate: expenseDate };
  }
  
  // Buscar cotización para la fecha exacta
  let exchangeRate = await ExchangeRate.findOne({
    where: { rate_date: expenseDate }
  });
  
  // Si no existe, buscar la siguiente más cercana
  if (!exchangeRate) {
    exchangeRate = await ExchangeRate.findOne({
      where: { rate_date: { [Op.gte]: expenseDate } },
      order: [['rate_date', 'ASC']],
      limit: 1
    });
  }
  
  if (!exchangeRate) {
    throw new Error(`No exchange rate found for date ${expenseDate} or after`);
  }
  
  let convertedAmount;
  
  if (fromCurrency === 'ARS' && toCurrency === 'USD') {
    convertedAmount = amount / exchangeRate.ars_to_usd;
  } else if (fromCurrency === 'USD' && toCurrency === 'ARS') {
    convertedAmount = amount * exchangeRate.ars_to_usd;
  }
  
  // Redondear hacia arriba (CEILING) a 2 decimales
  convertedAmount = Math.ceil(convertedAmount * 100) / 100;
  
  return {
    convertedAmount,
    exchangeRate: exchangeRate.ars_to_usd,
    exchangeRateDate: exchangeRate.rate_date
  };
}

module.exports = { convertAmount };
```

### 8.3 Endpoint: POST /api/expenses

```javascript
// backend/src/controllers/expenseController.js

async function createExpense(req, res) {
  const { description, amount, currency, category, date, notes } = req.body;
  
  // Validación
  if (!['ARS', 'USD'].includes(currency)) {
    return res.status(400).json({ error: "Moneda inválida. Use 'ARS' o 'USD'" });
  }
  
  if (amount <= 0) {
    return res.status(400).json({ error: "El monto debe ser mayor a 0" });
  }
  
  const expense = await Expense.create({
    user_id: req.user.id,
    description,
    amount,
    currency,  // ALMACENAR MONEDA ORIGINAL
    category,
    date,
    notes
  });
  
  res.status(201).json(expense);
}
```

### 8.4 Endpoint: GET /api/expenses (con conversión)

```javascript
// backend/src/controllers/expenseController.js

async function listExpenses(req, res) {
  const { currency, display_currency } = req.query;
  
  let where = { user_id: req.user.id };
  
  // Filtro por moneda
  if (currency && ['ARS', 'USD'].includes(currency)) {
    where.currency = currency;
  }
  
  const expenses = await Expense.findAll({ where });
  
  // Si se requiere conversión
  if (display_currency && display_currency !== 'original') {
    const converted = await Promise.all(
      expenses.map(async (exp) => {
        const json = exp.toJSON();
        
        if (exp.currency !== display_currency) {
          const conversion = await convertAmount(
            exp.amount,
            exp.currency,
            display_currency,
            exp.date
          );
          
          json.converted_amount = conversion.convertedAmount;
          json.converted_currency = display_currency;
          json.exchange_rate = conversion.exchangeRate;
          json.exchange_rate_date = conversion.exchangeRateDate;
        }
        
        return json;
      })
    );
    
    return res.json(converted);
  }
  
  res.json(expenses);
}
```

### 8.5 Endpoint: GET /api/expenses/convert (conversión ad-hoc)

```javascript
// backend/src/routes/expenses.js

router.get('/convert', async (req, res) => {
  const { amount, from_currency, to_currency, date } = req.query;
  
  const conversion = await convertAmount(
    parseFloat(amount),
    from_currency,
    to_currency,
    date
  );
  
  res.json({
    original_amount: amount,
    original_currency: from_currency,
    converted_amount: conversion.convertedAmount,
    converted_currency: to_currency,
    exchange_rate: conversion.exchangeRate,
    exchange_rate_date: conversion.exchangeRateDate
  });
});
```

### 8.6 Componente React: ExpenseForm

```jsx
// frontend/src/components/ExpenseForm.jsx

function ExpenseForm({ onSubmit, initialValues }) {
  const [formData, setFormData] = useState({
    description: initialValues?.description || '',
    amount: initialValues?.amount || '',
    currency: initialValues?.currency || 'ARS',  // DEFAULT ARS
    category: initialValues?.category || '',
    date: initialValues?.date || new Date().toISOString().split('T')[0],
    notes: initialValues?.notes || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!['ARS', 'USD'].includes(formData.currency)) {
      alert('Selecciona una moneda válida');
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="description"
        placeholder="Descripción"
        value={formData.description}
        onChange={handleChange}
        required
      />
      
      <div className="row">
        <input
          type="number"
          name="amount"
          placeholder="Monto"
          step="0.01"
          min="0"
          value={formData.amount}
          onChange={handleChange}
          required
        />
        
        <select
          name="currency"
          value={formData.currency}
          onChange={handleChange}
        >
          <option value="ARS">Pesos (ARS)</option>
          <option value="USD">Dólares (USD)</option>
        </select>
      </div>
      
      <select
        name="category"
        value={formData.category}
        onChange={handleChange}
      >
        <option value="">Seleccionar categoría</option>
        <option value="Comida">Comida</option>
        <option value="Transporte">Transporte</option>
        <option value="Viaje">Viaje</option>
      </select>
      
      <input
        type="date"
        name="date"
        value={formData.date}
        onChange={handleChange}
        required
      />
      
      <textarea
        name="notes"
        placeholder="Notas (opcional)"
        value={formData.notes}
        onChange={handleChange}
      />
      
      <button type="submit">Guardar Gasto</button>
    </form>
  );
}
```

---

## 9. PLAN DE IMPLEMENTACIÓN

### Fase 1: Base de Datos y Backend
- [ ] Crear migración: agregar columna `currency` a tabla `expenses`
- [ ] Crear servicio `currencyConversionService.js` con lógica de conversión
- [ ] Actualizar modelo `Expense` con campo `currency`
- [ ] Actualizar controller: POST `/api/expenses` (validar moneda)
- [ ] Actualizar controller: GET `/api/expenses` (filtro y conversión)
- [ ] Crear endpoint: GET `/api/expenses/convert`
- [ ] Crear endpoint: GET `/api/expenses/:id` (con conversión)
- [ ] Tests unitarios para conversión (ARS→USD, USD→ARS)
- [ ] Tests de integración para endpoints

### Fase 2: Frontend - Formularios
- [ ] Actualizar `ExpenseForm.jsx`: agregar selector de moneda
- [ ] Actualizar `ExpenseModal.jsx`: muestra moneda original
- [ ] Validación frontend de moneda
- [ ] Tests de componentes

### Fase 3: Frontend - Visualización
- [ ] Actualizar listado de gastos: mostrar moneda original
- [ ] Agregar filtro por moneda en listado
- [ ] Agregar selector "Mostrar en" (Moneda original / ARS / USD)
- [ ] Implementar conversión en tiempo real al cambiar selector
- [ ] Mostrar totales por moneda en listado
- [ ] Tests de interacción

### Fase 4: Reportes y Gráficos
- [ ] Actualizar generador de reportes: soporte de `display_currency`
- [ ] Agregar selector de moneda en reportes
- [ ] Calcular subtotales por moneda
- [ ] Actualizar gráficos: soporte de conversión
- [ ] Agregar selector de moneda en gráficos
- [ ] Tests de reportes con conversión

### Fase 5: Dashboard
- [ ] Actualizar dashboard: mostrar totales en ARS y USD
- [ ] Agregar resumen por moneda original
- [ ] Agregar gráfico de moneda original vs equivalentes
- [ ] Tests del dashboard

### Fase 6: Testing y Documentación
- [ ] Tests end-to-end de flujos completos
- [ ] Testing con cotizaciones faltantes
- [ ] Performance testing con 1000+ gastos mixtos
- [ ] Documentación de APIs
- [ ] Documentación para usuarios

---

## 10. RELACIÓN CON OTROS REQUERIMIENTOS

- **Depende de REQ-003** (Control de Cotizaciones): necesita tabla `exchange_rates` y cotizaciones disponibles
- **Complementa REQ-001** (Reportes): reportes usarán conversión de monedas
- **Requerirá migración en REQ-002** (Versionado BD): nueva columna en `expenses`

---

## 11. CONSIDERACIONES ESPECIALES

- **Retrocompatibilidad**: Gastos existentes sin `currency` serán tratados como ARS
- **Migración de datos**: Todos los gastos históricos recibirán `currency='ARS'` por defecto
- **Rendimiento**: Las conversiones se hacen en lectura, no en escritura (optimiza inserciones)
- **Fallback**: Si no existe cotización exacta, usar la siguiente disponible (nunca bloquear)
- **Precisión**: El redondeo siempre es hacia arriba (CEILING) para favorecer la precisión
- **Auditoría**: No registrar cada conversión; registrar solo cambios de moneda en edición
- **UX**: El selector de moneda debe ser prominente pero intuitivo (no confundir con categoría)

---

## 12. INTEGRACIONES CON OTRAS FUNCIONALIDADES

- Reportes mensuales/anuales pueden agrupar por moneda original o mostrar todo convertido
- Dashboard mostrará salud financiera en ambas monedas
- Gráficos de gastos por categoría pueden mostrarse en cualquier moneda
- Búsqueda/filtrado de gastos puede incluir rango de monedas
- Exportación a CSV incluirá moneda original y opcional conversión
- API de integración terceros (si existe) deberá especificar moneda en requests

---

**Última actualización**: 2026-04-08
**Versión**: 1.0
