import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import { FiX } from 'react-icons/fi'
import { useMonthlyReport } from '../../hooks/useMonthlyReport'
import { categoryService } from '../../services/categoryService'
import { expenseService } from '../../services/expenseService'
import FilterPanel from '../../components/reports/FilterPanel'
import MonthlyChart from '../../components/reports/MonthlyChart'
import DetailTable from '../../components/reports/DetailTable'
import Card, { CardTitle } from '../../components/UI/Card'
import Modal from '../../components/UI/Modal'
import Button from '../../components/UI/Button'
import { PageLoader } from '../../components/UI/LoadingSpinner'
import { formatCurrency } from '../../utils/formatters'
import { toast } from 'react-toastify'

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ReportMonthlyGrouping() {
  const navigate = useNavigate()
  const location = useLocation()
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [sort, setSort] = useState({ field: 'date', dir: 'desc' })
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const autoOpenedRef = useRef(false)

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
    refetchData,
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

  // Auto-open current month detail on first data load
  useEffect(() => {
    if (data && !autoOpenedRef.current) {
      autoOpenedRef.current = true
      const currentMonth = format(new Date(), 'yyyy-MM')
      const targetMonth = data.months?.includes(currentMonth)
        ? currentMonth
        : data.months?.[data.months.length - 1]
      if (targetMonth) openMonthDetail(targetMonth)
    }
  }, [data, openMonthDetail])

  const handleEdit = (expense) => {
    const targetId = expense.installment_group_id || expense.id
    navigate(`/expenses/${targetId}/edit`, { state: { from: location.pathname } })
  }

  const handleDeleteClick = (id) => setDeleteId(id)

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await expenseService.remove(deleteId)
      toast.success('Gasto eliminado')
      setDeleteId(null)
      refetchData()
      // Reload detail if open
      if (modalOpen && selectedMonth) {
        if (selectedCategory) {
          openDetailModal(selectedMonth, selectedCategory)
        } else {
          openMonthDetail(selectedMonth)
        }
      }
    } catch {
      toast.error('Error al eliminar el gasto')
    } finally {
      setDeleting(false)
    }
  }

  const selectedMonthLabel = selectedMonth && data
    ? data.monthLabels[data.months.indexOf(selectedMonth)]
    : selectedMonth || null

  const detailTitle = selectedCategory
    ? `${selectedCategory.name} — ${selectedMonthLabel}`
    : `Todos los gastos — ${selectedMonthLabel}`

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

          {/* Inline detail table */}
          {modalOpen && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <CardTitle>{detailTitle}</CardTitle>
                  {detailData && (
                    <p className="text-xs text-neutral-darker mt-1">
                      {detailData.pagination?.total ?? detailData.expenses?.length ?? 0} gastos · Total: {formatCurrency(detailData.total || 0)}
                    </p>
                  )}
                </div>
                <button onClick={closeDetailModal} className="p-1.5 text-neutral-darker hover:text-primary rounded transition-colors">
                  <FiX size={16} />
                </button>
              </div>

              {detailLoading && <p className="text-sm text-neutral-darker text-center py-8">Cargando...</p>}

              {!detailLoading && (!detailData?.expenses || detailData.expenses.length === 0) && (
                <p className="text-sm text-neutral-darker text-center py-8">Sin gastos para esta selección</p>
              )}

              {!detailLoading && detailData?.expenses?.length > 0 && (
                <DetailTable
                  expenses={detailData.expenses}
                  sort={sort}
                  onSort={(field) => setSort((prev) => ({ field, dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc' }))}
                  displayCurrency={displayCurrency}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                />
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
          <Button variant="danger" loading={deleting} onClick={handleDeleteConfirm}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  )
}
