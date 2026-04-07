import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  { label, error, hint, className = '', type = 'text', required = false, ...props },
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
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={`
          border rounded-md px-3 py-3 text-sm text-primary placeholder-neutral-darker
          transition-colors duration-200
          ${error
            ? 'border-danger focus:border-danger focus:ring-1 focus:ring-danger'
            : 'border-neutral focus:border-secondary focus:ring-2 focus:ring-secondary/20'
          }
          disabled:bg-neutral disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-neutral-darker">{hint}</p>}
    </div>
  )
})

export default Input
