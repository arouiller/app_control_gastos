const { checkAndMigrate } = require('./migrationEngine');
const logger = require('../utils/logger');

let migrationPromise = null;

function versionCheckMiddleware(_req, res, next) {
  if (!migrationPromise) {
    logger.info('[Migraciones] Primer acceso detectado, iniciando migraciones...');
    migrationPromise = checkAndMigrate();
  }

  migrationPromise
    .then(() => next())
    .catch((err) => {
      logger.error('[Migraciones] Error crítico:', err.message);
      res.status(503).json({
        success: false,
        error: {
          code: 'DB_MIGRATION_FAILED',
          message: 'Error en la actualización del sistema. Contacte al administrador.',
        },
      });
    });
}

module.exports = { versionCheckMiddleware };
