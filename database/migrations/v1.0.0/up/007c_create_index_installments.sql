CREATE INDEX idx_installments_expense_paid_date
    ON installments(expense_id, is_paid, due_date);
