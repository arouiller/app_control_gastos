const Joi = require('joi');

const createSchema = Joi.object({
  descripcion: Joi.string().required().max(255),
  monto_total: Joi.number().required().positive().precision(2),
  moneda: Joi.string().required().valid('ARS', 'USD'),
  medio_de_pago: Joi.string().required().valid('cash', 'credit_card'),
  cantidad_de_cuotas: Joi.number().required().integer().min(1).max(24),
  valor_de_la_cuota: Joi.number().required().positive().precision(2),
  expense_date: Joi.date().required().max('now'),
});

const updateSchema = Joi.object({
  descripcion: Joi.string().max(255),
  monto_total: Joi.number().positive().precision(2),
  moneda: Joi.string().valid('ARS', 'USD'),
  medio_de_pago: Joi.string().valid('cash', 'credit_card'),
  cantidad_de_cuotas: Joi.number().integer().min(1).max(24),
  valor_de_la_cuota: Joi.number().positive().precision(2),
  expense_date: Joi.date().max('now'),
}).min(1);

const convertirSchema = Joi.object({
  category_id: Joi.number().required().positive().integer(),
});

module.exports = {
  createSchema,
  updateSchema,
  convertirSchema,
};
