import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FiPlus, FiFilter, FiSearch, FiX } from 'react-icons/fi'
import { fetchExpenses, deleteExpense, setFilters, clearFilters, setDisplayCurrency } from '../store/expensesSlice'
import { fetchCategories } from '../store/categoriesSlice'
import Button from '../components/UI/Button'
import Input from '../components/UI/Input'
import Select from '../components/UI/Select'
import Card from '../components/UI/Card'
import DetailTable from '../components/reports/DetailTable'
import { PageLoader } from '../components/UI/LoadingSpinner'
import EmptyState from '../components/UI/EmptyState'
import Modal from '../components/UI/Modal'
import { startOfCurrentMonth, endOfCurrentMonth } from '../utils/formatters'

export default function Expenses() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { items: expenses, pagination, loading, filters, displayCurrency } = useSelector((state) => state.expenses)
  const { items: categories } = useSelector((state) => state.categories)
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [sort, setSort] = useState({ field: 'date', dir: 'desc' })

  const handleEdit = (expense) => {
    const targetId = expense.installment_group_id || expense.id
    navigate(`/expenses/${targetId}/edit`, { state: { from: location.pathname } })
  }

  const handleSort = (field) =>
    setSort((prev) => ({ field, dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc' }))

  useEffect(() => {
    dispatch(fetchCategories())
  }, [dispatch])

  useEffect(() => {
    // When searching by text, don't restrict by default date range — installments span multiple months
    const hasSearch = !!filters.search
    dispatch(fetchExpenses({
      ...filters,
      page,
      limit: 20,
      startDate: filters.startDate || (hasSearch ? undefined : startOfCurrentMonth()),
      endDate: filters.endDate || (hasSearch ? undefined : endOfCurrentMonth()),
      showConsolidated: filters.showConsolidated,
    }))
  }, [dispatch, filters, page])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await dispatch(deleteExpense(deleteId)).unwrap()
      toast.success('Gasto eliminado')
      setDeleteId(null)
    } catch {
      toast.error('Error al eliminar gasto')
    } finally {
      setDeleting(false)
    }
  }

  const categoryOptions = [
    { value: '', label: 'Todas las categorías' },
    ...categories.map((c) => ({ value: String(c.id), label: c.name })),
  ]

  if (loading && expenses.length === 0) return <PageLoader />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-primary">Gastos</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setFiltersOpen(!filtersOpen)}>
            <FiFilter size={16} />
            Filtros
          </Button>
          <Button size="sm" onClick={() => navigate('/expenses/new')}>
            <FiPlus size={16} />
            Nuevo Gasto
          </Button>
        </div>
      </div>

      {/* Filters */}
      {filtersOpen && (
        <Card className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              label="Desde"
              type="date"
              value={filters.startDate}
              onChange={(e) => dispatch(setFilters({ startDate: e.target.value }))}
            />
            <Input
              label="Hasta"
              type="date"
              value={filters.endDate}
              onChange={(e) => dispatch(setFilters({ endDate: e.target.value }))}
            />
            <Select
              label="Categoría"
              options={categoryOptions}
              value={filters.categoryId}
              onChange={(e) => dispatch(setFilters({ categoryId: e.target.value }))}
            />
            <Select
              label="Método de pago"
              options={[
                { value: '', label: 'Todos' },
                { value: 'cash', label: 'Efectivo' },
                { value: 'credit_card', label: 'Tarjeta' },
              ]}
              value={filters.paymentMethod}
              onChange={(e) => dispatch(setFilters({ paymentMethod: e.target.value }))}
            />
            <Select
              label="Moneda"
              options={[
                { value: '', label: 'Ambas' },
                { value: 'ARS', label: 'Pesos (ARS)' },
                { value: 'USD', label: 'Dólares (USD)' },
              ]}
              value={filters.currency}
              onChange={(e) => dispatch(setFilters({ currency: e.target.value }))}
            />
            <Select
              label="Mostrar en"
              options={[
                { value: 'original', label: 'Moneda original' },
                { value: 'ARS', label: 'Pesos (ARS)' },
                { value: 'USD', label: 'Dólares (USD)' },
              ]}
              value={displayCurrency}
              onChange={(e) => dispatch(setDisplayCurrency(e.target.value))}
            />
            <Select
              label="Vista de cuotas"
              options={[
                { value: 'false', label: 'Cuotas individuales' },
                { value: 'true', label: 'Consolidadas (solo padre)' },
              ]}
              value={String(filters.showConsolidated)}
              onChange={(e) => { dispatch(setFilters({ showConsolidated: e.target.value === 'true' })); setPage(1) }}
            />
          </div>
          <div className="flex gap-3 mt-3">
            <div className="flex-1">
              <div className="relative">
                <FiSearch size={16} className="absolute left-3 top-3.5 text-neutral-darker" />
                <input
                  type="text"
                  placeholder="Buscar por descripción..."
                  value={filters.search}
                  onChange={(e) => dispatch(setFilters({ search: e.target.value }))}
                  className="w-full pl-9 pr-4 py-3 border border-neutral rounded-md text-sm focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                />
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { dispatch(clearFilters()); setPage(1) }}>
              <FiX size={16} />
              Limpiar
            </Button>
          </div>
        </Card>
      )}

      {/* Expenses list */}
      {expenses.length === 0 ? (
        <EmptyState
          title="Sin gastos"
          description="No hay gastos registrados para el período seleccionado"
          action={() => navigate('/expenses/new')}
          actionLabel="Registrar Gasto"
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <DetailTable
            expenses={expenses}
            sort={sort}
            onSort={handleSort}
            displayCurrency={displayCurrency}
            onEdit={handleEdit}
            onDelete={(id) => setDeleteId(id)}
          />

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral">
              <p className="text-xs text-neutral-darker">
                {pagination.total} gastos · Página {pagination.page} de {pagination.pages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary" size="sm"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setPage((p) => p - 1)}
                >Anterior</Button>
                <Button
                  variant="secondary" size="sm"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                >Siguiente</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Delete confirmation modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Eliminar Gasto">
        <p className="text-sm text-primary mb-6">
          ¿Estás seguro de que quieres eliminar este gasto? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  )
}
