-- ============================================================
-- PAYMENT SCHEDULES — Sprint 4
-- Buyurtma bo'yicha to'lov bo'laklari (50%/30%/20% kabi rejalar)
-- ============================================================
-- Jalyuzi biznesida odatdagi rejim:
--   1. 50% avans → ishlab chiqarish boshlanadi (zaklad)
--   2. 30% tayyor bo'lganda (o'rnatish oldidan)
--   3. 20% o'rnatish bajarilganda (yakuniy)
-- Lekin har bir buyurtma uchun rejim moslashuvchan bo'lishi kerak.
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_schedules (
    id              BIGSERIAL PRIMARY KEY,
    order_id        BIGINT          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sequence_no     INTEGER         NOT NULL,        -- 1, 2, 3, ...
    label           VARCHAR(100)    NOT NULL,        -- 'Zaklad', 'Tayyor bo''lganda', 'Yakuniy'
    percentage      DECIMAL(5, 2),                   -- 50.00 (ixtiyoriy, faqat ma'lumot uchun)
    amount          DECIMAL(15, 2)  NOT NULL,        -- haqiqiy summa (so'm)
    due_date        DATE            NOT NULL,        -- to'lash kerakli sana
    status          VARCHAR(20)     NOT NULL DEFAULT 'PENDING',
    paid_at         TIMESTAMP,
    paid_amount     DECIMAL(15, 2)  DEFAULT 0,
    payment_id      BIGINT          REFERENCES order_payments(id) ON DELETE SET NULL,
    reminder_sent_at TIMESTAMP,
    notes           VARCHAR(500),
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version         BIGINT          NOT NULL DEFAULT 0,
    CONSTRAINT chk_ps_status   CHECK (status IN ('PENDING', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED')),
    CONSTRAINT chk_ps_sequence CHECK (sequence_no >= 1),
    CONSTRAINT chk_ps_amount   CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_ps_order      ON payment_schedules(order_id);
CREATE INDEX IF NOT EXISTS idx_ps_status     ON payment_schedules(status);
CREATE INDEX IF NOT EXISTS idx_ps_due_date   ON payment_schedules(due_date) WHERE status IN ('PENDING', 'PARTIAL');
CREATE UNIQUE INDEX IF NOT EXISTS uq_ps_order_sequence ON payment_schedules(order_id, sequence_no);

COMMENT ON TABLE  payment_schedules IS 'Order uchun to''lov rejasi bo''laklari (installments)';
COMMENT ON COLUMN payment_schedules.sequence_no IS 'Tartib raqami (1=zaklad, 2=oraliq, 3=yakuniy va h.k.)';
COMMENT ON COLUMN payment_schedules.percentage  IS 'Foiz (faqat ma''lumot uchun, hisob amount bilan)';
COMMENT ON COLUMN payment_schedules.payment_id  IS 'To''langan paytdagi order_payments yozuvi (audit trail)';

-- ============================================================
-- PERMISSIONS
-- ============================================================
INSERT INTO permissions (code, module, action, description)
VALUES
    ('PAYMENT_SCHEDULE_VIEW',   'PAYMENT_SCHEDULE', 'VIEW',   'To''lov rejasini ko''rish'),
    ('PAYMENT_SCHEDULE_MANAGE', 'PAYMENT_SCHEDULE', 'MANAGE', 'To''lov rejasini yaratish va o''zgartirish')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('ADMIN', 'MANAGER')
  AND p.code IN ('PAYMENT_SCHEDULE_VIEW', 'PAYMENT_SCHEDULE_MANAGE')
ON CONFLICT DO NOTHING;
