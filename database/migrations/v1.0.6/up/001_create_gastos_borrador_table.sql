-- REQ-006: Gastos Borrador - Sistema de drafts para gastos
-- Permite usuarios guardar gastos en estado borrador antes de convertir a definitivos

CREATE TABLE gastos_borrador (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  monto_total DECIMAL(12,2) NOT NULL,
  moneda ENUM('ARS', 'USD') NOT NULL DEFAULT 'ARS',
  medio_de_pago ENUM('cash', 'credit_card') NOT NULL,
  cantidad_de_cuotas INT NOT NULL CHECK (cantidad_de_cuotas BETWEEN 1 AND 24),
  valor_de_la_cuota DECIMAL(12,2) NOT NULL,
  expense_date DATE NOT NULL,
  status ENUM('draft', 'convertido') NOT NULL DEFAULT 'draft',
  expense_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  converted_at TIMESTAMP DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
