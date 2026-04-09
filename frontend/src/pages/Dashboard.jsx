import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  FiTrendingUp, FiTrendingDown, FiDollarSign, FiCreditCard,
  FiPlus, FiChevronUp, FiChevronDown, FiX, FiEdit2, FiTrash2,
} from 'react-icons/fi'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { analyticsService } from '../services/analyticsService'
import { expenseService } from '../services/expenseService'
import Card, { CardTitle } from '../components/UI/Card'
import { PageLoader } from '../components/UI/LoadingSpinner'
import Button from '../components/UI/Button'
import Badge from '../components/UI/Badge'
import Modal from '../components/UI/Modal'
import { formatCurrency, formatDate } from '../utils/formatters'
import { getDisplayAmount } from '../utils/currencyHelpers'
import { PAYMENT_METHOD_LABELS } from '../utils/constants'

// ─── Month utils ──────────────────────────────────────────────────────────────
const MONTH_NAMES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const buildMonths = (firstDate, lastDate) => {
  const months = []
  const start = new Date(firstDate + 'T00:00:00')
  const end = new Date(lastDate + 'T00:00:00')
  start.setDate(1); end.setDate(1)
  const cursor = new Date(start)
  while (cursor <= end) {
    const y = cursor.getFullYear()
    const m = String(cursor.getMonth() + 1).padStart(2, '0')
    const key = `${y}-${m}`
    const lastDay = new Date(y, cursor.getMonth() + 1, 0).getDate()
    months.push({ key, label: `${MONTH_NAMES_ES[cursor.getMonth()]} ${y}`, startDate: `${key}-01`, endDate: `${key}-${String(lastDay).padStart(2, '0')}` })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return months
}

const currentMonthPeriod = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const key = `${y}-${m}`
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
  return { key, label: `${MONTH_NAMES_ES[now.getMonth()]} ${y}`, startDate: `${key}-01`, endDate: `${key}-${String(lastDay).padStart(2, '0')}` }
}

// ─── Bar label (amount + %) ───────────────────────────────────────────────────
function CatBarLabel({ x, y, width, value, index, data }) {
  const entry = data?.[index]
  if (!value || !entry) return null
  return (
    <g>
      <text x={x + width / 2} y={y - 13} textAnchor="middle" fill="#374151" fontSize={10} fontWeight="600">
        {formatCurrency(value)}
      </text>
      <text x={x + width / 2} y={y - 2} textAnchor="middle" fill="#9CA3AF" fontSize={9}>
        {entry.percentage?.toFixed(1)}%
      </text>
    </g>
  )
}

// ─── Pie label ────────────────────────────────────────────────────────────────
const RADIAN = Math.PI / 180
function PieLabel({ cx, cy, midAngle, outerRadius, percent, value, name }) {
  if (percent < 0.04) return null
  const radius = outerRadius + 40
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  const anchor = x > cx ? 'start' : 'end'
  return (
    <g>
      <text x={x} y={y - 10} textAnchor={anchor} dominantBaseline="central" fill="#111827" fontSize={10} fontWeight="700">{name}</text>
      <text x={x} y={y + 2}  textAnchor={anchor} dominantBaseline="central" fill="#374151" fontSize={10} fontWeight="600">{`${(percent * 100).toFixed(1)}%`}</text>
      <text x={x} y={y + 13} textAnchor={anchor} dominantBaseline="central" fill="#6B7280" fontSize={9}>{formatCurrency(value)}</text>
    </g>
  )
}

// ─── Sortable th ─────────────────────────────────────────────────────────────
function SortTh({ label, field, sort, onSort }) {
  const active = sort.field === field
  return (
    <th onClick={() => onSort(field)} className="text-left text-xs font-semibold text-neutral-darker px-3 py-2 cursor-pointer select-none hover:text-primary whitespace-nowrap">
      <span className="flex items-center gap-1">
        {label}
        {active ? (sort.dir === 'asc' ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />) : <FiChevronDown size={12} className="opacity-30" />}
      </span>
    </th>
  )
}

// ─── Shared detail table ──────────────────────────────────────────────────────
function DetailTable({ expenses, sort, onSort, displayCurrency, onEdit, onDelete }) {
  const sorted = [...expenses].sort((a, b) => {
    let av, bv
    if (sort.field === 'date')        { av = a.date;                          bv = b.date }
    else if (sort.field === 'amount') { av = getDisplayAmount(a, displayCurrency) || 0; bv = getDisplayAmount(b, displayCurrency) || 0 }
    else if (sort.field === 'desc')   { av = a.description?.toLowerCase();    bv = b.description?.toLowerCase() }
    else if (sort.field === 'cat')    { av = a.category?.name?.toLowerCase(); bv = b.category?.name?.toLowerCase() }
    else if (sort.field === 'method') { av = a.payment_method;                bv = b.payment_method }
    if (av < bv) return sort.dir === 'asc' ? -1 : 1
    if (av > bv) return sort.dir === 'asc' ?  1 : -1
    return 0
  })

  const th = (label, field) => <SortTh label={label} field={field} sort={sort} onSort={onSort} />

  return (
    <div className="overflow-x-auto rounded border border-neutral">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-neutral">
          <tr>
            {th('Descripción', 'desc')}
            {th('Categoría', 'cat')}
            {th('Método', 'method')}
            {th('Fecha', 'date')}
            {th('Monto', 'amount')}
            {(onEdit || onDelete) && <th className="px-3 py-2 text-right text-xs font-semibold text-neutral-darker">Acciones</th>}
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
                {!!e.is_installment && !e.installment_number && (
                  <span className="ml-1 text-xs text-neutral-darker">({e.total_installments} cuotas)</span>
                )}
              </td>
              <td className="px-3 py-2">
                <span className="flex items-center gap-1 text-neutral-darker">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.category?.color || '#ccc' }} />
                  {e.category?.name || '—'}
                </span>
              </td>
              <td className="px-3 py-2">
                <Badge variant={e.payment_method === 'cash' ? 'success' : 'info'} className="text-xs">
                  {PAYMENT_METHOD_LABELS[e.payment_method]}
                </Badge>
              </td>
              <td className="px-3 py-2 text-neutral-darker whitespace-nowrap">{formatDate(e.date)}</td>
              <td className="px-3 py-2 text-right font-mono font-semibold text-primary whitespace-nowrap">
                {formatCurrency(getDisplayAmount(e, displayCurrency))}
                {displayCurrency !== 'original' && (
                  <span className="block text-xs font-normal text-neutral-darker">
                    {formatCurrency(e.original_amount)} {e.original_currency}
                  </span>
                )}
              </td>
              {(onEdit || onDelete) && (
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-1">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(e)}
                        className="p-1.5 text-neutral-darker hover:text-secondary rounded transition-colors"
                        title="Editar"
                      >
                        <FiEdit2 size={14} />
                      </button>
                    )}
                    {onDelete && !e.installment_group_id && (
                      <button
                        onClick={() => onDelete(e.id)}
                        className="p-1.5 text-neutral-darker hover:text-danger rounded transition-colors"
                        title="Eliminar"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              )}
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

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const [months, setMonths] = useState([])
  const [activePeriod, setActivePeriod] = useState(null)
  const [allData, setAllData] = useState({ summary: null, byCategory: null, pendingInstallments: null, cashVsCard: null })
  const [loading, setLoading] = useState(true)
  const [displayCurrency, setDisplayCurrency] = useState('ARS')

  const [selected, setSelected] = useState(null)
  const [allExpenses, setAllExpenses] = useState([])
  const [allExpensesLoading, setAllExpensesLoading] = useState(false)
  const [detailExpenses, setDetailExpenses] = useState([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailSort, setDetailSort] = useState({ field: 'date', dir: 'desc' })

  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const getDataByCurrency = (data, currency) => {
    if (!data) return null
    const key = currency === 'original' ? 'byOriginalCurrency' : currency === 'ARS' ? 'inArs' : 'inUsd'
    return data[key] || data
  }

  // Load date range on mount → build month list
  useEffect(() => {
    const init = async () => {
      try {
        const res = await expenseService.getDateRange()
        const range = res.data
        if (range?.firstDate && range?.lastDate) {
          const built = buildMonths(range.firstDate, range.lastDate)
          setMonths(built)
          const cur = currentMonthPeriod()
          const found = built.find((m) => m.key === cur.key)
          setActivePeriod(found || built[built.length - 1])
        } else {
          setActivePeriod(currentMonthPeriod())
        }
      } catch {
        setActivePeriod(currentMonthPeriod())
      }
    }
    init()
  }, [])

  const fetchExpensesForPeriod = useCallback(async (period) => {
    if (!period) return
    setAllExpensesLoading(true)
    try {
      const res = await expenseService.getAll({ startDate: period.startDate, endDate: period.endDate, limit: 200 })
      setAllExpenses(res.data || [])
    } catch {
      setAllExpenses([])
    } finally {
      setAllExpensesLoading(false)
    }
  }, [])

  // Load analytics + all expenses when period changes
  useEffect(() => {
    if (!activePeriod) return
    const load = async () => {
      setLoading(true)
      setAllExpensesLoading(true)
      setSelected(null)
      setDetailExpenses([])
      setAllExpenses([])
      try {
        const params = { startDate: activePeriod.startDate, endDate: activePeriod.endDate }
        const [summaryRes, catRes, installRes, cvcRes, expensesRes] = await Promise.all([
          analyticsService.getSummary(params),
          analyticsService.getByCategory(params),
          analyticsService.getPendingInstallments({ daysAhead: 30 }),
          analyticsService.getCashVsCard(params),
          expenseService.getAll({ ...params, limit: 200 }),
        ])
        setAllData({ summary: summaryRes.data, byCategory: catRes.data, pendingInstallments: installRes.data, cashVsCard: cvcRes.data })
        setAllExpenses(expensesRes.data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
        setAllExpensesLoading(false)
      }
    }
    load()
  }, [activePeriod])

  const handleSliceClick = useCallback(async (sliceMeta, apiParams) => {
    if (selected?.key === sliceMeta.key) {
      setSelected(null)
      setDetailExpenses([])
      return
    }
    setSelected(sliceMeta); setDetailExpenses([]); setDetailLoading(true)
    try {
      const res = await expenseService.getAll({
        ...apiParams,
        startDate: activePeriod?.startDate,
        endDate: activePeriod?.endDate,
        limit: 200,
      })
      setDetailExpenses(res.data || [])
    } catch {
      setDetailExpenses([])
    } finally {
      setDetailLoading(false)
    }
  }, [selected, activePeriod])

  const handleCatClick = (data) =>
    handleSliceClick(
      { key: `cat-${data.categoryId}`, type: 'category', label: data.categoryName, color: data.color },
      { categoryId: data.categoryId }
    )

  const handleCvcClick = (data) =>
    handleSliceClick(
      { key: `cvc-${data.method}`, type: 'cvc', label: data.name, method: data.method },
      { paymentMethod: data.method }
    )

  const handleSortDetail = (field) =>
    setDetailSort((prev) => ({ field, dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc' }))

  const handleEdit = (expense) => {
    if (expense.installment_group_id) {
      navigate(`/expenses/${expense.installment_group_id}/edit`)
    } else {
      navigate(`/expenses/${expense.id}/edit`)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await expenseService.remove(deleteId)
      toast.success('Gasto eliminado')
      setDeleteId(null)
      // Refetch expenses and analytics
      if (activePeriod) {
        setSelected(null)
        setDetailExpenses([])
        await fetchExpensesForPeriod(activePeriod)
        // Refresh analytics too
        const params = { startDate: activePeriod.startDate, endDate: activePeriod.endDate }
        const [summaryRes, catRes, cvcRes] = await Promise.all([
          analyticsService.getSummary(params),
          analyticsService.getByCategory(params),
          analyticsService.getCashVsCard(params),
        ])
        setAllData((prev) => ({ ...prev, summary: summaryRes.data, byCategory: catRes.data, cashVsCard: cvcRes.data }))
      }
    } catch {
      toast.error('Error al eliminar el gasto')
    } finally {
      setDeleting(false)
    }
  }

  if (!activePeriod) return <PageLoader />

  const summary = getDataByCurrency(allData.summary, displayCurrency)
  const byCategory = getDataByCurrency(allData.byCategory, displayCurrency)?.categories || []
  const pendingInstallments = getDataByCurrency(allData.pendingInstallments, displayCurrency) || { totalPending: 0, totalAmount: 0, installments: [] }
  const cashVsCard = getDataByCurrency(allData.cashVsCard, displayCurrency)

  const cashTotal = cashVsCard?.summary?.cashTotal || 0
  const cardTotal = cashVsCard?.summary?.cardTotal || 0
  const cvcGrand = cashTotal + cardTotal
  const cashVsCardData = cvcGrand > 0 ? [
    { name: 'Efectivo', value: cashTotal, color: '#10B981', method: 'cash' },
    { name: 'Tarjeta',  value: cardTotal, color: '#3B82F6', method: 'credit_card' },
  ] : []

  const isActive = (key) => selected?.key === key

  const displayExpenses = selected ? detailExpenses : allExpenses
  const isLoadingDetail = selected ? detailLoading : allExpensesLoading
  const detailTitle = selected ? `Detalle — ${selected.label}` : 'Gastos del mes'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {/* Month dropdown */}
          {months.length > 0 && (
            <select
              value={activePeriod?.key || ''}
              onChange={(e) => {
                const m = months.find((mo) => mo.key === e.target.value)
                if (m) setActivePeriod(m)
              }}
              className="text-sm border border-neutral rounded-md px-2 py-1.5 bg-white text-primary focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            >
              {[...months].reverse().map((m) => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          )}

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
          <Button onClick={() => navigate('/expenses/new')} size="sm">
            <FiPlus size={16} /> Nuevo Gasto
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-16"><PageLoader /></div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard title="Gasto Total del Mes"  value={formatCurrency(summary?.totalExpenses || 0)} subtitle={`${summary?.totalTransactions || 0} transacciones`} icon={FiDollarSign} trend={summary?.comparisonWithPreviousMonth?.percentageChange} />
            <SummaryCard title="Promedio Diario"       value={formatCurrency(summary?.averageDaily || 0)} icon={FiTrendingUp} />
            <SummaryCard title="Total Efectivo"        value={formatCurrency(summary?.cashTotal || 0)} subtitle={`${summary?.cashPercentage || 0}% del total`} icon={FiDollarSign} color="text-success" />
            <SummaryCard title="Total Tarjeta"         value={formatCurrency(summary?.cardTotal || 0)} subtitle={`${summary?.cardPercentage || 0}% del total`} icon={FiCreditCard} color="text-secondary" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Category bar chart */}
            <Card>
              <CardTitle className="mb-4">Gastos por Categoría</CardTitle>
              {byCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={byCategory} margin={{ top: 28, right: 4, left: 0, bottom: 45 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="categoryName" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Bar
                      dataKey="totalAmount"
                      name="Total"
                      radius={[4, 4, 0, 0]}
                      label={(props) => <CatBarLabel {...props} data={byCategory} />}
                      onClick={handleCatClick}
                      style={{ cursor: 'pointer' }}
                    >
                      {byCategory.map((entry, i) => (
                        <Cell key={i} fill={entry.color || '#3B82F6'} opacity={selected && selected.type === 'category' && !isActive(`cat-${entry.categoryId}`) ? 0.35 : 1} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-neutral-darker text-center py-16">Sin gastos este mes</p>
              )}
            </Card>

            {/* Cash vs Card pie + summary */}
            <Card>
              <CardTitle className="mb-4">Efectivo vs Tarjeta</CardTitle>
              {cashVsCardData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={cashVsCardData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%" cy="50%"
                        outerRadius={80}
                        labelLine
                        label={PieLabel}
                        onClick={handleCvcClick}
                        style={{ cursor: 'pointer' }}
                      >
                        {cashVsCardData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke={isActive(`cvc-${entry.method}`) ? '#111827' : 'white'} strokeWidth={isActive(`cvc-${entry.method}`) ? 3 : 1} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {cashVsCardData.map((d) => (
                      <div key={d.name} className="text-center">
                        <p className="text-xs text-neutral-darker">{d.name}</p>
                        <p className="text-sm font-semibold font-mono" style={{ color: d.color }}>{formatCurrency(d.value)}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-neutral-darker text-center py-16">Sin gastos este mes</p>
              )}
            </Card>
          </div>

          {/* Shared detail table */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <CardTitle>{detailTitle}</CardTitle>
                {!isLoadingDetail && (
                  <p className="text-xs text-neutral-darker mt-1">
                    {displayExpenses.length} gasto{displayExpenses.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              {selected && (
                <button onClick={() => { setSelected(null); setDetailExpenses([]) }} className="p-1.5 text-neutral-darker hover:text-primary rounded transition-colors" title="Ver todos">
                  <FiX size={16} />
                </button>
              )}
            </div>
            {isLoadingDetail && <p className="text-sm text-neutral-darker text-center py-8">Cargando...</p>}
            {!isLoadingDetail && displayExpenses.length === 0 && <p className="text-sm text-neutral-darker text-center py-8">Sin gastos para el período</p>}
            {!isLoadingDetail && displayExpenses.length > 0 && (
              <DetailTable
                expenses={displayExpenses}
                sort={detailSort}
                onSort={handleSortDetail}
                displayCurrency={displayCurrency}
                onEdit={handleEdit}
                onDelete={setDeleteId}
              />
            )}
          </Card>

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
                      <p className="text-xs text-neutral-darker">Cuota {inst.installmentNumber}/{inst.totalInstallments} · Vence {formatDate(inst.dueDate)}</p>
                    </div>
                    <div className="ml-3 text-right flex-shrink-0">
                      <p className="text-sm font-mono font-semibold text-primary">{formatCurrency(inst.amount)}</p>
                      {inst.daysUntilDue <= 7 && (
                        <Badge variant="warning" className="mt-0.5">{inst.daysUntilDue <= 0 ? 'Vencida' : `${inst.daysUntilDue}d`}</Badge>
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
        </>
      )}

      {/* Delete confirmation modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Eliminar Gasto">
        <p className="text-sm text-primary mb-6">¿Estás seguro de que quieres eliminar este gasto? Esta acción no se puede deshacer.</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  )
}
