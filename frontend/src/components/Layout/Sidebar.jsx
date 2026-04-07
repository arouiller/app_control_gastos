import { NavLink } from 'react-router-dom'
import {
  FiHome, FiDollarSign, FiCreditCard, FiBarChart2,
  FiTag, FiUser, FiX,
} from 'react-icons/fi'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', Icon: FiHome },
  { to: '/expenses', label: 'Gastos', Icon: FiDollarSign },
  { to: '/installments', label: 'Cuotas', Icon: FiCreditCard },
  { to: '/reports', label: 'Reportes', Icon: FiBarChart2 },
  { to: '/categories', label: 'Categorías', Icon: FiTag },
  { to: '/profile', label: 'Perfil', Icon: FiUser },
]

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-60 bg-white border-r border-neutral z-30
        transform transition-transform duration-300 ease-in-out
        lg:static lg:translate-x-0 lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Mobile close */}
        <div className="flex items-center justify-between p-4 lg:hidden border-b border-neutral">
          <span className="font-semibold text-primary">Menú</span>
          <button onClick={onClose} aria-label="Cerrar menú">
            <FiX size={20} />
          </button>
        </div>

        {/* Logo - Desktop */}
        <div className="hidden lg:flex items-center gap-2 p-6 border-b border-neutral">
          <div className="w-8 h-8 bg-secondary rounded-md flex items-center justify-center">
            <FiDollarSign size={16} className="text-white" />
          </div>
          <span className="font-semibold text-primary text-sm">Control de Gastos</span>
        </div>

        {/* Navigation */}
        <nav className="p-3 mt-2 lg:mt-0">
          <ul className="space-y-1">
            {navItems.map(({ to, label, Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium
                    transition-colors duration-200
                    ${isActive
                      ? 'bg-secondary-light text-secondary'
                      : 'text-primary hover:bg-neutral hover:text-primary'
                    }
                  `}
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  )
}
