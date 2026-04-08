-- Remove currency column from expenses table
ALTER TABLE expenses DROP INDEX idx_currency;
ALTER TABLE expenses DROP COLUMN currency;
