import Input from '../UI/Input'
import Card from '../UI/Card'

export default function FilterPanel({ filters, categories, onFilterChange }) {
  const { dateFrom, dateTo, categoryIds } = filters

  const handleDateFrom = (e) => {
    const val = e.target.value
    if (dateTo && val > dateTo) return
    onFilterChange({ dateFrom: val })
  }

  const handleDateTo = (e) => {
    const val = e.target.value
    if (dateFrom && val < dateFrom) return
    onFilterChange({ dateTo: val })
  }

  const toggleCategory = (id) => {
    const current = categoryIds || []
    const next = current.includes(id)
      ? current.filter((c) => c !== id)
      : [...current, id]
    onFilterChange({ categoryIds: next })
  }

  const selectAll = () => {
    onFilterChange({ categoryIds: categories.map((c) => c.id) })
  }

  const deselectAll = () => {
    onFilterChange({ categoryIds: [] })
  }

  const allSelected = categories.length > 0 && (categoryIds || []).length === categories.length
  const noneSelected = (categoryIds || []).length === 0

  return (
    <Card>
      <div className="space-y-4">
        {/* Date range */}
        <div className="flex flex-wrap gap-4 items-end">
          <Input
            label="Desde"
            type="date"
            value={dateFrom}
            onChange={handleDateFrom}
            max={dateTo || undefined}
          />
          <Input
            label="Hasta"
            type="date"
            value={dateTo}
            onChange={handleDateTo}
            min={dateFrom || undefined}
          />
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <div>
            <span className="text-sm font-medium text-primary block mb-2">Categorías</span>
            <div className="flex flex-wrap gap-2">
              {/* Quick-select pills */}
              <button
                onClick={selectAll}
                disabled={allSelected}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  allSelected
                    ? 'bg-primary text-white border-transparent'
                    : 'bg-white text-neutral-darker border-neutral hover:border-primary hover:text-primary'
                }`}
              >
                Todas
              </button>
              <button
                onClick={deselectAll}
                disabled={noneSelected}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  noneSelected
                    ? 'bg-primary text-white border-transparent'
                    : 'bg-white text-neutral-darker border-neutral hover:border-primary hover:text-primary'
                }`}
              >
                Ninguna
              </button>
              {/* Category pills */}
              {categories.map((cat) => {
                const active = (categoryIds || []).includes(cat.id)
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      active
                        ? 'text-white border-transparent'
                        : 'bg-white text-neutral-darker border-neutral hover:border-secondary'
                    }`}
                    style={active ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: active ? 'rgba(255,255,255,0.6)' : cat.color }}
                    />
                    {cat.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
