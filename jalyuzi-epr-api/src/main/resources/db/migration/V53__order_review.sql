-- =====================================================
-- V53: Post-installation mijoz bahosi (NPS / sharh halqasi)
-- Mijoz ommaviy kuzatuv sahifasi (/t/{code}) orqali o'rnatish yakunlangach
-- ishni baholaydi (1-5 yulduz) va izoh qoldiradi.
-- =====================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS review_rating INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS review_comment TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS review_submitted_at TIMESTAMP;
