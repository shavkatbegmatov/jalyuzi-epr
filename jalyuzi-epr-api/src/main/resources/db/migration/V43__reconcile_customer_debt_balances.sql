-- Reconciliation: V2 seed ba'zi mijozlarga manfiy `balance` ni to'g'ridan-to'g'ri bergan
-- (Bobur Rahimov -500000, Avtotrans MCHJ -2000000), lekin `debts` jadvaliga mos yozuv
-- yaratmagan. Natijada ular /customers sahifasida "Qarz" ko'rinardi (hasDebt = balance < 0),
-- ammo /debts sahifasida ko'rinmasdi (u `debts` jadvalini o'qiydi). Normal oqimda
-- (SaleService) qarzga sotuv ham Debt yozuvini yaratadi, ham balansni kamaytiradi —
-- seed esa faqat balansni o'zgartirib, ikki manbani nomuvofiq qoldirgan.
--
-- Bu migratsiya manfiy balansli har bir mijoz uchun (agar hali faol qarzi bo'lmasa)
-- ACTIVE qarz yozuvi yaratadi. Qarz summasi = balansning musbat qiymati (-balance).
-- Balans o'zgartirilmaydi — u allaqachon qarzni aks ettiradi; endi ikkala sahifa mos keladi.
-- sale_id NULL bo'ladi (boshlang'ich balans qarzi, sotuvga bog'liq emas) — DebtResponse
-- buni to'g'ri ishlaydi.

INSERT INTO debts (customer_id, original_amount, remaining_amount, due_date, status, notes)
SELECT
    c.id,
    -c.balance,
    -c.balance,
    CURRENT_DATE + 30,
    'ACTIVE',
    'Boshlang''ich qarz balansi (mijoz balansidan moslashtirildi)'
FROM customers c
WHERE c.balance < 0
  AND NOT EXISTS (
      SELECT 1 FROM debts d
      WHERE d.customer_id = c.id AND d.status = 'ACTIVE'
  );
