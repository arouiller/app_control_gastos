CREATE OR REPLACE VIEW v_monthly_summary AS
SELECT
    u.id                                        AS user_id,
    YEAR(e.date)                                AS year,
    MONTH(e.date)                               AS month,
    DATE_FORMAT(e.date, '%Y-%m-01')             AS month_start,
    COUNT(e.id)                                 AS total_transactions,
    COALESCE(SUM(e.amount), 0)                  AS total_amount,
    COALESCE(SUM(CASE WHEN e.payment_method = 'cash'        THEN e.amount ELSE 0 END), 0) AS total_cash,
    COALESCE(SUM(CASE WHEN e.payment_method = 'credit_card' THEN e.amount ELSE 0 END), 0) AS total_credit
FROM users u
LEFT JOIN expenses e ON u.id = e.user_id
GROUP BY u.id, YEAR(e.date), MONTH(e.date), DATE_FORMAT(e.date, '%Y-%m-01')
