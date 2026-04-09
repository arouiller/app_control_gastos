import { FiChevronUp, FiChevronDown } from 'react-icons/fi'

export default function SortTh({ label, field, sort, onSort }) {
  const active = sort.field === field
  return (
    <th onClick={() => onSort(field)} className="text-left text-xs font-semibold text-neutral-darker px-3 py-2 cursor-pointer select-none hover:text-primary whitespace-nowrap">
      <span className="flex items-center gap-1">
        {label}
        {active ? (sort.dir === 'asc' ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />) : <FiChevronDown size={12} className="opacity-30" />}
      </span>
    </th>
  )
}
