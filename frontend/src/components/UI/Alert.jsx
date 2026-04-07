import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiInfo } from 'react-icons/fi'

const configs = {
  success: {
    bg: 'bg-success-bg border-success',
    text: 'text-success-text',
    Icon: FiCheckCircle,
  },
  error: {
    bg: 'bg-danger-bg border-danger',
    text: 'text-danger-text',
    Icon: FiXCircle,
  },
  warning: {
    bg: 'bg-warning-bg border-warning',
    text: 'text-warning-text',
    Icon: FiAlertTriangle,
  },
  info: {
    bg: 'bg-info-bg border-info',
    text: 'text-info-text',
    Icon: FiInfo,
  },
}

export default function Alert({ type = 'info', children, className = '' }) {
  const { bg, text, Icon } = configs[type] || configs.info
  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${bg} ${text} ${className}`} role="alert">
      <Icon size={18} className="mt-0.5 flex-shrink-0" />
      <div className="text-sm">{children}</div>
    </div>
  )
}
