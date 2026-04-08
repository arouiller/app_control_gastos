import { useEffect, useState } from 'react'
import { FiTrendingUp, FiRefreshCw, FiDownload, FiAlertCircle } from 'react-icons/fi'
import { exchangeRateService } from '../services/exchangeRateService'
import Card, { CardTitle } from '../components/UI/Card'
import { PageLoader } from '../components/UI/LoadingSpinner'
import Badge from '../components/UI/Badge'
import Button from '../components/UI/Button'
import Input from '../components/UI/Input'

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-AR')
}

function formatDateTime(ts) {
  if (!ts) return '-'
  return new Date(ts).toLocaleString('es-AR')
}

function formatRate(rate) {
  if (rate == null) return '-'
  return Number(rate).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
}

const statusVariant = { success: 'success', failed: 'danger', skipped: 'warning' }
const typeLabel = { daily_fetch: 'Diario', historical_load: 'Histórico', manual_update: 'Manual' }

function defaultDates() {
  const today = new Date().toISOString().split('T')[0]
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  return { today, oneYearAgo }
}

export default function ExchangeRates() {
  const { today, oneYearAgo } = defaultDates()

  const [rates, setRates] = useState(null)
  const [logs, setLogs] = useState(null)
  const [loading, setLoading] = useState(true)

  // Historical load form
  const [fechaDesde, setFechaDesde] = useState(oneYearAgo)
  const [fechaHasta, setFechaHasta] = useState(today)
  const [loadingHistorical, setLoadingHistorical] = useState(false)
  const [historicalResult, setHistoricalResult] = useState(null)
  const [historicalError, setHistoricalError] = useState(null)

  // Trigger daily fetch
  const [triggerLoading, setTriggerLoading] = useState(false)
  const [triggerResult, setTriggerResult] = useState(null)

  // Logs filters
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [logsLoading, setLogsLoading] = useState(false)

  async function loadData() {
    try {
      const [r, l] = await Promise.all([
        exchangeRateService.getRecentRates(30),
        exchangeRateService.getLogs({ limit: 50 }),
      ])
      setRates(r)
      setLogs(l)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  async function handleLoadHistorical(e) {
    e.preventDefault()
    setLoadingHistorical(true)
    setHistoricalResult(null)
    setHistoricalError(null)
    try {
      const result = await exchangeRateService.loadHistorical(fechaDesde, fechaHasta)
      setHistoricalResult(result)
      // Refresh data
      const [r, l] = await Promise.all([
        exchangeRateService.getRecentRates(30),
        exchangeRateService.getLogs({ limit: 50 }),
      ])
      setRates(r)
      setLogs(l)
    } catch (err) {
      setHistoricalError(err.response?.data?.error?.message || 'Error al cargar histórico')
    } finally {
      setLoadingHistorical(false)
    }
  }

  async function handleTrigger() {
    setTriggerLoading(true)
    setTriggerResult(null)
    try {
      const result = await exchangeRateService.triggerDailyFetch()
      setTriggerResult({ ok: true, message: result.status === 'skipped'
        ? 'Sin cotización disponible hoy (feriado/fin de semana)'
        : `Cotización guardada: ${formatRate(result.rate)} ARS/USD (${result.action})`
      })
      const [r, l] = await Promise.all([
        exchangeRateService.getRecentRates(30),
        exchangeRateService.getLogs({ limit: 50 }),
      ])
      setRates(r)
      setLogs(l)
    } catch (err) {
      setTriggerResult({ ok: false, message: err.response?.data?.error?.message || 'Error al obtener cotización' })
    } finally {
      setTriggerLoading(false)
    }
  }

  async function handleFilterLogs() {
    setLogsLoading(true)
    try {
      const l = await exchangeRateService.getLogs({
        type: filterType || undefined,
        status: filterStatus || undefined,
        limit: 100,
      })
      setLogs(l)
    } finally {
      setLogsLoading(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <FiTrendingUp size={22} className="text-secondary" />
          <h1 className="text-xl font-bold text-primary">Cotizaciones ARS/USD</h1>
        </div>
        <div className="flex items-center gap-2">
          {triggerResult && (
            <span className={`text-xs font-medium px-3 py-1.5 rounded-md ${triggerResult.ok ? 'bg-success-bg text-success-text' : 'bg-danger-bg text-danger-text'}`}>
              {triggerResult.message}
            </span>
          )}
          <Button variant="ghost" size="sm" loading={triggerLoading} onClick={handleTrigger}>
            <FiRefreshCw size={14} />
            Obtener cotización de hoy
          </Button>
        </div>
      </div>

      {/* Carga histórica */}
      <Card>
        <CardTitle className="flex items-center gap-2 mb-4">
          <FiDownload size={16} />
          Cargar Histórico
        </CardTitle>
        <form onSubmit={handleLoadHistorical} className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-neutral-darker mb-1">Desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="border border-neutral rounded-md px-3 py-2 text-sm text-primary focus:outline-none focus:border-secondary"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-darker mb-1">Hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="border border-neutral rounded-md px-3 py-2 text-sm text-primary focus:outline-none focus:border-secondary"
              required
            />
          </div>
          <Button type="submit" variant="primary" size="sm" loading={loadingHistorical}>
            Cargar Histórico
          </Button>
        </form>

        {loadingHistorical && (
          <p className="mt-3 text-sm text-neutral-darker">Consultando BCRA y procesando registros...</p>
        )}

        {historicalError && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-danger-bg text-danger-text text-sm rounded-md">
            <FiAlertCircle size={14} />
            {historicalError}
          </div>
        )}

        {historicalResult && (
          <div className="mt-3 px-4 py-3 bg-success-bg text-success-text rounded-md">
            <p className="text-sm font-semibold mb-1">Carga completada</p>
            <div className="flex flex-wrap gap-4 text-xs">
              <span>Procesados: <strong>{historicalResult.summary.total_days_processed}</strong></span>
              <span>Insertados: <strong>{historicalResult.summary.total_inserted}</strong></span>
              <span>Actualizados: <strong>{historicalResult.summary.total_updated}</strong></span>
              <span>Sin datos: <strong>{historicalResult.summary.total_skipped}</strong></span>
              {historicalResult.summary.total_failed > 0 && (
                <span className="text-danger-text">Fallidos: <strong>{historicalResult.summary.total_failed}</strong></span>
              )}
              <span className="text-neutral-darker">Tiempo: {(historicalResult.execution_time_ms / 1000).toFixed(1)}s</span>
            </div>
          </div>
        )}
      </Card>

      {/* Cotizaciones recientes */}
      <Card>
        <CardTitle className="mb-4">Cotizaciones Recientes</CardTitle>
        {!rates || rates.length === 0 ? (
          <p className="text-sm text-neutral-darker text-center py-4">Sin cotizaciones registradas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral">
                  <th className="text-left py-2 px-3 font-medium text-neutral-darker">Fecha</th>
                  <th className="text-right py-2 px-3 font-medium text-neutral-darker">ARS/USD</th>
                  <th className="text-right py-2 px-3 font-medium text-neutral-darker">Última actualización</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((r) => (
                  <tr key={r.rate_date} className="border-b border-neutral last:border-0 hover:bg-neutral/50">
                    <td className="py-2.5 px-3 font-mono text-primary">{formatDate(r.rate_date)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-secondary">
                      {formatRate(r.ars_to_usd)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-xs text-neutral-darker">
                      {formatDateTime(r.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Logs */}
      <Card>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <CardTitle>Últimas Operaciones</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-neutral rounded-md px-3 py-1.5 text-xs text-primary focus:outline-none focus:border-secondary"
            >
              <option value="">Todos los tipos</option>
              <option value="daily_fetch">Diario</option>
              <option value="historical_load">Histórico</option>
              <option value="manual_update">Manual</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-neutral rounded-md px-3 py-1.5 text-xs text-primary focus:outline-none focus:border-secondary"
            >
              <option value="">Todos los estados</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="skipped">Skipped</option>
            </select>
            <Button variant="secondary" size="sm" loading={logsLoading} onClick={handleFilterLogs}>
              Filtrar
            </Button>
          </div>
        </div>

        {!logs || logs.length === 0 ? (
          <p className="text-sm text-neutral-darker text-center py-4">Sin operaciones registradas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral">
                  <th className="text-left py-2 px-3 font-medium text-neutral-darker">Tipo</th>
                  <th className="text-left py-2 px-3 font-medium text-neutral-darker">Fecha</th>
                  <th className="text-right py-2 px-3 font-medium text-neutral-darker">Anterior</th>
                  <th className="text-right py-2 px-3 font-medium text-neutral-darker">Nuevo</th>
                  <th className="text-left py-2 px-3 font-medium text-neutral-darker">Estado</th>
                  <th className="text-left py-2 px-3 font-medium text-neutral-darker">Ejecutado</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-neutral last:border-0 hover:bg-neutral/50">
                    <td className="py-2.5 px-3">
                      <Badge variant="default">{typeLabel[log.operation_type] || log.operation_type}</Badge>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-primary">{formatDate(log.rate_date)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-neutral-darker text-xs">
                      {log.old_rate != null ? formatRate(log.old_rate) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-secondary">
                      {log.new_rate != null ? formatRate(log.new_rate) : '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant={statusVariant[log.status] || 'default'}>
                        {log.status}
                      </Badge>
                      {log.error_message && (
                        <p className="text-xs text-danger-text mt-0.5">{log.error_message}</p>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-neutral-darker">
                      <div>{formatDateTime(log.executed_at)}</div>
                      {log.executed_by && <div className="text-neutral-darker/70">{log.executed_by}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
