-- =====================================================
-- V51: Ishlab chiqarish bosqichiga kirish vaqti (dwell-time / bottleneck uchun)
-- Jonli wallboard kartalarini "bosqichda qancha turgani" bo'yicha issiqlik-rangga
-- bo'yash uchun har production order joriy bosqichga qachon kirgani saqlanadi.
-- =====================================================

ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS current_stage_entered_at TIMESTAMP;

-- Mavjud yozuvlar uchun: boshlangan/yaratilgan vaqtni boshlang'ich qiymat qilamiz
UPDATE production_orders
SET current_stage_entered_at = COALESCE(started_at, created_at)
WHERE current_stage_entered_at IS NULL;
