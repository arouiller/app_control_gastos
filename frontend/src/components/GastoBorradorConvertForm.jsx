import { useEffect, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '../store/categoriesSlice';
import Input from './UI/Input';
import Select from './UI/Select';
import Button from './UI/Button';
import Modal from './UI/Modal';
import { today } from '../utils/formatters';
import { PAYMENT_METHODS } from '../utils/constants';

const schema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida'),
  monto_total: z.string().refine((v) => !isNaN(v) && parseFloat(v) > 0, 'El monto debe ser mayor a 0'),
  moneda: z.enum(['ARS', 'USD']),
  expense_date: z.string().min(1, 'La fecha es requerida'),
  category_id: z.string().min(1, 'La categoría es requerida'),
  medio_de_pago: z.enum(['cash', 'credit_card']),
  notas: z.string().optional(),
  es_cuotas: z.boolean().optional(),
  modo_cuotas: z.enum(['total', 'por_cuota']).optional(),
  cantidad_cuotas: z.string().optional(),
});

const GastoBorradorConvertForm = ({
  isOpen,
  onClose,
  onSubmit,
  borrador,
  categories = [],
  isLoading = false
}) => {
  const dispatch = useDispatch();
  const { items: categoriesFromRedux } = useSelector((state) => state.categories || { items: [] });
  const dateManuallyChanged = useRef(false);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      descripcion: '',
      monto_total: '0.00',
      moneda: 'ARS',
      expense_date: today(),
      category_id: '',
      medio_de_pago: 'cash',
      notas: '',
      es_cuotas: false,
      modo_cuotas: 'total',
      cantidad_cuotas: '',
    },
  });

  const paymentMethod = watch('medio_de_pago');
  const esInstallment = watch('es_cuotas');
  const modoInstallment = watch('modo_cuotas');
  const amountValue = watch('monto_total');
  const numberOfInstallments = watch('cantidad_cuotas');
  const currencyValue = watch('moneda');

  // Cargar categorías
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Reset del formulario cuando cambia borrador o isOpen
  useEffect(() => {
    if (isOpen && borrador) {
      reset({
        descripcion: borrador.descripcion || '',
        monto_total: borrador.monto_total ? String(borrador.monto_total) : '0.00',
        moneda: borrador.moneda || 'ARS',
        expense_date: borrador.expense_date || today(),
        category_id: '',
        medio_de_pago: borrador.medio_de_pago || 'cash',
        notas: '',
        es_cuotas: (borrador.cantidad_de_cuotas && borrador.cantidad_de_cuotas > 1) || false,
        modo_cuotas: 'total',
        cantidad_cuotas: (borrador.cantidad_de_cuotas && borrador.cantidad_de_cuotas > 1) ? String(borrador.cantidad_de_cuotas) : '',
      });
      dateManuallyChanged.current = false;
    }
  }, [isOpen, borrador, reset]);

  const firstBusinessDayOfNextMonth = () => {
    const d = new Date();
    const first = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const day = first.getDay();
    if (day === 0) first.setDate(2);
    else if (day === 6) first.setDate(3);
    return `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, '0')}-${String(first.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (paymentMethod === 'credit_card' && !dateManuallyChanged.current) {
      setValue('expense_date', firstBusinessDayOfNextMonth());
    }
  }, [paymentMethod, setValue]);

  const installmentPreview = useMemo(() => {
    if (!esInstallment || !numberOfInstallments || !amountValue) return null;
    const n = parseInt(numberOfInstallments);
    const val = parseFloat(amountValue);
    if (!n || n < 2 || n > 36 || isNaN(val) || val <= 0) return null;
    const perInstallment = modoInstallment === 'por_cuota' ? val : val / n;
    const total = modoInstallment === 'por_cuota' ? val * n : val;
    const fmt = (v) => v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${n} cuotas de ${fmt(perInstallment)} ${currencyValue} (total: ${fmt(total)} ${currencyValue})`;
  }, [esInstallment, numberOfInstallments, amountValue, modoInstallment, currencyValue]);

  const categoryOptions = (categoriesFromRedux && categoriesFromRedux.length > 0)
    ? categoriesFromRedux.map((c) => ({ value: String(c.id), label: c.name }))
    : [];

  const handleFormSubmit = (data) => {
    const payload = {
      descripcion: data.descripcion,
      monto_total: parseFloat(data.monto_total),
      moneda: data.moneda,
      expense_date: data.expense_date,
      category_id: parseInt(data.category_id),
      medio_de_pago: data.medio_de_pago,
      notas: data.notas,
      cantidad_de_cuotas: data.es_cuotas ? parseInt(data.cantidad_cuotas) : 1,
    };

    if (data.es_cuotas && data.cantidad_cuotas) {
      const n = parseInt(data.cantidad_cuotas);
      const totalAmount = data.modo_cuotas === 'por_cuota'
        ? parseFloat((payload.monto_total * n).toFixed(2))
        : payload.monto_total;
      payload.monto_total = totalAmount;
    }

    onSubmit(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Convertir Gasto Borrador a Definitivo">
      <div className="bg-white rounded-lg p-6 max-h-96 overflow-y-auto">
        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="space-y-4">
          <Input
            label="Descripción"
            placeholder="Ej: Pizza para la oficina"
            required
            error={errors.descripcion?.message}
            {...register('descripcion')}
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
                error={errors.monto_total?.message}
                className="font-mono"
                {...register('monto_total')}
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
                error={errors.moneda?.message}
                {...register('moneda')}
              />
            </div>
          </div>

          <Select
            label="Categoría"
            options={categoryOptions}
            placeholder="Seleccionar categoría"
            required
            error={errors.category_id?.message}
            {...register('category_id')}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-primary">
              Método de Pago <span className="text-danger">*</span>
            </label>
            <div className="flex gap-4">
              {PAYMENT_METHODS.map((m) => (
                <label key={m.value} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={m.value} {...register('medio_de_pago')} className="text-secondary" />
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
                        checked={esInstallment === v}
                        onChange={() => setValue('es_cuotas', v)}
                        className="text-secondary"
                      />
                      <span className="text-sm">{l}</span>
                    </label>
                  ))}
                </div>
              </div>

              {esInstallment && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-primary">El monto ingresado es</label>
                    <div className="flex gap-4">
                      {[{ v: 'total', l: 'Monto total' }, { v: 'por_cuota', l: 'Monto por cuota' }].map(({ v, l }) => (
                        <label key={v} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={modoInstallment === v}
                            onChange={() => setValue('modo_cuotas', v)}
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
                    error={errors.cantidad_cuotas?.message}
                    {...register('cantidad_cuotas')}
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
            label="Fecha"
            type="date"
            required
            error={errors.expense_date?.message}
            {...register('expense_date', {
              onChange: () => { dateManuallyChanged.current = true },
            })}
          />

          <Input
            label="Notas"
            placeholder="Observaciones opcionales"
            error={errors.notas?.message}
            {...register('notas')}
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isLoading} fullWidth>
              Convertir a Gasto Definitivo
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default GastoBorradorConvertForm;
