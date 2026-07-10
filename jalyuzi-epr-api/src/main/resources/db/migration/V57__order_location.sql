-- Buyurtma o'rnatish joyining geolokatsiyasi (xaritadan tanlanadi, Telegram'ga yuboriladi)
ALTER TABLE orders ADD COLUMN location_lat NUMERIC(10, 7);
ALTER TABLE orders ADD COLUMN location_lng NUMERIC(10, 7);

COMMENT ON COLUMN orders.location_lat IS 'O''rnatish joyi kengligi (latitude, WGS84)';
COMMENT ON COLUMN orders.location_lng IS 'O''rnatish joyi uzunligi (longitude, WGS84)';
