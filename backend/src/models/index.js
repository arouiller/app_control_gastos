const sequelize = require('../config/database');
const UserModel = require('./User');
const CategoryModel = require('./Category');
const ExpenseModel = require('./Expense');
const InstallmentModel = require('./Installment');
const SessionModel = require('./Session');
const GastoBorradorModel = require('./GastoBorrador');

// Initialize models
const User = UserModel(sequelize);
const Category = CategoryModel(sequelize);
const Expense = ExpenseModel(sequelize);
const Installment = InstallmentModel(sequelize);
const Session = SessionModel(sequelize);
const GastoBorrador = GastoBorradorModel(sequelize);

const models = { User, Category, Expense, Installment, Session, GastoBorrador };

// Set up associations
Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

module.exports = { sequelize, ...models };
