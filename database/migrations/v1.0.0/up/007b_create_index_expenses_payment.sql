CREATE INDEX idx_expenses_user_payment_method
    ON expenses(user_id, payment_method);
