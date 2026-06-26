-- V55 da payment_method_settings jadvaliga BaseEntity'ning optimistik-lock ustuni
-- (version) qo'shilmagan edi. Hibernate `ddl-auto: validate` uni talab qiladi —
-- shusiz ilova ishga tushmaydi. IF NOT EXISTS: qo'lda qo'shilgan bo'lsa ham xavfsiz.
ALTER TABLE payment_method_settings ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;
