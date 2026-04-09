const { Expense, Category } = require('../models');
const { sequelize } = require('../models');
const { addMonths, format } = require('../utils/dateHelpers');
const { created, error } = require('../utils/response');

const createInstallmentExpense = async (req, res, next) => {
  try {
    const {
      description, amount, date, categoryId, paymentMethod,
      numberOfInstallments, notes, currency = 'ARS',
    } = req.body;

    const category = await Category.findOne({
      where: { id: categoryId, user_id: req.user.id },
    });
    if (!category) return error(res, 'Categoría no encontrada', 404);

    const numInstallments = parseInt(numberOfInstallments);
    if (numInstallments < 2 || numInstallments > 36) {
      return error(res, 'El número de cuotas debe ser entre 2 y 36', 400);
    }

    const totalAmount = parseFloat(amount);
    const installmentAmount = parseFloat((totalAmount / numInstallments).toFixed(2));

    const result = await sequelize.transaction(async (t) => {
      const parent = await Expense.create({
        user_id: req.user.id,
        category_id: categoryId,
        description,
        amount: totalAmount,
        currency,
        date,
        payment_method: paymentMethod || 'credit_card',
        is_installment: true,
        total_installments: numInstallments,
        installment_number: null,
        installment_group_id: null,
        notes,
      }, { transaction: t });

      const startDate = new Date(date);
      const childrenData = [];
      for (let i = 1; i <= numInstallments; i++) {
        childrenData.push({
          user_id: req.user.id,
          category_id: categoryId,
          description,
          amount: installmentAmount,
          currency,
          date: format(addMonths(startDate, i - 1)),
          payment_method: paymentMethod || 'credit_card',
          is_installment: true,
          total_installments: numInstallments,
          installment_number: i,
          installment_group_id: parent.id,
          notes,
        });
      }
      const children = await Expense.bulkCreate(childrenData, { transaction: t });

      return { parent, children };
    });

    return res.status(201).json({
      success: true,
      message: 'Gasto en cuotas registrado',
      data: {
        ...result.parent.toJSON(),
        installments: result.children.map(c => c.toJSON()),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createInstallmentExpense };
