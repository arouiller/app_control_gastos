const { Op } = require('sequelize');
const { Installment, Expense, Category } = require('../models');
const { success, error, paginated } = require('../utils/response');

const listInstallments = async (req, res, next) => {
  try {
    const { includeAllCuotas, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (!includeAllCuotas || includeAllCuotas === 'false') {
      where.is_paid = false;
    }

    const { rows, count } = await Installment.findAndCountAll({
      where,
      include: [{
        model: Expense,
        as: 'expense',
        where: { user_id: req.user.id },
        include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'color'] }],
      }],
      order: [['due_date', 'ASC']],
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

const payInstallment = async (req, res, next) => {
  try {
    const installment = await Installment.findOne({
      where: { id: req.params.id },
      include: [{
        model: Expense,
        as: 'expense',
        where: { user_id: req.user.id },
      }],
    });

    if (!installment) return error(res, 'Cuota no encontrada', 404);

    const { paymentDate, notes } = req.body;
    await installment.update({
      is_paid: true,
      paid_date: paymentDate || new Date(),
      payment_notes: notes,
    });

    return success(res, installment, 'Cuota marcada como pagada');
  } catch (err) {
    next(err);
  }
};

const unpayInstallment = async (req, res, next) => {
  try {
    const installment = await Installment.findOne({
      where: { id: req.params.id },
      include: [{
        model: Expense,
        as: 'expense',
        where: { user_id: req.user.id },
      }],
    });

    if (!installment) return error(res, 'Cuota no encontrada', 404);

    await installment.update({ is_paid: false, paid_date: null, payment_notes: null });
    return success(res, installment, 'Cuota marcada como no pagada');
  } catch (err) {
    next(err);
  }
};

const deleteInstallment = async (req, res, next) => {
  try {
    const installment = await Installment.findOne({
      where: { id: req.params.id },
      include: [{
        model: Expense,
        as: 'expense',
        where: { user_id: req.user.id },
      }],
    });

    if (!installment) return error(res, 'Cuota no encontrada', 404);

    await installment.destroy();
    return success(res, null, 'Cuota eliminada');
  } catch (err) {
    next(err);
  }
};

module.exports = { listInstallments, payInstallment, unpayInstallment, deleteInstallment };
