-- SMS tasdiqlash jadvali
CREATE TABLE sms_verifications (
    id BIGSERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indekslar
CREATE INDEX idx_sms_verifications_phone ON sms_verifications(phone);
CREATE INDEX idx_sms_verifications_phone_code ON sms_verifications(phone, code);
CREATE INDEX idx_sms_verifications_expires_at ON sms_verifications(expires_at);

-- Eskirgan yozuvlarni tozalash uchun
CREATE INDEX idx_sms_verifications_verified ON sms_verifications(verified);

COMMENT ON TABLE sms_verifications IS 'SMS orqali telefon tasdiqlash';
COMMENT ON COLUMN sms_verifications.phone IS 'Telefon raqami (+998XXXXXXXXX formatida)';
COMMENT ON COLUMN sms_verifications.code IS '6 xonali tasdiqlash kodi';
COMMENT ON COLUMN sms_verifications.expires_at IS 'Kod amal qilish muddati';
COMMENT ON COLUMN sms_verifications.verified IS 'Tasdiqlandi yoki yo''q';
COMMENT ON COLUMN sms_verifications.attempts IS 'Noto''g''ri urinishlar soni';
