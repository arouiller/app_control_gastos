import api from './api'

export const authService = {
  login: async (credentials) => {
    const { data } = await api.post('/auth/login', credentials)
    return data
  },
  register: async (userData) => {
    const { data } = await api.post('/auth/register', userData)
    return data
  },
  logout: async () => {
    const { data } = await api.post('/auth/logout')
    return data
  },
  forgotPassword: async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email })
    return data
  },
  googleAuth: async (credential) => {
    const { data } = await api.post('/auth/google', { credential })
    return data
  },
  linkGoogle: async (credential) => {
    const { data } = await api.post('/auth/google/link', { credential })
    return data
  },
}
