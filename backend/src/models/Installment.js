const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Installment = sequelize.define('Installment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    expense_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    installment_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    total_installments: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0.01 },
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    is_paid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    paid_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    payment_notes: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  }, {
    tableName: 'installments',
    timestamps: true,
    underscored: true,
  });

  Installment.associate = (models) => {
    Installment.belongsTo(models.Expense, { foreignKey: 'expense_id', as: 'expense' });
  };

  return Installment;
};
