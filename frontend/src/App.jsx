import { useSelector } from 'react-redux'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import ExpenseForm from './pages/ExpenseForm'
import Installments from './pages/Installments'
import Reports from './pages/Reports'
import ReportMonthlyGrouping from './pages/reports/ReportMonthlyGrouping'
import Categories from './pages/Categories'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import ExchangeRates from './pages/ExchangeRates'

function PrivateRoute({ children }) {
  const { user } = useSelector((state) => state.auth)
  return user ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user } = useSelector((state) => state.auth)
  if (!user) return <Navigate to="/login" replace />
  if (!user.is_admin) return <Navigate to="/dashboard" replace />
  return children
}

function PublicRoute({ children }) {
  const { user } = useSelector((state) => state.auth)
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Protected routes */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="expenses/new" element={<ExpenseForm />} />
        <Route path="expenses/:id/edit" element={<ExpenseForm />} />
        <Route path="installments" element={<Installments />} />
        <Route path="reports" element={<Reports />} />
        <Route path="reports/monthly-grouping" element={<ReportMonthlyGrouping />} />
        <Route path="categories" element={<Categories />} />
        <Route path="profile" element={<Profile />} />
        <Route path="admin" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="exchange-rates" element={<AdminRoute><ExchangeRates /></AdminRoute>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
