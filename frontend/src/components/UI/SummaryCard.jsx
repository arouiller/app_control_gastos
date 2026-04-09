import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi'
import Card from './Card'

export default function SummaryCard({ title, value, subtitle, icon: Icon, trend, color = 'text-secondary' }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-neutral-darker mb-1">{title}</p>
          <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-neutral-darker mt-1 truncate">{subtitle}</p>}
        </div>
        <div className="ml-3 p-2 bg-neutral rounded-lg flex-shrink-0">
          <Icon size={18} className="text-primary" />
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${trend >= 0 ? 'text-danger' : 'text-success'}`}>
          {trend >= 0 ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
          <span>{Math.abs(trend).toFixed(1)}% vs mes anterior</span>
        </div>
      )}
    </Card>
  )
}
