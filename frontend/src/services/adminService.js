import api from './api'

const getDbInfo = async () => {
  const { data } = await api.get('/admin/db-info')
  return data.data
}

export const adminService = { getDbInfo }
