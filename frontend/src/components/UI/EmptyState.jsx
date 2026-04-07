import { FiInbox } from 'react-icons/fi'
import Button from './Button'

export default function EmptyState({ icon: Icon = FiInbox, title, description, action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon size={48} className="text-neutral-darker mb-4" />
      <h3 className="text-base font-semibold text-primary mb-1">{title}</h3>
      {description && <p className="text-sm text-neutral-darker mb-6 max-w-sm">{description}</p>}
      {action && actionLabel && (
        <Button onClick={action}>{actionLabel}</Button>
      )}
    </div>
  )
}
