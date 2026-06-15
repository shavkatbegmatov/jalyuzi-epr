-- =====================================================
-- V50: Joyida qayta o'lchov + narx qayta-hisoblash (menejer tasdig'i bilan)
-- O'rnatuvchi obyektda buyurtma mahsulotini qayta o'lchaydi, narx onlik qayta
-- hisoblanadi va menejerга tasdiqlash uchun yuboriladi. Tasdiqlangach buyurtma
-- mahsuloti o'lchami/narxi va buyurtma jamilari yangilanadi.
-- =====================================================

CREATE TABLE IF NOT EXISTS order_item_revisions (
    id                BIGSERIAL PRIMARY KEY,
    order_id          BIGINT NOT NULL REFERENCES orders(id),
    order_number      VARCHAR(30),
    order_item_id     BIGINT NOT NULL,
    product_name      VARCHAR(255),
    room_name         VARCHAR(100),
    old_width_mm      INTEGER,
    old_height_mm     INTEGER,
    old_total_price   NUMERIC(15, 2),
    new_width_mm      INTEGER,
    new_height_mm     INTEGER,
    new_total_price   NUMERIC(15, 2),
    delta             NUMERIC(15, 2),
    status            VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    note              TEXT,
    requested_by      BIGINT,
    requested_by_name VARCHAR(150),
    created_at        TIMESTAMP NOT NULL DEFAULT now(),
    decided_by        BIGINT,
    decided_by_name   VARCHAR(150),
    decision_note     TEXT,
    decided_at        TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_order_item_revisions_status ON order_item_revisions (status);
CREATE INDEX IF NOT EXISTS ix_order_item_revisions_order ON order_item_revisions (order_id);
