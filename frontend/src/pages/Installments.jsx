import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
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
  const [page, setPage] = useState(1)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await installmentService.getAll({ page, limit: 20 })
      setInstallments(res.data)
      setPagination(res.pagination)
    } catch {
      toast.error('Error al cargar cuotas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [page])

  if (loading && installments.length === 0) return <PageLoader />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-primary">Cuotas</h1>
      </div>

      {installments.length === 0 ? (
        <EmptyState
          title="Sin cuotas registradas"
          description="No hay gastos en cuotas registrados"
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-neutral">
                  <th className="text-left text-xs font-semibold text-neutral-darker px-4 py-3">Descripción</th>
                  <th className="text-center text-xs font-semibold text-neutral-darker px-4 py-3 hidden sm:table-cell">Cuota</th>
                  <th className="text-left text-xs font-semibold text-neutral-darker px-4 py-3 hidden md:table-cell">Fecha</th>
                  <th className="text-right text-xs font-semibold text-neutral-darker px-4 py-3">Monto</th>
                  <th className="text-right text-xs font-semibold text-neutral-darker px-4 py-3 hidden sm:table-cell">Moneda</th>
                </tr>
              </thead>
              <tbody>
                {installments.map((inst) => (
                  <tr key={inst.id} className="border-b border-neutral last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-primary">{inst.description}</p>
                      {inst.category && (
                        <p className="text-xs text-neutral-darker flex items-center gap-1">
                          <span
                            className="w-2 h-2 rounded-full inline-block"
                            style={{ backgroundColor: inst.category.color || '#ccc' }}
                          />
                          {inst.category.name}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-center text-sm text-primary">
                      <Badge variant="info">
                        {inst.installment_number}/{inst.total_installments}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-primary">
                      {formatDate(inst.date)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-sm text-primary">
                      {formatCurrency(inst.amount)}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-right">
                      <Badge variant={inst.currency === 'ARS' ? 'warning' : 'info'}>
                        {inst.currency}
                      </Badge>
                    </td>
                  </tr>
                ))}
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
