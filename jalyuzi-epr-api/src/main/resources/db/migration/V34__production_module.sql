-- ============================================================
-- PRODUCTION MODULE — Sprint 1
-- Jalyuzi ishlab chiqarish jarayonini boshqarish
-- ============================================================
-- 4 ta yangi jadval:
--   production_stages          — bosqich shablonlari (catalog)
--   production_orders          — har bir buyurtma item uchun production order
--   production_stage_history   — bosqichlar o'tish tarixi (kim/qachon/qancha vaqt)
--   production_materials       — sarflangan materiallar (planned vs actual)
-- ============================================================

-- ------------------------------------------------------------
-- 1) PRODUCTION_STAGES — bosqich shablonlari (admin sozlashi mumkin)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS production_stages (
    id                  BIGSERIAL PRIMARY KEY,
    code                VARCHAR(30)  NOT NULL UNIQUE,
    name                VARCHAR(100) NOT NULL,
    sequence            INTEGER      NOT NULL,
    color               VARCHAR(20)  DEFAULT '#6366f1',
    estimated_minutes   INTEGER      DEFAULT 60,
    requires_qa         BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version             BIGINT       NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_production_stages_sequence
    ON production_stages(sequence) WHERE is_active = TRUE;

COMMENT ON TABLE production_stages IS 'Ishlab chiqarish bosqichlari katalogi (Qirqim, Tikuv, Yig''ish, QA, Tayyor)';
COMMENT ON COLUMN production_stages.sequence IS 'Bosqich tartibi (1, 2, 3, ...) — Kanban kolonna tartibi';
COMMENT ON COLUMN production_stages.requires_qa IS 'Bu bosqichdan o''tish uchun sifat nazorati kerakmi';

-- ------------------------------------------------------------
-- 2) PRODUCTION_ORDERS — har bir buyurtma uchun production order
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS production_orders (
    id                      BIGSERIAL PRIMARY KEY,
    production_number       VARCHAR(30)  NOT NULL UNIQUE,
    order_id                BIGINT       NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    order_item_id           BIGINT       REFERENCES order_items(id) ON DELETE SET NULL,
    status                  VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    current_stage_id        BIGINT       REFERENCES production_stages(id) ON DELETE SET NULL,
    assigned_worker_id      BIGINT       REFERENCES users(id) ON DELETE SET NULL,
    priority                INTEGER      NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    deadline                TIMESTAMP,
    started_at              TIMESTAMP,
    completed_at            TIMESTAMP,
    notes                   TEXT,
    defect_reason           VARCHAR(500),
    created_at              TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version                 BIGINT       NOT NULL DEFAULT 0,
    created_by              BIGINT       REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_prod_status CHECK (status IN ('PENDING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS idx_production_orders_order_id    ON production_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_status      ON production_orders(status);
CREATE INDEX IF NOT EXISTS idx_production_orders_stage       ON production_orders(current_stage_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_worker      ON production_orders(assigned_worker_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_deadline    ON production_orders(deadline) WHERE status NOT IN ('COMPLETED', 'CANCELLED');

COMMENT ON TABLE production_orders IS 'Sex uchun ishlab chiqarish buyurtmalari';
COMMENT ON COLUMN production_orders.production_number IS 'Avtonom raqam: PROD-0001';
COMMENT ON COLUMN production_orders.priority IS '1=eng past, 5=eng yuqori (shoshilinch)';

-- ------------------------------------------------------------
-- 3) PRODUCTION_STAGE_HISTORY — bosqichlar tarixi
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS production_stage_history (
    id                  BIGSERIAL PRIMARY KEY,
    production_order_id BIGINT       NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
    stage_id            BIGINT       NOT NULL REFERENCES production_stages(id) ON DELETE RESTRICT,
    worker_id           BIGINT       REFERENCES users(id) ON DELETE SET NULL,
    started_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at        TIMESTAMP,
    duration_minutes    INTEGER,
    notes               TEXT,
    defect_reason       VARCHAR(500),
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stage_history_prod_order  ON production_stage_history(production_order_id);
CREATE INDEX IF NOT EXISTS idx_stage_history_stage       ON production_stage_history(stage_id);
CREATE INDEX IF NOT EXISTS idx_stage_history_worker      ON production_stage_history(worker_id);

COMMENT ON TABLE production_stage_history IS 'Kim, qaysi bosqichni, qachondan qachongacha bajardi';
COMMENT ON COLUMN production_stage_history.duration_minutes IS 'Avtomatik hisoblanadi: completed_at - started_at';

-- ------------------------------------------------------------
-- 4) PRODUCTION_MATERIALS — sarflangan materiallar
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS production_materials (
    id                  BIGSERIAL PRIMARY KEY,
    production_order_id BIGINT          NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
    product_id          BIGINT          NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity_planned    DECIMAL(12, 3)  NOT NULL DEFAULT 0,
    quantity_used       DECIMAL(12, 3)  NOT NULL DEFAULT 0,
    quantity_wasted     DECIMAL(12, 3)  NOT NULL DEFAULT 0,
    unit                VARCHAR(20)     NOT NULL DEFAULT 'METER',
    unit_cost           DECIMAL(15, 2),
    total_cost          DECIMAL(15, 2),
    notes               VARCHAR(500),
    recorded_by         BIGINT          REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version             BIGINT          NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_prod_materials_prod_order ON production_materials(production_order_id);
CREATE INDEX IF NOT EXISTS idx_prod_materials_product    ON production_materials(product_id);

COMMENT ON TABLE production_materials IS 'Bir production order uchun rejalashtirilgan va haqiqatda sarflangan materiallar';
COMMENT ON COLUMN production_materials.quantity_wasted IS 'Chiqindi/brak miqdori (otklod)';

-- ------------------------------------------------------------
-- SEED — Default 5 ta bosqich (jalyuzi sexi uchun standart)
-- ------------------------------------------------------------
INSERT INTO production_stages (code, name, sequence, color, estimated_minutes, requires_qa)
VALUES
    ('CUTTING',   'Qirqim',           1, '#3b82f6', 30,  FALSE),
    ('SEWING',    'Tikuv',            2, '#8b5cf6', 60,  FALSE),
    ('ASSEMBLY',  'Mexanizm yig''ish', 3, '#f59e0b', 45,  FALSE),
    ('QC',        'Sifat nazorati',   4, '#22c55e', 15,  TRUE),
    ('READY',     'Tayyor',           5, '#10b981', 5,   FALSE)
ON CONFLICT (code) DO NOTHING;

-- ------------------------------------------------------------
-- PERMISSIONS — production module uchun RBAC
-- ------------------------------------------------------------
INSERT INTO permissions (code, module, action, description)
VALUES
    ('PRODUCTION_VIEW',     'PRODUCTION', 'VIEW',     'Production order ro''yxati va detallarini ko''rish'),
    ('PRODUCTION_MANAGE',   'PRODUCTION', 'MANAGE',   'Production order yaratish, bosqich o''zgartirish'),
    ('PRODUCTION_ASSIGN',   'PRODUCTION', 'ASSIGN',   'Production order''ga ishchi/usta biriktirish'),
    ('PRODUCTION_MATERIAL', 'PRODUCTION', 'MATERIAL', 'Sarflangan material miqdorlarini kiritish')
ON CONFLICT (code) DO NOTHING;

-- ADMIN rolega barcha production permissionlarni berish
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'ADMIN'
  AND p.code IN ('PRODUCTION_VIEW', 'PRODUCTION_MANAGE', 'PRODUCTION_ASSIGN', 'PRODUCTION_MATERIAL')
ON CONFLICT DO NOTHING;

-- MANAGER rolega view+manage+assign berish (material yozishni xodimlar qiladi)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'MANAGER'
  AND p.code IN ('PRODUCTION_VIEW', 'PRODUCTION_MANAGE', 'PRODUCTION_ASSIGN')
ON CONFLICT DO NOTHING;
