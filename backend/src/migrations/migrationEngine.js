const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');
const logger = require('../utils/logger');

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../database/migrations');
const VERSIONS_FILE = path.join(MIGRATIONS_DIR, 'versions.json');

// ─── Tablas de versionado ────────────────────────────────────────────────────

const SQL_CREATE_SCHEMA_VERSION = `
  CREATE TABLE IF NOT EXISTS schema_version (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    version         VARCHAR(20)  NOT NULL,
    applied_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description     TEXT,
    migration_time_ms INT
  )
`;

const SQL_CREATE_SCHEMA_VERSION_HISTORY = `
  CREATE TABLE IF NOT EXISTS schema_version_history (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    from_version    VARCHAR(20),
    to_version      VARCHAR(20),
    status          ENUM('success', 'failed', 'rolled_back') NOT NULL,
    applied_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    error_message   LONGTEXT,
    migration_time_ms INT
  )
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function bootstrapVersioningTables() {
  await sequelize.query(SQL_CREATE_SCHEMA_VERSION);
  await sequelize.query(SQL_CREATE_SCHEMA_VERSION_HISTORY);
}

async function getCurrentVersion() {
  try {
    const [rows] = await sequelize.query(
      'SELECT version FROM schema_version ORDER BY applied_at DESC LIMIT 1'
    );
    return rows.length > 0 ? rows[0].version : '0.0.0';
  } catch {
    // La tabla no existe aún → primera ejecución
    return '0.0.0';
  }
}

function getExpectedVersion() {
  return process.env.APP_VERSION || '1.0.0';
}

function getOrderedVersions() {
  const config = JSON.parse(fs.readFileSync(VERSIONS_FILE, 'utf8'));
  return config.versions.map((v) => v.version);
}

function getVersionsBetween(from, to, allVersions) {
  const fromIdx = from === '0.0.0' ? -1 : allVersions.indexOf(from);
  const toIdx = allVersions.indexOf(to);

  if (toIdx === -1) throw new Error(`Versión destino ${to} no encontrada en versions.json`);

  if (fromIdx < toIdx) {
    // Migración ascendente: versiones después de "from" hasta "to" (inclusive)
    return { direction: 'up', versions: allVersions.slice(fromIdx + 1, toIdx + 1) };
  } else if (fromIdx > toIdx) {
    // Migración descendente: versiones desde "from" hasta "to" (exclusive), en orden inverso
    return { direction: 'down', versions: allVersions.slice(toIdx + 1, fromIdx + 1).reverse() };
  }
  return { direction: 'none', versions: [] };
}

function getSqlFilesForVersion(version, direction) {
  const dirPath = path.join(MIGRATIONS_DIR, `v${version}`, direction);
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => path.join(dirPath, f));
}

/**
 * Divide el contenido de un archivo SQL en statements individuales.
 * Respeta bloques BEGIN...END (para triggers/procedures).
 */
function splitSqlStatements(sql) {
  // Eliminar comentarios de bloque
  sql = sql.replace(/\/\*[\s\S]*?\*\//g, '');

  const statements = [];
  let current = '';
  let depth = 0;

  for (const line of sql.split('\n')) {
    const upper = line.trim().toUpperCase();
    const withoutComment = line.replace(/--.*$/, '').trim();

    // Rastrear profundidad de bloques BEGIN...END
    if (/\bBEGIN\b/.test(upper) && !/\bEND\b/.test(upper)) depth++;
    if (/\bEND\b/.test(upper) && !/\bBEGIN\b/.test(upper)) depth = Math.max(0, depth - 1);

    current += line + '\n';

    // Separar en profundidad 0 cuando la línea termina con ;
    if (depth === 0 && withoutComment.endsWith(';')) {
      const stmt = current.replace(/;\s*$/, '').trim();
      if (stmt) statements.push(stmt);
      current = '';
    }
  }

  // Último statement sin ; final
  const remaining = current.trim();
  if (remaining) statements.push(remaining);

  return statements.filter((s) => s.trim());
}

async function executeSqlFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8').trim();
  if (!sql) return;
  const statements = splitSqlStatements(sql);
  for (const stmt of statements) {
    await sequelize.query(stmt);
  }
}

async function recordHistory(fromVersion, toVersion, status, errorMessage, timeMs) {
  await sequelize.query(
    `INSERT INTO schema_version_history (from_version, to_version, status, error_message, migration_time_ms)
     VALUES (?, ?, ?, ?, ?)`,
    { replacements: [fromVersion, toVersion, status, errorMessage || null, timeMs] }
  );
}

async function setCurrentVersion(version, description, timeMs) {
  // schema_version guarda solo la versión actual: truncar y reemplazar
  await sequelize.query('DELETE FROM schema_version');
  await sequelize.query(
    `INSERT INTO schema_version (version, description, migration_time_ms) VALUES (?, ?, ?)`,
    { replacements: [version, description || null, timeMs] }
  );
}

// ─── Motor principal ──────────────────────────────────────────────────────────

async function runMigrations(currentVersion, targetVersion) {
  const allVersions = getOrderedVersions();
  const { direction, versions } = getVersionsBetween(currentVersion, targetVersion, allVersions);

  if (direction === 'none') return;

  logger.info(`[Migraciones] Dirección: ${direction.toUpperCase()} | ${currentVersion} → ${targetVersion}`);
  logger.info(`[Migraciones] Versiones a aplicar: ${versions.join(', ')}`);

  for (const version of versions) {
    const fromVer = versions[0] === version ? currentVersion : versions[versions.indexOf(version) - 1];
    const t0 = Date.now();

    logger.info(`[Migraciones] Aplicando v${version} (${direction})...`);
    const files = getSqlFilesForVersion(version, direction);

    if (files.length === 0) {
      logger.warn(`[Migraciones] Sin archivos SQL en v${version}/${direction}`);
      continue;
    }

    try {
      for (const file of files) {
        logger.info(`[Migraciones]   → ${path.basename(file)}`);
        await executeSqlFile(file);
      }

      const timeMs = Date.now() - t0;
      const newVersion = direction === 'up' ? version : fromVer;
      await setCurrentVersion(newVersion, `Migración ${direction} a v${version}`, timeMs);
      await recordHistory(fromVer, version, 'success', null, timeMs);
      logger.info(`[Migraciones] v${version} aplicada (${timeMs}ms)`);
    } catch (err) {
      const timeMs = Date.now() - t0;
      await recordHistory(fromVer, version, 'failed', err.message, timeMs);
      logger.error(`[Migraciones] Error en v${version}: ${err.message}`);
      throw err;
    }
  }
}

// ─── Punto de entrada ─────────────────────────────────────────────────────────

async function checkAndMigrate() {
  await bootstrapVersioningTables();

  const current = await getCurrentVersion();
  const expected = getExpectedVersion();

  logger.info(`[Migraciones] Versión actual: ${current} | Versión esperada: ${expected}`);

  if (current === expected) {
    logger.info('[Migraciones] Base de datos actualizada. Sin cambios necesarios.');
    return;
  }

  logger.info(`[Migraciones] Ejecutando migraciones: ${current} → ${expected}`);
  const t0 = Date.now();

  await runMigrations(current, expected);

  logger.info(`[Migraciones] Completado en ${Date.now() - t0}ms. Versión: ${expected}`);
}

module.exports = { checkAndMigrate, getCurrentVersion, getExpectedVersion };
