-- ============================================================
-- PRODUCT IMAGES — mahsulot rasmlari galereyasi
-- Material katalogi uchun bir nechta rasm qo'llab-quvvatlanadi
-- ============================================================
-- products jadvalida JSONB ustun:
--   image_urls — mahsulot rasmlari ro'yxati (array of public URL string)
-- Mavjud image_url ustuni — asosiy (muqova) rasm sifatida saqlanadi.
-- ============================================================

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN products.image_urls IS 'Mahsulot rasmlari galereyasi (JSONB array of URL)';

-- Mavjud asosiy rasmi (image_url) bor mahsulotlar uchun uni galereyaga ko'chiramiz,
-- shunda eski ma'lumotlar ham galereyada ko'rinadi.
UPDATE products
SET image_urls = jsonb_build_array(image_url)
WHERE image_url IS NOT NULL
  AND image_url <> ''
  AND (image_urls IS NULL OR image_urls = '[]'::jsonb);
