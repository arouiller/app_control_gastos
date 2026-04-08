let migrationStatus = 'pending'; // 'pending' | 'ok' | 'error'

function setMigrationStatus(status) {
  migrationStatus = status;
}

function versionCheckMiddleware(_req, res, next) {
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

  next();
}

module.exports = { versionCheckMiddleware, setMigrationStatus };
