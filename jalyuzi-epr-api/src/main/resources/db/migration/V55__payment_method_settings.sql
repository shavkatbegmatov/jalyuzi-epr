-- To'lov usullari sozlamasi (admin paneldan boshqariladi)
-- Har bir PaymentMethod enum qiymati uchun bitta yozuv.

CREATE TABLE payment_method_settings (
    id           BIGSERIAL PRIMARY KEY,
    code         VARCHAR(20)  NOT NULL UNIQUE,
    label        VARCHAR(50)  NOT NULL,
    enabled      BOOLEAN      NOT NULL DEFAULT TRUE,
    shop_enabled BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order   INTEGER      NOT NULL DEFAULT 0,
    created_at   TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP
);

CREATE INDEX idx_payment_method_settings_sort ON payment_method_settings (sort_order);

-- Standart usullarni seed qilish.
-- MIXED (aralash) onlayn-do'kon uchun standart o'chirilgan — odatda self-service'da ishlatilmaydi.
INSERT INTO payment_method_settings (code, label, enabled, shop_enabled, sort_order) VALUES
    ('CASH',     'Naqd',            TRUE, TRUE,  1),
    ('CARD',     'Plastik karta',   TRUE, TRUE,  2),
    ('TRANSFER', 'Bank o''tkazmasi', TRUE, TRUE,  3),
    ('DEBT',     'Qarzga',          TRUE, TRUE,  4),
    ('MIXED',    'Aralash',         TRUE, FALSE, 5);
