# REQ-002: Versionado de Base de Datos y Migraciones Automáticas

**ID Requerimiento**: REQ-002  
**Versión**: 1.0  
**Fecha de Creación**: 2026-04-08  
**Estado**: En Diseño  
**Prioridad**: Crítica  

---

## 1. DESCRIPCIÓN GENERAL

El sistema debe mantener un historial de versiones de la base de datos y ejecutar automáticamente las migraciones necesarias para llevar la BD de la versión actual a la versión esperada. Antes de realizar cualquier operación (excepto el login), la aplicación debe verificar que la base de datos está en la versión correcta y, si no es así, ejecutar los archivos SQL correspondientes.

---

## 2. REQUERIMIENTOS FUNCIONALES

### 2.1 Historial de Versiones de Base de Datos

- **RF-201**: El sistema debe mantener un registro de la versión actual de la base de datos
  - Tabla: `schema_version` con campos: `version` (VARCHAR), `applied_at` (TIMESTAMP), `description` (TEXT)
  - La versión debe seguir formato semántico: `v1.0.0`, `v1.0.1`, `v1.1.0`, etc.
  - Solo un registro activo a la vez (la versión más reciente)

- **RF-202**: El sistema debe registrar cuándo se aplicó cada migración
  - Campo `applied_at`: timestamp automático al aplicar migración
  - Campo `description`: descripción del cambio realizado
  - Registrar también: usuario que aplicó la migración (si aplica)

- **RF-203**: El sistema debe mantener un historial completo de versiones aplicadas
  - Tabla histórica: `schema_version_history`
  - Guardar todas las versiones anteriores para auditoría
  - No permitir borrar registros de historial

### 2.2 Carpeta de Migraciones

- **RF-204**: Las migraciones SQL deben encontrarse en una carpeta específica
  - Ruta: `/database/migrations/`
  - Estructura de carpetas por versión: `/database/migrations/v1.0.0/`, `/database/migrations/v1.0.1/`, etc.
  - Cada carpeta contiene los archivos `.sql` necesarios para alcanzar esa versión

- **RF-205**: Los archivos de migración deben seguir una convención de nombres
  - Formato: `001_create_initial_schema.sql`, `002_add_users_table.sql`, `003_add_categories.sql`, etc.
  - Numeración secuencial dentro de cada versión
  - La ejecución debe ser en orden numérico

- **RF-206**: Cada archivo de migración debe ser idempotente
  - Usar `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE IF EXISTS`, etc.
  - Permitir re-ejecutar migraciones sin causar errores
  - Documentar si una migración no es reversible

- **RF-207**: El sistema debe soportar migraciones ascendentes y descendentes
  - Carpeta `/up/` para migraciones hacia versiones más nuevas
  - Carpeta `/down/` para rollback a versiones anteriores
  - Ej: `/database/migrations/v1.0.0/up/001_create_tables.sql`

### 2.3 Verificación de Versión y Ejecución Automática

- **RF-208**: La aplicación debe verificar la versión de BD antes de cualquier operación
  - Lógica: ejecutar en middleware antes de procesar cualquier request
  - Excepción: endpoint `/login` no requiere verificación de versión
  - Verificación debe ocurrir antes de autenticación

- **RF-209**: El sistema debe comparar versión esperada con versión actual
  - Versión esperada: definida en variable `APP_VERSION` en el proyecto
  - Versión actual: obtenida de tabla `schema_version`
  - Si son iguales: continuar normalmente
  - Si no son iguales: ejecutar migraciones automáticamente

- **RF-210**: El sistema debe ejecutar migraciones automáticamente si es necesario
  - Detectar si hay que subir o bajar de versión
  - Ejecutar todas las migraciones intermedias en orden
  - Ejemplo: si BD está en v1.0.0 y app espera v1.0.2, ejecutar:
    - v1.0.0 → v1.0.1
    - v1.0.1 → v1.0.2

- **RF-211**: Durante la migración, la aplicación debe mostrar estado
  - Mostrar página de "Migración en progreso" a los usuarios
  - No permitir nuevas requests hasta completar migraciones
  - Mostrar barra de progreso si es posible
  - Tiempo máximo estimado para migraciones

- **RF-212**: Si una migración falla, el sistema debe registrar el error y notificar
  - Registrar error exacto de SQL
  - Revertir cambios si es posible (transacción)
  - Mostrar error detallado en logs (no en UI pública)
  - Intentar detectar si la BD está en estado inconsistente

### 2.4 Estructura de Archivos

- **RF-213**: Cada versión debe tener un archivo `README.md` con documentación
  - Cambios realizados en esa versión
  - Cualquier consideración especial
  - Tiempo estimado de ejecución
  - Breaking changes, si aplica

- **RF-214**: Debe existir un archivo de configuración de versiones
  - Archivo: `/database/migrations/versions.json`
  - Contiene: lista de versiones, descripción, fecha de release
  - Facilita gestión centralizada de versiones

---

## 3. REQUERIMIENTOS NO FUNCIONALES

- **RNF-201**: Las migraciones deben ejecutarse en menos de 5 minutos (incluir timeout)
- **RNF-202**: La verificación de versión debe tomar menos de 100ms
- **RNF-203**: El sistema debe soportar BD de hasta 10 GB sin degradación significativa
- **RNF-204**: Las migraciones deben ser reversibles siempre que sea posible
- **RNF-205**: Los logs de migraciones deben ser inmutables e auditables
- **RNF-206**: El sistema debe funcionar en desarrollo, testing y producción

---

## 4. CASOS DE USO

### Caso 1: Aplicación arranca con versión correcta
1. Base de datos está en v1.0.0
2. Aplicación espera v1.0.0
3. Verificación de versión en middleware
4. Versiones coinciden → continuar normalmente
5. Usuario accede a la aplicación sin problemas

### Caso 2: Aplicación arranca con versión desactualizada
1. Base de datos está en v1.0.0
2. Aplicación espera v1.0.2
3. User intenta acceder a cualquier endpoint (excepto /login)
4. Middleware detecta desajuste de versiones
5. Sistema ejecuta automáticamente:
   - `/database/migrations/v1.0.1/up/001_*.sql`
   - `/database/migrations/v1.0.1/up/002_*.sql`
   - `/database/migrations/v1.0.2/up/001_*.sql`
6. Cada migración se registra en `schema_version_history`
7. `schema_version` se actualiza a v1.0.2
8. Usuario ve página "Migración completada"
9. Permite continuar con la aplicación

### Caso 3: Migración falla
1. Sistema intenta ejecutar migración de v1.0.1 a v1.0.2
2. Archivo SQL tiene error (columna no existe)
3. Sistema detecta error en transacción
4. Revierte cambios a v1.0.1
5. Registra error en log de migraciones
6. Muestra error genérico a usuario: "Error en configuración de BD"
7. Admin puede revisar logs detallados para diagnosticar

### Caso 4: Despliegue de nuevo ambiente
1. Nuevo servidor de desarrollo
2. BD vacía o versión v0.0.0
3. Aplicación inicia
4. Middleware detecta versión 0.0.0 vs esperada 1.0.2
5. Sistema ejecuta TODAS las migraciones desde el inicio:
   - v1.0.0 (creación inicial)
   - v1.0.1 (mejoras)
   - v1.0.2 (actual)
6. BD completamente preparada automáticamente
7. Equipo no necesita scripts manuales

### Caso 5: Rollback (degradación de versión)
1. Descubrimiento de bug crítico en v1.0.2
2. Decisión de volver a v1.0.1
3. Actualizar `APP_VERSION` a v1.0.1
4. Reiniciar aplicación
5. Middleware detecta v1.0.2 actual vs v1.0.1 esperada
6. Ejecuta rollback automático:
   - `/database/migrations/v1.0.2/down/002_*.sql` (orden inverso)
   - `/database/migrations/v1.0.2/down/001_*.sql`
7. Registra rollback en historial
8. BD vuelve a estado v1.0.1

---

## 5. RESTRICCIONES Y CONSIDERACIONES

- Las migraciones solo se ejecutan si usuario está autenticado (excepto caso de startup)
- El login NO requiere verificación de versión (para no bloquear acceso si hay migraciones pendientes)
- Cada migración debe ser transaccional (usar BEGIN/COMMIT/ROLLBACK)
- Las migraciones descendentes (down) deben preservar datos cuando sea posible
- No se permite saltar versiones (ej: v1.0.0 → v1.0.3 sin pasar por v1.0.1 y v1.0.2)
- Las migraciones deben documentarse claramente
- Un registro de migraciones fallidas debe estar disponible para auditoría

---

## 6. CRITERIOS DE ACEPTACIÓN

- ✅ Tabla `schema_version` existe con versión actual
- ✅ Tabla `schema_version_history` registra todas las versiones anteriores
- ✅ Carpeta `/database/migrations/` existe con estructura de versiones
- ✅ Archivos SQL siguen convención de nombres (001_, 002_, etc.)
- ✅ Middleware verifica versión en cada request (excepto /login)
- ✅ Migraciones se ejecutan automáticamente si versiones no coinciden
- ✅ Migraciones son idempotentes (se pueden re-ejecutar sin error)
- ✅ Se registra cada migración aplicada con timestamp
- ✅ En caso de error, se revierte transacción y se registra fallo
- ✅ Usuario ve página de progreso durante migración
- ✅ Rollback a versiones anteriores funciona correctamente
- ✅ Sistema soporta BD vacía (ejecuta todas las migraciones desde inicio)

---

## 7. MOCKUPS / REFERENCIAS

### Pantalla: Migración en Progreso

```
┌────────────────────────────────────────────────────┐
│                                                    │
│              🔄 ACTUALIZANDO SISTEMA                │
│                                                    │
│  La base de datos se está actualizando             │
│  para la versión 1.0.2                             │
│                                                    │
│  Versión actual: 1.0.0                             │
│  Versión destino: 1.0.2                            │
│                                                    │
│  Progreso:                                         │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  60%    │
│                                                    │
│  Ejecutando: v1.0.1/up/002_add_fields.sql          │
│  Tiempo estimado: 2 minutos                        │
│                                                    │
│  Por favor, no recargue la página...               │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Estructura de Carpetas de Migraciones

```
database/
└── migrations/
    ├── versions.json
    ├── v1.0.0/
    │   ├── README.md
    │   ├── up/
    │   │   ├── 001_create_users_table.sql
    │   │   ├── 002_create_categories_table.sql
    │   │   ├── 003_create_expenses_table.sql
    │   │   └── 004_create_indexes.sql
    │   └── down/
    │       ├── 004_drop_indexes.sql
    │       ├── 003_drop_expenses_table.sql
    │       ├── 002_drop_categories_table.sql
    │       └── 001_drop_users_table.sql
    │
    ├── v1.0.1/
    │   ├── README.md
    │   ├── up/
    │   │   ├── 001_add_email_verification.sql
    │   │   └── 002_add_user_preferences.sql
    │   └── down/
    │       ├── 002_drop_user_preferences.sql
    │       └── 001_drop_email_verification.sql
    │
    └── v1.0.2/
        ├── README.md
        ├── up/
        │   ├── 001_add_expense_attachments.sql
        │   └── 002_update_expense_schema.sql
        └── down/
            ├── 002_revert_expense_schema.sql
            └── 001_drop_expense_attachments.sql
```

### Archivo: versions.json

```json
{
  "versions": [
    {
      "version": "1.0.0",
      "description": "Versión inicial - Creación de tablas base",
      "releaseDate": "2026-01-15",
      "estimatedTime": "< 1 minuto",
      "breaking": false,
      "notes": "Schema inicial con usuarios, categorías y gastos"
    },
    {
      "version": "1.0.1",
      "description": "Verificación de email y preferencias de usuario",
      "releaseDate": "2026-02-20",
      "estimatedTime": "< 2 minutos",
      "breaking": false,
      "notes": "Añade funcionalidad de verificación de email"
    },
    {
      "version": "1.0.2",
      "description": "Adjuntos en gastos y mejoras de schema",
      "releaseDate": "2026-04-08",
      "estimatedTime": "< 3 minutos",
      "breaking": false,
      "notes": "Permite agregar archivos a los gastos"
    }
  ],
  "current": "1.0.0"
}
```

### Tabla: schema_version

```sql
CREATE TABLE schema_version (
  id INT PRIMARY KEY AUTO_INCREMENT,
  version VARCHAR(20) NOT NULL UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  applied_by VARCHAR(100),
  description TEXT,
  migration_time_ms INT,
  notes TEXT
);

-- Registro inicial
INSERT INTO schema_version (version, description) 
VALUES ('1.0.0', 'Versión inicial del sistema');
```

### Tabla: schema_version_history

```sql
CREATE TABLE schema_version_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  from_version VARCHAR(20),
  to_version VARCHAR(20),
  status ENUM('success', 'failed', 'rolled_back'),
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  applied_by VARCHAR(100),
  error_message LONGTEXT NULL,
  migration_time_ms INT,
  FOREIGN KEY (id) REFERENCES schema_version(id)
);
```

---

## 8. ESPECIFICACIÓN TÉCNICA

### 8.1 Middleware de Verificación de Versión

**Ubicación**: Backend (Express middleware)

**Lógica pseudocódigo:**
```
middleware: verifyDatabaseVersion(req, res, next) {
  // Excepción: /login no requiere verificación
  if (req.path === '/login' || req.path === '/api/auth/login') {
    return next();
  }

  currentVersion = obtenerVersionActual();
  expectedVersion = obtenerVersionEsperada();

  if (currentVersion === expectedVersion) {
    return next();  // Continuar normalmente
  }

  if (currentVersion > expectedVersion) {
    // BD más nueva que app: degradar
    return ejecutarMigracionesDescendentes(currentVersion, expectedVersion);
  } else {
    // BD más vieja que app: actualizar
    return ejecutarMigracionesAscendentes(currentVersion, expectedVersion);
  }
}
```

### 8.2 Versión Esperada en Código

**Ubicación**: `.env` o archivo de configuración

```env
APP_VERSION=1.0.2
```

O en código:
```javascript
const APP_VERSION = '1.0.2';  // package.json version
```

### 8.3 Ejecución de Migraciones

**Algoritmo:**
1. Comparar versión actual con esperada
2. Determinar ruta de migraciones (ascendente o descendente)
3. Obtener lista de versiones intermedias
4. Para cada versión:
   - Leer archivos SQL de carpeta `/up/` o `/down/` en orden
   - Envolver en transacción
   - Ejecutar cada archivo
   - Registrar en `schema_version_history`
5. Actualizar `schema_version` con nueva versión
6. Retornar al usuario

### 8.4 Manejo de Errores

- Si falla una migración:
  - Hacer ROLLBACK de toda la transacción
  - Registrar error en `schema_version_history` con status='failed'
  - **NO actualizar** `schema_version`
  - Mostrar página de error (BD inconsistente)
  - Enviar alerta a administrador

### 8.5 Seguridad

- Migraciones solo se ejecutan con usuario BD con permisos adecuados
- Credenciales de BD NO deben estar en archivos de migración
- Logs de migraciones deben ser auditables
- Restricción de acceso al directorio `/database/migrations/`

---

## 9. PLAN DE IMPLEMENTACIÓN

### Fase 1: Infraestructura de Tablas y Carpetas
- [ ] Crear tabla `schema_version`
- [ ] Crear tabla `schema_version_history`
- [ ] Crear carpeta `/database/migrations/`
- [ ] Crear versión inicial v1.0.0 con schema actual

### Fase 2: Middleware de Verificación
- [ ] Implementar middleware de verificación de versión
- [ ] Integrar en Express app
- [ ] Excepcionar endpoint /login
- [ ] Pruebas unitarias del middleware

### Fase 3: Motor de Migraciones
- [ ] Implementar función de ejecución de migraciones
- [ ] Soporte para migraciones ascendentes
- [ ] Soporte para migraciones descendentes
- [ ] Transacciones y rollback

### Fase 4: UI y Feedback
- [ ] Página de migración en progreso
- [ ] Mostrar barra de progreso
- [ ] Página de error si migración falla
- [ ] Logs detallados en backend

### Fase 5: Testing y Documentación
- [ ] Tests de migración ascendente
- [ ] Tests de migración descendente
- [ ] Tests de rollback
- [ ] Documentación para equipo

---

## 10. RELACIÓN CON OTROS REQUERIMIENTOS

- Se integra con **RF-001** (Autenticación - excepción en /login)
- Soporta **REQ-001** (Reportes dependen de schema consistente)
- Facilita **REQ-003** (Futuras características requieren schema actualizado)

---

## 11. VENTAJAS DE ESTE SISTEMA

- **Automatizado**: No requiere intervención manual para actualizar BD
- **Reversible**: Permite volver a versiones anteriores fácilmente
- **Auditable**: Historial completo de cambios
- **Consistente**: Garantiza que BD siempre está en estado esperado
- **Escalable**: Soporta aplicación con múltiples instancias
- **Documentado**: Cada cambio está documentado en carpetas de versión

---

## 12. CONSIDERACIONES ESPECIALES

- El archivo `versions.json` debe actualizarse manualmente al crear nueva versión
- Cada developer debe correr migraciones localmente para tener BD consistente
- En CI/CD, las migraciones deben ejecutarse automáticamente
- Backups de BD deben tomarse antes de migraciones en producción
- El equipo debe revisar migraciones críticas antes de aplicarlas
