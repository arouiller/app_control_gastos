const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');
const logger = require('../utils/logger');

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../database/migrations');
const VERSIONS_FILE = path.join(MIGRATIONS_DIR, 'versions.json');
const MIGRATION_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutos máximo

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function schemaVersionExists() {
  try {
    await sequelize.query('SELECT 1 FROM schema_version LIMIT 1');
    return true;
  } catch {
    return false;
  }
}

async function getCurrentVersion() {
  try {
    const [rows] = await sequelize.query(
      'SELECT version FROM schema_version ORDER BY applied_at DESC LIMIT 1'
    );
    return rows.length > 0 ? rows[0].version : null;
  } catch {
    return null;
  }
}

function getOrderedVersions() {
  const config = JSON.parse(fs.readFileSync(VERSIONS_FILE, 'utf8'));
  return config.versions.map((v) => v.version);
}

function getExpectedVersion() {
  const versions = getOrderedVersions();
  return versions[versions.length - 1];
}

function getVersionsBetween(from, to, allVersions) {
  // from === null significa BD vacía → aplicar desde la primera versión
  const fromIdx = from === null ? -1 : allVersions.indexOf(from);
  const toIdx = allVersions.indexOf(to);

  if (toIdx === -1) throw new Error(`Versión destino ${to} no encontrada en versions.json`);

  if (fromIdx < toIdx) {
    return { direction: 'up', versions: allVersions.slice(fromIdx + 1, toIdx + 1) };
  } else if (fromIdx > toIdx) {
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
 * Respeta bloques BEGIN...END (triggers/procedures).
 * END IF / END WHILE / END LOOP no decrementan la profundidad.
 */
function splitSqlStatements(sql) {
  sql = sql.replace(/\/\*[\s\S]*?\*\//g, ''); // eliminar comentarios de bloque

  const statements = [];
  let current = '';
  let depth = 0;

  for (const line of sql.split('\n')) {
    const trimmed = line.trim();
    const upper = trimmed.toUpperCase();
    const withoutComment = trimmed.replace(/--.*$/, '').trim();

    if (upper === 'BEGIN' || upper === 'BEGIN;') depth++;
    if (upper === 'END' || upper === 'END;') depth = Math.max(0, depth - 1);

    current += line + '\n';

    if (depth === 0 && withoutComment.endsWith(';')) {
      const stmt = current.replace(/;\s*$/, '').trim();
      if (stmt) statements.push(stmt);
      current = '';
    }
  }

  const remaining = current.trim();
  if (remaining) statements.push(remaining);

  return statements.filter((s) => s.trim());
}

async function executeSqlFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8').trim();
  if (!sql) return;
  for (const stmt of splitSqlStatements(sql)) {
    try {
      await sequelize.query(stmt);
    } catch (err) {
      const msg = err.original?.sqlMessage || err.message || '';
      const isIdempotent =
        /Duplicate column name/i.test(msg) ||
        /Duplicate key name/i.test(msg) ||
        /index.*already exists/i.test(msg) ||
        /table.*already exists/i.test(msg) ||
        /Trigger.*already exists/i.test(msg);
      if (!isIdempotent) throw err;
      logger.warn(`[Migraciones] Ignorando error idempotente: ${msg}`);
    }
  }
}

async function setCurrentVersion(version, description, timeMs) {
  await sequelize.query('DELETE FROM schema_version');
  await sequelize.query(
    'INSERT INTO schema_version (version, description, migration_time_ms) VALUES (?, ?, ?)',
    { replacements: [version, description || null, timeMs] }
  );
}

async function recordHistory(fromVersion, toVersion, status, errorMessage, timeMs) {
  try {
    await sequelize.query(
      `INSERT INTO schema_version_history (from_version, to_version, status, error_message, migration_time_ms)
       VALUES (?, ?, ?, ?, ?)`,
      { replacements: [fromVersion, toVersion, status, errorMessage || null, timeMs] }
    );
  } catch {
    // schema_version_history puede no existir aún (fallo durante v1.0.0)
    // En ese caso simplemente no registramos — el log del servidor tiene el error
  }
}

// ─── Motor principal ──────────────────────────────────────────────────────────

async function runMigrations(currentVersion, targetVersion) {
  const allVersions = getOrderedVersions();
  const { direction, versions } = getVersionsBetween(currentVersion, targetVersion, allVersions);

  if (direction === 'none') return;

  logger.info(`[Migraciones] Dirección: ${direction.toUpperCase()} | ${currentVersion ?? 'vacía'} → ${targetVersion}`);
  logger.info(`[Migraciones] Versiones a aplicar: ${versions.join(', ')}`);

  for (const version of versions) {
    const idx = versions.indexOf(version);
    const fromVer = idx === 0 ? currentVersion : versions[idx - 1];
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
      logger.info(`[Migraciones] v${version} aplicada en ${timeMs}ms`);
    } catch (err) {
      const timeMs = Date.now() - t0;
      await recordHistory(fromVer, version, 'failed', err.message, timeMs);
      logger.error(`[Migraciones] Error en v${version}: ${err.message}`);
      throw err;
    }
  }
}

// ─── Operaciones manuales ─────────────────────────────────────────────────────

let migrationLock = false;

async function migrateTo(targetVersion) {
  if (migrationLock) throw new Error('Ya hay una migración en curso.');
  const allVersions = getOrderedVersions();
  if (!allVersions.includes(targetVersion)) {
    throw new Error(`Versión ${targetVersion} no encontrada en versions.json`);
  }
  migrationLock = true;
  try {
    const current = await getCurrentVersion();
    if (current === targetVersion) return { from: current, to: targetVersion, changed: false };
    await runMigrations(current, targetVersion);
    return { from: current, to: targetVersion, changed: true };
  } finally {
    migrationLock = false;
  }
}

function getVersionsMetadata() {
  const config = JSON.parse(fs.readFileSync(VERSIONS_FILE, 'utf8'));
  return config.versions;
}

// ─── Punto de entrada ─────────────────────────────────────────────────────────

async function _doCheckAndMigrate() {
  const tableExists = await schemaVersionExists();
  const current = tableExists ? await getCurrentVersion() : null;
  const expected = getExpectedVersion();

  logger.info(`[Migraciones] Versión actual: ${current ?? 'ninguna'} | Versión esperada: ${expected}`);

  if (current === expected) {
    logger.info('[Migraciones] Base de datos actualizada. Sin cambios necesarios.');
    return;
  }

  logger.info(`[Migraciones] Ejecutando migraciones: ${current ?? 'vacía'} → ${expected}`);
  const t0 = Date.now();

  await runMigrations(current, expected);

  logger.info(`[Migraciones] Completado en ${Date.now() - t0}ms. Versión: ${expected}`);
}

async function checkAndMigrate() {
  const timeout = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error(`Timeout: migraciones tardaron más de ${MIGRATION_TIMEOUT_MS / 1000}s`)),
      MIGRATION_TIMEOUT_MS
    )
  );
  return Promise.race([_doCheckAndMigrate(), timeout]);
}

module.exports = { checkAndMigrate, getCurrentVersion, getExpectedVersion, migrateTo, getVersionsMetadata };
