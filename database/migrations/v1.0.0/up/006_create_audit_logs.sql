CREATE TABLE IF NOT EXISTS audit_logs (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT         NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id   INT         NOT NULL,
    action      VARCHAR(50) NOT NULL,
    old_values  JSON,
    new_values  JSON,
    created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id    (user_id),
    INDEX idx_created_at (created_at)
)
