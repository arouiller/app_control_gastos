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
const { versionCheckMiddleware } = require('./migrations/versionCheck');

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

// API Routes (con verificación de versión de BD antes de cada llamada a la API)
app.use('/api', versionCheckMiddleware, routes);

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
  } catch (err) {
    logger.error('No se pudo conectar a la base de datos:', err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    logger.info(`Servidor corriendo en puerto ${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = app;
