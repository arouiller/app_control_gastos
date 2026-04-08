import api from './api'

const getDbInfo = async () => {
  const { data } = await api.get('/admin/db-info')
  return data.data
}

const getDbVersions = async () => {
  const { data } = await api.get('/admin/db-versions')
  return data.data
}

const migrateToVersion = async (version) => {
  const { data } = await api.post('/admin/db-migrate', { version })
  return data.data
}

export const adminService = { getDbInfo, getDbVersions, migrateToVersion }
