'use strict';

module.exports = {
  up: async (sequelize, Sequelize) => {
    const transaction = await sequelize.transaction();
    try {
      await sequelize.getQueryInterface().createTable(
        'gastos_borrador',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          descripcion: {
            type: Sequelize.STRING(255),
            allowNull: false,
          },
          monto_total: {
            type: Sequelize.DECIMAL(12, 2),
            allowNull: false,
            validate: { min: 0.01 },
          },
          moneda: {
            type: Sequelize.ENUM('ARS', 'USD'),
            allowNull: false,
            defaultValue: 'ARS',
          },
          medio_de_pago: {
            type: Sequelize.ENUM('cash', 'credit_card'),
            allowNull: false,
          },
          cantidad_de_cuotas: {
            type: Sequelize.INTEGER,
            allowNull: false,
            validate: { min: 1, max: 24 },
          },
          valor_de_la_cuota: {
            type: Sequelize.DECIMAL(12, 2),
            allowNull: false,
            validate: { min: 0.01 },
          },
          expense_date: {
            type: Sequelize.DATEONLY,
            allowNull: false,
          },
          status: {
            type: Sequelize.ENUM('draft', 'convertido'),
            allowNull: false,
            defaultValue: 'draft',
          },
          expense_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: 'expenses',
              key: 'id',
            },
            onDelete: 'SET NULL',
          },
          created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.fn('NOW'),
          },
          updated_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.fn('NOW'),
            onUpdate: Sequelize.fn('NOW'),
          },
          converted_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
        },
        { transaction }
      );

      // Indexes
      await sequelize.getQueryInterface().addIndex(
        'gastos_borrador',
        ['user_id'],
        { transaction }
      );
      await sequelize.getQueryInterface().addIndex(
        'gastos_borrador',
        ['status'],
        { transaction }
      );
      await sequelize.getQueryInterface().addIndex(
        'gastos_borrador',
        ['created_at'],
        { transaction }
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  down: async (sequelize, Sequelize) => {
    await sequelize.getQueryInterface().dropTable('gastos_borrador');
  },
};
