-- Xodimning Telegram akkaunti (Telegram Mini App orqali avtomatik kirish uchun)
ALTER TABLE users ADD COLUMN telegram_user_id BIGINT;
ALTER TABLE users ADD COLUMN telegram_username VARCHAR(64);
ALTER TABLE users ADD COLUMN telegram_linked_at TIMESTAMP;

-- Bitta Telegram akkaunt faqat bitta xodimga ulanishi mumkin
CREATE UNIQUE INDEX uq_users_telegram_user_id ON users (telegram_user_id) WHERE telegram_user_id IS NOT NULL;

COMMENT ON COLUMN users.telegram_user_id IS 'Telegram foydalanuvchi ID (Mini App initData dagi user.id, bot bilan shaxsiy chat_id ga teng)';
COMMENT ON COLUMN users.telegram_username IS 'Telegram username (@ belgisisiz), faqat ko''rsatish uchun';
COMMENT ON COLUMN users.telegram_linked_at IS 'Telegram akkaunt ulangan vaqt';
