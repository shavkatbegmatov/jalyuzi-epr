-- Customer source (marketing kanali) ustuni
-- Mijoz qayerdan kelganligini kuzatish: Instagram, Telegram, Tavsiya, Reklama, Boshqa

ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS source VARCHAR(30);

CREATE INDEX IF NOT EXISTS idx_customers_source
    ON customers(source)
    WHERE source IS NOT NULL;

COMMENT ON COLUMN customers.source IS 'Mijoz manbasi: INSTAGRAM, TELEGRAM, REFERRAL, ADVERTISEMENT, WEBSITE, WALK_IN, OTHER';
