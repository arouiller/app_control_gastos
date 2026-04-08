import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiCreditCard, FiPlus, FiChevronUp, FiChevronDown } from 'react-icons/fi'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { analyticsService } from '../services/analyticsService'
import { expenseService } from '../services/expenseService'
import Card, { CardTitle } from '../components/UI/Card'
import { PageLoader } from '../components/UI/LoadingSpinner'
import Button from '../components/UI/Button'
import Badge from '../components/UI/Badge'
import Select from '../components/UI/Select'
import { formatCurrency, formatDate, startOfCurrentMonth, endOfCurrentMonth } from '../utils/formatters'
import { getDisplayAmount } from '../utils/currencyHelpers'
import { PAYMENT_METHOD_LABELS } from '../utils/constants'

// ─── Custom pie label rendered as SVG text ────────────────────────────────────
const RADIAN = Math.PI / 180
function PieLabel({ cx, cy, midAngle, outerRadius, percent, value, name }) {
  if (percent < 0.04) return null
  const radius = outerRadius + 38
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  const anchor = x > cx ? 'start' : 'end'
  return (
    <g>
      <text x={x} y={y - 7} textAnchor={anchor} dominantBaseline="central" fill="#374151" fontSize={10} fontWeight="600">
        {`${(percent * 100).toFixed(1)}%`}
      </text>
      <text x={x} y={y + 7} textAnchor={anchor} dominantBaseline="central" fill="#6B7280" fontSize={9}>
        {formatCurrency(value)}
      </text>
    </g>
  )
}

// ─── Sortable detail table ─────────────────────────────────────────────────────
function SortIcon({ field, sort }) {
  if (sort.field !== field) return <FiChevronDown size={12} className="opacity-30" />
  return sort.dir === 'asc' ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />
}

function DetailTable({ expenses, sort, onSort, displayCurrency, showCategory }) {
  const sorted = [...expenses].sort((a, b) => {
    let av, bv
    if (sort.field === 'date') { av = a.date; bv = b.date }
    else if (sort.field === 'amount') { av = getDisplayAmount(a, displayCurrency) || 0; bv = getDisplayAmount(b, displayCurrency) || 0 }
    else if (sort.field === 'description') { av = a.description?.toLowerCase(); bv = b.description?.toLowerCase() }
    else if (sort.field === 'category') { av = a.category?.name?.toLowerCase(); bv = b.category?.name?.toLowerCase() }
    else if (sort.field === 'method') { av = a.payment_method; bv = b.payment_method }
    if (av < bv) return sort.dir === 'asc' ? -1 : 1
    if (av > bv) return sort.dir === 'asc' ? 1 : -1
    return 0
  })

  const th = (label, field) => (
    <th
      onClick={() => onSort(field)}
      className="text-left text-xs font-semibold text-neutral-darker px-3 py-2 cursor-pointer select-none hover:text-primary whitespace-nowrap"
    >
      <span className="flex items-center gap-1">{label}<SortIcon field={field} sort={sort} /></span>
    </th>
  )

  return (
    <div className="overflow-x-auto mt-3 rounded border border-neutral">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-neutral">
          <tr>
            {th('Descripción', 'description')}
            {showCategory ? th('Categoría', 'category') : th('Método', 'method')}
            {th('Fecha', 'date')}
            {th('Monto', 'amount')}
          </tr>
        </thead>
        <tbody>
          {sorted.map((e) => (
            <tr key={e.id} className="border-b border-neutral last:border-0 hover:bg-gray-50">
              <td className="px-3 py-2">
                <span className="font-medium text-primary">{e.description}</span>
                {!!e.is_installment && !!e.installment_number && (
                  <span className="ml-1 text-xs text-neutral-darker">({e.installment_number}/{e.total_installments})</span>
                )}
              </td>
              <td className="px-3 py-2 text-neutral-darker">
                {showCategory
                  ? <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.category?.color || '#ccc' }} />
                      {e.category?.name}
                    </span>
                  : <Badge variant={e.payment_method === 'cash' ? 'success' : 'info'} className="text-xs">
                      {PAYMENT_METHOD_LABELS[e.payment_method]}
                    </Badge>
                }
              </td>
              <td className="px-3 py-2 text-neutral-darker whitespace-nowrap">{formatDate(e.date)}</td>
              <td className="px-3 py-2 text-right font-mono font-semibold text-primary whitespace-nowrap">
                {formatCurrency(getDisplayAmount(e, displayCurrency))}
                {displayCurrency !== 'original' && (
                  <span className="block text-xs text-neutral-darker font-normal">
                    {formatCurrency(e.original_amount)} {e.original_currency}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Summary card ─────────────────────────────────────────────────────────────
function SummaryCard({ title, value, subtitle, icon: Icon, trend, color = 'text-secondary' }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-neutral-darker mb-1">{title}</p>
          <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-neutral-darker mt-1 truncate">{subtitle}</p>}
        </div>
        <div className="ml-3 p-2 bg-neutral rounded-lg flex-shrink-0">
          <Icon size={18} className="text-primary" />
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${trend >= 0 ? 'text-danger' : 'text-success'}`}>
          {trend >= 0 ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
          <span>{Math.abs(trend).toFixed(1)}% vs mes anterior</span>
        </div>
      )}
    </Card>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const [allData, setAllData] = useState({ summary: null, byCategory: null, pendingInstallments: null, cashVsCard: null })
  const [loading, setLoading] = useState(true)
  const [displayCurrency, setDisplayCurrency] = useState('original')

  // Detail table state – category
  const [catSelected, setCatSelected] = useState(null)
  const [catExpenses, setCatExpenses] = useState([])
  const [catLoading, setCatLoading] = useState(false)
  const [catSort, setCatSort] = useState({ field: 'date', dir: 'desc' })

  // Detail table state – cash vs card
  const [cvcSelected, setCvcSelected] = useState(null)
  const [cvcExpenses, setCvcExpenses] = useState([])
  const [cvcLoading, setCvcLoading] = useState(false)
  const [cvcSort, setCvcSort] = useState({ field: 'date', dir: 'desc' })

  const getDataByCurrency = (data, currency) => {
    if (!data) return null
    const key = currency === 'original' ? 'byOriginalCurrency' : currency === 'ARS' ? 'inArs' : 'inUsd'
    return data[key] || data
  }

  useEffect(() => {
    const load = async () => {
      try {
        const params = { startDate: startOfCurrentMonth(), endDate: endOfCurrentMonth() }
        const [summaryRes, catRes, installRes, cvcRes] = await Promise.all([
          analyticsService.getSummary(params),
          analyticsService.getByCategory(params),
          analyticsService.getPendingInstallments({ daysAhead: 30 }),
          analyticsService.getCashVsCard(params),
        ])
        setAllData({ summary: summaryRes.data, byCategory: catRes.data, pendingInstallments: installRes.data, cashVsCard: cvcRes.data })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const fetchCategoryDetail = useCallback(async (categoryId, categoryName, color) => {
    if (catSelected?.categoryId === categoryId) { setCatSelected(null); setCatExpenses([]); return }
    setCatSelected({ categoryId, categoryName, color })
    setCatLoading(true)
    try {
      const res = await expenseService.getAll({ categoryId, startDate: startOfCurrentMonth(), endDate: endOfCurrentMonth(), limit: 200 })
      setCatExpenses(res.data || [])
    } catch { setCatExpenses([]) }
    finally { setCatLoading(false) }
  }, [catSelected])

  const fetchCvcDetail = useCallback(async (paymentMethod, name) => {
    if (cvcSelected?.paymentMethod === paymentMethod) { setCvcSelected(null); setCvcExpenses([]); return }
    setCvcSelected({ paymentMethod, name })
    setCvcLoading(true)
    try {
      const res = await expenseService.getAll({ paymentMethod, startDate: startOfCurrentMonth(), endDate: endOfCurrentMonth(), limit: 200 })
      setCvcExpenses(res.data || [])
    } catch { setCvcExpenses([]) }
    finally { setCvcLoading(false) }
  }, [cvcSelected])

  const toggleSort = (setSort) => (field) =>
    setSort((prev) => ({ field, dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc' }))

  if (loading) return <PageLoader />

  const summary = getDataByCurrency(allData.summary, displayCurrency)
  const byCategory = getDataByCurrency(allData.byCategory, displayCurrency)?.categories || []
  const pendingInstallments = getDataByCurrency(allData.pendingInstallments, displayCurrency) || { totalPending: 0, totalAmount: 0, installments: [] }
  const cashVsCard = getDataByCurrency(allData.cashVsCard, displayCurrency)

  const cashTotal = cashVsCard?.summary.cashTotal || 0
  const cardTotal = cashVsCard?.summary.cardTotal || 0
  const cvcTotal = cashTotal + cardTotal
  const cashVsCardData = cvcTotal > 0 ? [
    { name: 'Efectivo', value: cashTotal, pct: cvcTotal > 0 ? cashTotal / cvcTotal : 0, color: '#10B981', method: 'cash' },
    { name: 'Tarjeta', value: cardTotal, pct: cvcTotal > 0 ? cardTotal / cvcTotal : 0, color: '#3B82F6', method: 'credit_card' },
  ] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
        <div className="flex gap-2 items-end">
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
          <Button onClick={() => navigate('/expenses/new')} size="sm">
            <FiPlus size={16} />
            Nuevo Gasto
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Gasto Total del Mes" value={formatCurrency(summary?.totalExpenses || 0)} subtitle={`${summary?.totalTransactions || 0} transacciones`} icon={FiDollarSign} trend={summary?.comparisonWithPreviousMonth?.percentageChange} />
        <SummaryCard title="Promedio Diario" value={formatCurrency(summary?.averageDaily || 0)} icon={FiTrendingUp} />
        <SummaryCard title="Total Efectivo" value={formatCurrency(summary?.cashTotal || 0)} subtitle={`${summary?.cashPercentage || 0}% del total`} icon={FiDollarSign} color="text-success" />
        <SummaryCard title="Total Tarjeta" value={formatCurrency(summary?.cardTotal || 0)} subtitle={`${summary?.cardPercentage || 0}% del total`} icon={FiCreditCard} color="text-secondary" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Categories pie */}
        <Card>
          <CardTitle className="mb-1">Gastos por Categoría</CardTitle>
          <p className="text-xs text-neutral-darker mb-3">Clic en una porción para ver el detalle</p>
          {byCategory.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="totalAmount"
                    nameKey="categoryName"
                    cx="50%" cy="50%"
                    outerRadius={75}
                    labelLine
                    label={PieLabel}
                    onClick={(data) => fetchCategoryDetail(data.categoryId, data.categoryName, data.color)}
                    style={{ cursor: 'pointer' }}
                  >
                    {byCategory.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.color || '#3B82F6'}
                        stroke={catSelected?.categoryId === entry.categoryId ? '#1F2937' : 'white'}
                        strokeWidth={catSelected?.categoryId === entry.categoryId ? 2 : 1}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>

              {catSelected && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: catSelected.color }} />
                    <span className="text-sm font-semibold text-primary">{catSelected.categoryName}</span>
                    <button onClick={() => { setCatSelected(null); setCatExpenses([]) }} className="ml-auto text-xs text-neutral-darker hover:text-primary">✕ cerrar</button>
                  </div>
                  {catLoading
                    ? <p className="text-xs text-neutral-darker py-3 text-center">Cargando...</p>
                    : catExpenses.length === 0
                      ? <p className="text-xs text-neutral-darker py-3 text-center">Sin gastos</p>
                      : <DetailTable expenses={catExpenses} sort={catSort} onSort={toggleSort(setCatSort)} displayCurrency={displayCurrency} showCategory={false} />
                  }
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-neutral-darker text-center py-12">Sin gastos este mes</p>
          )}
        </Card>

        {/* Cash vs Card pie */}
        <Card>
          <CardTitle className="mb-1">Efectivo vs Tarjeta</CardTitle>
          <p className="text-xs text-neutral-darker mb-3">Clic en una porción para ver el detalle</p>
          {cashVsCardData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={cashVsCardData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%" cy="50%"
                    outerRadius={75}
                    labelLine
                    label={({ cx, cy, midAngle, outerRadius, percent, value, name }) =>
                      <PieLabel cx={cx} cy={cy} midAngle={midAngle} outerRadius={outerRadius} percent={percent} value={value} name={name} />
                    }
                    onClick={(data) => fetchCvcDetail(data.method, data.name)}
                    style={{ cursor: 'pointer' }}
                  >
                    {cashVsCardData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.color}
                        stroke={cvcSelected?.paymentMethod === entry.method ? '#1F2937' : 'white'}
                        strokeWidth={cvcSelected?.paymentMethod === entry.method ? 2 : 1}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>

              {cvcSelected && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={cvcSelected.paymentMethod === 'cash' ? 'success' : 'info'}>{cvcSelected.name}</Badge>
                    <button onClick={() => { setCvcSelected(null); setCvcExpenses([]) }} className="ml-auto text-xs text-neutral-darker hover:text-primary">✕ cerrar</button>
                  </div>
                  {cvcLoading
                    ? <p className="text-xs text-neutral-darker py-3 text-center">Cargando...</p>
                    : cvcExpenses.length === 0
                      ? <p className="text-xs text-neutral-darker py-3 text-center">Sin gastos</p>
                      : <DetailTable expenses={cvcExpenses} sort={cvcSort} onSort={toggleSort(setCvcSort)} displayCurrency={displayCurrency} showCategory />
                  }
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-neutral-darker text-center py-12">Sin gastos este mes</p>
          )}
        </Card>
      </div>

      {/* Pending installments */}
      {pendingInstallments.totalPending > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Cuotas Próximas (30 días)</CardTitle>
            <Badge variant="warning">{pendingInstallments.totalPending} pendientes</Badge>
          </div>
          <div className="space-y-2">
            {pendingInstallments.installments.slice(0, 5).map((inst) => (
              <div key={inst.id} className="flex items-center justify-between py-2 border-b border-neutral last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-primary truncate">{inst.description}</p>
                  <p className="text-xs text-neutral-darker">
                    Cuota {inst.installmentNumber}/{inst.totalInstallments} · Vence {formatDate(inst.dueDate)}
                  </p>
                </div>
                <div className="ml-3 text-right flex-shrink-0">
                  <p className="text-sm font-mono font-semibold text-primary">{formatCurrency(inst.amount)}</p>
                  {inst.daysUntilDue <= 7 && (
                    <Badge variant="warning" className="mt-0.5">
                      {inst.daysUntilDue <= 0 ? 'Vencida' : `${inst.daysUntilDue}d`}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
          {pendingInstallments.totalPending > 5 && (
            <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={() => navigate('/installments')}>
              Ver todas ({pendingInstallments.totalPending})
            </Button>
          )}
        </Card>
      )}
    </div>
  )
}
