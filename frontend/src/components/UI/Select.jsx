import { forwardRef } from 'react'

const Select = forwardRef(function Select(
  { label, error, options = [], placeholder, className = '', required = false, ...props },
  ref
) {
  const inputId = props.id || props.name

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-primary">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        className={`
          border rounded-md px-3 py-3 text-sm text-primary bg-white
          transition-colors duration-200
          ${error
            ? 'border-danger focus:border-danger'
            : 'border-neutral focus:border-secondary focus:ring-2 focus:ring-secondary/20'
          }
          disabled:bg-neutral disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
})

export default Select
