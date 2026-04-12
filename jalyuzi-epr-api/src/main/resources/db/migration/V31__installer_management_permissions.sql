-- V31: O'rnatuvchilar boshqaruvi uchun permissionlar

-- 1. Yangi permissionlar yaratish
INSERT INTO permissions (code, module, action, description, created_at)
VALUES
    ('INSTALLERS_VIEW', 'INSTALLERS', 'VIEW', 'O''rnatuvchilar ro''yxatini ko''rish', NOW()),
    ('INSTALLERS_CREATE', 'INSTALLERS', 'CREATE', 'Yangi o''rnatuvchi yaratish', NOW()),
    ('INSTALLERS_UPDATE', 'INSTALLERS', 'UPDATE', 'O''rnatuvchi ma''lumotlarini tahrirlash', NOW()),
    ('INSTALLERS_TOGGLE', 'INSTALLERS', 'TOGGLE', 'O''rnatuvchini faollashtirish/o''chirish', NOW())
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
