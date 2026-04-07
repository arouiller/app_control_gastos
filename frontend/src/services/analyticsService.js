import api from './api'

export const analyticsService = {
  getSummary: async (params = {}) => {
    const { data } = await api.get('/analytics/summary', { params })
    return data
  },
  getByCategory: async (params = {}) => {
    const { data } = await api.get('/analytics/by-category', { params })
    return data
  },
  getCashVsCard: async (params = {}) => {
    const { data } = await api.get('/analytics/cash-vs-card', { params })
    return data
  },
  getPendingInstallments: async (params = {}) => {
    const { data } = await api.get('/analytics/pending-installments', { params })
    return data
  },
  getUserProfile: async () => {
    const { data } = await api.get('/users/profile')
    return data
  },
  updateProfile: async (profileData) => {
    const { data } = await api.put('/users/profile', profileData)
    return data
  },
  changePassword: async (passwordData) => {
    const { data } = await api.put('/users/password', passwordData)
    return data
  },
}
