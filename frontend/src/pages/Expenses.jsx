import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FiPlus, FiEdit2, FiTrash2, FiFilter, FiSearch, FiX } from 'react-icons/fi'
import { fetchExpenses, deleteExpense, setFilters, clearFilters, setDisplayCurrency } from '../store/expensesSlice'
import { fetchCategories } from '../store/categoriesSlice'
import Button from '../components/UI/Button'
import Input from '../components/UI/Input'
import Select from '../components/UI/Select'
import Card from '../components/UI/Card'
import Badge from '../components/UI/Badge'
import { PageLoader } from '../components/UI/LoadingSpinner'
import EmptyState from '../components/UI/EmptyState'
import Modal from '../components/UI/Modal'
import { formatCurrency, formatDate, startOfCurrentMonth, endOfCurrentMonth } from '../utils/formatters'
import { getDisplayAmount } from '../utils/currencyHelpers'
import { PAYMENT_METHOD_LABELS } from '../utils/constants'

export default function Expenses() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { items: expenses, pagination, loading, filters, displayCurrency } = useSelector((state) => state.expenses)
  const { items: categories } = useSelector((state) => state.categories)
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-neutral">
                  <th className="text-left text-xs font-semibold text-neutral-darker px-4 py-3">Descripción</th>
                  <th className="text-left text-xs font-semibold text-neutral-darker px-4 py-3 hidden sm:table-cell">Categoría</th>
                  <th className="text-left text-xs font-semibold text-neutral-darker px-4 py-3 hidden md:table-cell">Fecha</th>
                  <th className="text-left text-xs font-semibold text-neutral-darker px-4 py-3 hidden lg:table-cell">Método</th>
                  <th className="text-right text-xs font-semibold text-neutral-darker px-4 py-3">Monto</th>
                  <th className="text-right text-xs font-semibold text-neutral-darker px-4 py-3 hidden sm:table-cell">Moneda</th>
                  <th className="text-right text-xs font-semibold text-neutral-darker px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense, i) => (
                  <tr key={expense.id} className={`border-b border-neutral last:border-0 hover:bg-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-primary">{expense.description}</p>
                        {!!expense.is_installment && !!expense.installment_number && (
                          <Badge variant="info" className="mt-0.5 text-xs">
                            Cuota {expense.installment_number}/{expense.total_installments}
                          </Badge>
                        )}
                        {!!expense.is_installment && !expense.installment_number && (
                          <Badge variant="warning" className="mt-0.5 text-xs">
                            {expense.total_installments} cuotas
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: expense.category?.color || '#ccc' }}
                        />
                        <span className="text-sm text-primary">{expense.category?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-primary">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <Badge variant={expense.payment_method === 'cash' ? 'success' : 'info'}>
                        {PAYMENT_METHOD_LABELS[expense.payment_method]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-sm text-primary">
                      <div>
                        <span>
                          {formatCurrency(getDisplayAmount(expense, displayCurrency))}
                        </span>
                        {displayCurrency !== 'original' && (
                          <span className="text-xs text-neutral-darker block">
                            (orig: {formatCurrency(expense.original_amount)} {expense.original_currency})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-right">
                      <Badge variant={expense.original_currency === 'ARS' ? 'warning' : 'info'}>
                        {expense.original_currency}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {!expense.installment_group_id && (
                          <button
                            onClick={() => navigate(`/expenses/${expense.id}/edit`)}
                            className="p-1.5 text-neutral-darker hover:text-secondary rounded transition-colors"
                            title="Editar"
                          >
                            <FiEdit2 size={15} />
                          </button>
                        )}
                        {!expense.installment_group_id && (
                          <button
                            onClick={() => setDeleteId(expense.id)}
                            className="p-1.5 text-neutral-darker hover:text-danger rounded transition-colors"
                            title="Eliminar"
                          >
                            <FiTrash2 size={15} />
                          </button>
                        )}
                        {expense.installment_group_id && (
                          <button
                            onClick={() => navigate(`/expenses/${expense.installment_group_id}/edit`)}
                            className="p-1.5 text-neutral-darker hover:text-secondary rounded transition-colors"
                            title="Editar gasto padre"
                          >
                            <FiEdit2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
