-- =====================================================
-- V49: Dala o'rnatuvchi SOS / eskalatsiya tizimi
-- O'rnatuvchi obyektda muammoga duch kelganda (noto'g'ri o'lcham, qism yo'q,
-- nuqsonli mahsulot, mijoz nizosi, kirish muammosi) tezkor "Yordam" so'rovi
-- yuboradi; barcha menejerlar real vaqtda (WebSocket) xabar oladi va hal qiladi.
-- Buyurtma statusiga tegmaydi — alohida overlay yozuv sifatida ishlaydi.
-- =====================================================

CREATE TABLE IF NOT EXISTS order_escalations (
    id               BIGSERIAL PRIMARY KEY,
    order_id         BIGINT NOT NULL REFERENCES orders(id),
    reason           VARCHAR(30) NOT NULL,
    description      TEXT,
    photo_url        VARCHAR(500),
    status           VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    created_by       BIGINT,
    created_by_name  VARCHAR(150),
    resolved_by      BIGINT,
    resolved_by_name VARCHAR(150),
    resolution_note  TEXT,
    created_at       TIMESTAMP NOT NULL DEFAULT now(),
    resolved_at      TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_order_escalations_status ON order_escalations (status);
CREATE INDEX IF NOT EXISTS ix_order_escalations_order ON order_escalations (order_id);
