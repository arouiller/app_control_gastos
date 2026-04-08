const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Expense = sequelize.define('Expense', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0.01 },
    },
    currency: {
      type: DataTypes.ENUM('ARS', 'USD'),
      allowNull: false,
      defaultValue: 'ARS',
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    payment_method: {
      type: DataTypes.ENUM('cash', 'credit_card'),
      allowNull: false,
    },
    is_installment: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    total_installments: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    installment_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    installment_group_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'expenses',
    timestamps: true,
    underscored: true,
  });

  Expense.associate = (models) => {
    Expense.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Expense.belongsTo(models.Category, { foreignKey: 'category_id', as: 'category' });
    Expense.hasMany(models.Installment, { foreignKey: 'expense_id', as: 'installments' });
    // Self-reference for installment group
    Expense.belongsTo(models.Expense, { foreignKey: 'installment_group_id', as: 'installmentGroup' });
    Expense.hasMany(models.Expense, { foreignKey: 'installment_group_id', as: 'installmentExpenses' });
  };

  return Expense;
};
