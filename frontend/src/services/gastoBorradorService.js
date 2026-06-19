import api from './api';

export const gastoBorradorService = {
  // Create new borrador
  create: (data) => api.post('/gastos-borrador', data),

  // Get all borradores with filters
  getAll: (filters = {}) => api.get('/gastos-borrador', { params: filters }),

  // Get single borrador by ID
  getById: (id) => api.get(`/gastos-borrador/${id}`),

  // Update borrador (only if draft)
  update: (id, data) => api.put(`/gastos-borrador/${id}`, data),

  // Delete borrador (only if draft)
  delete: (id) => api.delete(`/gastos-borrador/${id}`),

  // Convert borrador to expense
  convertir: (id, categoryId) => api.post(`/gastos-borrador/${id}/convertir`, { category_id: categoryId }),
};
