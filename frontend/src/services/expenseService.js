import api from './api'

export const expenseService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/expenses', { params })
    return data
  },
  getById: async (id) => {
    const { data } = await api.get(`/expenses/${id}`)
    return data
  },
  create: async (expenseData) => {
    const { data } = await api.post('/expenses', expenseData)
    return data
  },
  createInstallment: async (expenseData) => {
    const { data } = await api.post('/expenses/installment', expenseData)
    return data
  },
  update: async (id, expenseData) => {
    const { data } = await api.put(`/expenses/${id}`, expenseData)
    return data
  },
  remove: async (id) => {
    const { data } = await api.delete(`/expenses/${id}`)
    return data
  },
  convert: async (params = {}) => {
    const { data } = await api.get('/expenses/convert', { params })
    return data
  },
}
