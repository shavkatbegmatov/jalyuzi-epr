-- =====================================================
-- V54: Do'kon (onlayn) buyurtmalari uchun sales.created_by NULL bo'lishi mumkin
-- Mijoz o'zi onlayn-do'kondан buyurtma berganda xodim (created_by) bo'lmaydi.
-- Ilgari NOT NULL bo'lgani uchun shop checkout 500 xato berardi.
-- =====================================================

ALTER TABLE sales ALTER COLUMN created_by DROP NOT NULL;
