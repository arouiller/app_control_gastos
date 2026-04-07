import { useDispatch, useSelector } from 'react-redux'
import { FiMenu, FiDollarSign, FiLogOut } from 'react-icons/fi'
import { logoutUser } from '../../store/authSlice'

export default function Navbar({ onMenuClick }) {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)

  const handleLogout = () => dispatch(logoutUser())

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  return (
    <header className="h-14 bg-white border-b border-neutral flex items-center px-4 gap-4 z-10">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-md hover:bg-neutral transition-colors"
        aria-label="Abrir menú"
      >
        <FiMenu size={20} />
      </button>

      {/* Logo - Mobile */}
      <div className="flex items-center gap-2 lg:hidden">
        <div className="w-7 h-7 bg-secondary rounded-md flex items-center justify-center">
          <FiDollarSign size={14} className="text-white" />
        </div>
        <span className="font-semibold text-primary text-sm">Control de Gastos</span>
      </div>

      <div className="flex-1" />

      {/* User info */}
      <div className="flex items-center gap-3">
        <span className="hidden sm:block text-sm text-primary">{user?.name}</span>
        <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white text-xs font-semibold">
          {initials}
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-md text-neutral-darker hover:text-primary hover:bg-neutral transition-colors"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <FiLogOut size={18} />
        </button>
      </div>
    </header>
  )
}
