const { Expense, Category } = require('../models');
const { success, error, paginated } = require('../utils/response');

// Lists child installment expenses from the expenses table (REQ-005 architecture)
const listInstallments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows, count } = await Expense.findAndCountAll({
      where: {
        user_id: req.user.id,
        is_installment: true,
        installment_group_id: { [require('sequelize').Op.ne]: null },
      },
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'color'] }],
      order: [['date', 'ASC'], ['installment_number', 'ASC']],
      limit: parseInt(limit),
      offset,
    });

    const totalPages = Math.ceil(count / parseInt(limit));
    return paginated(res, rows, {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: totalPages,
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1,
    });
  } catch (err) {
    next(err);
  }
};

// Payment tracking is a future feature (REQ-005 Consideraciones Futuras)
const payInstallment = async (req, res, next) => {
  return error(res, 'Marcación de pago por cuota es una funcionalidad futura', 501);
};

const unpayInstallment = async (req, res, next) => {
  return error(res, 'Marcación de pago por cuota es una funcionalidad futura', 501);
};

const deleteInstallment = async (req, res, next) => {
  return error(res, 'Eliminá el gasto padre para eliminar todas las cuotas', 403);
};

module.exports = { listInstallments, payInstallment, unpayInstallment, deleteInstallment };
