CREATE OR REPLACE VIEW v_cash_vs_card AS
SELECT
    u.id                                         AS user_id,
    YEAR(e.date)                                 AS year,
    MONTH(e.date)                                AS month,
    COALESCE(SUM(CASE WHEN e.payment_method = 'cash'        THEN e.amount ELSE 0 END), 0) AS cash_total,
    COALESCE(SUM(CASE WHEN e.payment_method = 'credit_card' THEN e.amount ELSE 0 END), 0) AS card_total,
    COALESCE(SUM(e.amount), 0)                   AS grand_total,
    ROUND(
        COALESCE(SUM(CASE WHEN e.payment_method = 'cash' THEN e.amount ELSE 0 END), 0)
        / NULLIF(SUM(e.amount), 0) * 100
    , 2)                                         AS cash_percentage,
    ROUND(
        COALESCE(SUM(CASE WHEN e.payment_method = 'credit_card' THEN e.amount ELSE 0 END), 0)
        / NULLIF(SUM(e.amount), 0) * 100
    , 2)                                         AS card_percentage
FROM users u
LEFT JOIN expenses e ON u.id = e.user_id
GROUP BY u.id, YEAR(e.date), MONTH(e.date)
