import api from './api'

const getRecentRates = async (limit = 30) => {
  const { data } = await api.get('/admin/exchange-rates/recent', { params: { limit } })
  return data.data
}

const getLogs = async ({ type, status, fromDate, toDate, limit = 50 } = {}) => {
  const { data } = await api.get('/admin/exchange-rates/logs', {
    params: { type, status, from_date: fromDate, to_date: toDate, limit },
  })
  return data.data
}

const loadHistorical = async (fechaDesde, fechaHasta) => {
  const { data } = await api.post('/admin/exchange-rates/load-historical', {
    fecha_desde: fechaDesde,
    fecha_hasta: fechaHasta,
  })
  return data.data
}

const triggerDailyFetch = async () => {
  const { data } = await api.post('/admin/exchange-rates/trigger')
  return data.data
}

const getRateByDate = async (date) => {
  const { data } = await api.get(`/exchange-rates/${date}`)
  return data.data
}

const runDiagnostics = async () => {
  const { data } = await api.post('/admin/exchange-rates/diagnostics')
  return data.data
}

export const exchangeRateService = {
  getRecentRates,
  getLogs,
  loadHistorical,
  triggerDailyFetch,
  getRateByDate,
  runDiagnostics,
}
