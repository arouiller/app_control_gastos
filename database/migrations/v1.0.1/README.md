# v1.0.1 - Flag de administrador en usuarios

**Fecha**: 2026-04-08  
**Tiempo estimado**: < 1 minuto  
**Breaking changes**: No  

## Cambios

- Agrega columna `is_admin BOOLEAN DEFAULT FALSE` a tabla `users`
- Asigna `is_admin = TRUE` a todos los usuarios existentes
