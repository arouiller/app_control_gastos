const { GastoBorrador, Expense, Installment, Category } = require('../models');
const AppError = require('../utils/appError');
const { addMonths } = require('date-fns');

// Helper: Check inconsistency between monto_total, cantidad_de_cuotas, and valor_de_la_cuota
const getInconsistencyWarning = (monto_total, cantidad_de_cuotas, valor_de_la_cuota) => {
  const calculatedTotal = parseFloat((valor_de_la_cuota * cantidad_de_cuotas).toFixed(2));
  const actualTotal = parseFloat(monto_total.toFixed(2));
  if (calculatedTotal !== actualTotal) {
    return `Suma de cuotas ($${calculatedTotal}) difiere de monto total ($${actualTotal})`;
  }
  return null;
};

// Helper: Calculate installment dates (starting next month from expense_date)
const calculateInstallmentDates = (expenseDate, numInstallments) => {
  const dates = [];
  let currentDate = addMonths(new Date(expenseDate), 1);
  for (let i = 0; i < numInstallments; i++) {
    dates.push(new Date(currentDate));
    currentDate = addMonths(currentDate, 1);
  }
  return dates;
};

// Helper: Distribute amount across installments (last may differ due to rounding)
const distributeAmount = (totalAmount, numInstallments) => {
  const amounts = [];
  const baseAmount = parseFloat((totalAmount / numInstallments).toFixed(2));
  for (let i = 0; i < numInstallments - 1; i++) {
    amounts.push(baseAmount);
  }
  const lastAmount = parseFloat((totalAmount - baseAmount * (numInstallments - 1)).toFixed(2));
  amounts.push(lastAmount);
  return amounts;
};

// POST /api/gastos-borrador
exports.create = async (req, res, next) => {
  try {
    const { user } = req;
    const { descripcion, monto_total, moneda, medio_de_pago, cantidad_de_cuotas, valor_de_la_cuota, expense_date } = req.body;

    const inconsistency_warning = getInconsistencyWarning(monto_total, cantidad_de_cuotas, valor_de_la_cuota);

    const gastoBorrador = await GastoBorrador.create({
      user_id: user.id,
      descripcion,
      monto_total,
      moneda,
      medio_de_pago,
      cantidad_de_cuotas,
      valor_de_la_cuota,
      expense_date,
      status: 'draft',
    });

    res.status(201).json({
      success: true,
      data: {
        ...gastoBorrador.toJSON(),
        inconsistency_warning,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/gastos-borrador
exports.list = async (req, res, next) => {
  try {
    const { user } = req;
    const { status, page = 1, limit = 20, sort = '-created_at' } = req.query;

    const where = { user_id: user.id };
    if (status) {
      where.status = status;
    }

    const offset = (page - 1) * limit;
    const order = [];
    if (sort === '-created_at') {
      order.push(['created_at', 'DESC']);
    } else if (sort === 'created_at') {
      order.push(['created_at', 'ASC']);
    } else if (sort === '-monto_total') {
      order.push(['monto_total', 'DESC']);
    } else if (sort === 'monto_total') {
      order.push(['monto_total', 'ASC']);
    }

    const { count, rows } = await GastoBorrador.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order: order.length > 0 ? order : [['created_at', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/gastos-borrador/:id
exports.getById = async (req, res, next) => {
  try {
    const { user } = req;
    const { id } = req.params;

    const gastoBorrador = await GastoBorrador.findOne({
      where: { id, user_id: user.id },
    });

    if (!gastoBorrador) {
      return next(new AppError('Gasto borrador no encontrado', 404));
    }

    const inconsistency_warning = getInconsistencyWarning(
      gastoBorrador.monto_total,
      gastoBorrador.cantidad_de_cuotas,
      gastoBorrador.valor_de_la_cuota
    );

    res.status(200).json({
      success: true,
      data: {
        ...gastoBorrador.toJSON(),
        inconsistency_warning,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/gastos-borrador/:id
exports.update = async (req, res, next) => {
  try {
    const { user } = req;
    const { id } = req.params;
    const updates = req.body;

    const gastoBorrador = await GastoBorrador.findOne({
      where: { id, user_id: user.id },
    });

    if (!gastoBorrador) {
      return next(new AppError('Gasto borrador no encontrado', 404));
    }

    if (gastoBorrador.status !== 'draft') {
      return next(new AppError('Solo se pueden editar borradores en estado draft', 403));
    }

    // Auto-recalculate valor_de_la_cuota if monto_total or cantidad_de_cuotas changed
    const newMonto = updates.monto_total !== undefined ? updates.monto_total : gastoBorrador.monto_total;
    const newCuotas = updates.cantidad_de_cuotas !== undefined ? updates.cantidad_de_cuotas : gastoBorrador.cantidad_de_cuotas;

    // If user didn't explicitly set valor_de_la_cuota but changed monto or cuotas, recalculate
    if (
      (updates.monto_total !== undefined || updates.cantidad_de_cuotas !== undefined) &&
      updates.valor_de_la_cuota === undefined
    ) {
      updates.valor_de_la_cuota = parseFloat((newMonto / newCuotas).toFixed(2));
    }

    await gastoBorrador.update(updates);

    const inconsistency_warning = getInconsistencyWarning(
      gastoBorrador.monto_total,
      gastoBorrador.cantidad_de_cuotas,
      gastoBorrador.valor_de_la_cuota
    );

    res.status(200).json({
      success: true,
      data: {
        ...gastoBorrador.toJSON(),
        inconsistency_warning,
      },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/gastos-borrador/:id
exports.delete = async (req, res, next) => {
  try {
    const { user } = req;
    const { id } = req.params;

    const gastoBorrador = await GastoBorrador.findOne({
      where: { id, user_id: user.id },
    });

    if (!gastoBorrador) {
      return next(new AppError('Gasto borrador no encontrado', 404));
    }

    if (gastoBorrador.status !== 'draft') {
      return next(new AppError('Solo se pueden eliminar borradores en estado draft', 403));
    }

    await gastoBorrador.destroy();

    res.status(200).json({
      success: true,
      message: 'Gasto borrador eliminado',
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/gastos-borrador/:id/convertir
exports.convertir = async (req, res, next) => {
  const sequelize = require('../db/sequelize');
  const transaction = await sequelize.transaction();
  try {
    const { user } = req;
    const { id } = req.params;
    const { category_id } = req.body;

    const gastoBorrador = await GastoBorrador.findOne({
      where: { id, user_id: user.id },
      transaction,
    });

    if (!gastoBorrador) {
      await transaction.rollback();
      return next(new AppError('Gasto borrador no encontrado', 404));
    }

    if (gastoBorrador.status !== 'draft') {
      await transaction.rollback();
      return next(new AppError('Solo se pueden convertir borradores en estado draft', 403));
    }

    // Validate category belongs to user
    const category = await Category.findOne({
      where: { id: category_id, user_id: user.id },
      transaction,
    });

    if (!category) {
      await transaction.rollback();
      return next(new AppError('Categoría no válida o no pertenece al usuario', 400));
    }

    // Validate amounts
    if (gastoBorrador.monto_total <= 0 || gastoBorrador.valor_de_la_cuota <= 0) {
      await transaction.rollback();
      return next(new AppError('Montos deben ser positivos', 400));
    }

    // Create Expense
    const expense = await Expense.create(
      {
        user_id: user.id,
        category_id: category_id,
        description: gastoBorrador.descripcion,
        amount: gastoBorrador.monto_total,
        currency: gastoBorrador.moneda,
        date: gastoBorrador.expense_date,
        payment_method: gastoBorrador.medio_de_pago,
        is_installment: gastoBorrador.cantidad_de_cuotas > 1,
        total_installments: gastoBorrador.cantidad_de_cuotas,
      },
      { transaction }
    );

    // Create installments if cantidad_de_cuotas > 1
    if (gastoBorrador.cantidad_de_cuotas > 1) {
      const installmentDates = calculateInstallmentDates(gastoBorrador.expense_date, gastoBorrador.cantidad_de_cuotas);
      const installmentAmounts = distributeAmount(gastoBorrador.monto_total, gastoBorrador.cantidad_de_cuotas);

      const installments = [];
      for (let i = 0; i < gastoBorrador.cantidad_de_cuotas; i++) {
        installments.push({
          expense_id: expense.id,
          installment_number: i + 1,
          total_installments: gastoBorrador.cantidad_de_cuotas,
          amount: installmentAmounts[i],
          due_date: installmentDates[i],
          is_paid: false,
        });
      }

      await Installment.bulkCreate(installments, { transaction });
    }

    // Update GastoBorrador
    await gastoBorrador.update(
      {
        status: 'convertido',
        expense_id: expense.id,
        converted_at: new Date(),
      },
      { transaction }
    );

    // Reload to get associations
    const updatedBorrador = await GastoBorrador.findByPk(gastoBorrador.id, { transaction });
    const expenseWithInstallments = await Expense.findByPk(expense.id, {
      include: ['installments'],
      transaction,
    });

    await transaction.commit();

    res.status(201).json({
      success: true,
      data: {
        expense: expenseWithInstallments.toJSON(),
        gasto_borrador_actualizado: updatedBorrador.toJSON(),
      },
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};
