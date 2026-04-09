import { useEffect, useState } from 'react'
import { FiChevronUp, FiChevronDown, FiX } from 'react-icons/fi'
import { useMonthlyReport } from '../../hooks/useMonthlyReport'
import { categoryService } from '../../services/categoryService'
import FilterPanel from '../../components/reports/FilterPanel'
import MonthlyChart from '../../components/reports/MonthlyChart'
import Card, { CardTitle } from '../../components/UI/Card'
import Badge from '../../components/UI/Badge'
import { PageLoader } from '../../components/UI/LoadingSpinner'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { toast } from 'react-toastify'
import { PAYMENT_METHOD_LABELS } from '../../utils/constants'

// ─── Sortable th ─────────────────────────────────────────────────────────────
function SortTh({ label, field, sort, onSort }) {
  const active = sort.field === field
  return (
    <th onClick={() => onSort(field)} className="text-left text-xs font-semibold text-neutral-darker px-3 py-2 cursor-pointer select-none hover:text-primary whitespace-nowrap">
      <span className="flex items-center gap-1">
        {label}
        {active
          ? (sort.dir === 'asc' ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />)
          : <FiChevronDown size={12} className="opacity-30" />}
      </span>
    </th>
  )
}

// ─── Inline detail table ──────────────────────────────────────────────────────
function InlineDetail({ detailData, loading, selectedCategory, selectedMonthLabel, displayCurrency, onClose }) {
  const [sort, setSort] = useState({ field: 'date', dir: 'desc' })

  const handleSort = (field) =>
    setSort((prev) => ({ field, dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc' }))

  const th = (label, field) => <SortTh label={label} field={field} sort={sort} onSort={handleSort} />

  const getAmount = (e) => {
    if (displayCurrency === 'USD') return e.amountInUsd || 0
    return e.amountInArs || e.amount || 0
  }

  const expenses = detailData?.expenses || []
  const sorted = [...expenses].sort((a, b) => {
    let av, bv
    if (sort.field === 'date')   { av = a.date;                            bv = b.date }
    if (sort.field === 'amount') { av = getAmount(a);                      bv = getAmount(b) }
    if (sort.field === 'desc')   { av = a.description?.toLowerCase();      bv = b.description?.toLowerCase() }
    if (sort.field === 'cat')    { av = a.category?.name?.toLowerCase();   bv = b.category?.name?.toLowerCase() }
    if (sort.field === 'method') { av = a.paymentMethod;                   bv = b.paymentMethod }
    if (av < bv) return sort.dir === 'asc' ? -1 : 1
    if (av > bv) return sort.dir === 'asc' ?  1 : -1
    return 0
  })

  const title = selectedCategory
    ? `${selectedCategory.name} — ${selectedMonthLabel}`
    : `Todos los gastos — ${selectedMonthLabel}`

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <CardTitle>{title}</CardTitle>
          {detailData && (
            <p className="text-xs text-neutral-darker mt-1">
              {detailData.pagination?.total ?? expenses.length} gastos · Total: {formatCurrency(detailData.total || 0)}
            </p>
          )}
        </div>
        <button onClick={onClose} className="p-1.5 text-neutral-darker hover:text-primary rounded transition-colors">
          <FiX size={16} />
        </button>
      </div>

      {loading && <p className="text-sm text-neutral-darker text-center py-8">Cargando...</p>}

      {!loading && expenses.length === 0 && (
        <p className="text-sm text-neutral-darker text-center py-8">Sin gastos para esta selección</p>
      )}

      {!loading && expenses.length > 0 && (
        <div className="overflow-x-auto rounded border border-neutral">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-neutral">
              <tr>
                {th('Descripción', 'desc')}
                {th('Categoría', 'cat')}
                {th('Fecha', 'date')}
                {th('Método', 'method')}
                {th('Monto', 'amount')}
              </tr>
            </thead>
            <tbody>
              {sorted.map((e) => (
                <tr key={e.id} className="border-b border-neutral last:border-0 hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <span className="font-medium text-primary">{e.description}</span>
                    {e.isInstallment && e.installmentNumber && (
                      <Badge variant="info" className="ml-1 text-xs">
                        {e.installmentNumber}/{e.totalInstallments}
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {e.category ? (
                      <span className="flex items-center gap-1 text-neutral-darker whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.category.color || '#ccc' }} />
                        {e.category.name}
                      </span>
                    ) : <span className="text-neutral-darker">—</span>}
                  </td>
                  <td className="px-3 py-2 text-neutral-darker whitespace-nowrap">{formatDate(e.date)}</td>
                  <td className="px-3 py-2">
                    <Badge variant={e.paymentMethod === 'cash' ? 'success' : 'info'} className="text-xs">
                      {PAYMENT_METHOD_LABELS[e.paymentMethod]}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-semibold text-primary whitespace-nowrap">
                    {formatCurrency(getAmount(e))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ReportMonthlyGrouping() {
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  const {
    filters,
    data,
    chartData,
    displayCurrency,
    setDisplayCurrency,
    loading,
    error,
    modalOpen,
    selectedMonth,
    selectedCategory,
    detailData,
    detailLoading,
    updateFilters,
    openDetailModal,
    openMonthDetail,
    closeDetailModal,
  } = useMonthlyReport()

  useEffect(() => {
    categoryService.getAll({ is_active: true })
      .then((res) => {
        const cats = res.data?.categories || res.data || []
        setCategories(cats)
      })
      .catch(() => toast.error('Error al cargar categorías'))
      .finally(() => setCategoriesLoading(false))
  }, [])

  const selectedMonthLabel = selectedMonth && data
    ? data.monthLabels[data.months.indexOf(selectedMonth)]
    : selectedMonth || null

  if (categoriesLoading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-primary">Reporte Mensual por Categoría</h1>
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

      <FilterPanel
        filters={filters}
        categories={categories}
        onFilterChange={updateFilters}
      />

      {loading ? (
        <div className="py-12"><PageLoader /></div>
      ) : error ? (
        <Card>
          <p className="text-sm text-danger text-center py-4">{error}</p>
        </Card>
      ) : (
        <>
          {/* Summary totals */}
          {data && (() => {
            const monthlyTotals = displayCurrency === 'USD' ? data.monthlyTotalsUsd : data.monthlyTotalsArs
            const totalsArr = Object.values(monthlyTotals || {})
            const activeMonths = totalsArr.filter((v) => v > 0)
            const grandTotal = totalsArr.reduce((s, v) => s + v, 0)
            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                  <p className="text-xs text-neutral-darker">Total período</p>
                  <p className="text-lg font-bold font-mono text-primary mt-1">{formatCurrency(grandTotal)}</p>
                  <p className="text-xs text-neutral-darker mt-1">{displayCurrency}</p>
                </Card>
                <Card>
                  <p className="text-xs text-neutral-darker">Meses con datos</p>
                  <p className="text-lg font-bold text-primary mt-1">{activeMonths.length}</p>
                </Card>
                <Card>
                  <p className="text-xs text-neutral-darker">Categorías</p>
                  <p className="text-lg font-bold text-primary mt-1">{data.categories.length}</p>
                </Card>
                <Card>
                  <p className="text-xs text-neutral-darker">Promedio mensual</p>
                  <p className="text-lg font-bold font-mono text-primary mt-1">
                    {formatCurrency(activeMonths.length > 0 ? grandTotal / activeMonths.length : 0)}
                  </p>
                </Card>
              </div>
            )
          })()}

          <MonthlyChart
            data={chartData}
            categories={data?.categories || []}
            onBarClick={(month, cat) => openDetailModal(month, cat)}
            onMonthClick={(month) => openMonthDetail(month)}
          />

          {/* Inline detail table — shown when a bar or month is clicked */}
          {modalOpen && (
            <InlineDetail
              detailData={detailData}
              loading={detailLoading}
              selectedCategory={selectedCategory}
              selectedMonthLabel={selectedMonthLabel}
              displayCurrency={displayCurrency}
              onClose={closeDetailModal}
            />
          )}
        </>
      )}
    </div>
  )
}
