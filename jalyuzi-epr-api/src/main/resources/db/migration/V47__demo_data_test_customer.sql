-- V47: Test mijoz uchun boy DEMO ma'lumotlar (customer portal / kabinet demosi)
--
-- MAQSAD:
--   "Test Mijoz" (+998901234567, V6 da yaratilgan, PIN 1234) kabineti bo'sh
--   ko'rinmasligi uchun real ko'rinishdagi demo ma'lumotlar yaratadi:
--   xaridlar, qarzlar, buyurtmalar (turli statuslar), kafolat shikoyati va
--   bildirishnomalar. Shunda /kabinet/ portali to'liq va jonli ko'rinadi.
--
-- XAVFSIZLIK / ISHONCHLILIK:
--   * Butun blok DO ... EXCEPTION WHEN OTHERS ichida — agar biror xato bo'lsa,
--     o'zgarishlar to'liq qaytariladi (atomik) va migratsiya BARIBIR muvaffaqiyatli
--     hisoblanadi. Ya'ni bu seed hech qachon production deploy'ini buzmaydi.
--   * Idempotent: 'DEMO-INV-0001' marker bo'yicha tekshiradi — qayta ishga
--     tushirilsa takrorlamaydi.
--   * Test mijoz topilmasa yoki foydalanuvchi yo'q bo'lsa — jim o'tkazib yuboradi.
--   * Barcha demo yozuvlar 'DEMO-' prefiksi bilan belgilangan (oson tozalash uchun
--     pastdagi izohga qarang).
--
-- ESLATMA: bu test/demo ma'lumot. Real ishlatishdan oldin o'chirish mumkin.

DO $BODY$
DECLARE
    v_customer_id BIGINT;
    v_admin_id    BIGINT;
    v_p1          BIGINT;   -- Zebra jalyuzi (Demo)
    v_p2          BIGINT;   -- Rulonli jalyuzi (Demo)
    v_p3          BIGINT;   -- Kun-Tun jalyuzi (Demo)
    v_sale1       BIGINT;
    v_sale2       BIGINT;
    v_sale3       BIGINT;
    v_order1      BIGINT;
    v_order2      BIGINT;
    v_order3      BIGINT;
BEGIN
    -- ===== 1) Asosiy bog'lanishlar =====
    SELECT id INTO v_customer_id FROM customers WHERE phone = '+998901234567' LIMIT 1;
    IF v_customer_id IS NULL THEN
        RAISE NOTICE 'V47: test mijoz (+998901234567) topilmadi, demo qoldirildi';
        RETURN;
    END IF;

    -- Idempotency: demo allaqachon yuklanganmi?
    IF EXISTS (SELECT 1 FROM sales WHERE invoice_number = 'DEMO-INV-0001') THEN
        RAISE NOTICE 'V47: demo malumotlar allaqachon mavjud, qoldirildi';
        RETURN;
    END IF;

    SELECT id INTO v_admin_id FROM users WHERE username = 'admin' LIMIT 1;
    IF v_admin_id IS NULL THEN
        SELECT id INTO v_admin_id FROM users ORDER BY id LIMIT 1;
    END IF;
    IF v_admin_id IS NULL THEN
        RAISE NOTICE 'V47: foydalanuvchi topilmadi, demo qoldirildi';
        RETURN;
    END IF;

    -- ===== 2) Demo jalyuzi mahsulotlari (idempotent, SKU bo'yicha) =====
    INSERT INTO products (sku, name, selling_price, purchase_price, quantity, min_stock_level, price_per_sqm, active, created_by, created_at)
    VALUES ('DEMO-ZEBRA-01', $t$Zebra jalyuzi (Demo)$t$, 200000, 120000, 100, 5, 200000, TRUE, v_admin_id, NOW())
    ON CONFLICT (sku) DO NOTHING;
    SELECT id INTO v_p1 FROM products WHERE sku = 'DEMO-ZEBRA-01';

    INSERT INTO products (sku, name, selling_price, purchase_price, quantity, min_stock_level, price_per_sqm, active, created_by, created_at)
    VALUES ('DEMO-ROLLER-01', $t$Rulonli jalyuzi (Demo)$t$, 160000, 95000, 100, 5, 160000, TRUE, v_admin_id, NOW())
    ON CONFLICT (sku) DO NOTHING;
    SELECT id INTO v_p2 FROM products WHERE sku = 'DEMO-ROLLER-01';

    INSERT INTO products (sku, name, selling_price, purchase_price, quantity, min_stock_level, price_per_sqm, active, created_by, created_at)
    VALUES ('DEMO-DAYNIGHT-01', $t$Kun-Tun jalyuzi (Demo)$t$, 240000, 140000, 100, 5, 240000, TRUE, v_admin_id, NOW())
    ON CONFLICT (sku) DO NOTHING;
    SELECT id INTO v_p3 FROM products WHERE sku = 'DEMO-DAYNIGHT-01';

    -- ===== 3) XARIDLAR (sales) + sale_items =====
    -- SALE 1 — to'liq to'langan (naqd), 60 kun oldin
    INSERT INTO sales (invoice_number, customer_id, sale_date, subtotal, discount_amount, discount_percent, total_amount, paid_amount, debt_amount, payment_method, payment_status, status, notes, created_by, created_at)
    VALUES ('DEMO-INV-0001', v_customer_id, NOW() - INTERVAL '60 days', 2400000, 0, 0, 2400000, 2400000, 0, 'CASH', 'PAID', 'COMPLETED', $t$Mehmonxona va yotoqxona jalyuzilari$t$, v_admin_id, NOW() - INTERVAL '60 days')
    RETURNING id INTO v_sale1;
    INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, discount, total_price, created_at) VALUES
        (v_sale1, v_p1, 1, 1400000, 0, 1400000, NOW() - INTERVAL '60 days'),
        (v_sale1, v_p2, 1, 1000000, 0, 1000000, NOW() - INTERVAL '60 days');

    -- SALE 2 — to'liq to'langan (karta), 30 kun oldin
    INSERT INTO sales (invoice_number, customer_id, sale_date, subtotal, discount_amount, discount_percent, total_amount, paid_amount, debt_amount, payment_method, payment_status, status, notes, created_by, created_at)
    VALUES ('DEMO-INV-0002', v_customer_id, NOW() - INTERVAL '30 days', 1650000, 0, 0, 1650000, 1650000, 0, 'CARD', 'PAID', 'COMPLETED', $t$Oshxona uchun kun-tun jalyuzi$t$, v_admin_id, NOW() - INTERVAL '30 days')
    RETURNING id INTO v_sale2;
    INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, discount, total_price, created_at) VALUES
        (v_sale2, v_p3, 1, 1650000, 0, 1650000, NOW() - INTERVAL '30 days');

    -- SALE 3 — qisman to'langan (PARTIAL), 12 kun oldin -> 1 200 000 qarz
    INSERT INTO sales (invoice_number, customer_id, sale_date, subtotal, discount_amount, discount_percent, total_amount, paid_amount, debt_amount, payment_method, payment_status, status, notes, created_by, created_at)
    VALUES ('DEMO-INV-0003', v_customer_id, NOW() - INTERVAL '12 days', 3000000, 0, 0, 3000000, 1800000, 1200000, 'CASH', 'PARTIAL', 'COMPLETED', $t$Bolalar xonasi va oshxona; qoldiq to'lov qarzga$t$, v_admin_id, NOW() - INTERVAL '12 days')
    RETURNING id INTO v_sale3;
    INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, discount, total_price, created_at) VALUES
        (v_sale3, v_p2, 1, 1200000, 0, 1200000, NOW() - INTERVAL '12 days'),
        (v_sale3, v_p3, 1, 1800000, 0, 1800000, NOW() - INTERVAL '12 days');

    -- ===== 4) QARZLAR (debts) =====
    -- ACTIVE qarz (SALE 3 dan)
    INSERT INTO debts (customer_id, sale_id, original_amount, remaining_amount, due_date, status, notes, created_at)
    VALUES (v_customer_id, v_sale3, 1200000, 1200000, (NOW() + INTERVAL '18 days')::date, 'ACTIVE', $t$Oshxona/bolalar xonasi jalyuzilari uchun qoldiq to'lov$t$, NOW() - INTERVAL '12 days');
    -- PAID qarz (tarixiy, to'langan)
    INSERT INTO debts (customer_id, sale_id, original_amount, remaining_amount, due_date, status, notes, created_at)
    VALUES (v_customer_id, NULL, 800000, 0, (NOW() - INTERVAL '40 days')::date, 'PAID', $t$Avvalgi to'langan qarz$t$, NOW() - INTERVAL '70 days');

    -- ===== 5) Mijoz balansi (active qarz bilan moslab: manfiy = qarzdor) =====
    UPDATE customers SET balance = -1200000, updated_at = NOW() WHERE id = v_customer_id;

    -- ===== 6) BUYURTMALAR (orders) + order_items =====
    -- ORDER 1 — YAKUNLANDI (to'liq sikl bajarilgan, SALE 1 bilan bog'liq)
    INSERT INTO orders (order_number, customer_id, status, installation_address, manager_id, subtotal, total_amount, paid_amount, remaining_amount, sale_id, notes, created_by, created_at, measurement_date, installation_date, completed_date)
    VALUES ('DEMO-ORD-0001', v_customer_id, 'YAKUNLANDI', $t$Toshkent sh., Chilonzor t., Bunyodkor ko'chasi 12-uy$t$, v_admin_id, 2400000, 2400000, 2400000, 0, v_sale1, $t$Mehmonxona + yotoqxona — o'rnatildi va yakunlandi$t$, v_admin_id, NOW() - INTERVAL '65 days', NOW() - INTERVAL '63 days', NOW() - INTERVAL '59 days', NOW() - INTERVAL '58 days')
    RETURNING id INTO v_order1;
    INSERT INTO order_items (order_id, product_id, room_name, width_mm, height_mm, calculated_sqm, quantity, unit_price, installation_price, discount, total_price, installation_included, created_at) VALUES
        (v_order1, v_p1, $t$Mehmonxona$t$, 1500, 2000, 3.0, 1, 1400000, 100000, 0, 1400000, TRUE, NOW() - INTERVAL '65 days'),
        (v_order1, v_p2, $t$Yotoqxona$t$,  1200, 1500, 1.8, 1, 1000000,  80000, 0, 1000000, TRUE, NOW() - INTERVAL '65 days');

    -- ORDER 2 — ISHLAB_CHIQARISHDA (50% zaklad to'langan)
    INSERT INTO orders (order_number, customer_id, status, installation_address, manager_id, subtotal, total_amount, paid_amount, remaining_amount, notes, created_by, created_at, measurement_date, production_start_date)
    VALUES ('DEMO-ORD-0002', v_customer_id, 'ISHLAB_CHIQARISHDA', $t$Toshkent sh., Yunusobod t., Amir Temur ko'chasi 45-uy$t$, v_admin_id, 4500000, 4500000, 2250000, 2250000, $t$Oshxona va bolalar xonasi; ishlab chiqarishda$t$, v_admin_id, NOW() - INTERVAL '20 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '15 days')
    RETURNING id INTO v_order2;
    INSERT INTO order_items (order_id, product_id, room_name, width_mm, height_mm, calculated_sqm, quantity, unit_price, installation_price, discount, total_price, installation_included, created_at) VALUES
        (v_order2, v_p3, $t$Oshxona$t$,        1800, 1400, 2.52, 1, 2500000, 120000, 0, 2500000, TRUE, NOW() - INTERVAL '20 days'),
        (v_order2, v_p2, $t$Bolalar xonasi$t$, 1600, 1500, 2.40, 1, 2000000, 100000, 0, 2000000, TRUE, NOW() - INTERVAL '20 days');

    -- ORDER 3 — OLCHOV_KUTILMOQDA (yangi, o'lchov kutilmoqda)
    INSERT INTO orders (order_number, customer_id, status, installation_address, manager_id, subtotal, total_amount, paid_amount, remaining_amount, notes, created_by, created_at)
    VALUES ('DEMO-ORD-0003', v_customer_id, 'OLCHOV_KUTILMOQDA', $t$Toshkent sh., Mirzo Ulug'bek t., Buyuk Ipak Yuli 78-uy$t$, v_admin_id, 0, 0, 0, 0, $t$Balkon uchun yangi buyurtma; o'lchov tayinlanmoqda$t$, v_admin_id, NOW() - INTERVAL '3 days')
    RETURNING id INTO v_order3;
    INSERT INTO order_items (order_id, product_id, room_name, quantity, unit_price, installation_price, discount, total_price, installation_included, created_at) VALUES
        (v_order3, v_p1, $t$Balkon$t$, 1, 0, 0, 0, 0, TRUE, NOW() - INTERVAL '3 days');

    -- ===== 6b) Buyurtma status tarixi (timeline) =====
    INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, notes, created_at) VALUES
        (v_order1, NULL,                   'YANGI',                v_admin_id, $t$Buyurtma yaratildi$t$,            NOW() - INTERVAL '65 days'),
        (v_order1, 'YANGI',                'OLCHOV_BAJARILDI',     v_admin_id, NULL,                              NOW() - INTERVAL '63 days'),
        (v_order1, 'OLCHOV_BAJARILDI',     'ZAKLAD_QABUL_QILINDI', v_admin_id, NULL,                              NOW() - INTERVAL '62 days'),
        (v_order1, 'ZAKLAD_QABUL_QILINDI', 'ISHLAB_CHIQARISHDA',   v_admin_id, NULL,                              NOW() - INTERVAL '62 days'),
        (v_order1, 'ISHLAB_CHIQARISHDA',   'TAYYOR',               v_admin_id, NULL,                              NOW() - INTERVAL '60 days'),
        (v_order1, 'TAYYOR',               'ORNATISH_JARAYONIDA',  v_admin_id, NULL,                              NOW() - INTERVAL '59 days'),
        (v_order1, 'ORNATISH_JARAYONIDA',  'ORNATISH_BAJARILDI',   v_admin_id, NULL,                              NOW() - INTERVAL '59 days'),
        (v_order1, 'ORNATISH_BAJARILDI',   'YAKUNLANDI',           v_admin_id, $t$To'liq to'landi va yakunlandi$t$, NOW() - INTERVAL '58 days'),
        (v_order2, NULL,                   'YANGI',                v_admin_id, $t$Buyurtma yaratildi$t$,            NOW() - INTERVAL '20 days'),
        (v_order2, 'YANGI',                'OLCHOV_BAJARILDI',     v_admin_id, NULL,                              NOW() - INTERVAL '18 days'),
        (v_order2, 'OLCHOV_BAJARILDI',     'ISHLAB_CHIQARISHDA',   v_admin_id, $t$50% zaklad qabul qilindi$t$,     NOW() - INTERVAL '15 days'),
        (v_order3, NULL,                   'YANGI',                v_admin_id, $t$Buyurtma yaratildi$t$,            NOW() - INTERVAL '3 days'),
        (v_order3, 'YANGI',                'OLCHOV_KUTILMOQDA',    v_admin_id, $t$O'lchovchi tayinlanishi kutilmoqda$t$, NOW() - INTERVAL '3 days');

    -- ===== 7) BILDIRISHNOMALAR (customer_notifications) — uz+ru, 2 ta o'qilmagan =====
    INSERT INTO customer_notifications (customer_id, title_uz, title_ru, message_uz, message_ru, notification_type, is_read, read_at, created_at) VALUES
        (v_customer_id, $t$To'lov qabul qilindi$t$, $t$Платёж принят$t$,
         $t$2 400 000 so'm to'lovingiz muvaffaqiyatli qabul qilindi. Rahmat!$t$,
         $t$Ваш платёж 2 400 000 сум успешно принят. Спасибо!$t$,
         'PAYMENT_RECEIVED', TRUE, NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days'),
        (v_customer_id, $t$Buyurtma yakunlandi$t$, $t$Заказ завершён$t$,
         $t$DEMO-ORD-0001 buyurtmangiz o'rnatildi va yakunlandi.$t$,
         $t$Ваш заказ DEMO-ORD-0001 установлен и завершён.$t$,
         'SYSTEM', TRUE, NOW() - INTERVAL '58 days', NOW() - INTERVAL '58 days'),
        (v_customer_id, $t$To'lov qabul qilindi$t$, $t$Платёж принят$t$,
         $t$1 650 000 so'm to'lovingiz qabul qilindi.$t$,
         $t$Ваш платёж 1 650 000 сум принят.$t$,
         'PAYMENT_RECEIVED', TRUE, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
        (v_customer_id, $t$Ishlab chiqarish boshlandi$t$, $t$Производство началось$t$,
         $t$DEMO-ORD-0002 buyurtmangiz ishlab chiqarishga qabul qilindi.$t$,
         $t$Ваш заказ DEMO-ORD-0002 принят в производство.$t$,
         'SYSTEM', TRUE, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
        (v_customer_id, $t$Qarz eslatmasi$t$, $t$Напоминание о задолженности$t$,
         $t$Sizda 1 200 000 so'm to'lanmagan qarz mavjud. Iltimos, vaqtida to'lang.$t$,
         $t$У вас есть непогашенная задолженность 1 200 000 сум. Пожалуйста, оплатите вовремя.$t$,
         'DEBT_REMINDER', FALSE, NULL, NOW() - INTERVAL '2 days'),
        (v_customer_id, $t$Mavsumiy chegirma!$t$, $t$Сезонная скидка!$t$,
         $t$Barcha rulonli jalyuzilarga 15% chegirma! Shoshiling.$t$,
         $t$Скидка 15% на все рулонные жалюзи! Успейте.$t$,
         'PROMOTION', FALSE, NULL, NOW() - INTERVAL '1 days');

    -- ===== 8) KAFOLAT shikoyati (warranty_claims) — ORDER 1 ga, hal qilingan =====
    INSERT INTO warranty_claims (claim_number, order_id, customer_id, issue_type, issue_description, status, priority, assigned_to, resolution, is_warranty_covered, cost_to_customer, submitted_by, created_at, resolved_at)
    VALUES ('DEMO-CLM-0001', v_order1, v_customer_id, 'MECHANISM',
            $t$Mehmonxona zebra jalyuzi mexanizmi ko'tarishda taqilib qolyapti.$t$,
            'RESOLVED', 3, v_admin_id,
            $t$Mexanizm kafolat ostida bepul almashtirildi.$t$,
            TRUE, 0, v_admin_id, NOW() - INTERVAL '45 days', NOW() - INTERVAL '40 days');

    RAISE NOTICE 'V47: demo malumotlar muvaffaqiyatli yuklandi (mijoz id=%)', v_customer_id;

EXCEPTION WHEN OTHERS THEN
    -- Har qanday xatoda: hammasi qaytariladi, deploy buzilmaydi.
    RAISE NOTICE 'V47: demo malumotlarni yuklashda xato, qoldirildi: %', SQLERRM;
END
$BODY$;

-- =====================================================================
-- DEMO MA'LUMOTLARNI TOZALASH (kerak bo'lsa, qo'lda ishga tushiring):
-- =====================================================================
-- DELETE FROM warranty_claims WHERE claim_number LIKE 'DEMO-%';
-- DELETE FROM order_status_history WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'DEMO-%');
-- DELETE FROM order_items  WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'DEMO-%');
-- DELETE FROM orders       WHERE order_number LIKE 'DEMO-%';
-- DELETE FROM debts        WHERE sale_id IN (SELECT id FROM sales WHERE invoice_number LIKE 'DEMO-%')
--                             OR (customer_id = (SELECT id FROM customers WHERE phone = '+998901234567') AND notes LIKE '%to''langan qarz%');
-- DELETE FROM sale_items   WHERE sale_id IN (SELECT id FROM sales WHERE invoice_number LIKE 'DEMO-%');
-- DELETE FROM sales        WHERE invoice_number LIKE 'DEMO-%';
-- DELETE FROM customer_notifications WHERE customer_id = (SELECT id FROM customers WHERE phone = '+998901234567');
-- DELETE FROM products     WHERE sku LIKE 'DEMO-%';
-- UPDATE customers SET balance = 0 WHERE phone = '+998901234567';
