CREATE TABLE IF NOT EXISTS expenses (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    user_id              INT            NOT NULL,
    category_id          INT            NOT NULL,
    description          VARCHAR(255)   NOT NULL,
    amount               DECIMAL(10,2)  NOT NULL,
    date                 DATE           NOT NULL,
    payment_method       ENUM('cash','credit_card') NOT NULL,
    is_installment       BOOLEAN        NOT NULL DEFAULT FALSE,
    installment_group_id INT,
    notes                TEXT,
    created_at           TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_expense_amount CHECK (amount > 0),

    FOREIGN KEY (user_id)              REFERENCES users(id)      ON DELETE CASCADE,
    FOREIGN KEY (category_id)          REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (installment_group_id) REFERENCES expenses(id)   ON DELETE CASCADE,

    INDEX idx_user_id        (user_id),
    INDEX idx_category_id    (category_id),
    INDEX idx_date           (date),
    INDEX idx_payment_method (payment_method),
    INDEX idx_user_date      (user_id, date)
)
