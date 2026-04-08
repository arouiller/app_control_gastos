-- REQ-005: Gastos en Tarjeta de Crédito con Cuotas
-- Agrega campos de cuotas a la tabla expenses para soporte de estructura padre-hijo

ALTER TABLE expenses
  ADD COLUMN total_installments INT NULL AFTER is_installment,
  ADD COLUMN installment_number INT NULL AFTER total_installments;

-- Índice para búsquedas por parent (installment_group_id ya existe como FK)
ALTER TABLE expenses
  ADD INDEX idx_is_installment (is_installment),
  ADD INDEX idx_installment_number (installment_number);

-- Actualizar vista para incluir nuevos campos
CREATE OR REPLACE VIEW expenses_with_conversions AS
SELECT
  e.id,
  e.user_id,
  e.category_id,
  e.description,
  e.amount AS original_amount,
  e.currency AS original_currency,
  e.date AS expense_date,
  e.payment_method,
  e.is_installment,
  e.total_installments,
  e.installment_number,
  e.installment_group_id,
  e.notes,
  -- Amount in ARS
  CASE
    WHEN e.currency = 'ARS' THEN e.amount
    WHEN e.currency = 'USD' AND er.ars_to_usd IS NOT NULL THEN CEIL(e.amount * er.ars_to_usd * 100) / 100
    ELSE NULL
  END AS amount_in_ars,
  -- Amount in USD
  CASE
    WHEN e.currency = 'USD' THEN e.amount
    WHEN e.currency = 'ARS' AND er.ars_to_usd IS NOT NULL THEN CEIL(e.amount / er.ars_to_usd * 100) / 100
    ELSE NULL
  END AS amount_in_usd,
  -- Exchange rate used and its date
  er.ars_to_usd AS exchange_rate_used,
  er.rate_date AS exchange_rate_date,
  e.created_at,
  e.updated_at
FROM expenses e
LEFT JOIN (
  SELECT
    e2.id,
    COALESCE(
      (SELECT ars_to_usd FROM exchange_rates
       WHERE rate_date = e2.date LIMIT 1),
      (SELECT ars_to_usd FROM exchange_rates
       WHERE rate_date > e2.date
       ORDER BY rate_date ASC LIMIT 1),
      (SELECT ars_to_usd FROM exchange_rates
       WHERE rate_date < e2.date
       ORDER BY rate_date DESC LIMIT 1)
    ) AS ars_to_usd,
    COALESCE(
      (SELECT rate_date FROM exchange_rates
       WHERE rate_date = e2.date LIMIT 1),
      (SELECT rate_date FROM exchange_rates
       WHERE rate_date > e2.date
       ORDER BY rate_date ASC LIMIT 1),
      (SELECT rate_date FROM exchange_rates
       WHERE rate_date < e2.date
       ORDER BY rate_date DESC LIMIT 1)
    ) AS rate_date
  FROM expenses e2
) er ON e.id = er.id;
