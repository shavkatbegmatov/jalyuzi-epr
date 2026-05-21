-- ============================================================
-- WARRANTY CLAIMS — Sprint 5
-- Mijoz shikoyatlari va kafolat xizmati
-- ============================================================
-- 2 ta yangi jadval:
--   warranty_claims  — mijoz shikoyati (mahsulot ishlamayapti, brak va h.k.)
--   service_visits   — usta tashrifi (claim'ni hal qilish uchun)
-- ============================================================

CREATE TABLE IF NOT EXISTS warranty_claims (
    id                  BIGSERIAL PRIMARY KEY,
    claim_number        VARCHAR(30)     NOT NULL UNIQUE,
    order_id            BIGINT          NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    customer_id         BIGINT          NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    issue_type          VARCHAR(30)     NOT NULL,        -- MECHANISM, FABRIC, MOTOR, INSTALLATION, OTHER
    issue_description   TEXT            NOT NULL,
    photos              JSONB           DEFAULT '[]'::jsonb,
    status              VARCHAR(20)     NOT NULL DEFAULT 'NEW',
    priority            INTEGER         NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    assigned_to         BIGINT          REFERENCES users(id) ON DELETE SET NULL,
    resolution          TEXT,
    is_warranty_covered BOOLEAN,                          -- NULL = hali aniqlanmagan
    cost_to_customer    DECIMAL(15, 2)  DEFAULT 0,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at         TIMESTAMP,
    closed_at           TIMESTAMP,
    submitted_by        BIGINT          REFERENCES users(id) ON DELETE SET NULL,
    version             BIGINT          NOT NULL DEFAULT 0,
    CONSTRAINT chk_wc_status CHECK (status IN ('NEW', 'IN_PROGRESS', 'WAITING_PARTS', 'RESOLVED', 'CLOSED', 'REJECTED')),
    CONSTRAINT chk_wc_issue  CHECK (issue_type IN ('MECHANISM', 'FABRIC', 'MOTOR', 'INSTALLATION', 'OTHER'))
);

CREATE INDEX IF NOT EXISTS idx_wc_order      ON warranty_claims(order_id);
CREATE INDEX IF NOT EXISTS idx_wc_customer   ON warranty_claims(customer_id);
CREATE INDEX IF NOT EXISTS idx_wc_status     ON warranty_claims(status);
CREATE INDEX IF NOT EXISTS idx_wc_assigned   ON warranty_claims(assigned_to);
CREATE INDEX IF NOT EXISTS idx_wc_created_at ON warranty_claims(created_at DESC);

COMMENT ON TABLE  warranty_claims IS 'Mijoz kafolat shikoyatlari';
COMMENT ON COLUMN warranty_claims.claim_number IS 'Avtonom raqam: CLM-0001';
COMMENT ON COLUMN warranty_claims.is_warranty_covered IS 'true=kafolat ostida (tekin), false=mijoz to''lashi kerak';
COMMENT ON COLUMN warranty_claims.cost_to_customer IS 'Mijoz to''lovi (faqat kafolatdan tashqari hollarda)';

CREATE TABLE IF NOT EXISTS service_visits (
    id                  BIGSERIAL PRIMARY KEY,
    claim_id            BIGINT          NOT NULL REFERENCES warranty_claims(id) ON DELETE CASCADE,
    technician_id       BIGINT          REFERENCES users(id) ON DELETE SET NULL,
    scheduled_date      DATE            NOT NULL,
    scheduled_time      TIME,
    actual_arrived_at   TIMESTAMP,
    completed_at        TIMESTAMP,
    visit_notes         TEXT,
    action_taken        TEXT,
    parts_used          JSONB           DEFAULT '[]'::jsonb,
    photos_before       JSONB           DEFAULT '[]'::jsonb,
    photos_after        JSONB           DEFAULT '[]'::jsonb,
    customer_signature  TEXT,
    customer_rating     INTEGER CHECK (customer_rating BETWEEN 1 AND 5),
    customer_feedback   TEXT,
    status              VARCHAR(20)     NOT NULL DEFAULT 'SCHEDULED',
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version             BIGINT          NOT NULL DEFAULT 0,
    CONSTRAINT chk_sv_status CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS idx_sv_claim         ON service_visits(claim_id);
CREATE INDEX IF NOT EXISTS idx_sv_technician    ON service_visits(technician_id);
CREATE INDEX IF NOT EXISTS idx_sv_scheduled    ON service_visits(scheduled_date) WHERE status IN ('SCHEDULED', 'IN_PROGRESS');

COMMENT ON TABLE service_visits IS 'Kafolat shikoyati bo''yicha usta tashriflari';

-- ============================================================
-- PERMISSIONS
-- ============================================================
INSERT INTO permissions (code, module, action, description)
VALUES
    ('WARRANTY_VIEW',    'WARRANTY', 'VIEW',    'Kafolat shikoyatlarini ko''rish'),
    ('WARRANTY_CREATE',  'WARRANTY', 'CREATE',  'Shikoyat yaratish'),
    ('WARRANTY_MANAGE',  'WARRANTY', 'MANAGE',  'Shikoyat statusini boshqarish, hal qilish'),
    ('WARRANTY_RESOLVE', 'WARRANTY', 'RESOLVE', 'Tashrif belgilash va ishni yopish')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('ADMIN', 'MANAGER')
  AND p.code IN ('WARRANTY_VIEW', 'WARRANTY_CREATE', 'WARRANTY_MANAGE', 'WARRANTY_RESOLVE')
ON CONFLICT DO NOTHING;

-- INSTALLER uchun faqat VIEW + RESOLVE (o'z tashrifini yopish uchun)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'INSTALLER'
  AND p.code IN ('WARRANTY_VIEW', 'WARRANTY_RESOLVE')
ON CONFLICT DO NOTHING;
