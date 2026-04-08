# REQ-003: Control de Cotizaciones ARS/USD

**ID Requerimiento**: REQ-003  
**Versión**: 1.0  
**Fecha de Creación**: 2026-04-08  
**Estado**: En Diseño  
**Prioridad**: Alta  

---

## 1. DESCRIPCIÓN GENERAL

El sistema debe mantener un histórico de cotizaciones diarias de ARS (Peso Argentino) y USD (Dólar Estadounidense). Esto permitirá realizar conversiones de moneda en reportes y gastos con el tipo de cambio vigente en la fecha del movimiento. Se requiere:

- Obtención automática diaria de cotización a las 22:00 horas
- Capacidad de cargar histórico manual (últimos 12 meses)
- Registro de todas las operaciones en logs
- Posibilidad de sobrescribir cotizaciones existentes

---

## 2. REQUERIMIENTOS FUNCIONALES

### 2.1 Modelo de Datos

- **RF-301**: El sistema debe mantener tabla `exchange_rates` con cotizaciones diarias
  - Campos: `id` (INT), `rate_date` (DATE), `ars_to_usd` (DECIMAL), `created_at` (TIMESTAMP), `updated_at` (TIMESTAMP)
  - Clave única: `(rate_date)` - una cotización por día
  - Índice: en `rate_date` para búsquedas rápidas
  - Rango histórico: mínimo últimos 12 meses

- **RF-302**: El sistema debe mantener tabla `exchange_rate_logs` para auditoría
  - Campos: `id` (INT), `operation_type` (ENUM), `rate_date` (DATE), `old_rate` (DECIMAL), `new_rate` (DECIMAL), `source` (VARCHAR), `status` (ENUM), `error_message` (TEXT), `executed_at` (TIMESTAMP), `executed_by` (VARCHAR)
  - `operation_type`: 'daily_fetch', 'historical_load', 'manual_update'
  - `source`: 'cron_job', 'admin_interface', 'api_call'
  - `status`: 'success', 'failed', 'skipped'
  - Registro inmutable de todas las operaciones

### 2.2 Obtención Automática Diaria

- **RF-303**: El sistema debe ejecutar tarea cron a las 22:00 horas de cada día
  - Obtener cotización actual ARS/USD de fuente externa (API)
  - Si la fecha ya existe, sobrescribir el valor
  - Registrar resultado en `exchange_rate_logs` con status success/failed
  - Mantener reintentos automáticos si falla (máximo 3 intentos)

- **RF-304**: La cotización debe obtenerse de API confiable
  - Opciones recomendadas: Open Exchange Rates, BCRA (API oficial Argentina), Fixer.io
  - Implementar con retry logic y timeout (máximo 30 segundos)
  - Grabar en log si API no responde
  - Usar cotización anterior como fallback si está disponible

- **RF-305**: La tarea cron debe ser idempotente
  - Si ya se ejecutó hoy, no ejecutar nuevamente
  - Validar que no se dupliquen ejecuciones
  - Permitir ejecución manual desde admin

### 2.3 Carga Histórica Manual

- **RF-306**: Debe existir endpoint en API para carga histórica
  - Parámetros: `fecha_desde` (DATE), `fecha_hasta` (DATE)
  - Valores por defecto: `fecha_desde` = hoy - 1 año, `fecha_hasta` = hoy
  - Validación: `fecha_desde` <= `fecha_hasta`, ambas en formato YYYY-MM-DD
  - Respuesta: array de cotizaciones obtenidas

- **RF-307**: El proceso de carga histórica debe registrar cada operación
  - Log de inicio y fin del proceso
  - Registrar éxito/fallo para cada fecha procesada
  - Contar total de registros procesados, insertados, actualizados
  - Mostrar cualquier error encontrado

- **RF-308**: La carga histórica debe obtener datos de API
  - Usar misma fuente que cron job
  - Implementar delay entre requests para no saturar API (ej: 1 segundo)
  - Registrar en log si alguna fecha no pudo obtenerse
  - Permitir continuar con siguientes fechas si una falla

- **RF-309**: Debe existir interfaz en admin panel para carga histórica
  - Formulario con campos: `fecha_desde`, `fecha_hasta`
  - Botón "Cargar Histórico"
  - Pre-llenar con valores por defecto (hoy - 1 año a hoy)
  - Mostrar progreso durante ejecución
  - Mostrar resumen de resultados al completar

### 2.4 Logging y Auditoría

- **RF-310**: Todas las operaciones de cotización deben registrarse en logs
  - Timestamp exacto de operación
  - Usuario que ejecutó (para operaciones manuales)
  - Resultado: success, failed, skipped
  - Detalles del error si aplica
  - Valor anterior y nuevo de cotización

- **RF-311**: Los logs deben ser consultables desde admin panel
  - Vista con filtros: fecha, tipo de operación, status
  - Orden descendente por timestamp
  - Mostrar último resultado para cada fecha

- **RF-312**: Sistema debe generar alertas si cron falla
  - Si 3 intentos fallan consecutivamente, registrar alerta
  - Notificar a administrador (log visible en dashboard)
  - Permitir intervención manual

### 2.5 Sobrescritura de Datos

- **RF-313**: Ambas operaciones (cron y manual) pueden sobrescribir cotizaciones
  - Si `rate_date` ya existe en tabla, actualizar `ars_to_usd`
  - Guardar valor anterior en log
  - Permitir correcciones posteriores
  - No borrar registros, solo actualizar

---

## 3. REQUERIMIENTOS NO FUNCIONALES

- **RNF-301**: La obtención diaria debe completarse en menos de 30 segundos
- **RNF-302**: La carga histórica debe procesar 365 días en menos de 10 minutos
- **RNF-303**: Queries de búsqueda de cotización deben tomar < 50ms
- **RNF-304**: Los logs deben ser inmutables y auditables
- **RNF-305**: La API debe usar HTTPS con validación de certificados
- **RNF-306**: Sistema debe tolerar caídas de API externa (fallback + notificación)

---

## 4. CASOS DE USO

### Caso 1: Ejecución diaria automática (22:00 horas)
1. Sistema detecta que son las 22:00
2. Cron job ejecuta obtención de cotización
3. API retorna: 1 USD = 1250 ARS (ejemplo)
4. Registra en `exchange_rates` para hoy
5. Registra éxito en `exchange_rate_logs`
6. Sistema continúa operativo

### Caso 2: Carga histórica desde admin panel
1. Admin abre "Cotizaciones" en panel admin
2. Ve formulario pre-llenado: desde 2025-04-08 hasta 2026-04-08
3. Hace clic en "Cargar Histórico"
4. Sistema consulta API para cada día del período
5. Inserta/actualiza registros en `exchange_rates`
6. Registra cada operación en logs
7. Muestra progreso: "Procesando 365 días... 45% completado"
8. Al terminar: "365 registros procesados, 365 insertados"

### Caso 3: Sobrescritura de cotización incorrecta
1. Admin nota que cotización de ayer está mal (1200 en lugar de 1250)
2. Abre formulario de carga manual
3. Ingresa: fecha_desde = ayer, fecha_hasta = ayer
4. Sistema obtiene nuevamente cotización correcta (1250)
5. Lee registro anterior (1200) en log
6. Actualiza a 1250 en `exchange_rates`
7. Registra en logs: "updated_by_admin, old_value: 1200, new_value: 1250"

### Caso 4: API externa no responde
1. A las 22:00 se ejecuta cron job
2. API no responde (timeout después de 30s)
3. Sistema registra fallo en logs (intento 1 de 3)
4. Reintenta después de 5 minutos
5. Si 3 intentos fallan, registra alerta
6. Admin ve notificación en dashboard: "Error al obtener cotización"
7. Puede ejecutar manualmente cuando API recupere servicio

### Caso 5: Consulta de cotización en reporte
1. Usuario genera reporte de gastos (2026-03-15 a 2026-04-08)
2. Sistema busca cotización para cada gasto
3. Usa valor de `exchange_rates` para fecha del gasto
4. Calcula conversión ARS → USD usando cotización de ese día

---

## 5. RESTRICCIONES Y CONSIDERACIONES

- La obtención de cotización debe usar credenciales de API almacenadas de forma segura (variables de entorno)
- La API externa debe ser confiable; si requiere key/token, implementar rotación
- Los logs deben retener datos permanentemente (nunca borrar)
- Las operaciones de carga histórica pueden ser largas; implementar paginación/chunks si es necesario
- La cron job debe ser thread-safe (no ejecutar múltiples instancias simultáneamente)
- Si hay múltiples servidores, usar lock en BD para evitar duplicados
- Validar que todas las fechas tengan 365 registros (un año completo) para funcionalidad correcta

---

## 6. CRITERIOS DE ACEPTACIÓN

- ✅ Tabla `exchange_rates` existe y almacena cotizaciones
- ✅ Tabla `exchange_rate_logs` registra todas las operaciones
- ✅ Cron job se ejecuta diariamente a las 22:00
- ✅ Obtiene cotización de API externa correctamente
- ✅ Endpoint API para carga histórica funciona
- ✅ Interface admin permite cargar histórico con defaults
- ✅ Cargas sobrescriben cotizaciones existentes correctamente
- ✅ Todos los logs se registran con status success/failed
- ✅ Admin puede consultar logs con filtros
- ✅ Sistema maneja fallos de API con reintentos y notificaciones
- ✅ Caída de API no impide funcionamiento general del sistema

---

## 7. MOCKUPS / REFERENCIAS

### Pantalla: Panel Admin - Cotizaciones

```
┌─────────────────────────────────────────────────────────┐
│  📊 COTIZACIONES ARS/USD                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📥 CARGAR HISTÓRICO                                   │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Desde: [2025-04-08]    Hasta: [2026-04-08]        │ │
│  │                        [ Cargar Histórico ]       │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  📅 COTIZACIONES RECIENTES                             │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Fecha        │ ARS/USD │ Última actualización    │ │
│  ├──────────────┼─────────┼────────────────────────┤ │
│  │ 2026-04-08   │ 1250.50 │ Hoy 22:00              │ │
│  │ 2026-04-07   │ 1248.75 │ Ayer 22:00             │ │
│  │ 2026-04-06   │ 1245.00 │ Hace 2 días 22:00      │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  🔄 ÚLTIMAS OPERACIONES                               │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Tipo    │ Fecha      │ Estado   │ Hora          │ │
│  ├─────────┼────────────┼──────────┼──────────────┤ │
│  │ daily   │ 2026-04-08 │ SUCCESS  │ 2026-04-08  │ │
│  │         │            │          │ 22:00:15    │ │
│  │ daily   │ 2026-04-07 │ SUCCESS  │ 2026-04-07  │ │
│  │         │            │          │ 22:00:08    │ │
│  │ history │ 2026-04-06 │ FAILED   │ 2026-04-06  │ │
│  │         │            │          │ 10:30:42    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Tabla: exchange_rates

```sql
CREATE TABLE exchange_rates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  rate_date DATE NOT NULL UNIQUE,
  ars_to_usd DECIMAL(10, 4) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_rate_date (rate_date)
);

-- Ejemplo de datos
INSERT INTO exchange_rates (rate_date, ars_to_usd) VALUES 
('2026-04-08', 1250.50),
('2026-04-07', 1248.75),
('2026-04-06', 1245.00);
```

### Tabla: exchange_rate_logs

```sql
CREATE TABLE exchange_rate_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  operation_type ENUM('daily_fetch', 'historical_load', 'manual_update') NOT NULL,
  rate_date DATE NOT NULL,
  old_rate DECIMAL(10, 4) NULL,
  new_rate DECIMAL(10, 4) NOT NULL,
  source VARCHAR(100) NOT NULL,
  status ENUM('success', 'failed', 'skipped') NOT NULL,
  error_message LONGTEXT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  executed_by VARCHAR(100),
  INDEX idx_rate_date (rate_date),
  INDEX idx_executed_at (executed_at),
  INDEX idx_status (status)
);

-- Ejemplo de datos
INSERT INTO exchange_rate_logs 
(operation_type, rate_date, old_rate, new_rate, source, status, executed_at, executed_by) 
VALUES 
('daily_fetch', '2026-04-08', NULL, 1250.50, 'cron_job', 'success', NOW(), NULL),
('historical_load', '2026-04-07', NULL, 1248.75, 'admin_interface', 'success', NOW(), 'admin@example.com'),
('daily_fetch', '2026-04-06', 1244.00, 1245.00, 'cron_job', 'success', NOW(), NULL);
```

### Estructura de Carpetas (para migraciones)

```
database/
└── migrations/
    └── v1.1.0/
        ├── README.md
        ├── up/
        │   ├── 001_create_exchange_rates_table.sql
        │   └── 002_create_exchange_rate_logs_table.sql
        └── down/
            ├── 002_drop_exchange_rate_logs_table.sql
            └── 001_drop_exchange_rates_table.sql
```

---

## 8. ESPECIFICACIÓN TÉCNICA

### 8.1 Cron Job (Node.js)

**Librería**: `node-cron`

**Ubicación**: `backend/jobs/exchange-rate-job.js`

**Pseudocódigo:**
```javascript
// Se ejecuta diariamente a las 22:00
cron.schedule('0 22 * * *', async () => {
  const maxRetries = 3;
  let retryCount = 0;
  let success = false;
  
  while (retryCount < maxRetries && !success) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const cotization = await fetchExchangeRate(); // API call
      
      await db.upsert('exchange_rates', {
        rate_date: today,
        ars_to_usd: cotization
      });
      
      await logOperation('daily_fetch', today, cotization, 'success');
      success = true;
    } catch (error) {
      retryCount++;
      await logOperation('daily_fetch', today, null, 'failed', error.message);
      if (retryCount < maxRetries) await delay(5 * 60 * 1000); // 5 min
    }
  }
});
```

### 8.2 Endpoint API para Carga Histórica

**Método**: POST  
**Ruta**: `/api/admin/exchange-rates/load-historical`  
**Requiere**: Autenticación + rol admin

**Body:**
```json
{
  "fecha_desde": "2025-04-08",
  "fecha_hasta": "2026-04-08"
}
```

**Response:**
```json
{
  "status": "success",
  "summary": {
    "total_days_processed": 365,
    "total_inserted": 200,
    "total_updated": 165,
    "total_skipped": 0,
    "total_failed": 0
  },
  "execution_time_ms": 420000
}
```

### 8.3 Endpoint para Consultar Logs

**Método**: GET  
**Ruta**: `/api/admin/exchange-rates/logs`  
**Parámetros query**: `type`, `status`, `from_date`, `to_date`, `limit=50`

---

## 9. PLAN DE IMPLEMENTACIÓN

### Fase 1: Infraestructura BD y API
- [ ] Crear tabla `exchange_rates`
- [ ] Crear tabla `exchange_rate_logs`
- [ ] Endpoint GET `/api/exchange-rates/:date`
- [ ] Endpoint POST `/api/admin/exchange-rates/load-historical`
- [ ] Endpoint GET `/api/admin/exchange-rates/logs`

### Fase 2: Integraciones Externas
- [ ] Seleccionar e integrar API de cotización
- [ ] Implementar retry logic y timeouts
- [ ] Implementar fallback a cotización anterior
- [ ] Tests de conexión a API

### Fase 3: Cron Job
- [ ] Implementar cron job diario a las 22:00
- [ ] Validar idempotencia
- [ ] Registrar en logs
- [ ] Tests de cron job

### Fase 4: Panel Admin
- [ ] Formulario de carga histórica
- [ ] Tabla de cotizaciones recientes
- [ ] Tabla de logs con filtros
- [ ] Notificaciones de errores

### Fase 5: Testing y Documentación
- [ ] Tests de obtención de cotización
- [ ] Tests de carga histórica
- [ ] Tests de sobrescritura de datos
- [ ] Documentación para equipo

---

## 10. RELACIÓN CON OTROS REQUERIMIENTOS

- Se integra con **REQ-001** (Reportes usarán cotización del día para conversiones)
- Complementa **REQ-002** (Requiere migración de tablas en v1.1.0)

---

## 11. CONSIDERACIONES ESPECIALES

- **Fuente de API**: Validar disponibilidad y confiabilidad antes de elegir
- **Zonas horarias**: Cotizaciones varían por zona horaria; definir estándar (ej: UTC)
- **Feriados**: Considerar si cargar cotización en feriados (algunos mercados cierran)
- **Validación**: Validar que cotización sea número positivo razonable
- **Tolerancia**: Si API retorna valor muy diferente al anterior, alertar antes de guardar

---

## 12. INTEGRACIONES CON OTRAS FUNCIONALIDADES

- Reportes usarán cotización del día para conversiones multi-moneda
- Gastos en USD podrán convertirse a ARS usando esta tabla
- Dashboard mostrará tipo de cambio actual

