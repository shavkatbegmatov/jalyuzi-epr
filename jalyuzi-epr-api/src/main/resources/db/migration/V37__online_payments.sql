-- ============================================================
-- ONLINE PAYMENTS — Sprint 4.3 (Click / Payme webhook foundation)
-- ============================================================
-- Idempotency uchun har bir provider transaksiyasini saqlaymiz.
-- To'lov tasdiqlangach order_payments jadvaliga yoziladi.
-- ============================================================

CREATE TABLE IF NOT EXISTS online_payments (
    id                  BIGSERIAL PRIMARY KEY,
    provider            VARCHAR(20)     NOT NULL,        -- 'CLICK' yoki 'PAYME'
    provider_transaction_id VARCHAR(100) NOT NULL,       -- provider tomonidan berilgan ID
    order_id            BIGINT          REFERENCES orders(id) ON DELETE SET NULL,
    schedule_id         BIGINT          REFERENCES payment_schedules(id) ON DELETE SET NULL,
    amount              DECIMAL(15, 2)  NOT NULL,
    status              VARCHAR(20)     NOT NULL DEFAULT 'PENDING', -- PENDING, COMPLETED, CANCELLED, REJECTED
    raw_request         TEXT,                            -- webhook payload (debug uchun)
    raw_response        TEXT,
    error_message       VARCHAR(500),
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at        TIMESTAMP,
    payment_id          BIGINT          REFERENCES order_payments(id) ON DELETE SET NULL,
    version             BIGINT          NOT NULL DEFAULT 0,
    CONSTRAINT chk_online_provider CHECK (provider IN ('CLICK', 'PAYME')),
    CONSTRAINT chk_online_status   CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED', 'REJECTED'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_online_payment_provider_tx
    ON online_payments(provider, provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_online_payments_order   ON online_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_online_payments_status  ON online_payments(status);

COMMENT ON TABLE online_payments IS 'Click va Payme orqali kelayotgan onlayn to''lovlar (idempotency uchun)';
COMMENT ON COLUMN online_payments.provider_transaction_id IS 'Provider tomonidan berilgan unique ID — takror webhook qabul qilmaslik uchun';
