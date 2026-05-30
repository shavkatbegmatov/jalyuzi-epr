-- ============================================================
-- V40: Ierarxik atribut oilasi (AttributeFamily) daraxti
-- Mahsulot xususiyatlari uchun CSS-uslubidagi kaskad meros tizimi.
-- Mavjud ProductType tizimi BUZILMAYDI — parallel ishlaydi.
-- ============================================================

CREATE TABLE IF NOT EXISTS attribute_families (
    id               BIGSERIAL PRIMARY KEY,
    code             VARCHAR(80) NOT NULL UNIQUE,
    name             VARCHAR(120) NOT NULL,
    description      VARCHAR(500),
    icon             VARCHAR(50),
    color            VARCHAR(20),
    parent_id        BIGINT REFERENCES attribute_families(id),
    product_type_id  BIGINT REFERENCES product_types(id),
    attribute_schema JSONB NOT NULL DEFAULT '{"groups":[],"attributes":[]}',
    overrides        JSONB NOT NULL DEFAULT '[]',
    depth            INTEGER NOT NULL DEFAULT 0,
    path             VARCHAR(500),
    is_system        BOOLEAN NOT NULL DEFAULT FALSE,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    display_order    INTEGER DEFAULT 0,
    created_by       BIGINT REFERENCES users(id),
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version          BIGINT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_attribute_families_parent ON attribute_families(parent_id);
CREATE INDEX IF NOT EXISTS idx_attribute_families_code ON attribute_families(code);
CREATE INDEX IF NOT EXISTS idx_attribute_families_active ON attribute_families(is_active);
CREATE INDEX IF NOT EXISTS idx_attribute_families_product_type ON attribute_families(product_type_id);

COMMENT ON TABLE attribute_families IS 'Ierarxik atribut oilasi daraxti (CSS-uslub kaskad meros)';
COMMENT ON COLUMN attribute_families.attribute_schema IS 'Bu tugun OWN deltasi (yangi guruh/atributlar)';
COMMENT ON COLUMN attribute_families.overrides IS 'Meros atributlarga xossa-darajasidagi override (sparse)';
COMMENT ON COLUMN attribute_families.path IS 'Materialized path, masalan /1/4/9/';

-- products jadvaliga barg tugun FK
ALTER TABLE products ADD COLUMN IF NOT EXISTS attribute_family_id BIGINT REFERENCES attribute_families(id);
CREATE INDEX IF NOT EXISTS idx_products_attribute_family ON products(attribute_family_id);

-- ============================================================
-- Boshlang'ich daraxt: root "Bazaviy mahsulot" + mavjud 3 ProductType barg sifatida.
-- Barg sxemasi = ProductType sxemasining to'liq nusxasi (xulq 100% saqlanadi).
-- ============================================================
DO $$
DECLARE
    root_id BIGINT;
    child_id BIGINT;
    pt RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM attribute_families WHERE code = 'BASE_PRODUCT') THEN
        RETURN; -- idempotent
    END IF;

    INSERT INTO attribute_families
        (code, name, description, color, parent_id, product_type_id, attribute_schema, overrides, depth, is_system, is_active, display_order)
    VALUES
        ('BASE_PRODUCT', 'Bazaviy mahsulot', 'Barcha mahsulotlar uchun umumiy ildiz', 'neutral',
         NULL, NULL, '{"groups":[],"attributes":[]}'::jsonb, '[]'::jsonb, 0, TRUE, TRUE, 0)
    RETURNING id INTO root_id;

    UPDATE attribute_families SET path = '/' || root_id || '/' WHERE id = root_id;

    FOR pt IN
        SELECT id, code, name, description, color, attribute_schema, display_order
        FROM product_types
        WHERE code IN ('FINISHED_PRODUCT', 'RAW_MATERIAL', 'ACCESSORY')
    LOOP
        INSERT INTO attribute_families
            (code, name, description, color, parent_id, product_type_id, attribute_schema, overrides, depth, is_system, is_active, display_order)
        VALUES
            (pt.code || '_FAMILY', pt.name, pt.description, pt.color, root_id, pt.id,
             COALESCE(pt.attribute_schema, '{"groups":[],"attributes":[]}'::jsonb), '[]'::jsonb,
             1, TRUE, TRUE, COALESCE(pt.display_order, 0))
        RETURNING id INTO child_id;

        UPDATE attribute_families SET path = '/' || root_id || '/' || child_id || '/' WHERE id = child_id;
    END LOOP;
END $$;

-- ============================================================
-- Mavjud mahsulotlarni mos barg tugunga bog'lash (idempotent).
-- Eski enum product_type orqali (FINISHED_PRODUCT/RAW_MATERIAL/ACCESSORY).
-- custom_attributes va product_type_id TEGILMAYDI.
-- ============================================================
UPDATE products p
SET attribute_family_id = af.id
FROM attribute_families af
JOIN product_types pt ON pt.id = af.product_type_id
WHERE pt.code = p.product_type
  AND p.attribute_family_id IS NULL;

-- ============================================================
-- Ruxsatlar (permissions)
-- ============================================================
INSERT INTO permissions (code, module, action, description, created_at)
VALUES
    ('ATTRIBUTE_FAMILIES_VIEW',   'ATTRIBUTE_FAMILIES', 'VIEW',   'Atribut oilalarini ko''rish', NOW()),
    ('ATTRIBUTE_FAMILIES_CREATE', 'ATTRIBUTE_FAMILIES', 'CREATE', 'Atribut oilasi yaratish', NOW()),
    ('ATTRIBUTE_FAMILIES_UPDATE', 'ATTRIBUTE_FAMILIES', 'UPDATE', 'Atribut oilasini tahrirlash', NOW()),
    ('ATTRIBUTE_FAMILIES_DELETE', 'ATTRIBUTE_FAMILIES', 'DELETE', 'Atribut oilasini o''chirish', NOW())
ON CONFLICT (code) DO NOTHING;

-- ADMIN roliga barchasi
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.module = 'ATTRIBUTE_FAMILIES'
ON CONFLICT DO NOTHING;

-- MANAGER roliga faqat ko'rish
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'MANAGER' AND p.code = 'ATTRIBUTE_FAMILIES_VIEW'
ON CONFLICT DO NOTHING;
