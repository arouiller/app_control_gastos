import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { analyticsService } from '../services/analyticsService'
import Card, { CardTitle } from '../components/UI/Card'
import Button from '../components/UI/Button'
import Input from '../components/UI/Input'
import Select from '../components/UI/Select'
import { PageLoader } from '../components/UI/LoadingSpinner'
import { formatCurrency, startOfCurrentMonth, endOfCurrentMonth } from '../utils/formatters'
import { toast } from 'react-toastify'

export default function Reports() {
  const [startDate, setStartDate] = useState(startOfCurrentMonth())
  const [endDate, setEndDate] = useState(endOfCurrentMonth())
  const [displayCurrency, setDisplayCurrency] = useState('original')
  const [allData, setAllData] = useState({
    summary: null,
    cashVsCard: null,
  })
  const [loading, setLoading] = useState(true)

  // Helper to select data by currency
  const getDataByCurrency = (data, currency) => {
    if (!data) return null
    const key = currency === 'original' ? 'byOriginalCurrency' : currency === 'ARS' ? 'inArs' : 'inUsd'
    return data[key] || data
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const params = { startDate, endDate }
      const [s, cvc] = await Promise.all([
        analyticsService.getSummary(params),
        analyticsService.getCashVsCard(params),
      ])
      setAllData({
        summary: s.data,
        cashVsCard: cvc.data,
      })
    } catch {
      toast.error('Error al cargar reportes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [startDate, endDate])

  if (loading) return <PageLoader />

  // Select data based on displayCurrency
  const summary = getDataByCurrency(allData.summary, displayCurrency)
  const cashVsCard = getDataByCurrency(allData.cashVsCard, displayCurrency)

  const cashVsCardData = cashVsCard ? [
    { name: 'Efectivo', value: cashVsCard.summary.cashTotal, color: '#10B981' },
    { name: 'Tarjeta', value: cashVsCard.summary.cardTotal, color: '#3B82F6' },
  ] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-primary">Reportes</h1>
        <Link
          to="/reports/monthly-grouping"
          className="text-sm font-medium text-secondary hover:underline"
        >
          Agrupamiento mensual →
        </Link>
      </div>

      {/* Date range selector and currency */}
      <Card>
        <div className="flex flex-wrap gap-4 items-end">
          <Input
            label="Desde"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="Hasta"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <div className="w-48">
            <Select
              label="Mostrar en"
              options={[
                { value: 'original', label: 'Moneda original' },
                { value: 'ARS', label: 'Pesos (ARS)' },
                { value: 'USD', label: 'Dólares (USD)' },
              ]}
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value)}
            />
          </div>
          <Button variant="secondary" onClick={loadData}>Actualizar</Button>
        </div>
      </Card>

      {/* Summary stats */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Gastos', value: formatCurrency(summary.totalExpenses) },
            { label: 'Transacciones', value: summary.totalTransactions },
            { label: 'Promedio Diario', value: formatCurrency(summary.averageDaily) },
            { label: 'Var. Mes Ant.', value: `${summary.comparisonWithPreviousMonth?.percentageChange > 0 ? '+' : ''}${(summary.comparisonWithPreviousMonth?.percentageChange || 0).toFixed(1)}%` },
          ].map((s) => (
            <Card key={s.label}>
              <p className="text-xs text-neutral-darker">{s.label}</p>
              <p className="text-lg font-bold font-mono text-primary mt-1">{s.value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cash vs Card Pie */}
        <Card>
          <CardTitle className="mb-4">Efectivo vs Tarjeta</CardTitle>
          {cashVsCardData.some((d) => d.value > 0) ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={cashVsCardData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {cashVsCardData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-4 mt-2">
                {cashVsCardData.map((d) => (
                  <div key={d.name} className="text-center">
                    <p className="text-xs text-neutral-darker">{d.name}</p>
                    <p className="text-sm font-semibold font-mono" style={{ color: d.color }}>
                      {formatCurrency(d.value)}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-neutral-darker text-center py-16">Sin datos para el período</p>
          )}
        </Card>
      </div>

      {/* Timeline */}
      {cashVsCard?.timeline?.length > 0 && (
        <Card>
          <CardTitle className="mb-4">Evolución de Gastos</CardTitle>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={cashVsCard.timeline} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend />
              <Line type="monotone" dataKey="cash" name="Efectivo" stroke="#10B981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="card" name="Tarjeta" stroke="#3B82F6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

    </div>
  )
}
