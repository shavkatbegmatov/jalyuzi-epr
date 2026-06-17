-- =====================================================
-- V52: "O'lchovdan keyin" — zaklad follow-up avtomatizatsiyasi
-- Narx tasdiqlangan, lekin zaklad to'lanmagan buyurtmalar uchun avtomatik
-- eslatma yuboriladi. Takror yubormaslik uchun yuborilgan vaqt saqlanadi.
-- =====================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS quote_followup_sent_at TIMESTAMP;
