import api from './api'

export const installmentService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/installments', { params })
    return data
  },
  pay: async (id, paymentData = {}) => {
    const { data } = await api.put(`/installments/${id}/pay`, paymentData)
    return data
  },
  unpay: async (id) => {
    const { data } = await api.put(`/installments/${id}/unpay`)
    return data
  },
  remove: async (id) => {
    const { data } = await api.delete(`/installments/${id}`)
    return data
  },
}
