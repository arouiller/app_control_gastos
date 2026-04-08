CREATE TABLE IF NOT EXISTS schema_version (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    version           VARCHAR(20) NOT NULL,
    applied_at        TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description       TEXT,
    migration_time_ms INT
);

CREATE TABLE IF NOT EXISTS schema_version_history (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    from_version      VARCHAR(20),
    to_version        VARCHAR(20),
    status            ENUM('success', 'failed', 'rolled_back') NOT NULL,
    applied_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    error_message     LONGTEXT,
    migration_time_ms INT
);
