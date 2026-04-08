import api from './api'

export const reportService = {
  getMonthlyGrouped: async (params = {}) => {
    const { data } = await api.get('/reports/monthly-grouping', { params })
    return data
  },
  getMonthlyDetails: async (params = {}) => {
    const { data } = await api.get('/reports/monthly-grouping/details', { params })
    return data
  },
}
