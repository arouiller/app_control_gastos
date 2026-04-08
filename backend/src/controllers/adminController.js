const { sequelize } = require('../models');
const { success } = require('../utils/response');
const { getCurrentVersion } = require('../migrations/migrationEngine');

const getDbInfo = async (req, res, next) => {
  try {
    const version = await getCurrentVersion();

    // Tablas de la BD actual (excluyendo vistas)
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME AS name
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);

    // Contar registros de cada tabla
    const counts = await Promise.all(
      tables.map(async ({ name }) => {
        const [[row]] = await sequelize.query(
          `SELECT COUNT(*) AS count FROM \`${name}\``
        );
        return { table: name, count: Number(row.count) };
      })
    );

    return success(res, { version, tables: counts });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDbInfo };
