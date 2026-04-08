// Rutas (relativas a /api) exentas de la verificación de versión de BD
// El middleware está montado en app.use('/api', versionCheckMiddleware, routes)
// por lo que req.path aquí es relativo a /api (ej: '/auth/login', no '/api/auth/login')
const EXCLUDED_PATHS = ['/auth/login', '/auth/refresh'];

/**
 * Middleware que bloquea requests si la base de datos no está en la versión correcta.
 * La migración se corre en startup (server.js). Este middleware sirve como guardia
 * por si algún request llega antes de que las migraciones finalicen.
 */
let migrationStatus = 'ok'; // 'pending' | 'ok' | 'error'
let migrationError = null;

function setMigrationStatus(status, err = null) {
  migrationStatus = status;
  migrationError = err;
}

async function versionCheckMiddleware(req, res, next) {
  // Rutas excluidas pasan siempre
  if (EXCLUDED_PATHS.includes(req.path)) {
    return next();
  }

  if (migrationStatus === 'pending') {
    return res.status(503).json({
      success: false,
      error: {
        code: 'DB_MIGRATION_IN_PROGRESS',
        message: 'El sistema se está actualizando. Por favor, intente en unos segundos.',
      },
    });
  }

  if (migrationStatus === 'error') {
    return res.status(503).json({
      success: false,
      error: {
        code: 'DB_MIGRATION_FAILED',
        message: 'Error en la actualización del sistema. Contacte al administrador.',
      },
    });
  }

  // migrationStatus === 'ok' → continuar normalmente
  next();
}

module.exports = { versionCheckMiddleware, setMigrationStatus };
