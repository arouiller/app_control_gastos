DROP TRIGGER IF EXISTS trg_installment_after_insert;

CREATE TRIGGER trg_installment_after_insert
AFTER INSERT ON installments
FOR EACH ROW
BEGIN
    UPDATE expenses
    SET is_installment = TRUE
    WHERE id = NEW.expense_id;
END
