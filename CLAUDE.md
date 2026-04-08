# Instrucciones para Claude Code

## 📋 Lineamientos de Desarrollo

### Documentación de Arquitectura
**IMPORTANTE:** Antes de cualquier desarrollo, consulta la carpeta `Documentacion aplicacion/Arquitectura y buenas practicas/`:

- **ARQUITECTURA.md** - Entiende la estructura general del proyecto
- **COMPONENTES.md** - Identifica dónde va el código (backend/frontend)
- **INTERACCION.md** - Entiende cómo interactúan los módulos
- **BUENAS_PRACTICAS.md** - Sigue los estándares de código
- **PATRONES_CODIGO.md** - Copia los patrones recomendados
- **FLUJOS_PROCESO.md** - Estudia flujos complejos

### Procesos Estándar

#### Cuando agregues una nueva funcionalidad:
1. **Lectura**: Revisa ARQUITECTURA.md + COMPONENTES.md relevante
2. **Identificación**: Determina qué módulos necesitan cambios
3. **Patrones**: Copia patrones de PATRONES_CODIGO.md (ej: estructura de controlador)
4. **Estándares**: Valida contra BUENAS_PRACTICAS.md
5. **Flujos**: Si es complejo, estudia diagrama en FLUJOS_PROCESO.md

#### Cuando escribas código:
- Sigue convenciones de nombres en PATRONES_CODIGO.md
- Aplica SOLID principles de BUENAS_PRACTICAS.md
- Valida en múltiples capas (frontend, backend, BD)
- Maneja errores apropiadamente
- Incluye tests

#### Cuando debuguees:
- Usa FLUJOS_PROCESO.md para rastrear paso a paso
- Revisa INTERACCION.md para entender comunicación entre módulos
- Verifica convenciones en PATRONES_CODIGO.md

### Estructura de Carpetas (NO CAMBIAR)

```
backend/src/
├── controllers/    ← Lógica de negocio
├── routes/         ← Rutas REST
├── models/         ← Modelos Sequelize
├── middleware/     ← Auth, validación, errores
├── services/       ← Lógica reutilizable
└── utils/          ← Helpers

frontend/src/
├── pages/          ← Vistas principales
├── components/     ← Componentes React
├── services/       ← API clients
├── store/          ← Redux slices
├── hooks/          ← Custom hooks
└── utils/          ← Formatters, constantes
```

### Tecnología Stack (Fijo)

**Backend:**
- Node.js 18+ + Express.js
- Sequelize (ORM para MySQL)
- MySQL 8.0+
- JWT para autenticación
- bcryptjs para hashing

**Frontend:**
- React 18+ con Vite
- Redux Toolkit para estado
- Tailwind CSS para estilos
- Recharts para gráficos
- React Hook Form + Zod para validación

### Convenciones Clave

**Nombres de archivos:**
- Controllers: `expenseController.js`
- Routes: `expenses.js`
- Models: `Expense.js`
- Components: `ExpenseForm.jsx` (PascalCase)
- Services: `expenseService.js` (camelCase)

**Variables:**
- camelCase para variables y funciones
- PascalCase para clases y componentes React
- UPPER_SNAKE_CASE para constantes

**Estructura de código:**
- Máximo 300 líneas por archivo
- Una clase/función por archivo
- Separación clara: routes → controllers → services → models

### Seguridad (Obligatorio)

- ✅ Validar TODAS las entradas (frontend + backend)
- ✅ Usar middleware de autenticación en endpoints
- ✅ Verificar ownership de recursos (user_id)
- ✅ SQL parameterizado (Sequelize lo hace)
- ✅ Hashear contraseñas con bcrypt
- ✅ JWT con expiración
- ✅ HTTPS en producción
- ❌ NO loguees contraseñas, tokens o datos sensibles
- ❌ NO confíes en datos del cliente para autorización

### Testing

- Tests para funciones críticas
- Tests de integración para APIs
- Cobertura mínima 70%
- Mock de datos externos

### Git Commits

```
Mensaje en presente, descriptivo:

✅ feat: add monthly expense report with PDF export
✅ fix: correct installment calculation for 12 months
✅ refactor: simplify expense filtering logic

❌ fixed bug
❌ changes
❌ update stuff
```

### Code Review Checklist

Antes de hacer PR, valida:
- [ ] Código sigue patrones en PATRONES_CODIGO.md
- [ ] SOLID principles aplicados
- [ ] Validación en múltiples capas
- [ ] Manejo de errores completo
- [ ] Tests incluidos
- [ ] Sin hardcoded values o secrets
- [ ] Documentación actualizada
- [ ] Nombrado consistente con proyecto

---

## 📞 Dudas Frecuentes

**P: ¿Dónde agrego un nuevo endpoint REST?**
R: 
1. Lee COMPONENTES.md > Backend > Módulo relevante
2. Crea/modifica en `backend/src/routes/`
3. Crea/modifica controlador en `backend/src/controllers/`
4. Sigue patrón en PATRONES_CODIGO.md > Backend > Patrón de Ruta

**P: ¿Cómo agrego estado global a Redux?**
R:
1. Crea/modifica slice en `frontend/src/store/`
2. Sigue patrón en PATRONES_CODIGO.md > Frontend > Patrón Redux Slice

**P: ¿Necesito validación en frontend y backend?**
R: SÍ, siempre ambas. Frontend para UX, backend para seguridad.

**P: ¿Qué si no encuentro un patrón similar?**
R: Consulta BUENAS_PRACTICAS.md > SOLID Principles para diseñar tu solución.

---

**Última actualización:** Abril 2026
**Versión:** 1.0
