CREATE INDEX IF NOT EXISTS idx_expenses_user_date_category
    ON expenses(user_id, date, category_id)
