-- Fix: V27 used r.name = 'MANAGER' but actual name is 'Menejer' (code = 'MANAGER')
-- This migration adds missing ORDERS permissions to MANAGER role using correct code column

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'MANAGER' AND p.code IN (
    'ORDERS_VIEW', 'ORDERS_CREATE', 'ORDERS_UPDATE',
    'ORDERS_ASSIGN', 'ORDERS_MEASURE', 'ORDERS_PRODUCE',
    'ORDERS_CONFIRM_PAYMENT'
)
ON CONFLICT DO NOTHING;

-- Also fix SELLER and INSTALLER role permissions from V27
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'SELLER' AND p.code IN ('ORDERS_VIEW', 'ORDERS_CREATE')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'INSTALLER' AND p.code IN (
    'ORDERS_VIEW', 'ORDERS_INSTALL', 'ORDERS_COLLECT_PAYMENT',
    'ORDERS_CONFIRM_PAYMENT'
)
ON CONFLICT DO NOTHING;
