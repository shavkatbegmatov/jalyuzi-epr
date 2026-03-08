-- =====================================================
-- V27: Buyurtma Boshqaruv Tizimi (Order Management System)
-- =====================================================

-- 1. Orders jadvali
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(30) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    status VARCHAR(30) NOT NULL DEFAULT 'YANGI',

    -- Manzil
    installation_address VARCHAR(500),

    -- Tayinlangan xodimlar
    manager_id BIGINT REFERENCES users(id),
    measurer_id BIGINT REFERENCES employees(id),
    installer_id BIGINT REFERENCES users(id),

    -- Moliyaviy maydonlar
    subtotal DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    remaining_amount DECIMAL(15,2) DEFAULT 0,
    cost_total DECIMAL(15,2) DEFAULT 0,

    -- Bog'lanishlar
    sale_id BIGINT REFERENCES sales(id),
    debt_id BIGINT REFERENCES debts(id),

    -- Sanalar
    measurement_date TIMESTAMP,
    production_start_date TIMESTAMP,
    production_end_date TIMESTAMP,
    installation_date TIMESTAMP,
    completed_date TIMESTAMP,

    -- Izohlar
    notes VARCHAR(1000),

    -- Audit
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 2. Order items jadvali
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),

    -- Xona nomi
    room_name VARCHAR(100),

    -- O'lchamlar (mm)
    width_mm INTEGER,
    height_mm INTEGER,
    depth_mm INTEGER,

    -- Hisoblangan maydonlar
    calculated_sqm DECIMAL(10,4),
    quantity INTEGER NOT NULL DEFAULT 1,

    -- Narxlar
    unit_price DECIMAL(15,2) NOT NULL,
    installation_price DECIMAL(15,2) DEFAULT 0,
    discount DECIMAL(15,2) DEFAULT 0,
    total_price DECIMAL(15,2) NOT NULL,

    -- Tannarx snapshot
    cost_price DECIMAL(15,2),

    -- O'rnatish
    installation_included BOOLEAN DEFAULT FALSE,

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 3. Order payments jadvali
CREATE TABLE order_payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_type VARCHAR(20) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'CASH',

    -- Kim yig'di / tasdiqladi
    collected_by BIGINT REFERENCES users(id),
    confirmed_by BIGINT REFERENCES users(id),
    is_confirmed BOOLEAN DEFAULT FALSE,

    notes VARCHAR(500),

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 4. Order status history jadvali
CREATE TABLE order_status_history (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    changed_by BIGINT NOT NULL REFERENCES users(id),
    notes VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 5. Indekslar
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_manager_id ON orders(manager_id);
CREATE INDEX idx_orders_installer_id ON orders(installer_id);
CREATE INDEX idx_orders_measurer_id ON orders(measurer_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_payments_order_id ON order_payments(order_id);
CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);

-- 6. Yangi permissionlar
INSERT INTO permissions (code, description, module, action) VALUES
    ('ORDERS_VIEW', 'Buyurtmalar ro''yxatini ko''rish', 'ORDERS', 'VIEW'),
    ('ORDERS_CREATE', 'Yangi buyurtma yaratish', 'ORDERS', 'CREATE'),
    ('ORDERS_UPDATE', 'Buyurtma ma''lumotlarini yangilash', 'ORDERS', 'UPDATE'),
    ('ORDERS_DELETE', 'Buyurtmani o''chirish', 'ORDERS', 'DELETE'),
    ('ORDERS_ASSIGN', 'Buyurtmani xodimga tayinlash', 'ORDERS', 'ASSIGN'),
    ('ORDERS_MEASURE', 'Buyurtma o''lchovlarini kiritish', 'ORDERS', 'MEASURE'),
    ('ORDERS_PRODUCE', 'Ishlab chiqarish statusini boshqarish', 'ORDERS', 'PRODUCE'),
    ('ORDERS_INSTALL', 'Buyurtma o''rnatishini bajarish', 'ORDERS', 'INSTALL'),
    ('ORDERS_COLLECT_PAYMENT', 'Mijozdan to''lov qabul qilish', 'ORDERS', 'COLLECT_PAYMENT'),
    ('ORDERS_CONFIRM_PAYMENT', 'Yig''ilgan to''lovni tasdiqlash', 'ORDERS', 'CONFIRM_PAYMENT')
ON CONFLICT (code) DO NOTHING;

-- 7. INSTALLER roli yaratish
INSERT INTO roles (name, code, description, is_system, created_at)
VALUES ('INSTALLER', 'INSTALLER', 'O''rnatuvchi - buyurtmalarni o''rnatish va to''lov yig''ish', TRUE, NOW())
ON CONFLICT (name) DO NOTHING;

-- 8. INSTALLER roliga permissionlar tayinlash
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'INSTALLER' AND p.code IN (
    'ORDERS_VIEW', 'ORDERS_INSTALL', 'ORDERS_COLLECT_PAYMENT',
    'CUSTOMERS_VIEW', 'DASHBOARD_VIEW'
)
ON CONFLICT DO NOTHING;

-- 9. ADMIN roliga barcha ORDERS permissionlarini qo'shish
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ADMIN' AND p.code LIKE 'ORDERS_%'
ON CONFLICT DO NOTHING;

-- 10. MANAGER roliga kerakli ORDERS permissionlarini qo'shish
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'MANAGER' AND p.code IN (
    'ORDERS_VIEW', 'ORDERS_CREATE', 'ORDERS_UPDATE',
    'ORDERS_ASSIGN', 'ORDERS_MEASURE', 'ORDERS_PRODUCE',
    'ORDERS_CONFIRM_PAYMENT'
)
ON CONFLICT DO NOTHING;

-- 11. SELLER roliga buyurtma ko'rish va yaratish
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'SELLER' AND p.code IN ('ORDERS_VIEW', 'ORDERS_CREATE')
ON CONFLICT DO NOTHING;
