import { format, parseISO, isValid } from 'date-fns'
import { es } from 'date-fns/locale'

export const formatCurrency = (amount, currency = 'ARS') => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '$0,00'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(num)
}

export const formatDate = (date, fmt = 'dd/MM/yyyy') => {
  if (!date) return ''
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(d)) return ''
    return format(d, fmt, { locale: es })
  } catch {
    return ''
  }
}

export const formatDateLong = (date) => formatDate(date, "d 'de' MMMM yyyy")

export const formatPercent = (value) => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0%'
  return `${num.toFixed(1)}%`
}

export const toDateInputValue = (date) => {
  if (!date) return ''
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(d)) return ''
    return format(d, 'yyyy-MM-dd')
  } catch {
    return ''
  }
}

export const today = () => format(new Date(), 'yyyy-MM-dd')

export const startOfCurrentMonth = () => {
  const d = new Date()
  return format(new Date(d.getFullYear(), d.getMonth(), 1), 'yyyy-MM-dd')
}

export const endOfCurrentMonth = () => {
  const d = new Date()
  return format(new Date(d.getFullYear(), d.getMonth() + 1, 0), 'yyyy-MM-dd')
}
