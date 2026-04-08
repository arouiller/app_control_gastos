import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { FiDollarSign } from 'react-icons/fi'
import { GoogleLogin } from '@react-oauth/google'
import { loginUser, googleAuthUser, clearError } from '../store/authSlice'
import Input from '../components/UI/Input'
import Button from '../components/UI/Button'
import Alert from '../components/UI/Alert'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error, user } = useSelector((state) => state.auth)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (user) navigate('/dashboard')
    return () => dispatch(clearError())
  }, [user, navigate, dispatch])

  const onSubmit = (data) => dispatch(loginUser(data))
  const onGoogleSuccess = ({ credential }) => dispatch(googleAuthUser(credential))

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center mb-4">
            <FiDollarSign size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-primary">Control de Gastos</h1>
          <p className="text-sm text-neutral-darker mt-1">Inicia sesión en tu cuenta</p>
        </div>

        <div className="bg-white rounded-lg border border-neutral shadow-card p-6">
          {error && <Alert type="error" className="mb-4">{error}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              required
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              required
              error={errors.password?.message}
              {...register('password')}
            />

            <Button type="submit" fullWidth loading={loading} className="mt-2">
              Iniciar Sesión
            </Button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 border-t border-neutral" />
            <span className="text-xs text-neutral-darker">o</span>
            <div className="flex-1 border-t border-neutral" />
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={onGoogleSuccess}
              onError={() => dispatch({ type: 'auth/google/rejected', payload: 'Error al autenticar con Google' })}
              text="signin_with"
              locale="es"
            />
          </div>

          <p className="text-center text-sm text-neutral-darker mt-4">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-secondary hover:underline font-medium">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
