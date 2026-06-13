-- Fix: V27 (9-qadam) ADMIN roliga ORDERS permissionlarini berishda `r.name = 'ADMIN'`
-- ishlatgan, lekin ADMIN rolining name'i 'Administrator' (code = 'ADMIN'). Shu sababli
-- INSERT hech qaysi rol bilan mos kelmagan va ADMIN ORDERS permissionlarini umuman olmagan.
-- V29 xuddi shu xatoni MANAGER/SELLER/INSTALLER uchun tuzatgan, ammo ADMIN'ni tashlab ketgan;
-- V30 esa faqat ORDERS_REVERT'ni qo'shgan. Natijada admin /v1/employees/technicians,
-- /v1/orders/** kabi ORDERS_ASSIGN talab qiluvchi endpointlarda 403 olardi.
--
-- Ushbu migratsiya ADMIN'ga barcha ORDERS permissionlarini (to'g'ri `r.code` ustuni orqali)
-- tiklaydi. Idempotent: allaqachon mavjud grantlar ON CONFLICT bilan o'tkazib yuboriladi.

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.module = 'ORDERS'
ON CONFLICT DO NOTHING;
