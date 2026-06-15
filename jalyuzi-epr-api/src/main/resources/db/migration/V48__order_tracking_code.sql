-- =====================================================
-- V48: Buyurtma ommaviy kuzatuv kodi ("Jalyuzimni kuzat")
-- Har buyurtmaga noyob, taxmin qilib bo'lmaydigan qisqa kod beriladi.
-- Mijoz shu kod orqali auth'siz ommaviy sahifada (/t/{code}) buyurtmasini
-- real vaqtda kuzatadi (Domino's uslubidagi treker).
-- =====================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(16);

-- Mavjud (bekor qilinmagan) buyurtmalarga ham kod beramiz — ular ham kuzatiluvchi bo'lsin.
-- md5(random + id) → 10 ta belgili HEX kod; id aralashgani uchun to'qnashuv ehtimoli amalda nol.
UPDATE orders
SET tracking_code = upper(substr(md5(random()::text || id::text), 1, 10))
WHERE tracking_code IS NULL;

-- Noyoblikni majburlash (yangi kodlar generatsiyasi ham shu indeksga tayanadi)
CREATE UNIQUE INDEX IF NOT EXISTS ux_orders_tracking_code ON orders (tracking_code);
