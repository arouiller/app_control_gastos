# Especificación: Sistema de Gastos Borrador

**Fecha**: 2026-06-18  
**Autores**: Alejandro Rouiller  
**Estado**: Draft → Review

---

## 📋 Resumen Ejecutivo

Se implementará un sistema de **gastos borrador** que permita al usuario registrar gastos preliminares de forma editable antes de convertirlos en gastos definitivos. Los borradores se almacenan en una tabla separada y pueden ser editados completamente. Una vez confirmados, se convierten a `Expense` con todas sus cuotas asociadas siguiendo la lógica actual.

**Motivación**: Facilitar entrada de datos incrementales y permitir auditoría de origen cuando se integre con terceras aplicaciones (futuro).

---

## 🎯 Requisitos Funcionales

### RF1: Crear Gasto Borrador
- El usuario puede crear un gasto borrador ingresando:
  - `descripcion` (string, requerido)
  - `monto_total` (decimal, requerido, > 0)
  - `moneda` (enum: ARS, USD, requerido)
  - `medio_de_pago` (enum: efectivo, tarjeta, requerido)
  - `cantidad_de_cuotas` (integer, requerido, 1-24)
  - `valor_de_la_cuota` (decimal, requerido, > 0)
  - `expense_date` (date, requerido)
- El borrador se crea con `status='draft'`
- Se valida que no haya discrepancia matemática (si la hay, se alerta pero se acepta)

### RF2: Listar Gastos Borrador
- El usuario ve listado de sus borradores (paginado)
- Filtro por `status` (draft, convertido)
- Mostrar: descripcion, monto_total, moneda, cantidad_cuotas, fecha, estado
- Botones: Editar, Convertir, Eliminar (solo si draft)

### RF3: Editar Gasto Borrador
- Solo borradores con `status='draft'` pueden editarse
- Al cambiar `monto_total` o `cantidad_de_cuotas`, recalcula automáticamente `valor_de_la_cuota`
- Si usuario cambia `valor_de_la_cuota`, se valida contra total/cuotas
- Mostrar advertencia si hay inconsistencia

### RF4: Convertir a Gasto Definitivo
- Usuario clickea "Convertir" en un borrador draft
- Sistema crea un `Expense` con los datos
- Si `cantidad_de_cuotas > 1`, crea `Installment` records (con fechas de vencimiento progresivas)
- Marca borrador como `status='convertido'`, guarda `expense_id` y `converted_at`
- Redirige a lista de borradores

### RF5: Eliminar Gasto Borrador
- Solo borradores con `status='draft'` pueden eliminarse
- Soft delete o hard delete (a definir en implementación, recomendado hard delete para borradores)

---

## 🏗️ Requisitos Técnicos

### RT1: Modelo de Datos

**Tabla: `gastos_borrador`**
```sql
CREATE TABLE gastos_borrador (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  monto_total DECIMAL(12,2) NOT NULL,
  moneda ENUM('ARS', 'USD') NOT NULL,
  medio_de_pago ENUM('efectivo', 'tarjeta') NOT NULL,
  cantidad_de_cuotas INT NOT NULL CHECK (cantidad_de_cuotas BETWEEN 1 AND 24),
  valor_de_la_cuota DECIMAL(12,2) NOT NULL,
  expense_date DATE NOT NULL,
  status ENUM('draft', 'convertido') NOT NULL DEFAULT 'draft',
  expense_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  converted_at TIMESTAMP DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

**Relaciones**:
- `gastos_borrador.user_id` → `users.id` (1:N)
- `gastos_borrador.expense_id` → `expenses.id` (1:1, nullable)

### RT2: API REST Endpoints

#### POST /api/gastos-borrador
**Descripción**: Crear un nuevo gasto borrador  
**Auth**: JWT requerido  
**Request Body**:
```json
{
  "descripcion": "Compra en supermercado",
  "monto_total": 1200.50,
  "moneda": "ARS",
  "medio_de_pago": "tarjeta",
  "cantidad_de_cuotas": 3,
  "valor_de_la_cuota": 400.17,
  "expense_date": "2026-06-18"
}
```

**Response (201)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 5,
    "descripcion": "Compra en supermercado",
    "monto_total": 1200.50,
    "moneda": "ARS",
    "medio_de_pago": "tarjeta",
    "cantidad_de_cuotas": 3,
    "valor_de_la_cuota": 400.17,
    "expense_date": "2026-06-18",
    "status": "draft",
    "expense_id": null,
    "created_at": "2026-06-18T10:30:00Z",
    "updated_at": "2026-06-18T10:30:00Z",
    "converted_at": null,
    "inconsistency_warning": "Suma de cuotas ($1200.51) difiere de monto total ($1200.50)"
  }
}
```

**Validaciones**:
- `descripcion`: no vacío, max 255 chars
- `monto_total`: > 0, max 2 decimales
- `cantidad_de_cuotas`: 1-24
- `valor_de_la_cuota`: > 0, max 2 decimales
- `expense_date`: no puede ser futura (validar según business logic)
- Detectar inconsistencia: `valor_de_la_cuota * cantidad_de_cuotas ≠ monto_total` → warning (no error)

---

#### GET /api/gastos-borrador
**Descripción**: Listar gastos borrador del usuario autenticado  
**Auth**: JWT requerido  
**Query Params**:
- `status` (optional): 'draft' | 'convertido'
- `page` (optional): número de página (default: 1)
- `limit` (optional): items por página (default: 20)
- `sort` (optional): 'created_at' | 'monto_total' (default: '-created_at')

**Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "descripcion": "Compra en supermercado",
      "monto_total": 1200.50,
      "moneda": "ARS",
      "medio_de_pago": "tarjeta",
      "cantidad_de_cuotas": 3,
      "valor_de_la_cuota": 400.17,
      "expense_date": "2026-06-18",
      "status": "draft",
      "expense_id": null,
      "created_at": "2026-06-18T10:30:00Z",
      "converted_at": null
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

---

#### GET /api/gastos-borrador/:id
**Descripción**: Obtener detalles de un gasto borrador  
**Auth**: JWT requerido  
**Validación**: user_id del token debe coincidir con owner del borrador

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 5,
    "descripcion": "Compra en supermercado",
    "monto_total": 1200.50,
    "moneda": "ARS",
    "medio_de_pago": "tarjeta",
    "cantidad_de_cuotas": 3,
    "valor_de_la_cuota": 400.17,
    "expense_date": "2026-06-18",
    "status": "draft",
    "expense_id": null,
    "created_at": "2026-06-18T10:30:00Z",
    "updated_at": "2026-06-18T10:30:00Z",
    "converted_at": null,
    "inconsistency_warning": null
  }
}
```

**Errores**:
- 404: Borrador no encontrado
- 403: No autorizado (no es el propietario)

---

#### PUT /api/gastos-borrador/:id
**Descripción**: Editar un gasto borrador (solo si status='draft')  
**Auth**: JWT requerido  
**Validación**: user_id del token debe coincidir con owner + status debe ser 'draft'

**Request Body** (todos campos opcionales, se actualiza solo lo enviado):
```json
{
  "descripcion": "Compra en supermercado - actualizado",
  "monto_total": 1300.00,
  "cantidad_de_cuotas": 4
}
```

**Response (200)**: Objeto GastoBorrador actualizado (igual que GET :id)

**Recálculos automáticos**:
- Si cambian `monto_total` o `cantidad_de_cuotas` → recalcula `valor_de_la_cuota = monto_total / cantidad_de_cuotas`
- Si cambia `valor_de_la_cuota` → se valida pero no recalcula otros campos

**Errores**:
- 400: Validación fallida
- 403: Status no es 'draft' o no autorizado
- 404: Borrador no encontrado

---

#### DELETE /api/gastos-borrador/:id
**Descripción**: Eliminar un gasto borrador (solo si status='draft')  
**Auth**: JWT requerido  
**Validación**: user_id del token + status='draft'

**Response (200)**:
```json
{
  "success": true,
  "message": "Gasto borrador eliminado"
}
```

**Errores**:
- 403: Status no es 'draft' o no autorizado
- 404: Borrador no encontrado

---

#### POST /api/gastos-borrador/:id/convertir
**Descripción**: Convertir gasto borrador a gasto definitivo  
**Auth**: JWT requerido  
**Validación**: user_id del token + status='draft'

**Request Body**: (vacío)

**Response (201)**:
```json
{
  "success": true,
  "data": {
    "expense": {
      "id": 42,
      "user_id": 5,
      "descripcion": "Compra en supermercado",
      "amount": 1200.50,
      "currency": "ARS",
      "payment_method": "tarjeta",
      "expense_date": "2026-06-18",
      "is_installment": true,
      "num_installments": 3,
      "created_at": "2026-06-18T10:35:00Z"
    },
    "installments": [
      {
        "id": 101,
        "expense_id": 42,
        "installment_number": 1,
        "amount": 400.17,
        "due_date": "2026-07-18",
        "is_paid": false
      },
      {
        "id": 102,
        "expense_id": 42,
        "installment_number": 2,
        "amount": 400.17,
        "due_date": "2026-08-18",
        "is_paid": false
      },
      {
        "id": 103,
        "expense_id": 42,
        "installment_number": 3,
        "amount": 400.16,
        "due_date": "2026-09-18",
        "is_paid": false
      }
    ],
    "gasto_borrador_actualizado": {
      "id": 1,
      "status": "convertido",
      "expense_id": 42,
      "converted_at": "2026-06-18T10:35:00Z"
    }
  }
}
```

**Lógica de conversión** (transacción):
1. Validar que `status='draft'`
2. Crear `Expense` con campos: `descripcion`, `amount=monto_total`, `currency=moneda`, `payment_method=medio_de_pago`, `expense_date`
3. Si `cantidad_de_cuotas > 1`:
   - `is_installment=true`, `num_installments=cantidad_de_cuotas`
   - Generar `cantidad_de_cuotas` registros `Installment`:
     - Fechas: primera el próximo mes de `expense_date`, luego cada mes
     - Montos: distribuir `monto_total` (últimas cuota puede tener decimales diferentes)
4. Actualizar `gastos_borrador`:
   - `status='convertido'`
   - `expense_id=<id del Expense creado>`
   - `converted_at=now`
5. Commit transacción o rollback si falla

**Errores**:
- 400: Validación fallida (ej: monto_total <= 0 después de conversión)
- 403: Status no es 'draft' o no autorizado
- 404: Borrador no encontrado
- 500: Error en BD al crear Expense o Installments

---

### RT3: Validación de Entrada (Schema)

**Zod Schema (Frontend)** en `frontend/src/utils/schemas/gastoBorradorSchema.js`:
```javascript
const gastoBorradorSchema = z.object({
  descripcion: z.string().min(1).max(255),
  monto_total: z.number().gt(0),
  moneda: z.enum(['ARS', 'USD']),
  medio_de_pago: z.enum(['efectivo', 'tarjeta']),
  cantidad_de_cuotas: z.number().int().min(1).max(24),
  valor_de_la_cuota: z.number().gt(0),
  expense_date: z.string().date()
});
```

**Joi Schema (Backend)** en `backend/src/middleware/schemas/gastoBorradorSchema.js`:
```javascript
const schema = Joi.object({
  descripcion: Joi.string().required().max(255),
  monto_total: Joi.number().required().positive().precision(2),
  moneda: Joi.string().required().valid('ARS', 'USD'),
  medio_de_pago: Joi.string().required().valid('efectivo', 'tarjeta'),
  cantidad_de_cuotas: Joi.number().required().integer().min(1).max(24),
  valor_de_la_cuota: Joi.number().required().positive().precision(2),
  expense_date: Joi.date().required().max('now')
});
```

---

### RT4: Seguridad

- ✅ **Autenticación**: Todos los endpoints requieren JWT válido
- ✅ **Autorización**: Solo el propietario (user_id del token) puede editar/convertir/eliminar sus borradores
- ✅ **Validación**: Backend valida todos los datos (frontend es solo UX)
- ✅ **SQL Injection**: Sequelize ORM previene (parameterized queries)
- ✅ **Rate Limiting**: Aplicar a endpoint de conversión (puede ser costoso)

---

## 📐 Arquitectura

### Backend

**Directorios**:
```
backend/src/
├── models/
│   └── GastoBorrador.js
├── controllers/
│   └── gastoBorradorController.js
├── routes/
│   └── gastos-borrador.js
└── middleware/
    └── schemas/
        └── gastoBorradorSchema.js
```

**GastoBorrador.js** (Sequelize Model):
- Attributes: id, user_id, descripcion, monto_total, moneda, medio_de_pago, cantidad_de_cuotas, valor_de_la_cuota, expense_date, status, expense_id, created_at, updated_at, converted_at
- Associations: belongsTo(User), belongsTo(Expense)
- Validations: constraints en DB + hooks de Sequelize si es necesario

**gastoBorradorController.js**:
- `create()` - POST /api/gastos-borrador
- `list()` - GET /api/gastos-borrador
- `getById()` - GET /api/gastos-borrador/:id
- `update()` - PUT /api/gastos-borrador/:id
- `delete()` - DELETE /api/gastos-borrador/:id
- `convertir()` - POST /api/gastos-borrador/:id/convertir

**gastos-borrador.js** (Routes):
- Protegidas con middleware auth
- Validación de schema en middleware
- Ownership check en operaciones de edición

---

### Frontend

**Directorios**:
```
frontend/src/
├── pages/
│   └── GastosBorrador.jsx
├── components/
│   └── GastoBorradorForm.jsx
├── store/
│   └── gastoBorradoresSlice.js
├── services/
│   └── gastoBorradorService.js
└── utils/
    └── schemas/
        └── gastoBorradorSchema.js
```

**GastosBorrador.jsx** (Page):
- Tabla de borradores con filtros (draft/convertido)
- Paginación
- Botones: Crear (modal), Editar (modal), Convertir (confirmación), Eliminar (confirmación)
- Loading states y error handling

**GastoBorradorForm.jsx** (Component):
- Modal con formulario (crear/editar)
- Recálculo automático de campos en tiempo real
- Advertencia de inconsistencia
- Validación Zod en onChange + onSubmit

**gastoBorradoresSlice.js** (Redux):
- State: `borradores[]`, `loading`, `error`, `filters`
- Actions: `fetchBorradores`, `createBorrador`, `updateBorrador`, `deleteBorrador`, `convertirBorrador`

**gastoBorradorService.js**:
- API calls: `create()`, `getAll()`, `getById()`, `update()`, `delete()`, `convertir()`

---

## 🔄 Flujos Principales

### Flujo 1: Crear Gasto Borrador
```
Usuario click "Nuevo Borrador"
    ↓
Abre GastoBorradorForm modal (modo create)
    ↓
Usuario ingresa: descripcion, monto_total, moneda, etc.
    ↓
Form valida onChange con Zod
    ↓
Usuario cambio monto_total → recalcula valor_de_la_cuota
    ↓
Si inconsistencia → muestra badge "⚠ Inconsistencia"
    ↓
Usuario click "Guardar"
    ↓
POST /api/gastos-borrador
    ↓
Backend valida schema (Joi)
    ↓
Detecta inconsistencia → incluye warning en response
    ↓
Crea GastoBorrador con status='draft'
    ↓
Frontend: dispatch(createBorrador)
    ↓
Redux actualiza lista
    ↓
Tabla se refresca
    ↓
Modal cierra
    ↓
Toast: "Gasto borrador creado"
```

### Flujo 2: Convertir a Gasto Definitivo
```
Usuario ve borrador en status='draft'
    ↓
Usuario click "Convertir"
    ↓
Modal confirmación: "¿Convertir a gasto definitivo?"
    ↓
Si confirma:
    ↓
POST /api/gastos-borrador/:id/convertir
    ↓
Backend transacción:
  1. Validar status='draft'
  2. Crear Expense
  3. Si num_installments > 1: crear Installment records
  4. Actualizar GastoBorrador (status, expense_id, converted_at)
    ↓
Si éxito: Response con Expense + Installments + GastoBorrador actualizado
    ↓
Frontend: dispatch(convertirBorrador)
    ↓
Redux actualiza lista (marca como convertido)
    ↓
Toast: "Convertido a gasto definitivo"
    ↓
Redirige a lista (opcional: mostrar link al gasto creado)
```

---

## ✅ Consideraciones de Implementación

1. **Recálculo automático**: Frontend usa `useMemo` o `useEffect` para evitar re-cálculos innecesarios
2. **Transacción en conversión**: Backend debe usar transacción explícita para garantizar consistencia
3. **Validación de expense_date**: Considerar si permite fechas pasadas (ej: escanear factura vieja)
4. **Soft delete vs Hard delete**: Borradores son temporales, hard delete es aceptable
5. **Auditoría**: El borrador conserva el histórico (created_at, updated_at, converted_at)
6. **Migraciones**: Incluir creación de tabla `gastos_borrador` en migraciones

---

## 📚 Notas Futuras

- **Integración de terceros**: Cuando se implemente API_KEY, este endpoint recibirá borradores vía autenticación por API_KEY (no JWT)
- **Importación masiva**: Endpoint batch POST para crear múltiples borradores
- **Estados adicionales**: Considerar `'rechazado'` en futuro si hay flujo de aprobación

---

**Versión**: 1.0  
**Última actualización**: 2026-06-18
