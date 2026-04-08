-- Add currency column to expenses table
ALTER TABLE expenses
  ADD COLUMN currency ENUM('ARS', 'USD') NOT NULL DEFAULT 'ARS'
  AFTER amount;

-- Add index on currency for filtering
ALTER TABLE expenses
  ADD INDEX idx_currency (currency);

-- Ensure all existing records have ARS as currency
UPDATE expenses SET currency = 'ARS' WHERE currency IS NULL;
