const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    google_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    profile_picture_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
  });

  User.prototype.validatePassword = async function (password) {
    if (!this.password_hash) return false;
    return bcrypt.compare(password, this.password_hash);
  };

  User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password_hash;
    return values;
  };

  User.hashPassword = async (password) => {
    return bcrypt.hash(password, 12);
  };

  User.associate = (models) => {
    User.hasMany(models.Category, { foreignKey: 'user_id', as: 'categories' });
    User.hasMany(models.Expense, { foreignKey: 'user_id', as: 'expenses' });
    User.hasMany(models.Session, { foreignKey: 'user_id', as: 'sessions' });
  };

  return User;
};
