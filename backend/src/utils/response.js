/**
 * Utilidades para respuestas HTTP estandarizadas
 */

const success = (res, data = null, message = 'OK', statusCode = 200) => {
  const response = { success: true };
  if (message !== 'OK') response.message = message;
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
};

const created = (res, data = null, message = 'Recurso creado') => {
  return success(res, data, message, 201);
};

const error = (res, message = 'Error interno', statusCode = 500, details = null) => {
  const response = {
    success: false,
    error: { message },
  };
  if (details) response.error.details = details;
  return res.status(statusCode).json(response);
};

const validationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    error: {
      message: 'Datos de entrada inválidos',
      details: errors,
    },
  });
};

const paginated = (res, data, pagination) => {
  return res.status(200).json({
    success: true,
    data,
    pagination,
  });
};

module.exports = { success, created, error, validationError, paginated };
