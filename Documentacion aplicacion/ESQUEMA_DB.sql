-- ============================================================================
-- ESQUEMA DE BASE DE DATOS - APLICACIÓN DE CONTROL DE GASTOS
-- MySQL 8.0+
-- ============================================================================

-- Tabla de Usuarios
-- ============================================================================
CREATE TABLE users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(255)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    name          VARCHAR(100)  NOT NULL,
    profile_picture_url VARCHAR(500),
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_email      (email),
    INDEX idx_created_at (created_at)
);

-- Tabla de Categorías de Gastos
-- ============================================================================
CREATE TABLE categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT          NOT NULL,
    name        VARCHAR(100) NOT NULL,
    color       VARCHAR(7)   NOT NULL DEFAULT '#3B82F6',  -- Hex #RRGGBB
    icon        VARCHAR(50),
    description VARCHAR(255),
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE  KEY uq_user_category (user_id, name),
    INDEX       idx_user_id     (user_id)
);

-- Tabla de Gastos
-- ============================================================================
CREATE TABLE expenses (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    user_id              INT            NOT NULL,
    category_id          INT            NOT NULL,
    description          VARCHAR(255)   NOT NULL,
    amount               DECIMAL(10,2)  NOT NULL,
    date                 DATE           NOT NULL,
    payment_method       ENUM('cash','credit_card') NOT NULL,
    is_installment       BOOLEAN        NOT NULL DEFAULT FALSE,
    installment_group_id INT,                       -- FK a expenses.id (gasto padre de cuotas)
    notes                TEXT,
    created_at           TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_expense_amount CHECK (amount > 0),

    FOREIGN KEY (user_id)              REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (category_id)          REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (installment_group_id) REFERENCES expenses(id) ON DELETE CASCADE,

    INDEX idx_user_id       (user_id),
    INDEX idx_category_id   (category_id),
    INDEX idx_date          (date),
    INDEX idx_payment_method(payment_method),
    INDEX idx_user_date     (user_id, date)
);

-- Tabla de Cuotas
-- ============================================================================
CREATE TABLE installments (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    expense_id          INT           NOT NULL,
    installment_number  INT           NOT NULL,
    total_installments  INT           NOT NULL,
    amount              DECIMAL(10,2) NOT NULL,
    due_date            DATE          NOT NULL,
    is_paid             BOOLEAN       NOT NULL DEFAULT FALSE,
    paid_date           DATETIME,
    payment_notes       VARCHAR(255),
    created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_installment_amount CHECK (amount > 0),
    CONSTRAINT chk_installment_number CHECK (installment_number >= 1),
    CONSTRAINT chk_total_installments  CHECK (total_installments >= 1),

    FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
    UNIQUE  KEY uq_installment       (expense_id, installment_number),
    INDEX       idx_expense_id       (expense_id),
    INDEX       idx_due_date         (due_date),
    INDEX       idx_is_paid          (is_paid)
);

-- Tabla de Sesiones (refresh tokens)
-- ============================================================================
CREATE TABLE sessions (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT          NOT NULL,
    refresh_token VARCHAR(500) NOT NULL UNIQUE,
    expires_at    DATETIME     NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id   (user_id),
    INDEX idx_expires_at(expires_at)
);

-- Tabla de Auditoría (opcional)
-- ============================================================================
CREATE TABLE audit_logs (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT         NOT NULL,
    entity_type VARCHAR(50) NOT NULL,  -- 'expense' | 'category' | 'installment'
    entity_id   INT         NOT NULL,
    action      VARCHAR(50) NOT NULL,  -- 'CREATE' | 'UPDATE' | 'DELETE'
    old_values  JSON,
    new_values  JSON,
    created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id   (user_id),
    INDEX idx_created_at(created_at)
);

-- ============================================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- ============================================================================

CREATE INDEX idx_expenses_user_date_category
    ON expenses(user_id, date, category_id);

CREATE INDEX idx_expenses_user_payment_method
    ON expenses(user_id, payment_method);

CREATE INDEX idx_installments_expense_paid_date
    ON installments(expense_id, is_paid, due_date);

-- ============================================================================
-- VISTAS PARA REPORTES
-- ============================================================================

-- Vista: Resumen de Gastos por Mes
-- FIX: coma faltante, typo month_star→month_start,
--      DATE_FORMAT añadido al GROUP BY (requerido por ONLY_FULL_GROUP_BY)
CREATE VIEW v_monthly_summary AS
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
GROUP BY u.id, YEAR(e.date), MONTH(e.date), DATE_FORMAT(e.date, '%Y-%m-01');

-- Vista: Consumo por Categoría
CREATE VIEW v_spending_by_category AS
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
GROUP BY u.id, c.id, c.name, c.color;

-- Vista: Cuotas Pendientes
-- FIX: eliminado ORDER BY dentro de la vista (MySQL 8 lo ignora sin LIMIT;
--      ordenar en la consulta que use esta vista)
CREATE VIEW v_pending_installments AS
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
WHERE i.is_paid = FALSE;

-- Vista: Efectivo vs Tarjeta
-- FIX: NULLIF para evitar división por cero cuando SUM(amount) = 0
CREATE VIEW v_cash_vs_card AS
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
GROUP BY u.id, YEAR(e.date), MONTH(e.date);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DELIMITER $$

-- Trigger: al insertar una cuota, marcar el gasto padre como is_installment = TRUE
CREATE TRIGGER trg_installment_after_insert
AFTER INSERT ON installments
FOR EACH ROW
BEGIN
    UPDATE expenses
    SET is_installment = TRUE
    WHERE id = NEW.expense_id;
END$$

-- Trigger: al pagar/desmarcar una cuota, actualizar updated_at del gasto padre
CREATE TRIGGER trg_installment_after_update
AFTER UPDATE ON installments
FOR EACH ROW
BEGIN
    DECLARE total_count INT;
    DECLARE paid_count  INT;

    SELECT COUNT(*) INTO total_count
        FROM installments WHERE expense_id = NEW.expense_id;
    SELECT COUNT(*) INTO paid_count
        FROM installments WHERE expense_id = NEW.expense_id AND is_paid = TRUE;

    -- Tocar updated_at del gasto padre siempre que cambia el estado de pago
    IF OLD.is_paid <> NEW.is_paid THEN
        UPDATE expenses SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.expense_id;
    END IF;
END$$

DELIMITER ;

-- ============================================================================
-- NOTAS
-- ============================================================================
/*
  · Las categorías predeterminadas se crean desde la app al registrar un usuario
    (ver backend/src/controllers/categoryController.js → seedDefaultCategories).
    NO ejecutar los INSERT manuales a menos que se haga setup manual sin la app.

  · CHECK constraints requieren MySQL 8.0.16+.

  · ONLY_FULL_GROUP_BY está activo por defecto en MySQL 8; todas las vistas
    incluyen en GROUP BY las mismas expresiones que aparecen en SELECT.

  · ORDER BY dentro de vistas es ignorado por MySQL 8 sin LIMIT.
    Ordenar siempre desde la consulta que consume la vista:
      SELECT * FROM v_pending_installments ORDER BY due_date ASC;
*/
