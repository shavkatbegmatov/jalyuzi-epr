-- Add ORDERS_REVERT permission
INSERT INTO permissions (code, module, action, description) VALUES
    ('ORDERS_REVERT', 'ORDERS', 'REVERT', 'Buyurtma statusini orqaga qaytarish')
ON CONFLICT (code) DO NOTHING;

-- Assign ORDERS_REVERT to ADMIN and MANAGER roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code = 'ORDERS_REVERT'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'MANAGER' AND p.code IN ('ORDERS_REVERT', 'ORDERS_COLLECT_PAYMENT')
ON CONFLICT DO NOTHING;
