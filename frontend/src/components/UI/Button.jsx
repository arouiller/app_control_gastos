const variants = {
  primary: 'bg-secondary text-white hover:bg-secondary-hover disabled:bg-secondary/50',
  secondary: 'bg-neutral text-primary hover:bg-neutral-dark disabled:opacity-50',
  danger: 'bg-danger text-white hover:bg-danger-hover disabled:bg-danger/50',
  ghost: 'bg-transparent text-secondary border border-secondary hover:bg-secondary-light disabled:opacity-50',
}

const sizes = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className = '',
  ...props
}) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-md
        transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2
        focus-visible:outline-secondary disabled:cursor-not-allowed
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
