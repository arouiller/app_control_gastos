CREATE TABLE exchange_rate_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  operation_type ENUM('daily_fetch', 'historical_load', 'manual_update') NOT NULL,
  rate_date DATE NOT NULL,
  old_rate DECIMAL(10, 4) NULL,
  new_rate DECIMAL(10, 4) NULL,
  source VARCHAR(100) NOT NULL,
  status ENUM('success', 'failed', 'skipped') NOT NULL,
  error_message LONGTEXT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  executed_by VARCHAR(100) NULL,
  INDEX idx_rate_date (rate_date),
  INDEX idx_executed_at (executed_at),
  INDEX idx_status (status),
  INDEX idx_operation_type (operation_type)
);
