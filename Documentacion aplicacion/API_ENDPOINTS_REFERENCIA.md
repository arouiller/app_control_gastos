# Referencia Rápida de Endpoints API

**Base URL**: `http://localhost:5000/api` (desarrollo) | `https://api.tudominio.com/api` (producción)

**Autenticación**: JWT Bearer Token en header `Authorization: Bearer <token>`

---

## 🔐 AUTENTICACIÓN (Sin autenticación requerida)

### 📝 POST `/auth/register`
Registrar nuevo usuario

**Request Body**:
```json
{
  "email": "usuario@example.com",
  "password": "MiPassword123!",
  "name": "Juan Pérez"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "usuario@example.com",
    "name": "Juan Pérez"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

**Errores**:
- 400: Email ya registrado / Validación fallida
- 500: Error interno

---

### 🔑 POST `/auth/login`
Inicia sesión

**Request Body**:
```json
{
  "email": "usuario@example.com",
  "password": "MiPassword123!"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "usuario@example.com",
    "name": "Juan Pérez"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

**Errores**:
- 400: Credenciales inválidas
- 404: Usuario no encontrado
- 429: Demasiados intentos (rate limit)

---

### 🔄 POST `/auth/refresh-token`
Renovar access token usando refresh token

**Request Body**:
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response** (200):
```json
{
  "success": true,
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

### 🚪 POST `/auth/logout`
Cerrar sesión

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "message": "Sesión cerrada"
}
```

---

### 🔓 POST `/auth/forgot-password`
Solicitar recuperación de contraseña

**Request Body**:
```json
{
  "email": "usuario@example.com"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Email de recuperación enviado"
}
```

---

## 👤 USUARIOS (Autenticación requerida)

### 👤 GET `/users/profile`
Obtener perfil del usuario actual

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "usuario@example.com",
    "name": "Juan Pérez",
    "profilePictureUrl": "https://...",
    "createdAt": "2026-04-07T10:00:00Z"
  }
}
```

---

### ✏️ PUT `/users/profile`
Actualizar perfil de usuario

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "Juan Carlos Pérez",
  "profilePictureUrl": "https://..."
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Perfil actualizado",
  "data": { ... }
}
```

---

### 🔐 PUT `/users/password`
Cambiar contraseña

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "currentPassword": "MiPassword123!",
  "newPassword": "NuevaPassword456!"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Contraseña actualizada"
}
```

---

## 🏷️ CATEGORÍAS (Autenticación requerida)

### 📂 GET `/categories`
Listar todas las categorías del usuario

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `includeInactive` (boolean): Incluir categorías inactivas

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Alimentación",
      "color": "#FF6B6B",
      "icon": "utensils",
      "description": "Comidas, alimentos, restaurantes",
      "createdAt": "2026-04-07T10:00:00Z"
    }
  ]
}
```

---

### ➕ POST `/categories`
Crear nueva categoría

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "Gastos Médicos",
  "color": "#FF6B6B",
  "icon": "stethoscope",
  "description": "Medicinas, doctores, etc."
}
```

**Response** (201):
```json
{
  "success": true,
  "data": { ... }
}
```

---

### ✏️ PUT `/categories/:id`
Editar categoría

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "Gastos Médicos",
  "color": "#FF8B8B",
  "icon": "hospital"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Categoría actualizada",
  "data": { ... }
}
```

---

### 🗑️ DELETE `/categories/:id`
Eliminar categoría (solo si no tiene gastos)

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "message": "Categoría eliminada"
}
```

**Errores**:
- 409: No se puede eliminar, tiene gastos asociados

---

## 💰 GASTOS (Autenticación requerida)

### 📊 GET `/expenses`
Listar gastos con filtros

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
```
?startDate=2026-04-01&endDate=2026-04-30    // Filtro por fecha (ISO format)
&categoryId=1                                 // Filtro por categoría
&paymentMethod=credit_card                    // cash o credit_card
&minAmount=10&maxAmount=100                   // Rango de monto
&search=pizza                                 // Búsqueda en descripción
&page=1&limit=20                              // Paginación
&sort=-date                                   // Ordenar (-fecha desc, +fecha asc)
```

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "description": "Pizza para la oficina",
      "amount": 45.99,
      "date": "2026-04-07",
      "categoryId": 1,
      "categoryName": "Alimentación",
      "paymentMethod": "credit_card",
      "isInstallment": false,
      "installmentGroupId": null,
      "notes": "Reunión de equipo",
      "createdAt": "2026-04-07T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

---

### ➕ POST `/expenses`
Crear nuevo gasto

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "description": "Pizza para la oficina",
  "amount": 45.99,
  "date": "2026-04-07",
  "categoryId": 1,
  "paymentMethod": "credit_card",
  "notes": "Reunión de equipo"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Gasto registrado",
  "data": { ... }
}
```

---

### 🔍 GET `/expenses/:id`
Obtener gasto específico

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "data": { ... }
}
```

---

### ✏️ PUT `/expenses/:id`
Editar gasto

**Headers**: `Authorization: Bearer <token>`

**Request Body**: (igual a POST, campos opcionales)
```json
{
  "description": "Pizza para reunión",
  "amount": 50.00
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Gasto actualizado",
  "data": { ... }
}
```

---

### 🗑️ DELETE `/expenses/:id`
Eliminar gasto

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "message": "Gasto eliminado"
}
```

---

## 📋 CUOTAS/PAGOS EN CUOTAS (Autenticación requerida)

### ➕ POST `/expenses/installment`
Crear gasto en cuotas

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "description": "Laptop nueva",
  "amount": 1200.00,
  "date": "2026-04-07",
  "categoryId": 5,
  "paymentMethod": "credit_card",
  "numberOfInstallments": 12,
  "notes": "Comprada en tienda electrónica"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Gasto en cuotas registrado",
  "data": {
    "installmentGroupId": 10,
    "mainExpense": { ... },
    "installments": [
      {
        "id": 1,
        "installmentNumber": 1,
        "amount": 100.00,
        "dueDate": "2026-05-07",
        "isPaid": false
      }
    ]
  }
}
```

---

### 📋 GET `/installments`
Listar cuotas pendientes

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
```
?includeAllCuotas=false     // true para ver todas, false solo pendientes
&page=1&limit=20
```

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "expenseId": 5,
      "description": "Laptop nueva",
      "amount": 100.00,
      "dueDate": "2026-05-07",
      "installmentNumber": 1,
      "totalInstallments": 12,
      "isPaid": false,
      "paidDate": null
    }
  ]
}
```

---

### ✅ PUT `/installments/:id/pay`
Marcar cuota como pagada

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "paymentDate": "2026-05-07",
  "notes": "Pagada con tarjeta"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Cuota marcada como pagada",
  "data": { ... }
}
```

---

### ❌ PUT `/installments/:id/unpay`
Marcar cuota como no pagada

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "message": "Cuota marcada como no pagada",
  "data": { ... }
}
```

---

### 🗑️ DELETE `/installments/:id`
Eliminar una cuota

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "message": "Cuota eliminada"
}
```

---

## 📊 ANALYTICS Y REPORTES (Autenticación requerida)

### 📈 GET `/analytics/summary`
Resumen de gastos del período

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
```
?startDate=2026-04-01&endDate=2026-04-30
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2026-04-01",
      "endDate": "2026-04-30"
    },
    "totalExpenses": 2345.67,
    "totalTransactions": 34,
    "averageDaily": 78.19,
    "cashTotal": 500.00,
    "cardTotal": 1845.67,
    "cashPercentage": 21.33,
    "cardPercentage": 78.67,
    "comparisonWithPreviousMonth": {
      "difference": -150.00,
      "percentageChange": -6.01
    }
  }
}
```

---

### 📊 GET `/analytics/by-category`
Consumo por categoría

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
```
?startDate=2026-04-01&endDate=2026-04-30
```

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "categoryId": 1,
      "categoryName": "Alimentación",
      "color": "#FF6B6B",
      "totalAmount": 450.00,
      "percentage": 19.19,
      "transactionCount": 12,
      "averageTransaction": 37.50
    },
    {
      "categoryId": 2,
      "categoryName": "Transporte",
      "color": "#4ECDC4",
      "totalAmount": 300.00,
      "percentage": 12.79,
      "transactionCount": 8
    }
  ],
  "totalExpenses": 2345.67
}
```

---

### 💳 GET `/analytics/cash-vs-card`
Comparativo efectivo vs tarjeta

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
```
?startDate=2026-04-01&endDate=2026-04-30
&groupBy=week    // day, week, month
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "summary": {
      "cashTotal": 500.00,
      "cardTotal": 1845.67,
      "grandTotal": 2345.67,
      "cashPercentage": 21.33,
      "cardPercentage": 78.67
    },
    "timeline": [
      {
        "date": "2026-04-01",
        "cash": 50.00,
        "card": 200.00,
        "total": 250.00
      }
    ]
  }
}
```

---

### ⏳ GET `/analytics/pending-installments`
Cuotas pendientes próximas

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
```
?daysAhead=30    // Cuotas en los próximos N días
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "totalPending": 5,
    "totalAmount": 500.00,
    "installments": [
      {
        "id": 1,
        "expenseId": 10,
        "description": "Laptop nueva",
        "amount": 100.00,
        "dueDate": "2026-04-10",
        "daysUntilDue": 3,
        "installmentNumber": 2,
        "totalInstallments": 12
      }
    ]
  }
}
```

---

### 📥 GET `/reports/download`
Descargar reporte en PDF

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
```
?startDate=2026-04-01&endDate=2026-04-30
&format=pdf    // pdf, csv (futuro)
```

**Response** (200):
- Content-Type: `application/pdf`
- File: `reporte_gastos_2026_04.pdf`

---

## ⚠️ CÓDIGOS DE RESPUESTA ESTÁNDAR

| Código | Significado |
|--------|-------------|
| **200** | OK - Solicitud exitosa |
| **201** | Created - Recurso creado exitosamente |
| **400** | Bad Request - Datos inválidos |
| **401** | Unauthorized - Token inválido o expirado |
| **403** | Forbidden - No tiene permisos |
| **404** | Not Found - Recurso no encontrado |
| **409** | Conflict - Conflicto (ej: eliminar categoría con gastos) |
| **429** | Too Many Requests - Rate limit excedido |
| **500** | Internal Server Error - Error del servidor |
| **503** | Service Unavailable - Servidor no disponible |

---

## 📋 ESTRUCTURA DE RESPUESTAS

### Respuesta Exitosa
```json
{
  "success": true,
  "data": { ... },
  "message": "Operación completada"
}
```

### Respuesta con Error
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Email ya registrado",
    "details": {
      "field": "email"
    }
  }
}
```

---

## 🔄 PAGINACIÓN

Endpoints que listan datos soportan paginación:

**Query Parameters**:
```
?page=1        // Página actual (default: 1)
&limit=20      // Resultados por página (default: 20, max: 100)
&sort=-date    // Campo y dirección (-desc, +asc)
```

**Response incluye**:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## 🔑 AUTENTICACIÓN JWT

### Obtener Token
1. Registrarse o hacer login en `/auth/register` o `/auth/login`
2. Recibir `accessToken` y `refreshToken`

### Usar Token
Incluir en header `Authorization`:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Renovar Token
Cuando `accessToken` expira (15 min), usar `refreshToken` en:
```
POST /auth/refresh-token
{ "refreshToken": "..." }
```

### Token Expiración
- **Access Token**: 15 minutos
- **Refresh Token**: 7 días
- **Sesión Inactiva**: 30 minutos de timeout

---

## 🔒 RESTRICCIONES DE SEGURIDAD

- Solo usuarios autenticados pueden acceder a `/users`, `/expenses`, `/categories`, `/analytics`
- Cada usuario solo ve sus propios datos
- Rate limiting: máximo 5 intentos de login cada 15 minutos
- Compresión GZIP automática en respuestas
- CORS habilitado solo para `FRONTEND_URL` configurado

---

## 🧪 EJEMPLOS CON cURL

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "MiPassword123!"
  }'
```

### Crear Gasto
```bash
curl -X POST http://localhost:5000/api/expenses \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Pizza",
    "amount": 45.99,
    "date": "2026-04-07",
    "categoryId": 1,
    "paymentMethod": "credit_card"
  }'
```

### Listar Gastos Filtrados
```bash
curl "http://localhost:5000/api/expenses?startDate=2026-04-01&endDate=2026-04-30&categoryId=1" \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## 📚 DOCUMENTACIÓN ADICIONAL

- **REQUERIMIENTOS.md**: Especificación funcional completa
- **SEGURIDAD_Y_MEJORES_PRACTICAS.md**: Detalles de seguridad
- **Swagger/OpenAPI**: Documentación interactiva (futuro)

---

**Última actualización**: Abril 2026

**Versión API**: 1.0.0

*Esta referencia se actualiza con cada nueva funcionalidad agregada.*
