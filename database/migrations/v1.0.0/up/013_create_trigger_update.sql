CREATE TRIGGER IF NOT EXISTS trg_installment_after_update
AFTER UPDATE ON installments
FOR EACH ROW
BEGIN
    IF OLD.is_paid <> NEW.is_paid THEN
        UPDATE expenses SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.expense_id;
    END IF;
END
