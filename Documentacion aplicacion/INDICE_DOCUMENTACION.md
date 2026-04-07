# Índice de Documentación - Aplicación de Control de Gastos

## 📚 Todos los Documentos

### 🎯 Inicio Rápido
1. **[README.md](README.md)** (⭐ COMIENZA AQUÍ)
   - Vista general del proyecto
   - Stack tecnológico
   - Inicio rápido en 5 minutos
   - Links a documentación detallada

### 📋 Especificación del Proyecto

2. **[REQUERIMIENTOS.md](REQUERIMIENTOS.md)** (📌 DOCUMENTO PRINCIPAL)
   - **Requerimientos Funcionales** (RF-001 a RF-050+)
     - Autenticación y usuarios
     - Gestión de gastos
     - Gastos en cuotas
     - Categorización
     - Filtrado y búsqueda
     - Análisis y reportes
     - Dashboard
   
   - **Requerimientos Tecnológicos** (RT-001 a RT-046)
     - Base de datos MySQL
     - Backend (Node.js + Express)
     - Frontend (React + Vite)
     - Seguridad
     - DevOps y Deployment
   
   - **Arquitectura Propuesta**
     - Estructura de carpetas
     - Patrones de diseño
     - Endpoints API REST
   
   - **Esquema de Base de Datos**
     - Descripción de tablas principales
   
   - **Fases de Desarrollo**
     - Semana 1: Setup y Autenticación
     - Semana 2: Gestión de Gastos Básica
     - Semana 3: Gastos en Cuotas
     - Semana 4: Dashboard y Reportes
     - Semana 5: Tests y Deployment
   
   - **Criterios de Aceptación**

### 🗄️ Base de Datos

3. **[ESQUEMA_DB.sql](ESQUEMA_DB.sql)** (SQL DDL)
   - Script SQL completo para crear la base de datos
   - **Tablas**:
     - users
     - categories
     - expenses
     - installments
     - sessions (opcional)
     - audit_logs (opcional)
   
   - **Vistas para Reportes**:
     - v_monthly_summary
     - v_spending_by_category
     - v_pending_installments
     - v_cash_vs_card
   
   - **Índices** para optimización
   - **Triggers** para sincronización automática
   - **Datos de ejemplo** (categorías predeterminadas)

### 🔒 Seguridad

4. **[SEGURIDAD_Y_MEJORES_PRACTICAS.md](SEGURIDAD_Y_MEJORES_PRACTICAS.md)**
   - **Autenticación**
     - Requisitos de contraseñas
     - JWT tokens
     - Sesiones y timeouts
   
   - **OWASP Top 10**
     - Inyección SQL
     - Broken Authentication
     - Exposición de datos sensibles
     - Control de acceso
     - Configuración de seguridad
     - XSS (Cross-Site Scripting)
     - CSRF (Cross-Site Request Forgery)
     - Desserialización insegura
     - Componentes vulnerables
     - Logging insuficiente
   
   - **Validación de Entrada**
     - Backend (Joi)
     - Frontend (Zod)
   
   - **Protección de API**
     - Rate limiting
     - CORS
     - Compresión
     - HTTPS
   
   - **Seguridad en Base de Datos**
     - Credenciales
     - Permisos limitados
     - Backups cifrados
     - Auditoría
   
   - **Seguridad en Frontend**
     - Almacenamiento seguro de tokens
     - Content Security Policy
     - Protección contra XSS
   
   - **Monitoreo y Logging**
   - **Testing de Seguridad**
   - **Deployment Seguro**
   - **Cumplimiento Regulatorio** (GDPR, PCI DSS)
   - **Checklist Pre-Producción**

### ⚙️ Instalación y Setup

5. **[GUIA_INSTALACION.md](GUIA_INSTALACION.md)** (PASO A PASO)
   - **Requisitos Previos**
     - Software necesario
     - Verificación de versiones
   
   - **Setup de MySQL**
     - Crear base de datos
     - Crear usuario
     - Importar esquema
   
   - **Setup Backend (Node.js)**
     - Inicializar proyecto
     - Instalar dependencias
     - Estructura de carpetas
     - Configuración .env
     - Scripts package.json
     - Primer servidor
   
   - **Setup Frontend (React)**
     - Crear proyecto con Vite
     - Instalar dependencias
     - Configurar Tailwind CSS
     - Estructura de carpetas
     - Archivo .env
     - Vite config
   
   - **Verificación de Instalación**
     - Checklist completo
     - Prueba de conexión
   
   - **Comandos Útiles**
   
   - **Primeros Pasos**
     - Crear módulos básicos
     - Configurar API
     - Crear App inicial
   
   - **Troubleshooting Común**

---

## 🗺️ Mapa de Lectura Recomendado

### Para Gestores/PMs
1. README.md (5 min)
2. REQUERIMIENTOS.md → secciones 1, 2.5 (15 min)
3. Fases de desarrollo (5 min)

### Para Desarrolladores Backend
1. README.md (5 min)
2. REQUERIMIENTOS.md completo (30 min)
3. ESQUEMA_DB.sql (15 min)
4. GUIA_INSTALACION.md → Setup Backend (15 min)
5. SEGURIDAD_Y_MEJORES_PRACTICAS.md (20 min)

### Para Desarrolladores Frontend
1. README.md (5 min)
2. REQUERIMIENTOS.md → secciones 1, 2.3, 2.5 (20 min)
3. REQUERIMIENTOS.md → API Endpoints (10 min)
4. GUIA_INSTALACION.md → Setup Frontend (15 min)
5. SEGURIDAD_Y_MEJORES_PRACTICAS.md → secciones 6, 7 (10 min)

### Para DevOps/Arquitecto
1. README.md (5 min)
2. REQUERIMIENTOS.md → secciones 2, 3 (30 min)
3. ESQUEMA_DB.sql (15 min)
4. GUIA_INSTALACION.md (20 min)
5. SEGURIDAD_Y_MEJORES_PRACTICAS.md → secciones 9, 10 (20 min)

### Para Auditoría/Seguridad
1. SEGURIDAD_Y_MEJORES_PRACTICAS.md (completo) (45 min)
2. ESQUEMA_DB.sql → permisos (5 min)
3. REQUERIMIENTOS.md → RT-031 a RT-039 (5 min)

---

## 📊 Matriz de Contenido

| Tema | README | REQUERIMIENTOS | ESQUEMA_DB | SEGURIDAD | INSTALACIÓN |
|------|--------|---|---|---|---|
| **Descripción General** | ✅ | ✅ | | | |
| **Stack Tecnológico** | ✅ | ✅ | | | |
| **Estructura Proyecto** | ✅ | ✅ | | | ✅ |
| **RF Funcionales** | ⚠️ | ✅ | | | |
| **RT Tecnológicos** | ⚠️ | ✅ | | | |
| **Tablas BD** | | ✅ | ✅ | | |
| **Vistas BD** | | ✅ | ✅ | | |
| **Autenticación** | ⚠️ | ✅ | | ✅ | |
| **Seguridad OWASP** | | | | ✅ | |
| **Validación** | | | | ✅ | ✅ |
| **Setup MySQL** | | | | | ✅ |
| **Setup Backend** | | | | | ✅ |
| **Setup Frontend** | | | | | ✅ |
| **Endpoints API** | | ✅ | | | |
| **Fases Desarrollo** | ✅ | ✅ | | | |
| **Testing** | ⚠️ | ✅ | | ✅ | |
| **Deployment** | ⚠️ | ✅ | | ✅ | ⚠️ |

**Leyenda**: ✅ = Cobertura principal | ⚠️ = Cobertura secundaria | = No aplica

---

## 🔍 Búsqueda Rápida por Tema

### Autenticación
- REQUERIMIENTOS.md → Sección 1.1 (RF-001 a RF-008)
- REQUERIMIENTOS.md → Sección 2.2 (RT-007 a RT-017)
- SEGURIDAD_Y_MEJORES_PRACTICAS.md → Sección 1
- GUIA_INSTALACION.md → Sección 4.5 (package.json)

### Gastos Simples
- REQUERIMIENTOS.md → Sección 1.2 (RF-009 a RF-015)
- REQUERIMIENTOS.md → Sección 4.2 (Endpoints)

### Gastos en Cuotas
- REQUERIMIENTOS.md → Sección 1.3 (RF-016 a RF-022)
- REQUERIMIENTOS.md → Sección 4.5 (Endpoints)
- ESQUEMA_DB.sql → Tabla installments

### Reportes y Análisis
- REQUERIMIENTOS.md → Sección 1.6 (RF-035 a RF-045)
- REQUERIMIENTOS.md → Sección 4.6 (Endpoints)
- ESQUEMA_DB.sql → Vistas de reportes

### Filtrado y Búsqueda
- REQUERIMIENTOS.md → Sección 1.5 (RF-029 a RF-034)
- REQUERIMIENTOS.md → Sección 4.2 (Query params)

### Base de Datos
- ESQUEMA_DB.sql (DDL completo)
- REQUERIMIENTOS.md → Sección 5 (Esquema de BD)

### Seguridad
- SEGURIDAD_Y_MEJORES_PRACTICAS.md (documento completo)
- REQUERIMIENTOS.md → Sección 2.4 (RT Seguridad)

### Setup Desarrollo
- GUIA_INSTALACION.md (documento completo)
- REQUERIMIENTOS.md → Sección 3.1 (Estructura)

### Testing
- REQUERIMIENTOS.md → Sección 7 (Dependencias)
- SEGURIDAD_Y_MEJORES_PRACTICAS.md → Sección 8
- GUIA_INSTALACION.md → Sección 7 (Comandos)

### Deployment
- REQUERIMIENTOS.md → Sección 2.5 (RT DevOps)
- SEGURIDAD_Y_MEJORES_PRACTICAS.md → Sección 9
- README.md → Sección Deployment

---

## 📝 Historial de Documentos

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | Abril 2026 | Documento inicial - Especificación completa |

---

## 🎯 Siguiente Paso

Una vez leída esta documentación:

1. ✅ Crear base de datos MySQL (GUIA_INSTALACION.md)
2. ✅ Inicializar proyecto backend (GUIA_INSTALACION.md)
3. ✅ Inicializar proyecto frontend (GUIA_INSTALACION.md)
4. ✅ Implementar autenticación (REQUERIMIENTOS.md RF-001 a RF-008)
5. ✅ Implementar CRUD de gastos (REQUERIMIENTOS.md RF-009 a RF-015)

---

## 💡 Notas Importantes

### ⚠️ ANTES DE DESARROLLAR
- Leer al menos README.md + REQUERIMIENTOS.md
- Entender la arquitectura en REQUERIMIENTOS.md sección 3
- Configurar seguridad según SEGURIDAD_Y_MEJORES_PRACTICAS.md
- Seguir GUIA_INSTALACION.md exactamente

### 🔒 RECORDAR SIEMPRE
- Base de datos está normalizada (3FN)
- Usar ORM para evitar SQL Injection
- Validar entrada en frontend Y backend
- Nunca loguear datos sensibles
- HTTPS obligatorio en producción

### 📈 ESCALABILIDAD
- Los índices están optimizados para las queries esperadas
- Las vistas facilitan reportes complejos
- Los triggers sincronizan datos automáticamente
- La estructura permite crecer sin refactoring mayor

---

**Creado**: Abril 2026

**Mantenido por**: Equipo de Desarrollo

**Actualización**: Mantener sincronizado con cambios en el código

---

## 📞 Preguntas Frecuentes sobre la Documentación

**P: ¿Por dónde debo empezar?**
R: Comienza con README.md, luego REQUERIMIENTOS.md. Otros documentos son referencias específicas.

**P: ¿Necesito leer todo?**
R: Depende tu rol. Ver "Mapa de Lectura Recomendado" arriba.

**P: ¿La documentación se actualiza?**
R: Sí. Si haces cambios significativos en código, actualiza la documentación correspondiente.

**P: ¿Qué documento tiene la información técnica más detallada?**
R: REQUERIMIENTOS.md para la especificación completa, ESQUEMA_DB.sql para BD, SEGURIDAD_Y_MEJORES_PRACTICAS.md para seguridad.

**P: ¿Dónde están los endpoints de API?**
R: REQUERIMIENTOS.md Sección 4, o en documentación Swagger (cuando se implemente).
