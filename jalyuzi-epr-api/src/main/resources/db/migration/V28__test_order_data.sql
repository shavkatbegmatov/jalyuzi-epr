-- =====================================================
-- V28: Test buyurtma ma'lumotlari
-- Dashboard, installer paneli va buyurtmalar ro'yxatini
-- test qilish uchun turli statusdagi buyurtmalar
-- =====================================================

-- =====================================================
-- 1. Test jalyuzi mahsulotlar (V22 da eski mahsulotlar o'chirilgan)
-- =====================================================

INSERT INTO products (sku, name, brand_id, category_id, purchase_price, selling_price,
    quantity, min_stock_level, active, created_by, product_type, unit_type,
    blind_type, material, color, control_type, price_per_sqm, installation_price,
    product_type_id, custom_attributes)
VALUES
(
    'JL-ROL-001', 'Roletka Oq Standart',
    (SELECT id FROM brands WHERE name = 'Local Brand'),
    (SELECT id FROM categories WHERE name = 'Roletka'),
    150000, 250000, 50, 10, true, 1, 'FINISHED_PRODUCT', 'PIECE',
    'ROLLER', 'FABRIC', 'Oq', 'CHAIN', 180000, 50000,
    (SELECT id FROM product_types WHERE code = 'FINISHED_PRODUCT'),
    '{"blindType":"ROLLER","material":"FABRIC","color":"Oq","controlType":"CHAIN","pricePerSquareMeter":180000,"installationPrice":50000}'::jsonb
),
(
    'JL-ROL-002', 'Roletka Blackout Qora',
    (SELECT id FROM brands WHERE name = 'Hunter Douglas'),
    (SELECT id FROM categories WHERE name = 'Roletka'),
    250000, 400000, 30, 5, true, 1, 'FINISHED_PRODUCT', 'PIECE',
    'ROLLER', 'BLACKOUT', 'Qora', 'CHAIN', 280000, 50000,
    (SELECT id FROM product_types WHERE code = 'FINISHED_PRODUCT'),
    '{"blindType":"ROLLER","material":"BLACKOUT","color":"Qora","controlType":"CHAIN","pricePerSquareMeter":280000,"installationPrice":50000}'::jsonb
),
(
    'JL-VER-001', 'Vertikal Jalyuzi Kumush',
    (SELECT id FROM brands WHERE name = 'Luxaflex'),
    (SELECT id FROM categories WHERE name = 'Vertikal jalyuzi'),
    200000, 320000, 25, 5, true, 1, 'FINISHED_PRODUCT', 'PIECE',
    'VERTICAL', 'PVC', 'Kumush', 'CORD', 220000, 60000,
    (SELECT id FROM product_types WHERE code = 'FINISHED_PRODUCT'),
    '{"blindType":"VERTICAL","material":"PVC","color":"Kumush","controlType":"CORD","pricePerSquareMeter":220000,"installationPrice":60000}'::jsonb
),
(
    'JL-GOR-001', 'Gorizontal Jalyuzi Alyuminiy',
    (SELECT id FROM brands WHERE name = 'Somfy'),
    (SELECT id FROM categories WHERE name = 'Gorizontal jalyuzi'),
    180000, 300000, 40, 8, true, 1, 'FINISHED_PRODUCT', 'PIECE',
    'HORIZONTAL', 'ALUMINUM', 'Oq', 'CORD', 200000, 45000,
    (SELECT id FROM product_types WHERE code = 'FINISHED_PRODUCT'),
    '{"blindType":"HORIZONTAL","material":"ALUMINUM","color":"Oq","controlType":"CORD","pricePerSquareMeter":200000,"installationPrice":45000}'::jsonb
),
(
    'JL-RIM-001', 'Rim Pardasi Premium',
    (SELECT id FROM brands WHERE name = 'Hunter Douglas'),
    (SELECT id FROM categories WHERE name = 'Rim pardasi'),
    350000, 550000, 15, 3, true, 1, 'FINISHED_PRODUCT', 'PIECE',
    'ROMAN', 'FABRIC', 'Krem', 'CHAIN', 350000, 70000,
    (SELECT id FROM product_types WHERE code = 'FINISHED_PRODUCT'),
    '{"blindType":"ROMAN","material":"FABRIC","color":"Krem","controlType":"CHAIN","pricePerSquareMeter":350000,"installationPrice":70000}'::jsonb
);

-- =====================================================
-- 2. Test foydalanuvchilar
-- =====================================================

-- Manager (parol: manager123)
INSERT INTO users (username, password, full_name, phone, role, active)
VALUES ('manager', '$2a$10$CclPRg929rWyXKRcNKrAGuO91Y4VqO5fEIcogs7..lFRGIllrnM66',
        'Sardor Menejer', '+998901112200', 'MANAGER', true);

-- Installer (parol: installer123)
INSERT INTO users (username, password, full_name, phone, role, active)
VALUES ('installer', '$2a$10$JNl3tidYRwiMXiZbGbSFkOmYsqiWl0.FY3y3e27f4fVIanmELXdAy',
        'Jasur O''rnatuvchi', '+998901112201', 'INSTALLER', true);

-- User roles tayinlash
INSERT INTO user_roles (user_id, role_id, assigned_by)
SELECT u.id, r.id, 1
FROM users u, roles r
WHERE u.username = 'manager' AND r.code = 'MANAGER';

INSERT INTO user_roles (user_id, role_id, assigned_by)
SELECT u.id, r.id, 1
FROM users u, roles r
WHERE u.username = 'installer' AND r.code = 'INSTALLER';

-- =====================================================
-- 3. Xodimlar (employees)
-- =====================================================

INSERT INTO employees (full_name, phone, position, department, hire_date, user_id, is_technician)
VALUES ('Sardor Menejer', '+998901112200', 'Menejer', 'Boshqaruv', '2025-01-15',
        (SELECT id FROM users WHERE username = 'manager'), false);

INSERT INTO employees (full_name, phone, position, department, hire_date, user_id,
    is_technician, technician_skills, max_daily_installations)
VALUES ('Jasur O''rnatuvchi', '+998901112201', 'O''rnatuvchi', 'O''rnatish bo''limi', '2025-03-01',
        (SELECT id FROM users WHERE username = 'installer'), true,
        'Roletka, Vertikal jalyuzi, Gorizontal jalyuzi, Rim pardasi', 4);

-- =====================================================
-- 4. Buyurtmalar (5 ta, turli statuslarda)
-- =====================================================

-- Buyurtma 1: YAKUNLANDI (to'liq lifecycle)
INSERT INTO orders (order_number, customer_id, status, installation_address,
    manager_id, installer_id,
    subtotal, discount_amount, discount_percent, total_amount, paid_amount, remaining_amount,
    measurement_date, production_start_date, production_end_date, installation_date, completed_date,
    notes, created_by, created_at)
VALUES ('ORD-2026-0001', 1, 'YAKUNLANDI', 'Toshkent sh., Chilonzor tumani, 7-kvartal 15-uy',
    (SELECT id FROM users WHERE username = 'manager'),
    (SELECT id FROM users WHERE username = 'installer'),
    1818000, 90900, 5, 1727100, 1727100, 0,
    '2026-01-10 10:00:00', '2026-01-12 09:00:00', '2026-01-15 17:00:00',
    '2026-01-17 09:00:00', '2026-01-17 16:00:00',
    'Birinchi muvaffaqiyatli buyurtma', 1, '2026-01-08 14:30:00');

-- Buyurtma 2: ORNATISH_JARAYONIDA (installer hozir o'rnatmoqda)
INSERT INTO orders (order_number, customer_id, status, installation_address,
    manager_id, installer_id,
    subtotal, discount_amount, discount_percent, total_amount, paid_amount, remaining_amount,
    measurement_date, production_start_date, production_end_date, installation_date,
    notes, created_by, created_at)
VALUES ('ORD-2026-0002', 2, 'ORNATISH_JARAYONIDA', 'Toshkent sh., Yunusobod tumani, 4-mavze 22-uy',
    (SELECT id FROM users WHERE username = 'manager'),
    (SELECT id FROM users WHERE username = 'installer'),
    1785000, 0, 0, 1785000, 900000, 885000,
    '2026-02-15 11:00:00', '2026-02-18 09:00:00', '2026-02-22 17:00:00',
    '2026-03-09 09:00:00',
    'Ikkita xona uchun jalyuzi', 1, '2026-02-13 10:00:00');

-- Buyurtma 3: ISHLAB_CHIQARISHDA (ishlab chiqarish jarayonida)
INSERT INTO orders (order_number, customer_id, status, installation_address,
    manager_id,
    subtotal, discount_amount, discount_percent, total_amount, paid_amount, remaining_amount,
    measurement_date, production_start_date,
    notes, created_by, created_at)
VALUES ('ORD-2026-0003', 3, 'ISHLAB_CHIQARISHDA', 'Toshkent sh., Sergeli tumani, Sanoat ko''chasi 15',
    (SELECT id FROM users WHERE username = 'manager'),
    4265000, 213250, 5, 4051750, 2025000, 2026750,
    '2026-02-28 10:00:00', '2026-03-03 09:00:00',
    'Ofis uchun katta buyurtma - 5 ta deraza', 1, '2026-02-25 09:30:00');

-- Buyurtma 4: OLCHOV_KUTILMOQDA (boshlang'ich bosqich)
INSERT INTO orders (order_number, customer_id, status, installation_address,
    manager_id,
    subtotal, total_amount, paid_amount, remaining_amount,
    notes, created_by, created_at)
VALUES ('ORD-2026-0004', 4, 'OLCHOV_KUTILMOQDA', 'Samarqand sh., Registon ko''chasi 10',
    (SELECT id FROM users WHERE username = 'manager'),
    0, 0, 0, 0,
    'O''lchov uchun texnik tayinlanishi kerak', 1, '2026-03-07 15:00:00');

-- Buyurtma 5: ORNATISHGA_TAYINLANDI (bugunga tayinlangan)
INSERT INTO orders (order_number, customer_id, status, installation_address,
    manager_id, installer_id,
    subtotal, discount_amount, discount_percent, total_amount, paid_amount, remaining_amount,
    measurement_date, production_start_date, production_end_date, installation_date,
    notes, created_by, created_at)
VALUES ('ORD-2026-0005', 1, 'ORNATISHGA_TAYINLANDI', 'Toshkent sh., Chilonzor tumani, 19-kvartal 8-uy',
    (SELECT id FROM users WHERE username = 'manager'),
    (SELECT id FROM users WHERE username = 'installer'),
    568400, 0, 0, 568400, 280000, 288400,
    '2026-03-01 10:00:00', '2026-03-03 09:00:00', '2026-03-07 17:00:00',
    '2026-03-09 14:00:00',
    'Oshxona uchun roletka', 1, '2026-02-28 11:00:00');

-- =====================================================
-- 5. Buyurtma elementlari (order_items)
-- =====================================================

-- Buyurtma 1: 2 ta element
INSERT INTO order_items (order_id, product_id, room_name, width_mm, height_mm, calculated_sqm,
    quantity, unit_price, installation_price, total_price, cost_price, installation_included)
VALUES
(
    (SELECT id FROM orders WHERE order_number = 'ORD-2026-0001'),
    (SELECT id FROM products WHERE sku = 'JL-ROL-001'),
    'Yotoqxona', 1500, 1800, 2.7000, 1, 486000, 50000, 536000, 405000, true
),
(
    (SELECT id FROM orders WHERE order_number = 'ORD-2026-0001'),
    (SELECT id FROM products WHERE sku = 'JL-ROL-002'),
    'Mehmonxona', 2000, 2200, 4.4000, 1, 1232000, 50000, 1282000, 1100000, true
);

-- Buyurtma 2: 2 ta element
INSERT INTO order_items (order_id, product_id, room_name, width_mm, height_mm, calculated_sqm,
    quantity, unit_price, installation_price, total_price, cost_price, installation_included)
VALUES
(
    (SELECT id FROM orders WHERE order_number = 'ORD-2026-0002'),
    (SELECT id FROM products WHERE sku = 'JL-VER-001'),
    'Yotoqxona', 2500, 2400, 6.0000, 1, 1320000, 60000, 1380000, 1200000, true
),
(
    (SELECT id FROM orders WHERE order_number = 'ORD-2026-0002'),
    (SELECT id FROM products WHERE sku = 'JL-GOR-001'),
    'Oshxona', 1200, 1500, 1.8000, 1, 360000, 45000, 405000, 324000, true
);

-- Buyurtma 3: 3 ta element (ofis — katta buyurtma)
INSERT INTO order_items (order_id, product_id, room_name, width_mm, height_mm, calculated_sqm,
    quantity, unit_price, installation_price, total_price, cost_price, installation_included)
VALUES
(
    (SELECT id FROM orders WHERE order_number = 'ORD-2026-0003'),
    (SELECT id FROM products WHERE sku = 'JL-VER-001'),
    'Kabinet 1', 3000, 2500, 7.5000, 1, 1650000, 60000, 1710000, 1500000, true
),
(
    (SELECT id FROM orders WHERE order_number = 'ORD-2026-0003'),
    (SELECT id FROM products WHERE sku = 'JL-VER-001'),
    'Kabinet 2', 3000, 2500, 7.5000, 1, 1650000, 60000, 1710000, 1500000, true
),
(
    (SELECT id FROM orders WHERE order_number = 'ORD-2026-0003'),
    (SELECT id FROM products WHERE sku = 'JL-GOR-001'),
    'Qabul xonasi', 2000, 2000, 4.0000, 1, 800000, 45000, 845000, 720000, true
);

-- Buyurtma 4: hali o'lchov yo'q, element yo'q

-- Buyurtma 5: 1 ta element
INSERT INTO order_items (order_id, product_id, room_name, width_mm, height_mm, calculated_sqm,
    quantity, unit_price, installation_price, total_price, cost_price, installation_included)
VALUES
(
    (SELECT id FROM orders WHERE order_number = 'ORD-2026-0005'),
    (SELECT id FROM products WHERE sku = 'JL-ROL-001'),
    'Oshxona', 1800, 1600, 2.8800, 1, 518400, 50000, 568400, 432000, true
);

-- =====================================================
-- 6. To'lovlar (order_payments)
-- =====================================================

-- Buyurtma 1: DEPOSIT + FINAL_PAYMENT (ikkalasi tasdiqlangan)
INSERT INTO order_payments (order_id, payment_type, amount, payment_method,
    collected_by, confirmed_by, is_confirmed, notes, created_at)
VALUES
(
    (SELECT id FROM orders WHERE order_number = 'ORD-2026-0001'),
    'DEPOSIT', 860000, 'CASH',
    (SELECT id FROM users WHERE username = 'installer'),
    (SELECT id FROM users WHERE username = 'manager'),
    true, 'Zaklad to''lovi', '2026-01-10 15:00:00'
),
(
    (SELECT id FROM orders WHERE order_number = 'ORD-2026-0001'),
    'FINAL_PAYMENT', 867100, 'TRANSFER',
    (SELECT id FROM users WHERE username = 'installer'),
    (SELECT id FROM users WHERE username = 'manager'),
    true, 'Yakuniy to''lov', '2026-01-17 16:30:00'
);

-- Buyurtma 2: DEPOSIT (tasdiqlangan)
INSERT INTO order_payments (order_id, payment_type, amount, payment_method,
    collected_by, confirmed_by, is_confirmed, notes, created_at)
VALUES
(
    (SELECT id FROM orders WHERE order_number = 'ORD-2026-0002'),
    'DEPOSIT', 900000, 'CASH',
    (SELECT id FROM users WHERE username = 'seller'),
    (SELECT id FROM users WHERE username = 'manager'),
    true, 'Zaklad - 50%', '2026-02-15 12:00:00'
);

-- Buyurtma 3: DEPOSIT (tasdiqlangan)
INSERT INTO order_payments (order_id, payment_type, amount, payment_method,
    collected_by, confirmed_by, is_confirmed, notes, created_at)
VALUES
(
    (SELECT id FROM orders WHERE order_number = 'ORD-2026-0003'),
    'DEPOSIT', 2025000, 'TRANSFER',
    (SELECT id FROM users WHERE username = 'manager'),
    (SELECT id FROM users WHERE username = 'manager'),
    true, 'Ofis buyurtmasi uchun zaklad - 50%', '2026-02-28 14:00:00'
);

-- Buyurtma 5: DEPOSIT (tasdiqlanmagan — installer yig'gan)
INSERT INTO order_payments (order_id, payment_type, amount, payment_method,
    collected_by, is_confirmed, notes, created_at)
VALUES
(
    (SELECT id FROM orders WHERE order_number = 'ORD-2026-0005'),
    'DEPOSIT', 280000, 'CASH',
    (SELECT id FROM users WHERE username = 'installer'),
    false, 'Installer tomonidan yig''ilgan zaklad', '2026-03-01 11:00:00'
);

-- =====================================================
-- 7. Status tarixi (order_status_history)
-- =====================================================

-- Buyurtma 1: YANGI → ... → YAKUNLANDI (to'liq lifecycle)
INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, notes, created_at)
VALUES
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0001'), NULL, 'YANGI', 1, 'Buyurtma yaratildi', '2026-01-08 14:30:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0001'), 'YANGI', 'OLCHOV_KUTILMOQDA', 1, NULL, '2026-01-08 14:35:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0001'), 'OLCHOV_KUTILMOQDA', 'OLCHOV_BAJARILDI', 1, 'O''lchovlar kiritildi', '2026-01-10 12:00:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0001'), 'OLCHOV_BAJARILDI', 'NARX_TASDIQLANDI', (SELECT id FROM users WHERE username = 'manager'), 'Narx tasdiqlandi', '2026-01-10 14:00:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0001'), 'NARX_TASDIQLANDI', 'ZAKLAD_QABUL_QILINDI', (SELECT id FROM users WHERE username = 'manager'), 'Zaklad qabul qilindi', '2026-01-10 15:00:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0001'), 'ZAKLAD_QABUL_QILINDI', 'ISHLAB_CHIQARISHDA', (SELECT id FROM users WHERE username = 'manager'), NULL, '2026-01-12 09:00:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0001'), 'ISHLAB_CHIQARISHDA', 'TAYYOR', (SELECT id FROM users WHERE username = 'manager'), 'Ishlab chiqarish tugadi', '2026-01-15 17:00:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0001'), 'TAYYOR', 'ORNATISHGA_TAYINLANDI', (SELECT id FROM users WHERE username = 'manager'), 'Installerga tayinlandi', '2026-01-16 10:00:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0001'), 'ORNATISHGA_TAYINLANDI', 'ORNATISH_JARAYONIDA', (SELECT id FROM users WHERE username = 'installer'), NULL, '2026-01-17 09:00:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0001'), 'ORNATISH_JARAYONIDA', 'ORNATISH_BAJARILDI', (SELECT id FROM users WHERE username = 'installer'), 'O''rnatish muvaffaqiyatli bajarildi', '2026-01-17 14:00:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0001'), 'ORNATISH_BAJARILDI', 'TOLOV_KUTILMOQDA', (SELECT id FROM users WHERE username = 'manager'), NULL, '2026-01-17 14:30:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0001'), 'TOLOV_KUTILMOQDA', 'YAKUNLANDI', (SELECT id FROM users WHERE username = 'manager'), 'Buyurtma yakunlandi', '2026-01-17 17:00:00');

-- Buyurtma 2: YANGI → ... → ORNATISH_JARAYONIDA
INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, notes, created_at)
VALUES
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0002'), NULL, 'YANGI', 1, 'Buyurtma yaratildi', '2026-02-13 10:00:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0002'), 'YANGI', 'OLCHOV_KUTILMOQDA', 1, NULL, '2026-02-13 10:05:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0002'), 'OLCHOV_KUTILMOQDA', 'OLCHOV_BAJARILDI', 1, NULL, '2026-02-15 12:00:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0002'), 'OLCHOV_BAJARILDI', 'NARX_TASDIQLANDI', (SELECT id FROM users WHERE username = 'manager'), NULL, '2026-02-15 14:00:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0002'), 'NARX_TASDIQLANDI', 'ZAKLAD_QABUL_QILINDI', (SELECT id FROM users WHERE username = 'manager'), NULL, '2026-02-15 15:00:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0002'), 'ZAKLAD_QABUL_QILINDI', 'ISHLAB_CHIQARISHDA', (SELECT id FROM users WHERE username = 'manager'), NULL, '2026-02-18 09:00:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0002'), 'ISHLAB_CHIQARISHDA', 'TAYYOR', (SELECT id FROM users WHERE username = 'manager'), NULL, '2026-02-22 17:00:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0002'), 'TAYYOR', 'ORNATISHGA_TAYINLANDI', (SELECT id FROM users WHERE username = 'manager'), NULL, '2026-03-08 16:00:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0002'), 'ORNATISHGA_TAYINLANDI', 'ORNATISH_JARAYONIDA', (SELECT id FROM users WHERE username = 'installer'), 'O''rnatish boshlandi', '2026-03-09 09:30:00');

-- Buyurtma 3: YANGI → ... → ISHLAB_CHIQARISHDA
INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, notes, created_at)
VALUES
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0003'), NULL, 'YANGI', 1, 'Buyurtma yaratildi', '2026-02-25 09:30:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0003'), 'YANGI', 'OLCHOV_KUTILMOQDA', 1, NULL, '2026-02-25 09:35:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0003'), 'OLCHOV_KUTILMOQDA', 'OLCHOV_BAJARILDI', 1, NULL, '2026-02-28 11:00:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0003'), 'OLCHOV_BAJARILDI', 'NARX_TASDIQLANDI', (SELECT id FROM users WHERE username = 'manager'), NULL, '2026-02-28 13:00:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0003'), 'NARX_TASDIQLANDI', 'ZAKLAD_QABUL_QILINDI', (SELECT id FROM users WHERE username = 'manager'), NULL, '2026-02-28 14:30:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0003'), 'ZAKLAD_QABUL_QILINDI', 'ISHLAB_CHIQARISHDA', (SELECT id FROM users WHERE username = 'manager'), 'Ishlab chiqarish boshlandi', '2026-03-03 09:00:00');

-- Buyurtma 4: YANGI → OLCHOV_KUTILMOQDA
INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, notes, created_at)
VALUES
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0004'), NULL, 'YANGI', 1, 'Buyurtma yaratildi', '2026-03-07 15:00:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0004'), 'YANGI', 'OLCHOV_KUTILMOQDA', (SELECT id FROM users WHERE username = 'manager'), 'O''lchov uchun tayinlandi', '2026-03-07 15:30:00');

-- Buyurtma 5: YANGI → ... → ORNATISHGA_TAYINLANDI
INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, notes, created_at)
VALUES
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0005'), NULL, 'YANGI', 1, 'Buyurtma yaratildi', '2026-02-28 11:00:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0005'), 'YANGI', 'OLCHOV_KUTILMOQDA', 1, NULL, '2026-02-28 11:05:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0005'), 'OLCHOV_KUTILMOQDA', 'OLCHOV_BAJARILDI', 1, NULL, '2026-03-01 10:00:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0005'), 'OLCHOV_BAJARILDI', 'NARX_TASDIQLANDI', (SELECT id FROM users WHERE username = 'manager'), NULL, '2026-03-01 11:00:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0005'), 'NARX_TASDIQLANDI', 'ZAKLAD_QABUL_QILINDI', (SELECT id FROM users WHERE username = 'manager'), NULL, '2026-03-01 12:00:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0005'), 'ZAKLAD_QABUL_QILINDI', 'ISHLAB_CHIQARISHDA', (SELECT id FROM users WHERE username = 'manager'), NULL, '2026-03-03 09:00:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0005'), 'ISHLAB_CHIQARISHDA', 'TAYYOR', (SELECT id FROM users WHERE username = 'manager'), NULL, '2026-03-07 17:00:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2026-0005'), 'TAYYOR', 'ORNATISHGA_TAYINLANDI', (SELECT id FROM users WHERE username = 'manager'), 'Bugunga tayinlandi', '2026-03-08 18:00:00');
