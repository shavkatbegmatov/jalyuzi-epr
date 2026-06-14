-- =====================================================
-- V46: Mijoz imzosi audit maydonlari
-- Imzo kim tomonidan va qachon qo'yilganini kuzatish (forensik audit) —
-- imzolangan akt yaxlitligi va kelib chiqishini tasdiqlash uchun.
-- =====================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS signature_saved_by BIGINT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS signature_saved_at TIMESTAMP;

ALTER TABLE orders
    ADD CONSTRAINT fk_orders_signature_saved_by
    FOREIGN KEY (signature_saved_by) REFERENCES users(id);
