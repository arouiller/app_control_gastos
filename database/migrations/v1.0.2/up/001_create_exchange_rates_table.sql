CREATE TABLE exchange_rates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  rate_date DATE NOT NULL,
  ars_to_usd DECIMAL(10, 4) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_rate_date (rate_date),
  INDEX idx_rate_date (rate_date)
);
