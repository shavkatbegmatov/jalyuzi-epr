-- V31: O'rnatuvchilar boshqaruvi uchun permissionlar

-- 1. Yangi permissionlar yaratish
INSERT INTO permissions (code, name, description, module, action, created_at)
VALUES
    ('INSTALLERS_VIEW', 'INSTALLERS_VIEW', 'O''rnatuvchilar ro''yxatini ko''rish', 'INSTALLERS', 'VIEW', NOW()),
    ('INSTALLERS_CREATE', 'INSTALLERS_CREATE', 'Yangi o''rnatuvchi yaratish', 'INSTALLERS', 'CREATE', NOW()),
    ('INSTALLERS_UPDATE', 'INSTALLERS_UPDATE', 'O''rnatuvchi ma''lumotlarini tahrirlash', 'INSTALLERS', 'UPDATE', NOW()),
    ('INSTALLERS_TOGGLE', 'INSTALLERS_TOGGLE', 'O''rnatuvchini faollashtirish/o''chirish', 'INSTALLERS', 'TOGGLE', NOW())
ON CONFLICT (code) DO NOTHING;

-- 2. ADMIN roliga barcha installer permissionlarni tayinlash
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN (
    'INSTALLERS_VIEW', 'INSTALLERS_CREATE', 'INSTALLERS_UPDATE', 'INSTALLERS_TOGGLE'
)
ON CONFLICT DO NOTHING;

-- 3. MANAGER roliga ko'rish va tayinlash permissionlarini berish
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'MANAGER' AND p.code IN (
    'INSTALLERS_VIEW'
)
ON CONFLICT DO NOTHING;
