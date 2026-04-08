import { useState, useEffect, useCallback, useRef } from 'react'
import { format, startOfMonth, subMonths } from 'date-fns'
import { reportService } from '../services/reportService'
import { expenseService } from '../services/expenseService'
import { toast } from 'react-toastify'

const buildChartData = (apiData) => {
  if (!apiData) return []
  const { months, monthLabels, categories } = apiData
  return months.map((month, i) => {
    const entry = { month, monthLabel: monthLabels[i], total: apiData.monthlyTotals[month] || 0 }
    categories.forEach((cat) => {
      entry[`category_${cat.id}`] = cat.data[i] || 0
    })
    return entry
  })
}

const today = new Date()
const DEFAULT_FILTERS = {
  dateFrom: format(startOfMonth(subMonths(today, 11)), 'yyyy-MM-dd'),
  dateTo: format(today, 'yyyy-MM-dd'),
  categoryIds: [],
}

export function useMonthlyReport(initialFilters = DEFAULT_FILTERS) {
  const [filters, setFilters] = useState(initialFilters)
  const [data, setData] = useState(null)
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const debounceRef = useRef(null)

  const fetchData = useCallback(async (currentFilters) => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        dateFrom: currentFilters.dateFrom,
        dateTo: currentFilters.dateTo,
      }
      if (currentFilters.categoryIds && currentFilters.categoryIds.length > 0) {
        params.categories = currentFilters.categoryIds.join(',')
      }
      const response = await reportService.getMonthlyGrouped(params)
      setData(response.data)
      setChartData(buildChartData(response.data))
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Error al cargar el reporte'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchData(filters)
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [filters, fetchData])

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }, [])

  const openDetailModal = useCallback(async (month, category) => {
    setSelectedMonth(month)
    setSelectedCategory(category)
    setModalOpen(true)
    setDetailLoading(true)
    setDetailData(null)
    try {
      const response = await reportService.getMonthlyDetails({
        month,
        categoryId: category.id,
        page: 1,
        limit: 50,
      })
      setDetailData(response.data)
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Error al cargar detalles'
      toast.error(msg)
      setModalOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const closeDetailModal = useCallback(() => {
    setModalOpen(false)
    setSelectedMonth(null)
    setSelectedCategory(null)
    setDetailData(null)
  }, [])

  const handleDeleteExpense = useCallback(async (expenseId) => {
    try {
      await expenseService.remove(expenseId)
      toast.success('Gasto eliminado')
      // Refetch both detail and main data
      if (selectedMonth && selectedCategory) {
        const response = await reportService.getMonthlyDetails({
          month: selectedMonth,
          categoryId: selectedCategory.id,
          page: 1,
          limit: 50,
        })
        setDetailData(response.data)
      }
      fetchData(filters)
    } catch {
      toast.error('Error al eliminar el gasto')
    }
  }, [selectedMonth, selectedCategory, filters, fetchData])

  return {
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
    refetchData: () => fetchData(filters),
  }
}
