import { formatCurrency } from '../../utils/formatters'

const RADIAN = Math.PI / 180

export function CatBarLabel({ x, y, width, value, index, data }) {
  const entry = data?.[index]
  if (!value || !entry) return null
  return (
    <g>
      <text x={x + width / 2} y={y - 13} textAnchor="middle" fill="#374151" fontSize={10} fontWeight="600">
        {formatCurrency(value)}
      </text>
      <text x={x + width / 2} y={y - 2} textAnchor="middle" fill="#9CA3AF" fontSize={9}>
        {entry.percentage?.toFixed(1)}%
      </text>
    </g>
  )
}

export function PieLabel({ cx, cy, midAngle, outerRadius, percent, value, name }) {
  if (percent < 0.04) return null
  const radius = outerRadius + 40
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  const anchor = x > cx ? 'start' : 'end'
  return (
    <g>
      <text x={x} y={y - 10} textAnchor={anchor} dominantBaseline="central" fill="#111827" fontSize={10} fontWeight="700">{name}</text>
      <text x={x} y={y + 2}  textAnchor={anchor} dominantBaseline="central" fill="#374151" fontSize={10} fontWeight="600">{`${(percent * 100).toFixed(1)}%`}</text>
      <text x={x} y={y + 13} textAnchor={anchor} dominantBaseline="central" fill="#6B7280" fontSize={9}>{formatCurrency(value)}</text>
    </g>
  )
}
