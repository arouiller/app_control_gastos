import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiCreditCard, FiPlus, FiAlertCircle } from 'react-icons/fi'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import { analyticsService } from '../services/analyticsService'
import Card, { CardTitle } from '../components/UI/Card'
import { PageLoader } from '../components/UI/LoadingSpinner'
import Button from '../components/UI/Button'
import Badge from '../components/UI/Badge'
import { formatCurrency, formatDate, startOfCurrentMonth, endOfCurrentMonth } from '../utils/formatters'

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

export default function Dashboard() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [byCategory, setByCategory] = useState([])
  const [pendingInstallments, setPendingInstallments] = useState({ totalPending: 0, totalAmount: 0, installments: [] })
  const [cashVsCard, setCashVsCard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const params = { startDate: startOfCurrentMonth(), endDate: endOfCurrentMonth() }
        const [summaryRes, catRes, installRes, cvcRes] = await Promise.all([
          analyticsService.getSummary(params),
          analyticsService.getByCategory(params),
          analyticsService.getPendingInstallments({ daysAhead: 30 }),
          analyticsService.getCashVsCard(params),
        ])
        setSummary(summaryRes.data)
        setByCategory(catRes.data?.categories || [])
        setPendingInstallments(installRes.data)
        setCashVsCard(cvcRes.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) return <PageLoader />

  const cashVsCardData = cashVsCard ? [
    { name: 'Efectivo', value: cashVsCard.summary.cashTotal, color: '#10B981' },
    { name: 'Tarjeta', value: cashVsCard.summary.cardTotal, color: '#3B82F6' },
  ] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
        <Button onClick={() => navigate('/expenses/new')} size="sm">
          <FiPlus size={16} />
          Nuevo Gasto
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Gasto Total del Mes"
          value={formatCurrency(summary?.totalExpenses || 0)}
          subtitle={`${summary?.totalTransactions || 0} transacciones`}
          icon={FiDollarSign}
          trend={summary?.comparisonWithPreviousMonth?.percentageChange}
        />
        <SummaryCard
          title="Promedio Diario"
          value={formatCurrency(summary?.averageDaily || 0)}
          icon={FiTrendingUp}
        />
        <SummaryCard
          title="Total Efectivo"
          value={formatCurrency(summary?.cashTotal || 0)}
          subtitle={`${summary?.cashPercentage || 0}% del total`}
          icon={FiDollarSign}
          color="text-success"
        />
        <SummaryCard
          title="Total Tarjeta"
          value={formatCurrency(summary?.cardTotal || 0)}
          subtitle={`${summary?.cardPercentage || 0}% del total`}
          icon={FiCreditCard}
          color="text-secondary"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Categories Pie */}
        <Card>
          <CardTitle className="mb-4">Gastos por Categoría</CardTitle>
          {byCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={byCategory} dataKey="totalAmount" nameKey="categoryName" cx="50%" cy="50%" outerRadius={80}>
                  {byCategory.map((entry, i) => (
                    <Cell key={i} fill={entry.color || '#3B82F6'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-neutral-darker text-center py-12">Sin gastos este mes</p>
          )}
        </Card>

        {/* Cash vs Card */}
        <Card>
          <CardTitle className="mb-4">Efectivo vs Tarjeta</CardTitle>
          {cashVsCardData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={cashVsCardData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {cashVsCardData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
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
