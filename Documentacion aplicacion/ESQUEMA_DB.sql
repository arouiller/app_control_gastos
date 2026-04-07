-- ============================================================================
-- ESQUEMA DE BASE DE DATOS - APLICACIÓN DE CONTROL DE GASTOS
-- ============================================================================
-- Base de Datos MySQL 8.0+
-- Crear base de datos
-- ============================================================================

-- Tabla de Usuarios
-- ============================================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    profile_picture_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,

    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
);

-- Tabla de Categorías de Gastos
-- ============================================================================
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#000000',  -- Color en formato hex
    icon VARCHAR(50),                     -- Nombre del icono
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_category (user_id, name),
    INDEX idx_user_id (user_id)
);

-- Tabla de Gastos
-- ============================================================================
CREATE TABLE expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    payment_method ENUM('cash', 'credit_card') NOT NULL,
    is_installment BOOLEAN DEFAULT FALSE,
    installment_group_id INT,  -- Para agrupar gastos en cuotas
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (installment_group_id) REFERENCES expenses(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_category_id (category_id),
    INDEX idx_date (date),
    INDEX idx_payment_method (payment_method),
    INDEX idx_user_date (user_id, date),
    CHECK (amount > 0)
);

-- Tabla de Cuotas (Desglose de Tarjeta de Crédito)
-- ============================================================================
CREATE TABLE installments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expense_id INT NOT NULL,
    installment_number INT NOT NULL,
    total_installments INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    paid_date DATETIME,
    payment_notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
    INDEX idx_expense_id (expense_id),
    INDEX idx_due_date (due_date),
    INDEX idx_is_paid (is_paid),
    UNIQUE KEY unique_installment (expense_id, installment_number),
    CHECK (amount > 0),
    CHECK (installment_number >= 1),
    CHECK (total_installments >= 1)
);

-- Tabla de Historial de Sesiones (Opcional - para seguridad)
-- ============================================================================
CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    refresh_token VARCHAR(500) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

-- Tabla de Auditoría (Opcional - para rastrear cambios)
-- ============================================================================
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    entity_type VARCHAR(50) NOT NULL,  -- 'expense', 'category', 'installment'
    entity_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,        -- 'CREATE', 'UPDATE', 'DELETE'
    old_values JSON,
    new_values JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- ============================================================================
-- VISTAS ÚTILES PARA REPORTES
-- ============================================================================

-- Vista: Resumen de Gastos por Mes
CREATE VIEW v_monthly_summary AS
SELECT
    u.id as user_id,
    YEAR(e.date) as year,
    MONTH(e.date) as month,
    DATE_TRUNC(e.date, MONTH) as month_start,
    COUNT(*) as total_transactions,
    SUM(e.amount) as total_amount,
    SUM(CASE WHEN e.payment_method = 'cash' THEN e.amount ELSE 0 END) as total_cash,
    SUM(CASE WHEN e.payment_method = 'credit_card' THEN e.amount ELSE 0 END) as total_credit
FROM users u
LEFT JOIN expenses e ON u.id = e.user_id
GROUP BY u.id, YEAR(e.date), MONTH(e.date);

-- Vista: Consumo por Categoría
CREATE VIEW v_spending_by_category AS
SELECT
    u.id as user_id,
    c.id as category_id,
    c.name as category_name,
    c.color as category_color,
    COUNT(e.id) as transaction_count,
    SUM(e.amount) as total_amount,
    AVG(e.amount) as average_amount
FROM users u
LEFT JOIN categories c ON u.id = c.user_id
LEFT JOIN expenses e ON c.id = e.category_id
GROUP BY u.id, c.id, c.name, c.color;

-- Vista: Cuotas Pendientes
CREATE VIEW v_pending_installments AS
SELECT
    u.id as user_id,
    i.id as installment_id,
    e.id as expense_id,
    c.name as category_name,
    e.description,
    i.amount,
    i.due_date,
    i.installment_number,
    i.total_installments
FROM users u
JOIN expenses e ON u.id = e.user_id
JOIN installments i ON e.id = i.expense_id
JOIN categories c ON e.category_id = c.id
WHERE i.is_paid = FALSE
ORDER BY i.due_date ASC;

-- Vista: Efectivo vs Tarjeta
CREATE VIEW v_cash_vs_card AS
SELECT
    u.id as user_id,
    YEAR(e.date) as year,
    MONTH(e.date) as month,
    SUM(CASE WHEN e.payment_method = 'cash' THEN e.amount ELSE 0 END) as cash_total,
    SUM(CASE WHEN e.payment_method = 'credit_card' THEN e.amount ELSE 0 END) as card_total,
    SUM(e.amount) as grand_total,
    ROUND(SUM(CASE WHEN e.payment_method = 'cash' THEN e.amount ELSE 0 END) /
          SUM(e.amount) * 100, 2) as cash_percentage,
    ROUND(SUM(CASE WHEN e.payment_method = 'credit_card' THEN e.amount ELSE 0 END) /
          SUM(e.amount) * 100, 2) as card_percentage
FROM users u
LEFT JOIN expenses e ON u.id = e.user_id
GROUP BY u.id, YEAR(e.date), MONTH(e.date);

-- ============================================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- ============================================================================

-- Índices compuestos para consultas frecuentes
CREATE INDEX idx_expenses_user_date_category
ON expenses(user_id, date, category_id);

CREATE INDEX idx_expenses_user_payment_method
ON expenses(user_id, payment_method);

CREATE INDEX idx_installments_user_paid_date
ON installments(expense_id, is_paid, due_date);

-- ============================================================================
-- DATOS DE EJEMPLO - CATEGORÍAS PREDETERMINADAS
-- ============================================================================

-- Insertar categorías predeterminadas (se puede hacer en la app también)
INSERT INTO categories (user_id, name, color, icon, description) VALUES
(1, 'Alimentación', '#FF6B6B', 'utensils', 'Comidas, alimentos, restaurantes'),
(1, 'Transporte', '#4ECDC4', 'car', 'Gasolina, transporte público, taxi'),
(1, 'Entretenimiento', '#45B7D1', 'film', 'Cine, juegos, hobbies'),
(1, 'Servicios', '#96CEB4', 'home', 'Agua, luz, internet, servicios'),
(1, 'Salud', '#FFEAA7', 'heart', 'Medicinas, doctor, gym'),
(1, 'Educación', '#DDA15E', 'book', 'Cursos, libros, educación'),
(1, 'Otros', '#C0C0C0', 'circle', 'Otros gastos');

-- ============================================================================
-- TRIGGERS PARA SINCRONIZACIÓN DE DATOS
-- ============================================================================

-- Trigger: Cuando se crea una cuota, actualizar el estado del gasto
DELIMITER $$

CREATE TRIGGER trg_create_installment_after_insert
AFTER INSERT ON installments
FOR EACH ROW
BEGIN
    UPDATE expenses
    SET is_installment = TRUE
    WHERE id = NEW.expense_id;
END$$

-- Trigger: Cuando se pagan todas las cuotas, marcar gasto como completamente pagado
CREATE TRIGGER trg_check_installment_completion
AFTER UPDATE ON installments
FOR EACH ROW
BEGIN
    DECLARE total_count INT;
    DECLARE paid_count INT;

    SELECT COUNT(*) INTO total_count FROM installments WHERE expense_id = NEW.expense_id;
    SELECT COUNT(*) INTO paid_count FROM installments WHERE expense_id = NEW.expense_id AND is_paid = TRUE;

    IF total_count = paid_count THEN
        -- Aquí puedes registrar el evento de pago completo si lo necesitas
        UPDATE expenses SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.expense_id;
    END IF;
END$$

DELIMITER ;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
/*
1. NORMALIZACIÓN: La base de datos está normalizada a 3FN
2. INTEGRIDAD: Se utilizan FOREIGN KEYS para mantener integridad referencial
3. ÍNDICES: Se han creado índices en campos frecuentemente consultados
4. SEGURIDAD: Las contraseñas deben ser hasheadas en la aplicación, nunca almacenarlas en texto plano
5. ESCALABILIDAD: Para aplicaciones muy grandes, considerar particionamiento por fecha
6. BACKUPS: Establecer política de backups automáticos diarios
7. VISTAS: Las vistas facilitarán los reportes sin necesidad de queries complejas
8. TRIGGERS: Los triggers mantienen la sincronización automática de datos
*/

-- ============================================================================
-- CONEXIÓN DESDE LA APP
-- ============================================================================
/*
BACKEND CONNECTION STRING (Node.js + Sequelize):
const sequelize = new Sequelize('database_name', 'user', 'password', {
  host: 'localhost',
  dialect: 'mysql',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});
*/
