CREATE INDEX IF NOT EXISTS idx_installments_expense_paid_date
    ON installments(expense_id, is_paid, due_date)
