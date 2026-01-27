-- Jalyuzi ERP Transformation Migration
-- Shina do'konidan jalyuzi o'rnatish kompaniyasiga o'tish

-- ================================================
-- 1. PRODUCTS jadvalini o'zgartirish
-- ================================================

-- Eski shina maydonlarini o'chirish
ALTER TABLE products DROP COLUMN IF EXISTS width;
ALTER TABLE products DROP COLUMN IF EXISTS profile;
ALTER TABLE products DROP COLUMN IF EXISTS diameter;
ALTER TABLE products DROP COLUMN IF EXISTS load_index;
ALTER TABLE products DROP COLUMN IF EXISTS speed_rating;
ALTER TABLE products DROP COLUMN IF EXISTS season;

-- Yangi jalyuzi maydonlarini qo'shish
ALTER TABLE products ADD COLUMN IF NOT EXISTS blind_type VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS material VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS color VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS control_type VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_width INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS max_width INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_height INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS max_height INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_per_sqm DECIMAL(15, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS installation_price DECIMAL(15, 2);

-- Eski indeksni o'chirish
DROP INDEX IF EXISTS idx_products_season;

-- Yangi indekslar
CREATE INDEX IF NOT EXISTS idx_products_blind_type ON products(blind_type);
CREATE INDEX IF NOT EXISTS idx_products_material ON products(material);
CREATE INDEX IF NOT EXISTS idx_products_control_type ON products(control_type);

-- ================================================
-- 2. SALES jadvalini o'zgartirish (o'rnatish xizmati)
-- ================================================

ALTER TABLE sales ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'PRODUCT_SALE';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS installation_date TIMESTAMP;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS installation_address VARCHAR(500);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS installation_notes VARCHAR(1000);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS technician_id BIGINT REFERENCES employees(id);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS installation_status VARCHAR(20);

-- Indekslar
CREATE INDEX IF NOT EXISTS idx_sales_order_type ON sales(order_type);
CREATE INDEX IF NOT EXISTS idx_sales_installation_date ON sales(installation_date);
CREATE INDEX IF NOT EXISTS idx_sales_technician ON sales(technician_id);
CREATE INDEX IF NOT EXISTS idx_sales_installation_status ON sales(installation_status);

-- ================================================
-- 3. SALE_ITEMS jadvalini o'zgartirish (maxsus o'lcham)
-- ================================================

ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS custom_width INTEGER;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS custom_height INTEGER;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS calculated_sqm DECIMAL(10, 4);
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS calculated_price DECIMAL(15, 2);
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS installation_included BOOLEAN DEFAULT false;

-- ================================================
-- 4. CUSTOMERS jadvalini o'zgartirish (o'rnatish manzili)
-- ================================================

ALTER TABLE customers ADD COLUMN IF NOT EXISTS installation_address VARCHAR(500);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS access_instructions VARCHAR(500);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_time_morning BOOLEAN DEFAULT true;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_time_afternoon BOOLEAN DEFAULT true;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_time_evening BOOLEAN DEFAULT false;

-- ================================================
-- 5. EMPLOYEES jadvalini o'zgartirish (texnik)
-- ================================================

ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_technician BOOLEAN DEFAULT false;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS technician_skills VARCHAR(500);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS max_daily_installations INTEGER DEFAULT 3;

-- Indeks
CREATE INDEX IF NOT EXISTS idx_employees_technician ON employees(is_technician) WHERE is_technician = true;

-- ================================================
-- 6. INSTALLATIONS jadvali (o'rnatish jadvali)
-- ================================================

CREATE TABLE IF NOT EXISTS installations (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL REFERENCES sales(id),
    technician_id BIGINT NOT NULL REFERENCES employees(id),
    scheduled_date DATE NOT NULL,
    scheduled_time_start TIME,
    scheduled_time_end TIME,
    actual_date DATE,
    actual_time_start TIME,
    actual_time_end TIME,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    address VARCHAR(500) NOT NULL,
    contact_phone VARCHAR(20),
    access_instructions VARCHAR(500),
    notes VARCHAR(1000),
    completion_notes VARCHAR(1000),
    customer_signature TEXT,
    photos_before TEXT,
    photos_after TEXT,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- Indekslar
CREATE INDEX IF NOT EXISTS idx_installations_sale ON installations(sale_id);
CREATE INDEX IF NOT EXISTS idx_installations_technician ON installations(technician_id);
CREATE INDEX IF NOT EXISTS idx_installations_scheduled_date ON installations(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_installations_status ON installations(status);

-- ================================================
-- 7. WINDOW_MEASUREMENTS jadvali (o'lchovlar)
-- ================================================

CREATE TABLE IF NOT EXISTS window_measurements (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    room_name VARCHAR(100),
    window_number INTEGER DEFAULT 1,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    depth INTEGER,
    mount_type VARCHAR(20),
    notes VARCHAR(500),
    measured_by BIGINT REFERENCES employees(id),
    measured_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- Indekslar
CREATE INDEX IF NOT EXISTS idx_measurements_customer ON window_measurements(customer_id);
CREATE INDEX IF NOT EXISTS idx_measurements_measured_by ON window_measurements(measured_by);

-- ================================================
-- 8. Eski shina ma'lumotlarini tozalash
-- ================================================

-- Eski mahsulotlarni o'chirish (shina bo'lganligi uchun)
-- Yangi bo'sh tizim uchun barcha eski ma'lumotlarni o'chiramiz
DELETE FROM stock_movements;
DELETE FROM purchase_order_items;
DELETE FROM purchase_orders;
DELETE FROM sale_items;
DELETE FROM payments WHERE sale_id IS NOT NULL;
DELETE FROM debts;
DELETE FROM sales;
DELETE FROM products;

-- Eski kategoriyalar va brendlarni tozalash
DELETE FROM categories;
DELETE FROM brands;

-- ================================================
-- 9. Yangi kategoriyalar va brendlar
-- ================================================

-- Jalyuzi kategoriyalari
INSERT INTO categories (name, description, active) VALUES
    ('Roletka', 'Rulonli pardalar', true),
    ('Vertikal jalyuzi', 'Vertikal lamelali jalyuzilar', true),
    ('Gorizontal jalyuzi', 'Gorizontal lamelali jalyuzilar', true),
    ('Rim pardasi', 'Klassik rim uslubidagi pardalar', true),
    ('Uyali parda', 'Honeycomb texnologiyali pardalar', true);

-- Jalyuzi brendlari
INSERT INTO brands (name, country, active) VALUES
    ('Hunter Douglas', 'AQSh', true),
    ('Luxaflex', 'Niderlandiya', true),
    ('Velux', 'Daniya', true),
    ('Somfy', 'Frantsiya', true),
    ('Local Brand', 'O''zbekiston', true);
