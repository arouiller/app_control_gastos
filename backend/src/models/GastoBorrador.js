const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GastoBorrador = sequelize.define(
    'GastoBorrador',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      descripcion: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      monto_total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0.01 },
      },
      moneda: {
        type: DataTypes.ENUM('ARS', 'USD'),
        allowNull: false,
        defaultValue: 'ARS',
      },
      medio_de_pago: {
        type: DataTypes.ENUM('cash', 'credit_card'),
        allowNull: false,
      },
      cantidad_de_cuotas: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 24 },
      },
      valor_de_la_cuota: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0.01 },
      },
      expense_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('draft', 'convertido'),
        allowNull: false,
        defaultValue: 'draft',
      },
      expense_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      converted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'gastos_borrador',
      timestamps: true,
      underscored: true,
    }
  );

  GastoBorrador.associate = (models) => {
    GastoBorrador.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
    GastoBorrador.belongsTo(models.Expense, {
      foreignKey: 'expense_id',
      as: 'expense',
    });
  };

  return GastoBorrador;
};
