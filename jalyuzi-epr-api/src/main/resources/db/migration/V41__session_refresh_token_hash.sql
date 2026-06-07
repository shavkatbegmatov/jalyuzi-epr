-- Staff refresh oqimini tuzatish: sessiyani access-token hash o'rniga
-- refresh-token hash bo'yicha ham topib, joyida rotate qilish imkonini beradi.
-- Avval: refresh yangi access token bersa-da, sessiya eski (muddati o'tgan)
-- access-token hash'ida qolar edi -> filtr har bir so'rovni rad etib 401 qaytarardi.
ALTER TABLE sessions ADD COLUMN refresh_token_hash VARCHAR(64);

-- NULL ruxsat etilgan (bu migratsiyadan oldin yaratilgan eski qatorlar uchun).
-- PostgreSQL bir nechta NULL'ni dublikat deb hisoblamaydi, shuning uchun
-- UNIQUE index xavfsiz: eski qatorlar buzilmaydi.
CREATE UNIQUE INDEX idx_sessions_refresh_token_hash ON sessions (refresh_token_hash);

COMMENT ON COLUMN sessions.refresh_token_hash IS 'JWT refresh token SHA-256 hash (refresh paytida sessiyani rotate qilish uchun)';
