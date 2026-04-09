import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { createExpense, createInstallmentExpense, updateExpense } from '../store/expensesSlice'
import { fetchCategories } from '../store/categoriesSlice'
import { expenseService } from '../services/expenseService'
import Input from '../components/UI/Input'
import Select from '../components/UI/Select'
import Button from '../components/UI/Button'
import { PageLoader } from '../components/UI/LoadingSpinner'
import { today } from '../utils/formatters'
import { PAYMENT_METHODS } from '../utils/constants'

const baseSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida'),
  amount: z.string().refine((v) => !isNaN(v) && parseFloat(v) > 0, 'El monto debe ser mayor a 0'),
  currency: z.enum(['ARS', 'USD']),
  date: z.string().min(1, 'La fecha es requerida'),
  categoryId: z.string().min(1, 'La categoría es requerida'),
  paymentMethod: z.enum(['cash', 'credit_card']),
  notes: z.string().optional(),
  isInstallment: z.boolean().optional(),
  installmentMode: z.enum(['total', 'perInstallment']).optional(),
  numberOfInstallments: z.string().optional(),
})

export default function ExpenseForm() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const returnTo = location.state?.from || '/expenses'
  const isEditing = Boolean(id)

  const { items: categories } = useSelector((state) => state.categories)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEditing)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      date: today(),
      paymentMethod: 'cash',
      isInstallment: false,
      installmentMode: 'total',
      currency: 'ARS',
    },
  })

  const paymentMethod = watch('paymentMethod')
  const isInstallment = watch('isInstallment')
  const installmentMode = watch('installmentMode')
  const amountValue = watch('amount')
  const numberOfInstallments = watch('numberOfInstallments')
  const currencyValue = watch('currency')

  const installmentPreview = (() => {
    if (!isInstallment || !numberOfInstallments || !amountValue) return null
    const n = parseInt(numberOfInstallments)
    const val = parseFloat(amountValue)
    if (!n || n < 2 || n > 36 || isNaN(val) || val <= 0) return null
    const perInstallment = installmentMode === 'perInstallment' ? val : val / n
    const total = installmentMode === 'perInstallment' ? val * n : val
    const fmt = (v) => v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return `${n} cuotas de ${fmt(perInstallment)} ${currencyValue} (total: ${fmt(total)} ${currencyValue})`
  })()

  useEffect(() => {
    dispatch(fetchCategories())
  }, [dispatch])

  useEffect(() => {
    if (!isEditing) return
    const loadExpense = async () => {
      try {
        const res = await expenseService.getById(id)
        const e = res.data

        // RF-510: child installments are not directly editable
        if (e.installment_group_id) {
          toast.error('No se puede editar una cuota individualmente. Editá el gasto padre.')
          navigate('/expenses')
          return
        }

        setValue('description', e.description)
        setValue('amount', String(e.original_amount))
        setValue('currency', e.original_currency || 'ARS')
        setValue('date', e.date)
        setValue('categoryId', String(e.category_id))
        setValue('paymentMethod', e.payment_method)
        setValue('notes', e.notes || '')

        // RF-509: populate installment fields for parent installment expenses
        if (e.is_installment) {
          setValue('isInstallment', true)
          setValue('numberOfInstallments', String(e.total_installments))
          setValue('installmentMode', 'total')
        }
      } catch {
        toast.error('No se pudo cargar el gasto')
        navigate('/expenses')
      } finally {
        setInitialLoading(false)
      }
    }
    loadExpense()
  }, [id, isEditing, navigate, setValue])

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const payload = {
        description: data.description,
        amount: parseFloat(data.amount),
        currency: data.currency,
        date: data.date,
        categoryId: parseInt(data.categoryId),
        paymentMethod: data.paymentMethod,
        notes: data.notes,
      }

      if (isEditing) {
        const updatePayload = { ...payload, isInstallment }
        if (isInstallment && data.numberOfInstallments) {
          const n = parseInt(data.numberOfInstallments)
          const totalAmount = data.installmentMode === 'perInstallment'
            ? parseFloat((payload.amount * n).toFixed(2))
            : payload.amount
          updatePayload.amount = totalAmount
          updatePayload.numberOfInstallments = n
        }
        await dispatch(updateExpense({ id, data: updatePayload })).unwrap()
        toast.success('Gasto actualizado')
      } else if (data.isInstallment && data.numberOfInstallments) {
        const n = parseInt(data.numberOfInstallments)
        // If user entered per-installment amount, compute total before sending
        const totalAmount = data.installmentMode === 'perInstallment'
          ? parseFloat((payload.amount * n).toFixed(2))
          : payload.amount
        await dispatch(createInstallmentExpense({
          ...payload,
          amount: totalAmount,
          numberOfInstallments: n,
        })).unwrap()
        toast.success('Gasto en cuotas registrado')
      } else {
        await dispatch(createExpense(payload)).unwrap()
        toast.success('Gasto registrado')
      }
      navigate(returnTo)
    } catch (err) {
      toast.error(err || 'Error al guardar gasto')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) return <PageLoader />

  const categoryOptions = categories.map((c) => ({ value: String(c.id), label: c.name }))

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-primary mb-6">
        {isEditing ? 'Editar Gasto' : 'Nuevo Gasto'}
      </h1>

      <div className="bg-white rounded-lg border border-neutral shadow-card p-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Input
            label="Descripción"
            placeholder="Ej: Pizza para la oficina"
            required
            error={errors.description?.message}
            {...register('description')}
          />

          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                label="Monto"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                required
                error={errors.amount?.message}
                className="font-mono"
                {...register('amount')}
              />
            </div>
            <div className="flex-none w-32">
              <Select
                label="Moneda"
                options={[
                  { value: 'ARS', label: 'Pesos (ARS)' },
                  { value: 'USD', label: 'Dólares (USD)' },
                ]}
                required
                error={errors.currency?.message}
                {...register('currency')}
              />
            </div>
          </div>

          <Select
            label="Categoría"
            options={categoryOptions}
            placeholder="Seleccionar categoría"
            required
            error={errors.categoryId?.message}
            {...register('categoryId')}
          />

          <Input
            label="Fecha"
            type="date"
            required
            error={errors.date?.message}
            {...register('date')}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-primary">
              Método de Pago <span className="text-danger">*</span>
            </label>
            <div className="flex gap-4">
              {PAYMENT_METHODS.map((m) => (
                <label key={m.value} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={m.value} {...register('paymentMethod')} className="text-secondary" />
                  <span className="text-sm">{m.label}</span>
                </label>
              ))}
            </div>
          </div>

          {paymentMethod === 'credit_card' && (
            <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-neutral">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-primary">¿En cuotas?</label>
                <div className="flex gap-4">
                  {[{ v: false, l: 'No' }, { v: true, l: 'Sí' }].map(({ v, l }) => (
                    <label key={String(v)} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={isInstallment === v}
                        onChange={() => setValue('isInstallment', v)}
                        className="text-secondary"
                      />
                      <span className="text-sm">{l}</span>
                    </label>
                  ))}
                </div>
              </div>

              {isInstallment && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-primary">El monto ingresado es</label>
                    <div className="flex gap-4">
                      {[{ v: 'total', l: 'Monto total' }, { v: 'perInstallment', l: 'Monto por cuota' }].map(({ v, l }) => (
                        <label key={v} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={installmentMode === v}
                            onChange={() => setValue('installmentMode', v)}
                            className="text-secondary"
                          />
                          <span className="text-sm">{l}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Input
                    label="Número de cuotas"
                    type="number"
                    min="2"
                    max="36"
                    placeholder="Ej: 12"
                    error={errors.numberOfInstallments?.message}
                    {...register('numberOfInstallments')}
                  />

                  {installmentPreview && (
                    <div className="text-sm font-medium text-secondary bg-secondary/10 px-3 py-2 rounded">
                      Resumen: {installmentPreview}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <Input
            label="Notas"
            placeholder="Observaciones opcionales"
            error={errors.notes?.message}
            {...register('notes')}
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => navigate(returnTo)}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading} fullWidth>
              {isEditing ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
