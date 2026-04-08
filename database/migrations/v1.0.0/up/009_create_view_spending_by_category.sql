CREATE OR REPLACE VIEW v_spending_by_category AS
SELECT
    u.id                       AS user_id,
    c.id                       AS category_id,
    c.name                     AS category_name,
    c.color                    AS category_color,
    COUNT(e.id)                AS transaction_count,
    COALESCE(SUM(e.amount), 0) AS total_amount,
    COALESCE(AVG(e.amount), 0) AS average_amount
FROM users u
LEFT JOIN categories c ON u.id = c.user_id
LEFT JOIN expenses e   ON c.id = e.category_id
GROUP BY u.id, c.id, c.name, c.color
