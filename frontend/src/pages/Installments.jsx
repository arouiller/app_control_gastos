import { useEffect, useState, useMemo } from 'react'
import { toast } from 'react-toastify'
import { FiCreditCard } from 'react-icons/fi'
import { installmentService } from '../services/installmentService'
import { categoryService } from '../services/categoryService'
import Card, { CardTitle } from '../components/UI/Card'
import Badge from '../components/UI/Badge'
import Select from '../components/UI/Select'
import { PageLoader } from '../components/UI/LoadingSpinner'
import EmptyState from '../components/UI/EmptyState'
import MonthlyChart from '../components/reports/MonthlyChart'
import { formatCurrency, formatDate } from '../utils/formatters'

// Build MonthlyChart-compatible data from the chart API rows
function buildChartData(rows, displayCurrency) {
  if (!rows || rows.length === 0) return { chartData: [], categories: [] }
  const amountField = displayCurrency === 'ARS' ? 'totalArs' : 'totalUsd'

  const monthsSet = new Set()
  const categoriesMap = {}
  rows.forEach((r) => {
    monthsSet.add(r.monthKey)
    if (r.categoryId && !categoriesMap[r.categoryId]) {
      categoriesMap[r.categoryId] = { id: r.categoryId, name: r.categoryName, color: r.categoryColor, data: [] }
    }
  })

  const months = [...monthsSet].sort()
  const categories = Object.values(categoriesMap)

  const chartData = months.map((month) => {
    const monthRows = rows.filter((r) => r.monthKey === month)
    const label = monthRows[0]?.monthLabel || month
    const entry = { month, monthLabel: label, total: 0 }
    categories.forEach((cat) => {
      const row = monthRows.find((r) => r.categoryId === cat.id)
      const val = row ? parseFloat(row[amountField] || 0) : 0
      entry[`category_${cat.id}`] = val
      entry.total += val
    })
    return entry
  })

  return { chartData, categories }
}

export default function Installments() {
  const [grouped, setGrouped] = useState([])
  const [chartRows, setChartRows] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoryId, setCategoryId] = useState('')
  const [displayCurrency, setDisplayCurrency] = useState('ARS')

  const categoryOptions = [
    { value: '', label: 'Todas las categorías' },
    ...categories.map((c) => ({ value: String(c.id), label: c.name })),
  ]

  const loadData = async (catId) => {
    setLoading(true)
    try {
      const params = catId ? { categoryId: catId } : {}
      const [groupedRes, chartRes] = await Promise.all([
        installmentService.getGrouped(params),
        installmentService.getMonthlyChart(params),
      ])
      setGrouped(groupedRes.data || [])
      setChartRows(chartRes.data || [])
    } catch {
      toast.error('Error al cargar cuotas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    categoryService.getAll({ is_active: true })
      .then((res) => setCategories(res.data?.categories || res.data || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    loadData(categoryId || undefined)
  }, [categoryId])

  // Totals from grouped data (affected by category filter)
  const totals = useMemo(() => {
    const field = displayCurrency === 'ARS' ? 'inArs' : 'inUsd'
    return grouped.reduce(
      (acc, r) => ({
        pending: acc.pending + r[field].pending,
        total: acc.total + r[field].total,
        paid: acc.paid + r[field].paid,
      }),
      { pending: 0, total: 0, paid: 0 }
    )
  }, [grouped, displayCurrency])

  const { chartData, categories: chartCategories } = useMemo(
    () => buildChartData(chartRows, displayCurrency),
    [chartRows, displayCurrency]
  )

  // Amount display helper for parent table
  const getAmount = (row, field) => {
    const key = displayCurrency === 'ARS' ? 'inArs' : 'inUsd'
    return row[key][field]
  }

  if (loading && grouped.length === 0) return <PageLoader />

  const hasGrouped = grouped.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-primary">Cuotas</h1>
        <div className="flex gap-2 items-center flex-wrap">
          {/* Category filter */}
          <div className="w-48">
            <Select
              options={categoryOptions}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            />
          </div>
          {/* Currency toggle */}
          <div className="flex gap-0.5 bg-neutral rounded-lg p-1">
            {[['ARS', '$'], ['USD', 'U$D']].map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setDisplayCurrency(val)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                  displayCurrency === val ? 'bg-secondary text-white shadow-sm' : 'text-neutral-darker hover:text-primary'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-12"><PageLoader /></div>
      ) : !hasGrouped ? (
        <EmptyState title="Sin cuotas registradas" description="No hay gastos en cuotas registrados" />
      ) : (
        <>
          {/* Summary card — total pending */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-neutral-darker mb-1">Total pendiente</p>
                  <p className="text-xl font-bold font-mono text-danger">{formatCurrency(totals.pending)}</p>
                  <p className="text-xs text-neutral-darker mt-1">{displayCurrency}</p>
                </div>
                <div className="ml-3 p-2 bg-neutral rounded-lg flex-shrink-0">
                  <FiCreditCard size={18} className="text-primary" />
                </div>
              </div>
            </Card>
            <Card>
              <p className="text-xs text-neutral-darker mb-1">Total comprometido</p>
              <p className="text-xl font-bold font-mono text-primary">{formatCurrency(totals.total)}</p>
              <p className="text-xs text-neutral-darker mt-1">{displayCurrency}</p>
            </Card>
            <Card>
              <p className="text-xs text-neutral-darker mb-1">Total pagado</p>
              <p className="text-xl font-bold font-mono text-success">{formatCurrency(totals.paid)}</p>
              <p className="text-xs text-neutral-darker mt-1">{displayCurrency}</p>
            </Card>
          </div>

          {/* Monthly chart */}
          {chartData.length > 0 && (
            <MonthlyChart data={chartData} categories={chartCategories} />
          )}

          {/* Parent table */}
          <Card className="p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral">
              <CardTitle>Gastos en Cuotas</CardTitle>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-neutral">
                    <th className="text-left text-xs font-semibold text-neutral-darker px-4 py-3">Descripción</th>
                    <th className="text-left text-xs font-semibold text-neutral-darker px-4 py-3 hidden sm:table-cell">Desde</th>
                    <th className="text-center text-xs font-semibold text-neutral-darker px-4 py-3">Cuotas</th>
                    <th className="text-right text-xs font-semibold text-neutral-darker px-4 py-3">Total</th>
                    <th className="text-right text-xs font-semibold text-neutral-darker px-4 py-3 hidden md:table-cell">Pagado</th>
                    <th className="text-right text-xs font-semibold text-neutral-darker px-4 py-3">Pendiente</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped.map((row) => (
                    <tr key={row.id} className="border-b border-neutral last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-primary">{row.description}</p>
                        {row.category && (
                          <p className="text-xs text-neutral-darker flex items-center gap-1 mt-0.5">
                            <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: row.category.color || '#ccc' }} />
                            {row.category.name}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-sm text-neutral-darker">
                        {formatDate(row.startDate)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-xs text-neutral-darker">{row.counts.total} total</span>
                          <div className="flex gap-1">
                            <Badge variant="success" className="text-xs">{row.counts.paid} pagas</Badge>
                            <Badge variant="warning" className="text-xs">{row.counts.pending} pend.</Badge>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-sm text-primary">
                        {formatCurrency(getAmount(row, 'total'))}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-success hidden md:table-cell">
                        {formatCurrency(getAmount(row, 'paid'))}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-danger">
                        {formatCurrency(getAmount(row, 'pending'))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
