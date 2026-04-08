CREATE TABLE IF NOT EXISTS installments (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    expense_id         INT           NOT NULL,
    installment_number INT           NOT NULL,
    total_installments INT           NOT NULL,
    amount             DECIMAL(10,2) NOT NULL,
    due_date           DATE          NOT NULL,
    is_paid            BOOLEAN       NOT NULL DEFAULT FALSE,
    paid_date          DATETIME,
    payment_notes      VARCHAR(255),
    created_at         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_installment_amount      CHECK (amount > 0),
    CONSTRAINT chk_installment_number      CHECK (installment_number >= 1),
    CONSTRAINT chk_total_installments      CHECK (total_installments >= 1),

    FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
    UNIQUE  KEY uq_installment         (expense_id, installment_number),
    INDEX       idx_expense_id         (expense_id),
    INDEX       idx_due_date           (due_date),
    INDEX       idx_is_paid            (is_paid)
)
