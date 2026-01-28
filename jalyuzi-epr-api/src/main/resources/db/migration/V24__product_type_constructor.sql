-- =====================================================
-- V24: Mahsulot Turi Konstruktor Tizimi
-- Dinamik atributlar bilan mahsulot turlarini boshqarish
-- =====================================================

-- 1. product_types jadvalini yaratish
CREATE TABLE IF NOT EXISTS product_types (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    icon VARCHAR(50),
    color VARCHAR(20),
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    default_unit_type VARCHAR(20),
    attribute_schema JSONB NOT NULL DEFAULT '{"groups":[],"attributes":[]}',
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- product_types indekslari
CREATE INDEX IF NOT EXISTS idx_product_types_code ON product_types(code);
CREATE INDEX IF NOT EXISTS idx_product_types_active ON product_types(is_active);

-- 2. products jadvaliga yangi ustunlar qo'shish
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type_id BIGINT REFERENCES product_types(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS custom_attributes JSONB DEFAULT '{}';

-- products indekslari
CREATE INDEX IF NOT EXISTS idx_products_type_id ON products(product_type_id);
CREATE INDEX IF NOT EXISTS idx_products_custom_attrs ON products USING GIN (custom_attributes);

-- Ko'p ishlatiladigan atributlar uchun expression indekslari
CREATE INDEX IF NOT EXISTS idx_products_custom_blind_type ON products ((custom_attributes->>'blindType'));
CREATE INDEX IF NOT EXISTS idx_products_custom_material ON products ((custom_attributes->>'material'));
CREATE INDEX IF NOT EXISTS idx_products_custom_control_type ON products ((custom_attributes->>'controlType'));

-- 3. Tizimiy mahsulot turlarini yaratish
INSERT INTO product_types (code, name, description, icon, color, is_system, display_order, default_unit_type, attribute_schema) VALUES
(
    'FINISHED_PRODUCT',
    'Tayyor Jalyuzi',
    'O''rnatishga tayyor mahsulotlar',
    'Blinds',
    'primary',
    TRUE,
    1,
    'PIECE',
    '{
        "groups": [
            {"key": "blind_properties", "label": "Jalyuzi xususiyatlari", "order": 1},
            {"key": "dimensions", "label": "O''lchamlar", "order": 2},
            {"key": "pricing", "label": "Maxsus narxlar", "order": 3}
        ],
        "attributes": [
            {
                "key": "blindType",
                "label": "Jalyuzi turi",
                "dataType": "select",
                "group": "blind_properties",
                "order": 1,
                "filterable": true,
                "searchable": true,
                "options": [
                    {"value": "ROLLER", "label": "Roletka"},
                    {"value": "VERTICAL", "label": "Vertikal jalyuzi"},
                    {"value": "HORIZONTAL", "label": "Gorizontal jalyuzi"},
                    {"value": "ROMAN", "label": "Rim pardasi"},
                    {"value": "CELLULAR", "label": "Uyali (Honeycomb)"},
                    {"value": "MOTORIZED", "label": "Motorli"}
                ]
            },
            {
                "key": "material",
                "label": "Material",
                "dataType": "select",
                "group": "blind_properties",
                "order": 2,
                "filterable": true,
                "options": [
                    {"value": "ALUMINUM", "label": "Alyuminiy"},
                    {"value": "WOOD", "label": "Yog''och"},
                    {"value": "FABRIC", "label": "Mato"},
                    {"value": "PVC", "label": "PVC"},
                    {"value": "BAMBOO", "label": "Bambuk"}
                ]
            },
            {
                "key": "controlType",
                "label": "Boshqaruv turi",
                "dataType": "select",
                "group": "blind_properties",
                "order": 3,
                "filterable": true,
                "options": [
                    {"value": "CHAIN", "label": "Zanjirli"},
                    {"value": "CORD", "label": "Shnurli"},
                    {"value": "MOTORIZED", "label": "Motorli"},
                    {"value": "REMOTE", "label": "Pultli"},
                    {"value": "SMART", "label": "Smart (WiFi/Bluetooth)"}
                ]
            },
            {
                "key": "color",
                "label": "Rang",
                "dataType": "text",
                "group": "blind_properties",
                "order": 4,
                "placeholder": "Oq",
                "searchable": true,
                "validation": {"maxLength": 50}
            },
            {
                "key": "minWidth",
                "label": "Min kenglik",
                "dataType": "number",
                "group": "dimensions",
                "order": 1,
                "unit": "mm",
                "placeholder": "300",
                "validation": {"min": 100, "max": 10000}
            },
            {
                "key": "maxWidth",
                "label": "Max kenglik",
                "dataType": "number",
                "group": "dimensions",
                "order": 2,
                "unit": "mm",
                "placeholder": "3000",
                "validation": {"min": 100, "max": 10000}
            },
            {
                "key": "minHeight",
                "label": "Min balandlik",
                "dataType": "number",
                "group": "dimensions",
                "order": 3,
                "unit": "mm",
                "placeholder": "300",
                "validation": {"min": 100, "max": 10000}
            },
            {
                "key": "maxHeight",
                "label": "Max balandlik",
                "dataType": "number",
                "group": "dimensions",
                "order": 4,
                "unit": "mm",
                "placeholder": "3000",
                "validation": {"min": 100, "max": 10000}
            },
            {
                "key": "pricePerSquareMeter",
                "label": "Narx/m²",
                "dataType": "currency",
                "group": "pricing",
                "order": 1,
                "sortable": true,
                "validation": {"min": 0}
            },
            {
                "key": "installationPrice",
                "label": "O''rnatish narxi",
                "dataType": "currency",
                "group": "pricing",
                "order": 2,
                "validation": {"min": 0}
            }
        ]
    }'::jsonb
),
(
    'RAW_MATERIAL',
    'Xomashyo',
    'Ishlab chiqarish materiallari',
    'Layers',
    'secondary',
    TRUE,
    2,
    'METER',
    '{
        "groups": [
            {"key": "dimensions", "label": "O''lchamlar", "order": 1}
        ],
        "attributes": [
            {
                "key": "rollWidth",
                "label": "Rulon kengligi",
                "dataType": "decimal",
                "group": "dimensions",
                "order": 1,
                "unit": "m",
                "placeholder": "1.5",
                "validation": {"min": 0}
            },
            {
                "key": "rollLength",
                "label": "Rulon uzunligi",
                "dataType": "decimal",
                "group": "dimensions",
                "order": 2,
                "unit": "m",
                "placeholder": "50",
                "validation": {"min": 0}
            },
            {
                "key": "profileLength",
                "label": "Profil uzunligi",
                "dataType": "decimal",
                "group": "dimensions",
                "order": 3,
                "unit": "m",
                "placeholder": "6",
                "validation": {"min": 0}
            },
            {
                "key": "weightPerUnit",
                "label": "Birlik og''irligi",
                "dataType": "decimal",
                "group": "dimensions",
                "order": 4,
                "unit": "kg",
                "placeholder": "0.5",
                "validation": {"min": 0}
            }
        ]
    }'::jsonb
),
(
    'ACCESSORY',
    'Aksessuar',
    'Qo''shimcha qismlar va jihozlar',
    'Wrench',
    'accent',
    TRUE,
    3,
    'PIECE',
    '{
        "groups": [
            {"key": "compatibility", "label": "Moslik", "order": 1}
        ],
        "attributes": [
            {
                "key": "compatibleBlindTypes",
                "label": "Mos jalyuzi turlari",
                "dataType": "multiselect",
                "group": "compatibility",
                "order": 1,
                "helpText": "Bu aksessuar qaysi jalyuzi turlari bilan mos keladi",
                "options": [
                    {"value": "ROLLER", "label": "Roletka"},
                    {"value": "VERTICAL", "label": "Vertikal jalyuzi"},
                    {"value": "HORIZONTAL", "label": "Gorizontal jalyuzi"},
                    {"value": "ROMAN", "label": "Rim pardasi"},
                    {"value": "CELLULAR", "label": "Uyali (Honeycomb)"},
                    {"value": "MOTORIZED", "label": "Motorli"}
                ]
            }
        ]
    }'::jsonb
);

-- 4. Mavjud mahsulotlarni yangi tizimga o'tkazish
-- product_type_id ni bog'lash
UPDATE products p
SET product_type_id = pt.id
FROM product_types pt
WHERE pt.code = p.product_type;

-- custom_attributes ni to'ldirish (mavjud maydonlardan)
UPDATE products SET custom_attributes = jsonb_strip_nulls(jsonb_build_object(
    'blindType', blind_type,
    'material', material,
    'controlType', control_type,
    'color', color,
    'minWidth', min_width,
    'maxWidth', max_width,
    'minHeight', min_height,
    'maxHeight', max_height,
    'pricePerSquareMeter', price_per_sqm,
    'installationPrice', installation_price,
    'rollWidth', roll_width,
    'rollLength', roll_length,
    'profileLength', profile_length,
    'weightPerUnit', weight_per_unit,
    'compatibleBlindTypes', compatible_blind_types
))
WHERE custom_attributes = '{}'::jsonb OR custom_attributes IS NULL;

-- 5. Qo'shimcha permission qo'shish (agar kerak bo'lsa)
INSERT INTO permissions (code, module, action, description)
VALUES
    ('PRODUCT_TYPES_VIEW', 'SETTINGS', 'VIEW', 'Mahsulot turlarini ko''rish ruxsati'),
    ('PRODUCT_TYPES_CREATE', 'SETTINGS', 'CREATE', 'Yangi mahsulot turi yaratish ruxsati'),
    ('PRODUCT_TYPES_UPDATE', 'SETTINGS', 'UPDATE', 'Mahsulot turini tahrirlash ruxsati'),
    ('PRODUCT_TYPES_DELETE', 'SETTINGS', 'DELETE', 'Mahsulot turini o''chirish ruxsati')
ON CONFLICT (code) DO NOTHING;

-- Admin roliga yangi permissionlarni berish
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'ADMIN'
  AND p.code IN ('PRODUCT_TYPES_VIEW', 'PRODUCT_TYPES_CREATE', 'PRODUCT_TYPES_UPDATE', 'PRODUCT_TYPES_DELETE')
ON CONFLICT DO NOTHING;
