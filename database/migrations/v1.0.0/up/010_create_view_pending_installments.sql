CREATE OR REPLACE VIEW v_pending_installments AS
SELECT
    u.id                  AS user_id,
    i.id                  AS installment_id,
    e.id                  AS expense_id,
    c.name                AS category_name,
    e.description,
    i.amount,
    i.due_date,
    i.installment_number,
    i.total_installments
FROM users u
JOIN expenses     e ON u.id = e.user_id
JOIN installments i ON e.id = i.expense_id
JOIN categories   c ON e.category_id = c.id
WHERE i.is_paid = FALSE
