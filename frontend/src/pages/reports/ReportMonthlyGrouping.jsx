import { useEffect, useState } from 'react'
import { useMonthlyReport } from '../../hooks/useMonthlyReport'
import { categoryService } from '../../services/categoryService'
import FilterPanel from '../../components/reports/FilterPanel'
import MonthlyChart from '../../components/reports/MonthlyChart'
import ExpenseDetailModal from '../../components/reports/ExpenseDetailModal'
import Card, { CardTitle } from '../../components/UI/Card'
import { PageLoader } from '../../components/UI/LoadingSpinner'
import { formatCurrency } from '../../utils/formatters'
import { toast } from 'react-toastify'

export default function ReportMonthlyGrouping() {
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  const {
    filters,
    data,
    chartData,
    loading,
    error,
    modalOpen,
    selectedMonth,
    selectedCategory,
    detailData,
    detailLoading,
    updateFilters,
    openDetailModal,
    closeDetailModal,
    handleDeleteExpense,
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

  const handleBarClick = (month, category) => {
    openDetailModal(month, category)
  }

  // Find month label for modal
  const selectedMonthLabel = selectedMonth && data
    ? data.monthLabels[data.months.indexOf(selectedMonth)]
    : null

  if (categoriesLoading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-primary">Reporte Mensual por Categoría</h1>
      </div>

      <FilterPanel
        filters={filters}
        categories={categories}
        onFilterChange={updateFilters}
      />

      {loading ? (
        <div className="py-12">
          <PageLoader />
        </div>
      ) : error ? (
        <Card>
          <p className="text-sm text-danger text-center py-4">{error}</p>
        </Card>
      ) : (
        <>
          {/* Summary totals */}
          {data && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card>
                <p className="text-xs text-neutral-darker">Total período</p>
                <p className="text-lg font-bold font-mono text-primary mt-1">
                  {formatCurrency(
                    Object.values(data.monthlyTotals).reduce((s, v) => s + v, 0)
                  )}
                </p>
              </Card>
              <Card>
                <p className="text-xs text-neutral-darker">Meses con datos</p>
                <p className="text-lg font-bold text-primary mt-1">
                  {Object.values(data.monthlyTotals).filter((v) => v > 0).length}
                </p>
              </Card>
              <Card>
                <p className="text-xs text-neutral-darker">Categorías</p>
                <p className="text-lg font-bold text-primary mt-1">
                  {data.categories.length}
                </p>
              </Card>
              <Card>
                <p className="text-xs text-neutral-darker">Promedio mensual</p>
                <p className="text-lg font-bold font-mono text-primary mt-1">
                  {(() => {
                    const activeMonths = Object.values(data.monthlyTotals).filter((v) => v > 0)
                    if (activeMonths.length === 0) return formatCurrency(0)
                    const total = activeMonths.reduce((s, v) => s + v, 0)
                    return formatCurrency(total / activeMonths.length)
                  })()}
                </p>
              </Card>
            </div>
          )}

          <MonthlyChart
            data={chartData}
            categories={data?.categories || []}
            onBarClick={handleBarClick}
          />

          {/* Category totals table */}
          {data?.categories?.length > 0 && (
            <Card>
              <CardTitle className="mb-4">Totales por Categoría</CardTitle>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral">
                      <th className="text-left text-xs font-semibold text-neutral-darker pb-2">Categoría</th>
                      <th className="text-right text-xs font-semibold text-neutral-darker pb-2">Total</th>
                      <th className="text-right text-xs font-semibold text-neutral-darker pb-2 hidden sm:table-cell">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const grandTotal = Object.values(data.categoryTotals).reduce((s, v) => s + v, 0)
                      return data.categories
                        .slice()
                        .sort((a, b) => (data.categoryTotals[b.id] || 0) - (data.categoryTotals[a.id] || 0))
                        .map((cat) => {
                          const total = data.categoryTotals[String(cat.id)] || 0
                          const pct = grandTotal > 0 ? ((total / grandTotal) * 100).toFixed(1) : '0.0'
                          return (
                            <tr key={cat.id} className="border-b border-neutral last:border-0">
                              <td className="py-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                                  <span className="text-sm text-primary">{cat.name}</span>
                                </div>
                              </td>
                              <td className="py-2 text-right font-mono text-sm text-primary">
                                {formatCurrency(total)}
                              </td>
                              <td className="py-2 text-right text-sm text-neutral-darker hidden sm:table-cell">
                                {pct}%
                              </td>
                            </tr>
                          )
                        })
                    })()}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      <ExpenseDetailModal
        isOpen={modalOpen}
        month={selectedMonth}
        monthLabel={selectedMonthLabel}
        category={selectedCategory}
        detailData={detailData}
        loading={detailLoading}
        onClose={closeDetailModal}
        onDelete={handleDeleteExpense}
      />
    </div>
  )
}
