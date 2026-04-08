const { error } = require('../utils/response');

const requireAdmin = (req, res, next) => {
  if (!req.user?.is_admin) {
    return error(res, 'Acceso restringido a administradores', 403);
  }
  next();
};

module.exports = { requireAdmin };
