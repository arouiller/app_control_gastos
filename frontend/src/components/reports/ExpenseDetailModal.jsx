import { useNavigate } from 'react-router-dom'
import Modal from '../UI/Modal'
import ExpenseList from './ExpenseList'
import { formatCurrency } from '../../utils/formatters'
import { PageLoader } from '../UI/LoadingSpinner'

export default function ExpenseDetailModal({
  isOpen,
  month,
  monthLabel,
  category,
  detailData,
  loading,
  onClose,
  onDelete,
}) {
  const navigate = useNavigate()

  const handleEdit = (expenseId) => {
    onClose()
    navigate(`/expenses/${expenseId}/edit`)
  }

  const title = category && monthLabel
    ? `${category.name} — ${monthLabel}`
    : 'Detalle de gastos'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-2xl">
      {loading ? (
        <div className="py-8">
          <PageLoader />
        </div>
      ) : detailData ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {category && (
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                />
              )}
              <span className="text-sm text-neutral-darker">
                {detailData.pagination?.total || detailData.expenses.length} gasto(s)
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-darker">Total del mes</p>
              <p className="text-lg font-bold font-mono text-primary">
                {formatCurrency(detailData.total)}
              </p>
            </div>
          </div>
          <ExpenseList
            expenses={detailData.expenses}
            onEdit={handleEdit}
            onDelete={onDelete}
          />
        </div>
      ) : null}
    </Modal>
  )
}
