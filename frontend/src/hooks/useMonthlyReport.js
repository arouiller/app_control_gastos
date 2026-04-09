import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { format, startOfMonth, subMonths } from 'date-fns'
import { reportService } from '../services/reportService'
import { expenseService } from '../services/expenseService'
import { toast } from 'react-toastify'

const monthDateRange = (month) => {
  const [year, monthNum] = month.split('-').map(Number)
  const startDate = `${month}-01`
  const lastDay = new Date(year, monthNum, 0).getDate()
  const endDate = `${month}-${String(lastDay).padStart(2, '0')}`
  return { startDate, endDate }
}

const buildChartData = (apiData, currency) => {
  if (!apiData) return []
  const { months, monthLabels, categories } = apiData
  const totals = currency === 'USD' ? apiData.monthlyTotalsUsd : apiData.monthlyTotalsArs
  const dataField = currency === 'USD' ? 'dataUsd' : 'dataArs'
  return months.map((month, i) => {
    const entry = { month, monthLabel: monthLabels[i], total: totals?.[month] || 0 }
    categories.forEach((cat) => {
      entry[`category_${cat.id}`] = cat[dataField]?.[i] || 0
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
  const [displayCurrency, setDisplayCurrency] = useState('USD')
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
      setDetailData({
        ...response.data,
        expenses: (response.data.expenses || []).map((e) => ({ ...e, category })),
      })
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Error al cargar detalles'
      toast.error(msg)
      setModalOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const openMonthDetail = useCallback(async (month) => {
    setSelectedMonth(month)
    setSelectedCategory(null)
    setModalOpen(true)
    setDetailLoading(true)
    setDetailData(null)
    try {
      const { startDate, endDate } = monthDateRange(month)
      const response = await expenseService.getAll({ startDate, endDate, limit: 200 })
      const items = response.data || []
      setDetailData({
        expenses: items.map((e) => ({
          id: e.id,
          description: e.description,
          amount: parseFloat(e.original_amount || e.amount || 0),
          amountInArs: parseFloat(e.amount_in_ars || e.original_amount || e.amount || 0),
          amountInUsd: parseFloat(e.amount_in_usd || 0),
          date: e.date,
          paymentMethod: e.payment_method,
          isInstallment: !!e.is_installment,
          installmentNumber: e.installment_number || null,
          totalInstallments: e.total_installments || null,
          category: e.category || null,
        })),
        total: items.reduce((s, e) => s + parseFloat(e.amount_in_ars || e.original_amount || e.amount || 0), 0),
        pagination: { total: items.length },
      })
    } catch {
      toast.error('Error al cargar gastos del mes')
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

  const chartData = useMemo(() => buildChartData(data, displayCurrency), [data, displayCurrency])

  return {
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
    handleDeleteExpense,
    refetchData: () => fetchData(filters),
  }
}
