import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { logoutUser, updateUser } from '../store/authSlice'
import { analyticsService } from '../services/analyticsService'
import Card, { CardTitle } from '../components/UI/Card'
import Input from '../components/UI/Input'
import Button from '../components/UI/Button'

const profileSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export default function Profile() {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const [updatingProfile, setUpdatingProfile] = useState(false)
  const [updatingPassword, setUpdatingPassword] = useState(false)

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '' },
  })

  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) })

  const onUpdateProfile = async (data) => {
    setUpdatingProfile(true)
    try {
      const res = await analyticsService.updateProfile(data)
      dispatch(updateUser(res.data))
      toast.success('Perfil actualizado')
    } catch {
      toast.error('Error al actualizar perfil')
    } finally {
      setUpdatingProfile(false)
    }
  }

  const onChangePassword = async (data) => {
    setUpdatingPassword(true)
    try {
      await analyticsService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      toast.success('Contraseña actualizada')
      passwordForm.reset()
    } catch {
      toast.error('Error al cambiar contraseña')
    } finally {
      setUpdatingPassword(false)
    }
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-primary">Perfil</h1>

      {/* Avatar */}
      <Card className="flex items-center gap-4">
        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center text-white text-xl font-semibold flex-shrink-0">
          {initials}
        </div>
        <div>
          <p className="font-semibold text-primary">{user?.name}</p>
          <p className="text-sm text-neutral-darker">{user?.email}</p>
        </div>
      </Card>

      {/* Update profile */}
      <Card>
        <CardTitle className="mb-4">Información Personal</CardTitle>
        <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} noValidate className="space-y-4">
          <Input
            label="Nombre"
            required
            error={profileForm.formState.errors.name?.message}
            {...profileForm.register('name')}
          />
          <Input
            label="Email"
            type="email"
            value={user?.email || ''}
            disabled
            hint="El email no se puede cambiar"
          />
          <Button type="submit" loading={updatingProfile}>
            Guardar Cambios
          </Button>
        </form>
      </Card>

      {/* Change password */}
      <Card>
        <CardTitle className="mb-4">Cambiar Contraseña</CardTitle>
        <form onSubmit={passwordForm.handleSubmit(onChangePassword)} noValidate className="space-y-4">
          <Input
            label="Contraseña Actual"
            type="password"
            required
            error={passwordForm.formState.errors.currentPassword?.message}
            {...passwordForm.register('currentPassword')}
          />
          <Input
            label="Nueva Contraseña"
            type="password"
            required
            error={passwordForm.formState.errors.newPassword?.message}
            {...passwordForm.register('newPassword')}
          />
          <Input
            label="Confirmar Nueva Contraseña"
            type="password"
            required
            error={passwordForm.formState.errors.confirmPassword?.message}
            {...passwordForm.register('confirmPassword')}
          />
          <Button type="submit" loading={updatingPassword}>
            Actualizar Contraseña
          </Button>
        </form>
      </Card>

      {/* Logout */}
      <Card>
        <CardTitle className="mb-4">Sesión</CardTitle>
        <Button variant="danger" onClick={() => dispatch(logoutUser())}>
          Cerrar Sesión
        </Button>
      </Card>
    </div>
  )
}
