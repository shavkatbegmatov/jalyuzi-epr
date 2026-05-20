-- ============================================================
-- ORDER PHOTOS — Sprint 2
-- O'rnatish/bajarish jarayonida fotosurat dalillari
-- ============================================================
-- orders jadvalida 3 ta JSONB ustun:
--   measurement_photos  — o'lchov olishda olingan rasmlar (xona, deraza)
--   photos_before       — o'rnatish boshlanishidan oldin
--   photos_after        — o'rnatish tugagandan keyin (mijoz qabul qilishidan oldin)
-- Har bir ustun: array of {url, uploaded_at, uploaded_by} obyektlari
-- ============================================================

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS measurement_photos JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS photos_before     JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS photos_after      JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS customer_signature TEXT;

COMMENT ON COLUMN orders.measurement_photos  IS 'O''lchov olishda olingan rasmlar (JSONB array)';
COMMENT ON COLUMN orders.photos_before       IS 'O''rnatish oldidan rasmlar (JSONB array)';
COMMENT ON COLUMN orders.photos_after        IS 'O''rnatish keyin rasmlar (JSONB array)';
COMMENT ON COLUMN orders.customer_signature  IS 'Mijoz imzosi base64 PNG';

-- GIN index — JSONB ichidan ham qidirsa bo'ladi (kelajak uchun)
CREATE INDEX IF NOT EXISTS idx_orders_photos_before ON orders USING GIN (photos_before);
CREATE INDEX IF NOT EXISTS idx_orders_photos_after  ON orders USING GIN (photos_after);
