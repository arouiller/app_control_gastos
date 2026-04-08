import { useState } from 'react'
import { FiEdit2, FiTrash2, FiArrowUp, FiArrowDown } from 'react-icons/fi'
import { formatCurrency, formatDate } from '../../utils/formatters'

const PAYMENT_LABELS = { cash: 'Efectivo', credit_card: 'Tarjeta' }

export default function ExpenseList({ expenses, onEdit, onDelete }) {
  const [sortField, setSortField] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const sorted = [...expenses].sort((a, b) => {
    let aVal = sortField === 'amount' ? parseFloat(a.amount) : new Date(a.date)
    let bVal = sortField === 'amount' ? parseFloat(b.amount) : new Date(b.date)
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal
  })

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null
    return sortDir === 'asc' ? <FiArrowUp size={12} className="inline" /> : <FiArrowDown size={12} className="inline" />
  }

  const handleDeleteClick = (id) => setConfirmDelete(id)
  const handleDeleteConfirm = () => {
    if (confirmDelete) {
      onDelete(confirmDelete)
      setConfirmDelete(null)
    }
  }

  if (expenses.length === 0) {
    return <p className="text-sm text-neutral-darker text-center py-6">Sin gastos para este período</p>
  }

  return (
    <div>
      {confirmDelete && (
        <div className="mb-3 p-3 bg-danger/10 border border-danger/30 rounded-md text-sm">
          <p className="text-primary mb-2">¿Eliminar este gasto?</p>
          <div className="flex gap-2">
            <button
              onClick={handleDeleteConfirm}
              className="px-3 py-1 bg-danger text-white rounded text-xs font-medium hover:bg-danger-hover"
            >
              Eliminar
            </button>
            <button
              onClick={() => setConfirmDelete(null)}
              className="px-3 py-1 bg-neutral text-primary rounded text-xs font-medium hover:bg-neutral-dark"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral">
              <th className="text-left text-xs font-semibold text-neutral-darker pb-2 pr-3">Descripción</th>
              <th
                className="text-right text-xs font-semibold text-neutral-darker pb-2 pr-3 cursor-pointer hover:text-primary select-none"
                onClick={() => toggleSort('amount')}
              >
                Monto <SortIcon field="amount" />
              </th>
              <th className="text-right text-xs font-semibold text-neutral-darker pb-2 pr-3 hidden sm:table-cell">Moneda</th>
              <th
                className="text-right text-xs font-semibold text-neutral-darker pb-2 pr-3 cursor-pointer hover:text-primary select-none"
                onClick={() => toggleSort('date')}
              >
                Fecha <SortIcon field="date" />
              </th>
              <th className="text-right text-xs font-semibold text-neutral-darker pb-2 pr-3 hidden sm:table-cell">Método</th>
              <th className="text-right text-xs font-semibold text-neutral-darker pb-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((expense) => (
              <tr key={expense.id} className="border-b border-neutral last:border-0">
                <td className="py-2 pr-3">
                  <span className="text-primary">{expense.description}</span>
                  {expense.isInstallment && (
                    <span className="ml-1 text-xs text-secondary font-medium">(cuota)</span>
                  )}
                </td>
                <td className="py-2 pr-3 text-right font-mono font-medium text-primary">
                  <div>
                    <span>
                      {formatCurrency(expense.converted_amount ?? expense.amount)}
                    </span>
                    {expense.converted_amount && (
                      <span className="text-xs text-neutral-darker block">
                        (orig: {formatCurrency(expense.amount)})
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2 pr-3 text-right text-neutral-darker hidden sm:table-cell text-xs font-medium">
                  {expense.currency || 'ARS'}
                </td>
                <td className="py-2 pr-3 text-right text-neutral-darker">
                  {formatDate(expense.date)}
                </td>
                <td className="py-2 pr-3 text-right text-neutral-darker hidden sm:table-cell">
                  {PAYMENT_LABELS[expense.paymentMethod] || expense.paymentMethod}
                </td>
                <td className="py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(expense.id)}
                        className="p-1 text-neutral-darker hover:text-secondary transition-colors rounded"
                        title="Editar"
                      >
                        <FiEdit2 size={14} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => handleDeleteClick(expense.id)}
                        className="p-1 text-neutral-darker hover:text-danger transition-colors rounded"
                        title="Eliminar"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
