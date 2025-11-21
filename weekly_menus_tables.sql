-- ==================== WEEKLY MENUS TABLES ====================
-- Tablas para el sistema de menús semanales con reservaciones y lista de espera

-- Tabla principal de menús semanales
CREATE TABLE weekly_menus (
    menu_id UUID DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    menu_date DATE NOT NULL UNIQUE,
    entry_description VARCHAR(500) NOT NULL,
    main_course_description VARCHAR(500) NOT NULL,
    drink_description VARCHAR(255) NOT NULL,
    dessert_description VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    price NUMERIC(10, 2) NOT NULL
        CONSTRAINT positive_menu_price CHECK (price >= 0),
    reservation_deadline TIMESTAMP NOT NULL,
    max_reservations INTEGER
        CONSTRAINT positive_max_reservations CHECK (max_reservations IS NULL OR max_reservations > 0),
    current_reservations INTEGER DEFAULT 0
        CONSTRAINT positive_current_reservations CHECK (current_reservations >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE weekly_menus IS 'Menús semanales disponibles para reservación';

CREATE INDEX idx_weekly_menus_date ON weekly_menus (menu_date);
CREATE INDEX idx_weekly_menus_active ON weekly_menus (is_active);
CREATE INDEX idx_weekly_menus_deadline ON weekly_menus (reservation_deadline);

CREATE TRIGGER update_weekly_menus_updated_at
    BEFORE UPDATE ON weekly_menus
    FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Tabla de reservaciones de menú
CREATE TABLE menu_reservations (
    reservation_id UUID DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    menu_id UUID NOT NULL REFERENCES weekly_menus(menu_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1
        CONSTRAINT positive_reservation_quantity CHECK (quantity > 0),
    total_amount NUMERIC(10, 2) NOT NULL
        CONSTRAINT positive_reservation_amount CHECK (total_amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CONSTRAINT menu_reservations_status_check CHECK (
            status IN ('pending', 'confirmed', 'delivered', 'cancelled')
        ),
    notes TEXT,
    cancellation_reason TEXT,
    reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    delivered_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Un usuario solo puede tener una reservación activa por menú
    CONSTRAINT unique_active_reservation UNIQUE (menu_id, user_id)
);

COMMENT ON TABLE menu_reservations IS 'Reservaciones de menús semanales por usuario';

CREATE INDEX idx_menu_reservations_menu ON menu_reservations (menu_id);
CREATE INDEX idx_menu_reservations_user ON menu_reservations (user_id);
CREATE INDEX idx_menu_reservations_status ON menu_reservations (status);
CREATE INDEX idx_menu_reservations_date ON menu_reservations (reserved_at);

CREATE TRIGGER update_menu_reservations_updated_at
    BEFORE UPDATE ON menu_reservations
    FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Tabla de lista de espera
CREATE TABLE menu_waitlist (
    waitlist_id UUID DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    menu_id UUID NOT NULL REFERENCES weekly_menus(menu_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1
        CONSTRAINT positive_waitlist_quantity CHECK (quantity > 0),
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting'
        CONSTRAINT menu_waitlist_status_check CHECK (
            status IN ('waiting', 'notified', 'converted', 'expired')
        ),
    position INTEGER,
    notified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Un usuario solo puede estar una vez en la lista de espera por menú
    CONSTRAINT unique_waitlist_entry UNIQUE (menu_id, user_id)
);

COMMENT ON TABLE menu_waitlist IS 'Lista de espera para menús llenos';

CREATE INDEX idx_menu_waitlist_menu ON menu_waitlist (menu_id);
CREATE INDEX idx_menu_waitlist_user ON menu_waitlist (user_id);
CREATE INDEX idx_menu_waitlist_status ON menu_waitlist (status);
CREATE INDEX idx_menu_waitlist_position ON menu_waitlist (menu_id, position);

CREATE TRIGGER update_menu_waitlist_updated_at
    BEFORE UPDATE ON menu_waitlist
    FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- ==================== FUNCIONES Y TRIGGERS ====================

-- Función para actualizar el contador de reservaciones en weekly_menus
CREATE OR REPLACE FUNCTION update_menu_reservation_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE weekly_menus
        SET current_reservations = current_reservations + NEW.quantity
        WHERE menu_id = NEW.menu_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
            UPDATE weekly_menus
            SET current_reservations = current_reservations - OLD.quantity
            WHERE menu_id = OLD.menu_id;
        ELSIF OLD.status = 'cancelled' AND NEW.status != 'cancelled' THEN
            UPDATE weekly_menus
            SET current_reservations = current_reservations + NEW.quantity
            WHERE menu_id = NEW.menu_id;
        ELSIF OLD.quantity != NEW.quantity AND NEW.status != 'cancelled' THEN
            UPDATE weekly_menus
            SET current_reservations = current_reservations - OLD.quantity + NEW.quantity
            WHERE menu_id = NEW.menu_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.status != 'cancelled' THEN
            UPDATE weekly_menus
            SET current_reservations = current_reservations - OLD.quantity
            WHERE menu_id = OLD.menu_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reservation_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON menu_reservations
    FOR EACH ROW
EXECUTE PROCEDURE update_menu_reservation_count();

-- Función para asignar posición en lista de espera
CREATE OR REPLACE FUNCTION assign_waitlist_position()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.position IS NULL THEN
        SELECT COALESCE(MAX(position), 0) + 1
        INTO NEW.position
        FROM menu_waitlist
        WHERE menu_id = NEW.menu_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assign_waitlist_position_trigger
    BEFORE INSERT ON menu_waitlist
    FOR EACH ROW
EXECUTE PROCEDURE assign_waitlist_position();

-- ==================== VISTAS ÚTILES ====================

-- Vista para menús con información de disponibilidad
CREATE OR REPLACE VIEW weekly_menus_availability AS
SELECT
    m.*,
    CASE
        WHEN m.max_reservations IS NULL THEN true
        WHEN m.current_reservations < m.max_reservations THEN true
        ELSE false
    END AS has_availability,
    CASE
        WHEN m.max_reservations IS NULL THEN NULL
        ELSE m.max_reservations - m.current_reservations
    END AS spots_available,
    CASE
        WHEN m.is_active = false THEN false
        WHEN m.reservation_deadline < NOW() THEN false
        WHEN m.max_reservations IS NOT NULL AND m.current_reservations >= m.max_reservations THEN false
        ELSE true
    END AS can_reserve,
    (SELECT COUNT(*) FROM menu_waitlist w WHERE w.menu_id = m.menu_id AND w.status = 'waiting') AS waitlist_count
FROM weekly_menus m;

-- Vista para reservaciones con datos de usuario y menú
CREATE OR REPLACE VIEW menu_reservations_detailed AS
SELECT
    r.*,
    u.full_name AS user_name,
    u.email AS user_email,
    u.phone AS user_phone,
    m.menu_date,
    m.main_course_description,
    m.entry_description,
    m.drink_description,
    m.dessert_description,
    m.price AS menu_price
FROM menu_reservations r
JOIN users u ON r.user_id = u.user_id
JOIN weekly_menus m ON r.menu_id = m.menu_id;

-- Vista para lista de espera con datos de usuario y menú
CREATE OR REPLACE VIEW menu_waitlist_detailed AS
SELECT
    w.*,
    u.full_name AS user_name,
    u.email AS user_email,
    u.phone AS user_phone,
    m.menu_date,
    m.main_course_description,
    m.max_reservations,
    m.current_reservations
FROM menu_waitlist w
JOIN users u ON w.user_id = u.user_id
JOIN weekly_menus m ON w.menu_id = m.menu_id
ORDER BY w.menu_id, w.position;
