import api from './api'

export const categoryService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/categories', { params })
    return data
  },
  create: async (categoryData) => {
    const { data } = await api.post('/categories', categoryData)
    return data
  },
  update: async (id, categoryData) => {
    const { data } = await api.put(`/categories/${id}`, categoryData)
    return data
  },
  remove: async (id) => {
    const { data } = await api.delete(`/categories/${id}`)
    return data
  },
}
