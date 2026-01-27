-- =====================================================
-- V23: Universal Mahsulot Tizimi
-- Tayyor jalyuzi, xomashyo va aksessuarlarni qo'llab-quvvatlash
-- =====================================================

-- Yangi ustunlar qo'shish
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type VARCHAR(20) DEFAULT 'FINISHED_PRODUCT';
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_type VARCHAR(20) DEFAULT 'PIECE';

-- Xomashyo uchun maydonlar
ALTER TABLE products ADD COLUMN IF NOT EXISTS roll_width DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS roll_length DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS profile_length DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_per_unit DECIMAL(10,3);

-- Aksessuar uchun maydonlar
ALTER TABLE products ADD COLUMN IF NOT EXISTS compatible_blind_types VARCHAR(200);

-- Quantity va min_stock_level ni BigDecimal ga o'zgartirish (xomashyo uchun 2.5 metr)
ALTER TABLE products ALTER COLUMN quantity TYPE DECIMAL(15,3) USING quantity::DECIMAL(15,3);
ALTER TABLE products ALTER COLUMN min_stock_level TYPE DECIMAL(15,3) USING min_stock_level::DECIMAL(15,3);

-- Mavjud mahsulotlarni FINISHED_PRODUCT sifatida belgilash
UPDATE products SET product_type = 'FINISHED_PRODUCT' WHERE product_type IS NULL;
UPDATE products SET unit_type = 'PIECE' WHERE unit_type IS NULL;

-- Indeks yaratish
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_unit_type ON products(unit_type);
