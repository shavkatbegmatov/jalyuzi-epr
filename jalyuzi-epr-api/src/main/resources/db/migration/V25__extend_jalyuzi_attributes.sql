-- =====================================================
-- V25: Jalyuzi Mahsulot Atributlarini Kengaytirish
-- Yangi jalyuzi turlari, materiallar va atributlar
-- =====================================================

-- 1. FINISHED_PRODUCT uchun attribute_schema ni yangilash
-- Yangi jalyuzi turlari va materiallar, shuningdek yangi atributlar qo'shiladi
UPDATE product_types
SET attribute_schema = '{
    "groups": [
        {"key": "blind_properties", "label": "Jalyuzi xususiyatlari", "order": 1},
        {"key": "product_info", "label": "Mahsulot ma''lumotlari", "order": 2},
        {"key": "dimensions", "label": "O''lchamlar", "order": 3},
        {"key": "pricing", "label": "Maxsus narxlar", "order": 4}
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
                {"value": "MOTORIZED", "label": "Motorli"},
                {"value": "ZEBRA", "label": "Zebra (Kecha-kunduz)"},
                {"value": "DAY_NIGHT", "label": "Day-Night"},
                {"value": "PLEATED", "label": "Plisse"},
                {"value": "SHUTTERS", "label": "Shtutterlar"}
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
                {"value": "BAMBOO", "label": "Bambuk"},
                {"value": "POLYESTER", "label": "Polyester"},
                {"value": "BLACKOUT", "label": "Blackout (to''liq to''suvchi)"},
                {"value": "SCREEN", "label": "Skrin"},
                {"value": "DIMOUT", "label": "Dimout (qisman to''suvchi)"}
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
            "key": "collection",
            "label": "Kolleksiya",
            "dataType": "select",
            "group": "product_info",
            "order": 1,
            "filterable": true,
            "options": [
                {"value": "COLLECTION_1", "label": "1-kolleksiya"},
                {"value": "COLLECTION_2", "label": "2-kolleksiya"},
                {"value": "COLLECTION_3", "label": "3-kolleksiya"},
                {"value": "COLLECTION_4", "label": "4-kolleksiya"},
                {"value": "PREMIUM", "label": "Premium"}
            ]
        },
        {
            "key": "modelCode",
            "label": "Model kodi",
            "dataType": "text",
            "group": "product_info",
            "order": 2,
            "placeholder": "JL608-9",
            "searchable": true,
            "validation": {"maxLength": 50}
        },
        {
            "key": "lightTransmission",
            "label": "Yorug''lik o''tkazuvchanlik",
            "dataType": "number",
            "group": "product_info",
            "order": 3,
            "unit": "%",
            "placeholder": "50",
            "helpText": "0% - to''liq to''sadi, 100% - to''liq o''tkazadi",
            "validation": {"min": 0, "max": 100}
        },
        {
            "key": "washable",
            "label": "Yuvish mumkin",
            "dataType": "boolean",
            "group": "product_info",
            "order": 4,
            "defaultValue": false
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
}'::jsonb,
updated_at = CURRENT_TIMESTAMP
WHERE code = 'FINISHED_PRODUCT';

-- 2. ACCESSORY uchun compatibleBlindTypes ni yangilash
-- Yangi jalyuzi turlarini qo'shish
UPDATE product_types
SET attribute_schema = '{
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
                {"value": "MOTORIZED", "label": "Motorli"},
                {"value": "ZEBRA", "label": "Zebra (Kecha-kunduz)"},
                {"value": "DAY_NIGHT", "label": "Day-Night"},
                {"value": "PLEATED", "label": "Plisse"},
                {"value": "SHUTTERS", "label": "Shtutterlar"}
            ]
        }
    ]
}'::jsonb,
updated_at = CURRENT_TIMESTAMP
WHERE code = 'ACCESSORY';

-- 3. Yangi atributlar uchun qo'shimcha indekslar
CREATE INDEX IF NOT EXISTS idx_products_custom_collection ON products ((custom_attributes->>'collection'));
CREATE INDEX IF NOT EXISTS idx_products_custom_model_code ON products ((custom_attributes->>'modelCode'));
CREATE INDEX IF NOT EXISTS idx_products_custom_light_transmission ON products ((custom_attributes->>'lightTransmission'));
