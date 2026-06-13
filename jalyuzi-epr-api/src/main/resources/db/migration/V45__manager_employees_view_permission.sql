-- V45: MANAGER roliga EMPLOYEES_VIEW ruxsatini berish
--
-- MUAMMO:
--   V11 seed MANAGER roliga hech qanday EMPLOYEES_* ruxsati bermagan.
--   Keyinroq V14 faqat EMPLOYEES_CHANGE_ROLE va EMPLOYEES_MANAGE_ACCESS qo'shgan.
--   Natijada menejer xodim rolini o'zgartirish / akkount boshqarish ruxsatiga ega,
--   ammo xodimlar ro'yxatini umuman ko'ra olmaydi:
--     * GET /v1/employees, /v1/employees/{id}, /v1/employees/available-users va h.k.
--       @RequiresPermission(EMPLOYEES_VIEW) talab qiladi -> menejer 403 oladi
--       (EmployeeController.java). Demak CHANGE_ROLE/MANAGE_ACCESS amalda ishlamaydi.
--     * Frontend Sidebar "Xodimlar" menyusini EMPLOYEES_VIEW bo'yicha filtrlaydi,
--       shu sababli menyu menejerda umuman ko'rinmaydi.
--
-- YECHIM:
--   MANAGER roliga EMPLOYEES_VIEW qo'shamiz. Ko'rish ruxsati CHANGE_ROLE va
--   MANAGE_ACCESS amallarining old sharti hisoblanadi. Xodim yaratish/o'chirish
--   (CREATE/UPDATE/DELETE) ataylab faqat ADMIN'da qoldiriladi.
--
-- DIQQAT (RBAC konvensiyasi):
--   Rolni HAR DOIM `r.code` ustuni bo'yicha tanlaymiz, `r.name` emas.
--   Rol nomlari lokalizatsiya qilingan (ADMIN.name='Administrator',
--   MANAGER.name='Menejer', SELLER.name='Sotuvchi'), kod esa barqaror.
--   V27 aynan shu name/code chalkashligi tufayli ORDERS grantlarini noto'g'ri
--   bergan edi (keyin V29/V42 da `r.code` bilan tuzatilgan). Yangi seed/grant
--   migratsiyalarida doimo `r.code` ishlatilsin.

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'MANAGER'
  AND p.code = 'EMPLOYEES_VIEW'
ON CONFLICT DO NOTHING;
