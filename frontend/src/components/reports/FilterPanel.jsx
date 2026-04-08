import Input from '../UI/Input'
import Button from '../UI/Button'
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
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-primary">Categorías</span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAll}
                  disabled={allSelected}
                >
                  Todas
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deselectAll}
                  disabled={noneSelected}
                >
                  Ninguna
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
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
