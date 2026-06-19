import { z } from 'zod';

export const gastoBorradorSchema = z.object({
  descripcion: z.string()
    .min(1, 'Descripción es requerida')
    .max(255, 'Descripción no puede exceder 255 caracteres'),
  monto_total: z.number()
    .positive('Monto debe ser mayor a 0')
    .multipleOf(0.01, 'Máximo 2 decimales'),
  moneda: z.enum(['ARS', 'USD'], {
    errorMap: () => ({ message: 'Selecciona ARS o USD' }),
  }),
  medio_de_pago: z.enum(['cash', 'credit_card'], {
    errorMap: () => ({ message: 'Selecciona efectivo o tarjeta' }),
  }),
  cantidad_de_cuotas: z.number()
    .int('Debe ser un número entero')
    .min(1, 'Mínimo 1 cuota')
    .max(24, 'Máximo 24 cuotas'),
  valor_de_la_cuota: z.number()
    .positive('Valor debe ser mayor a 0')
    .multipleOf(0.01, 'Máximo 2 decimales'),
  expense_date: z.string()
    .refine(date => new Date(date) <= new Date(), 'Fecha no puede ser futura'),
});
