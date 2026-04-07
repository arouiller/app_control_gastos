import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { FiCheckCircle, FiXCircle } from 'react-icons/fi'
import { installmentService } from '../services/installmentService'
import Card from '../components/UI/Card'
import Badge from '../components/UI/Badge'
import Button from '../components/UI/Button'
import { PageLoader } from '../components/UI/LoadingSpinner'
import EmptyState from '../components/UI/EmptyState'
import { formatCurrency, formatDate } from '../utils/formatters'

export default function Installments() {
  const [installments, setInstallments] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [page, setPage] = useState(1)
  const [actionId, setActionId] = useState(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await installmentService.getAll({
        includeAllCuotas: showAll,
        page,
        limit: 20,
      })
      setInstallments(res.data)
      setPagination(res.pagination)
    } catch {
      toast.error('Error al cargar cuotas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [showAll, page])

  const handlePay = async (id) => {
    setActionId(id)
    try {
      await installmentService.pay(id, { paymentDate: new Date().toISOString().split('T')[0] })
      toast.success('Cuota marcada como pagada')
      loadData()
    } catch {
      toast.error('Error al marcar cuota')
    } finally {
      setActionId(null)
    }
  }

  const handleUnpay = async (id) => {
    setActionId(id)
    try {
      await installmentService.unpay(id)
      toast.success('Cuota marcada como no pagada')
      loadData()
    } catch {
      toast.error('Error al actualizar cuota')
    } finally {
      setActionId(null)
    }
  }

  if (loading && installments.length === 0) return <PageLoader />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-primary">Cuotas</h1>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => { setShowAll(e.target.checked); setPage(1) }}
              className="rounded text-secondary"
            />
            Mostrar todas
          </label>
        </div>
      </div>

      {installments.length === 0 ? (
        <EmptyState
          title="Sin cuotas pendientes"
          description={showAll ? 'No hay cuotas registradas' : 'No hay cuotas pendientes de pago'}
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-neutral">
                  <th className="text-left text-xs font-semibold text-neutral-darker px-4 py-3">Descripción</th>
                  <th className="text-center text-xs font-semibold text-neutral-darker px-4 py-3 hidden sm:table-cell">Cuota</th>
                  <th className="text-left text-xs font-semibold text-neutral-darker px-4 py-3 hidden md:table-cell">Vencimiento</th>
                  <th className="text-right text-xs font-semibold text-neutral-darker px-4 py-3">Monto</th>
                  <th className="text-center text-xs font-semibold text-neutral-darker px-4 py-3">Estado</th>
                  <th className="text-center text-xs font-semibold text-neutral-darker px-4 py-3">Acción</th>
                </tr>
              </thead>
              <tbody>
                {installments.map((inst) => {
                  const dueDate = new Date(inst.due_date)
                  const isOverdue = !inst.is_paid && dueDate < new Date()

                  return (
                    <tr key={inst.id} className="border-b border-neutral last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-primary">{inst.expense?.description}</p>
                        <p className="text-xs text-neutral-darker">{inst.expense?.category?.name}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-center text-sm text-primary">
                        {inst.installment_number}/{inst.total_installments}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-sm text-primary">
                        <span className={isOverdue ? 'text-danger font-medium' : ''}>
                          {formatDate(inst.due_date)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-sm text-primary">
                        {formatCurrency(inst.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {inst.is_paid ? (
                          <Badge variant="success">Pagada</Badge>
                        ) : isOverdue ? (
                          <Badge variant="danger">Vencida</Badge>
                        ) : (
                          <Badge variant="warning">Pendiente</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {inst.is_paid ? (
                          <button
                            onClick={() => handleUnpay(inst.id)}
                            disabled={actionId === inst.id}
                            className="p-1.5 text-neutral-darker hover:text-warning rounded transition-colors disabled:opacity-50"
                            title="Marcar como no pagada"
                          >
                            <FiXCircle size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePay(inst.id)}
                            disabled={actionId === inst.id}
                            className="p-1.5 text-neutral-darker hover:text-success rounded transition-colors disabled:opacity-50"
                            title="Marcar como pagada"
                          >
                            <FiCheckCircle size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral">
              <p className="text-xs text-neutral-darker">
                {pagination.total} cuotas · Página {pagination.page} de {pagination.pages}
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={!pagination.hasPrevPage} onClick={() => setPage((p) => p - 1)}>
                  Anterior
                </Button>
                <Button variant="secondary" size="sm" disabled={!pagination.hasNextPage} onClick={() => setPage((p) => p + 1)}>
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
