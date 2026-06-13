-- V44: "Shina magazin" seed qoldiqlarini tozalash / jalyuzi'ga moslashtirish
--
-- Loyiha shina do'konidan jalyuzi kompaniyasiga o'tkazilgan (V22). V22 brend, kategoriya
-- va mahsulotlarni almashtirgan, lekin `suppliers` va `users` jadvallariga tegmagan.
-- Shu sababli V2 seed'idagi tire-yetkazib beruvchilar (Michelin O'zbekiston, Bridge Auto
-- Import, Continental Central Asia) va @shinamagazin.uz emaillar DB'da qolib ketgan.
--
-- Bu migratsiya ularni jalyuzi'ga moslashtiradi (V22 brend/kategoriyalar bilan qilganidek).

-- ================================================
-- 1. Eski tire-yetkazib beruvchilarni o'chirish
--    (faqat ularga bog'liq purchase_order bo'lmasa — FK xatosini oldini olish uchun)
-- ================================================
DELETE FROM suppliers
WHERE name IN ('Michelin O''zbekiston', 'Bridge Auto Import', 'Continental Central Asia')
  AND NOT EXISTS (
      SELECT 1 FROM purchase_orders po WHERE po.supplier_id = suppliers.id
  );

-- ================================================
-- 2. Jalyuzi yetkazib beruvchilarini qo'shish (idempotent — nomi bo'yicha takrorlamaydi)
-- ================================================
INSERT INTO suppliers (name, contact_person, phone, email, address, balance, active)
SELECT v.name, v.contact_person, v.phone, v.email, v.address, v.balance, v.active
FROM (VALUES
    ('Mato Tekstil',       'Sardor Aliyev',    '+998901001010', 'info@matotekstil.uz',   'Toshkent sh., Yunusobod tumani', 0, true),
    ('Profil Alyumin',     'Jahongir Karimov', '+998902002020', 'sales@profilalumin.uz', 'Toshkent sh., Sergeli tumani',   0, true),
    ('Mexanizm Komponent', 'Olim Tursunov',    '+998903003030', 'order@mexkomponent.uz', 'Toshkent sh., Chilonzor tumani', 0, true)
) AS v(name, contact_person, phone, email, address, balance, active)
WHERE NOT EXISTS (SELECT 1 FROM suppliers s WHERE s.name = v.name);

-- ================================================
-- 3. admin/seller emaillarini @shinamagazin.uz dan @jalyuzi.uz ga o'zgartirish
--    (faqat hali seed qiymatida bo'lsa — qo'lda o'zgartirilganini buzmaydi)
-- ================================================
UPDATE users SET email = 'admin@jalyuzi.uz'
WHERE username = 'admin' AND email = 'admin@shinamagazin.uz';

UPDATE users SET email = 'seller@jalyuzi.uz'
WHERE username = 'seller' AND email = 'seller@shinamagazin.uz';
