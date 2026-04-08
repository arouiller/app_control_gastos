import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LabelList,
} from 'recharts'
import Card, { CardTitle } from '../UI/Card'
import { formatCurrency } from '../../utils/formatters'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const total = payload.reduce((sum, p) => sum + (p.value || 0), 0)
  return (
    <div className="bg-white border border-neutral rounded-lg shadow-modal p-3 text-sm min-w-[160px]">
      <p className="font-semibold text-primary mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: p.fill }} />
            <span className="text-neutral-darker truncate max-w-[100px]">{p.name}</span>
          </div>
          <span className="font-mono font-medium text-primary">{formatCurrency(p.value)}</span>
        </div>
      ))}
      {payload.length > 1 && (
        <div className="flex justify-between pt-1 mt-1 border-t border-neutral">
          <span className="text-neutral-darker font-medium">Total</span>
          <span className="font-mono font-semibold text-primary">{formatCurrency(total)}</span>
        </div>
      )}
    </div>
  )
}

// Custom X-axis tick — clickable to show all expenses for that month
function CustomXAxisTick({ x, y, payload, chartData, onMonthClick }) {
  const entry = chartData?.find((d) => d.month === payload.value)
  const label = entry?.monthLabel || payload.value
  const clickable = !!onMonthClick
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0} y={0} dy={12}
        textAnchor="end"
        fontSize={11}
        fill={clickable ? '#2563EB' : '#6B7280'}
        transform="rotate(-35)"
        style={{ cursor: clickable ? 'pointer' : 'default' }}
        onClick={() => onMonthClick && onMonthClick(payload.value)}
      >
        {label}
      </text>
    </g>
  )
}

export default function MonthlyChart({ data, categories, onBarClick, onMonthClick }) {
  const [hiddenCategories, setHiddenCategories] = useState({})

  const toggleCategory = (catId) => {
    setHiddenCategories((prev) => ({ ...prev, [catId]: !prev[catId] }))
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardTitle className="mb-4">Gastos Mensuales por Categoría</CardTitle>
        <p className="text-sm text-neutral-darker text-center py-16">Sin datos para el período seleccionado</p>
      </Card>
    )
  }

  // Sort categories by total descending so largest is at the base of the stack
  const categoryTotals = {}
  data.forEach((point) => {
    categories.forEach((cat) => {
      categoryTotals[cat.id] = (categoryTotals[cat.id] || 0) + (point[`category_${cat.id}`] || 0)
    })
  })
  const sortedCategories = [...categories].sort((a, b) => (categoryTotals[b.id] || 0) - (categoryTotals[a.id] || 0))

  return (
    <Card>
      <CardTitle className="mb-4">Gastos Mensuales por Categoría</CardTitle>
      <ResponsiveContainer width="100%" height={340}>
        <BarChart
          data={data}
          margin={{ top: 24, right: 4, left: 0, bottom: 40 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis
            dataKey="month"
            tick={<CustomXAxisTick chartData={data} onMonthClick={onMonthClick} />}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            onClick={(e) => {
              const cat = categories.find((c) => c.name === e.value)
              if (cat) toggleCategory(cat.id)
            }}
            wrapperStyle={{ cursor: 'pointer', fontSize: 12, paddingTop: 8 }}
            formatter={(value) => {
              const cat = categories.find((c) => c.name === value)
              const hidden = cat ? hiddenCategories[cat.id] : false
              return (
                <span style={{ color: hidden ? '#9CA3AF' : '#374151', textDecoration: hidden ? 'line-through' : 'none' }}>
                  {value}
                </span>
              )
            }}
          />
          {sortedCategories.map((cat) => (
            <Bar
              key={cat.id}
              dataKey={`category_${cat.id}`}
              name={cat.name}
              fill={cat.color}
              stackId="stack"
              hide={hiddenCategories[cat.id]}
              onClick={(payload) => {
                if (onBarClick && payload) onBarClick(payload.month, cat)
              }}
              style={{ cursor: onBarClick ? 'pointer' : 'default' }}
            />
          ))}
          {/* Phantom bar at top of stack — renders total label only */}
          <Bar dataKey={() => 0} stackId="stack" fill="none" legendType="none" isAnimationActive={false}>
            <LabelList
              dataKey="total"
              position="top"
              formatter={(v) => v > 0 ? formatCurrency(v) : ''}
              style={{ fontSize: 10, fontWeight: '600', fill: '#374151' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
