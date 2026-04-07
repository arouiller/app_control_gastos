const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { error } = require('../utils/response');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Token de acceso requerido', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({
      where: { id: decoded.id, is_active: true },
    });

    if (!user) {
      return error(res, 'Usuario no encontrado o inactivo', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Token expirado', 401);
    }
    if (err.name === 'JsonWebTokenError') {
      return error(res, 'Token inválido', 401);
    }
    next(err);
  }
};

module.exports = { authenticate };
