-- Telegram bot integratsiyasi
-- Mijozlarning Telegram chat_id'sini saqlash (kelajakda bildirishnomalar uchun ham)

ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT;

CREATE INDEX IF NOT EXISTS idx_customers_telegram_chat_id
    ON customers(telegram_chat_id)
    WHERE telegram_chat_id IS NOT NULL;

-- Telefon-chat_id bog'liqligini saqlash jadvali
-- Ro'yxatdan o'tmagan foydalanuvchilar uchun
CREATE TABLE IF NOT EXISTS telegram_phone_links (
    id BIGSERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL UNIQUE,
    chat_id BIGINT NOT NULL,
    telegram_username VARCHAR(100),
    telegram_first_name VARCHAR(100),
    telegram_last_name VARCHAR(100),
    verified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_telegram_phone_links_chat_id
    ON telegram_phone_links(chat_id);

COMMENT ON TABLE telegram_phone_links IS 'Telefon raqam va Telegram chat_id bog''liqligi';
COMMENT ON COLUMN customers.telegram_chat_id IS 'Mijozning Telegram chat_id (bildirishnomalar yuborish uchun)';
