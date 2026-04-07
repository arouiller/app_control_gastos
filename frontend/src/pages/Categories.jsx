import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi'
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../store/categoriesSlice'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import Input from '../components/UI/Input'
import Modal from '../components/UI/Modal'
import { PageLoader } from '../components/UI/LoadingSpinner'
import EmptyState from '../components/UI/EmptyState'
import { CATEGORY_COLORS } from '../utils/constants'

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido'),
  description: z.string().optional(),
})

export default function Categories() {
  const dispatch = useDispatch()
  const { items: categories, loading } = useSelector((state) => state.categories)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { color: '#3B82F6' },
  })

  useEffect(() => { dispatch(fetchCategories()) }, [dispatch])

  const openCreate = () => {
    setEditingCategory(null)
    reset({ color: '#3B82F6', name: '', description: '' })
    setModalOpen(true)
  }

  const openEdit = (cat) => {
    setEditingCategory(cat)
    reset({ name: cat.name, color: cat.color, description: cat.description || '' })
    setModalOpen(true)
  }

  const onSubmit = async (data) => {
    try {
      if (editingCategory) {
        await dispatch(updateCategory({ id: editingCategory.id, data })).unwrap()
        toast.success('Categoría actualizada')
      } else {
        await dispatch(createCategory(data)).unwrap()
        toast.success('Categoría creada')
      }
      setModalOpen(false)
    } catch (err) {
      toast.error(err || 'Error al guardar categoría')
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await dispatch(deleteCategory(deleteId)).unwrap()
      toast.success('Categoría eliminada')
      setDeleteId(null)
    } catch (err) {
      toast.error(err || 'No se puede eliminar: tiene gastos asociados')
    } finally {
      setDeleting(false)
    }
  }

  if (loading && categories.length === 0) return <PageLoader />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Categorías</h1>
        <Button size="sm" onClick={openCreate}>
          <FiPlus size={16} />
          Nueva Categoría
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          title="Sin categorías"
          description="Crea tu primera categoría para organizar tus gastos"
          action={openCreate}
          actionLabel="Crear Categoría"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Card key={cat.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary truncate">{cat.name}</p>
                  {cat.description && (
                    <p className="text-xs text-neutral-darker truncate">{cat.description}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => openEdit(cat)}
                  className="p-1.5 text-neutral-darker hover:text-secondary rounded transition-colors"
                  title="Editar"
                >
                  <FiEdit2 size={15} />
                </button>
                <button
                  onClick={() => setDeleteId(cat.id)}
                  className="p-1.5 text-neutral-darker hover:text-danger rounded transition-colors"
                  title="Eliminar"
                >
                  <FiTrash2 size={15} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Input
            label="Nombre"
            placeholder="Ej: Alimentación"
            required
            error={errors.name?.message}
            {...register('name')}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-primary">Color</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue('color', c)}
                  className="w-8 h-8 rounded-full border-2 border-transparent hover:border-primary transition-colors"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            <input
              type="color"
              {...register('color')}
              className="h-10 w-full rounded-md border border-neutral cursor-pointer"
            />
            {errors.color && <p className="text-xs text-danger">{errors.color.message}</p>}
          </div>
          <Input
            label="Descripción"
            placeholder="Descripción opcional"
            error={errors.description?.message}
            {...register('description')}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting} fullWidth>
              {editingCategory ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Eliminar Categoría">
        <p className="text-sm text-primary mb-6">
          ¿Seguro que quieres eliminar esta categoría? Solo se puede eliminar si no tiene gastos asociados.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  )
}
