require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const { sequelize } = require('./models');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const { checkAndMigrate } = require('./migrations/migrationEngine');
const { versionCheckMiddleware, setMigrationStatus } = require('./migrations/versionCheck');

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// Security headers
app.use(helmet({
  contentSecurityPolicy: isProd ? undefined : false,
}));

// CORS — en producción el mismo servidor sirve frontend y backend
if (!isProd) {
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
}

// Compression
app.use(compression());

// HTTP request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Verificación de versión de BD (bloquea requests si hay migración en progreso)
app.use(versionCheckMiddleware);

// API Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Servir frontend estático en producción
if (isProd) {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
  // SPA fallback — todas las rutas no-API devuelven index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  // 404 handler solo en desarrollo (en prod lo maneja el SPA fallback)
  app.use((req, res) => {
    res.status(404).json({ success: false, error: { message: 'Ruta no encontrada' } });
  });
}

// Global error handler
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    await sequelize.authenticate();
    logger.info('Conexión a base de datos establecida.');

    try {
      await checkAndMigrate();
      setMigrationStatus('ok');
    } catch (err) {
      logger.error('[Migraciones] Error crítico en migración:', err);
      setMigrationStatus('error', err);
      // No se hace process.exit: el servidor arranca en estado 'error' para que los logs sean visibles
    }

    app.listen(PORT, () => {
      logger.info(`Servidor corriendo en puerto ${PORT}`);
    });
  } catch (err) {
    logger.error('No se pudo iniciar el servidor:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
