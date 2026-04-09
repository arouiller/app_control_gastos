import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import Badge from '../UI/Badge'
import SortTh from './SortTh'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { getDisplayAmount } from '../../utils/currencyHelpers'
import { PAYMENT_METHOD_LABELS } from '../../utils/constants'

export default function DetailTable({ expenses, sort, onSort, displayCurrency, onEdit, onDelete }) {
  const sorted = [...expenses].sort((a, b) => {
    let av, bv
    if (sort.field === 'date')        { av = a.date;                          bv = b.date }
    else if (sort.field === 'amount') { av = getDisplayAmount(a, displayCurrency) || 0; bv = getDisplayAmount(b, displayCurrency) || 0 }
    else if (sort.field === 'desc')   { av = a.description?.toLowerCase();    bv = b.description?.toLowerCase() }
    else if (sort.field === 'cat')    { av = a.category?.name?.toLowerCase(); bv = b.category?.name?.toLowerCase() }
    else if (sort.field === 'method') { av = a.payment_method;                bv = b.payment_method }
    if (av < bv) return sort.dir === 'asc' ? -1 : 1
    if (av > bv) return sort.dir === 'asc' ?  1 : -1
    return 0
  })

  const th = (label, field) => <SortTh label={label} field={field} sort={sort} onSort={onSort} />

  return (
    <div className="overflow-x-auto rounded border border-neutral">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-neutral">
          <tr>
            {th('Descripción', 'desc')}
            {th('Categoría', 'cat')}
            {th('Método', 'method')}
            {th('Fecha', 'date')}
            {th('Monto', 'amount')}
            {(onEdit || onDelete) && <th className="px-3 py-2 text-right text-xs font-semibold text-neutral-darker">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {sorted.map((e) => (
            <tr key={e.id} className="border-b border-neutral last:border-0 hover:bg-gray-50">
              <td className="px-3 py-2">
                <span className="font-medium text-primary">{e.description}</span>
                {!!e.is_installment && !!e.installment_number && (
                  <span className="ml-1 text-xs text-neutral-darker">({e.installment_number}/{e.total_installments})</span>
                )}
                {!!e.is_installment && !e.installment_number && (
                  <span className="ml-1 text-xs text-neutral-darker">({e.total_installments} cuotas)</span>
                )}
              </td>
              <td className="px-3 py-2">
                <span className="flex items-center gap-1 text-neutral-darker">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.category?.color || '#ccc' }} />
                  {e.category?.name || '—'}
                </span>
              </td>
              <td className="px-3 py-2">
                <Badge variant={e.payment_method === 'cash' ? 'success' : 'info'} className="text-xs">
                  {PAYMENT_METHOD_LABELS[e.payment_method]}
                </Badge>
              </td>
              <td className="px-3 py-2 text-neutral-darker whitespace-nowrap">{formatDate(e.date)}</td>
              <td className="px-3 py-2 text-right font-mono font-semibold text-primary whitespace-nowrap">
                {formatCurrency(getDisplayAmount(e, displayCurrency))}
                {displayCurrency !== 'original' && (
                  <span className="block text-xs font-normal text-neutral-darker">
                    {formatCurrency(e.original_amount)} {e.original_currency}
                  </span>
                )}
              </td>
              {(onEdit || onDelete) && (
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-1">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(e)}
                        className="p-1.5 text-neutral-darker hover:text-secondary rounded transition-colors"
                        title="Editar"
                      >
                        <FiEdit2 size={14} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(e)}
                        className="p-1.5 text-neutral-darker hover:text-danger rounded transition-colors"
                        title={e.installment_group_id ? 'Eliminar todas las cuotas' : 'Eliminar'}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
