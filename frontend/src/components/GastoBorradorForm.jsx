import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { gastoBorradorSchema } from '../utils/schemas/gastoBorradorSchema';
import Button from './UI/Button';
import Input from './UI/Input';
import Select from './UI/Select';
import Modal from './UI/Modal';

const normalizeData = (data) => ({
  descripcion: data?.descripcion || '',
  monto_total: typeof data?.monto_total === 'number' ? data.monto_total : parseFloat(data?.monto_total) || 0,
  moneda: data?.moneda || 'ARS',
  medio_de_pago: data?.medio_de_pago || 'cash',
  cantidad_de_cuotas: typeof data?.cantidad_de_cuotas === 'number' ? data.cantidad_de_cuotas : parseInt(data?.cantidad_de_cuotas) || 1,
  valor_de_la_cuota: typeof data?.valor_de_la_cuota === 'number' ? data.valor_de_la_cuota : parseFloat(data?.valor_de_la_cuota) || 0,
  expense_date: data?.expense_date || new Date().toISOString().split('T')[0],
});

const GastoBorradorForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false
}) => {
  const defaultValues = useMemo(() => normalizeData(initialData), [initialData]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm({
    resolver: zodResolver(gastoBorradorSchema),
    defaultValues,
  });

  const montTotal = watch('monto_total') || 0;
  const cantidadCuotas = watch('cantidad_de_cuotas') || 1;
  const valorCuota = watch('valor_de_la_cuota') || 0;

  // Auto-recalculate valor_de_la_cuota when monto_total or cantidad_de_cuotas changes
  useEffect(() => {
    if (typeof montTotal === 'number' && montTotal > 0 && typeof cantidadCuotas === 'number' && cantidadCuotas > 0) {
      const calculatedValue = parseFloat((montTotal / cantidadCuotas).toFixed(2));
      setValue('valor_de_la_cuota', calculatedValue);
    }
  }, [montTotal, cantidadCuotas, setValue]);

  // Detect inconsistency - defensively handle undefined/non-numeric values
  const hasInconsistency = useMemo(() => {
    if (typeof valorCuota !== 'number' || typeof cantidadCuotas !== 'number' || typeof montTotal !== 'number') {
      return false;
    }
    if (montTotal <= 0) return false;
    const calculatedTotal = parseFloat((valorCuota * cantidadCuotas).toFixed(2));
    return calculatedTotal !== parseFloat(montTotal.toFixed(2));
  }, [valorCuota, cantidadCuotas, montTotal]);

  const calculatedTotal = useMemo(() => {
    if (typeof valorCuota !== 'number' || typeof cantidadCuotas !== 'number') {
      return 0;
    }
    return parseFloat((valorCuota * cantidadCuotas).toFixed(2));
  }, [valorCuota, cantidadCuotas]);

  useEffect(() => {
    if (isOpen) {
      reset(defaultValues);
    }
  }, [isOpen, defaultValues, reset]);

  const handleFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Editar Gasto Borrador' : 'Nuevo Gasto Borrador'}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Descripción */}
        <Controller
          name="descripcion"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <Input
                {...field}
                placeholder="Ej: Compra en supermercado"
                error={errors.descripcion?.message}
              />
            </div>
          )}
        />

        {/* Monto Total */}
        <Controller
          name="monto_total"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium mb-1">Monto Total</label>
              <Input
                {...field}
                type="number"
                step="0.01"
                placeholder="0.00"
                error={errors.monto_total?.message}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            </div>
          )}
        />

        {/* Moneda */}
        <Controller
          name="moneda"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium mb-1">Moneda</label>
              <Select
                {...field}
                options={[
                  { value: 'ARS', label: 'ARS' },
                  { value: 'USD', label: 'USD' },
                ]}
                error={errors.moneda?.message}
              />
            </div>
          )}
        />

        {/* Medio de Pago */}
        <Controller
          name="medio_de_pago"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium mb-1">Medio de Pago</label>
              <Select
                {...field}
                options={[
                  { value: 'cash', label: 'Efectivo' },
                  { value: 'credit_card', label: 'Tarjeta' },
                ]}
                error={errors.medio_de_pago?.message}
              />
            </div>
          )}
        />

        {/* Cantidad de Cuotas */}
        <Controller
          name="cantidad_de_cuotas"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium mb-1">Cantidad de Cuotas</label>
              <Input
                {...field}
                type="number"
                min="1"
                max="24"
                placeholder="1"
                error={errors.cantidad_de_cuotas?.message}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
              />
            </div>
          )}
        />

        {/* Valor de Cuota */}
        <Controller
          name="valor_de_la_cuota"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium mb-1">Valor por Cuota</label>
              <Input
                {...field}
                type="number"
                step="0.01"
                placeholder="0.00"
                error={errors.valor_de_la_cuota?.message}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
              {hasInconsistency && (
                <p className="text-sm text-yellow-600 mt-1">
                  ⚠ Suma de cuotas (${calculatedTotal.toFixed(2)}) difiere de monto total (${montTotal.toFixed(2)})
                </p>
              )}
            </div>
          )}
        />

        {/* Fecha de Gasto */}
        <Controller
          name="expense_date"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium mb-1">Fecha del Gasto</label>
              <Input
                {...field}
                type="date"
                error={errors.expense_date?.message}
              />
            </div>
          )}
        />

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {initialData ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default GastoBorradorForm;
