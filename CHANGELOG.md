# O'zgarishlar tarixi (Changelog)

Ushbu faylda **Jalyuzi ERP** loyihasidagi barcha muhim o'zgarishlar hujjatlashtirilgan.

Format [Keep a Changelog](https://keepachangelog.com/uz/1.1.0/) tamoyillariga,
versiyalash esa [Semantic Versioning](https://semver.org/lang/uz/) (SemVer) qoidalariga asoslanadi.

> **Joriy versiya:** `1.1.2` (Frontend `package.json` + Android `versionCode 4`).
> Backend (`pom.xml`) hozircha `0.0.1-SNAPSHOT` — mahsulot versiyasi yagona manba sifatida frontenddan olinadi.
>
> **Eslatma:** `1.0.0` dan oldingi versiyalar (`0.x`) loyiha git tarixidan qayta tiklangan
> (o'sha davrda rasmiy reliz raqamlanmagan). `1.0.0` va undan keyingi raqamlar
> Android `build.gradle` dagi haqiqiy reliz qiymatlariga to'liq mos keladi.

### Kategoriyalar izohi
- **Qo'shildi** — yangi imkoniyatlar
- **O'zgartirildi** — mavjud funksiyalardagi o'zgarishlar
- **Tuzatildi** — xatoliklar bartaraf etildi
- **Xavfsizlik** — xavfsizlikka oid yangilanishlar
- **Infratuzilma** — deploy, CI/CD, build va konfiguratsiya
- **Olib tashlandi** — eskirgan yoki keraksiz qismlar o'chirildi

---

## [Reja qilinmagan / Unreleased]

> 2026-06-07 dan 2026-06-14 gacha kiritilgan, hali alohida reliz raqami berilmagan o'zgarishlar.

### Tuzatildi
- **Auth:** Token yangilashda (`refresh`) sessiya rotatsiyasi qo'shildi — takroriy `401` loop muammosi bartaraf etildi (`V41__session_refresh_token_hash`).
- **Buyurtmalar:** `ADMIN` roliga `ORDERS` ruxsatlari qaytarildi (`V42__fix_admin_order_permissions`).
- **Qarzlar:** Manfiy mijoz balansi endi `ACTIVE` qarz yozuvi bilan moslashtiriladi (`V43__reconcile_customer_debt_balances`).
- **Ruxsatlar (RBAC):** `MANAGER` roliga `EMPLOYEES_VIEW` berildi — menejer xodimlar ro'yxatini ko'ra oladi (`GET /v1/employees` endi `403` qaytarmaydi) va "Xodimlar" menyusi unga ko'rinadi, shu bilan `EMPLOYEES_CHANGE_ROLE`/`EMPLOYEES_MANAGE_ACCESS` amalda ishlaydigan bo'ldi (`V45__manager_employees_view_permission`).

### Olib tashlandi
- Avvalgi "shina magazin" (tire shop) loyihasidan qolgan test/seed qoldiqlari tozalandi (`V44__cleanup_tire_shop_seed_data`).

### Infratuzilma
- `.dockerignore`, `.gitignore` va `lockfile` sinxronlashtirildi.

---

## [1.1.2] — 2026-06-04

### Tuzatildi
- **Mobil:** Panellarda butun-sahifa scroll o'rniga ichki (kontent) scroll qo'llanildi — status bar bilan ziddiyat to'liq bartaraf etildi.

---

## [1.1.1] — 2026-06-04

### Tuzatildi
- **Mobil:** Panel sarlavhalari status bar ustiga chiqib ketmasligi uchun `safe-area` qo'llab-quvvatlashi tuzatildi.

---

## [1.1.0] — 2026-06-04

> Yirik reliz. `1.0.0` (2026-05-03) dan beri to'plangan barcha ishlab chiqarish modullari
> (Sprint 1–7, 2026-05) hamda yangi premium mobil dizayn tizimi (2026-06) shu relizda jamlandi.

### Qo'shildi

#### 📱 Premium mobil dizayn tizimi (iteratsiya 1–3)
- Butun loyiha uchun yagona **premium minimalist mobile-first** dizayn tili: nozik teal palitra (`#0d9488` / `#2dd4bf`), Plus Jakarta Sans shrifti, yumshoq radius va nozik soya tizimi.
- Mobil komponentlar kutubxonasi: `BottomSheet`, `MobilePageHeader`, `AppBottomNav`, `Fab`, `FilterChipBar`, `MetricCard`, `ListItemCard`, `EmptyState`, `SegmentedControl`, `Skeleton`.
- Modallar moslashuvchan: mobilda *bottom-sheet*, desktopda *dialog* (25+ fayl).
- Dashboard, POS, ro'yxatlar, buyurtma va formalar to'liq mobil ko'rinishga qayta qurildi.

#### 🏭 Ishlab chiqarish moduli — Sprint 1 (Kanban)
- To'liq ishlab chiqarish jarayoni: bosqichlar katalogi (Qirqim → Tikuv → Yig'ish → QA → Tayyor), Kanban ko'rinishi, ishchi tayinlash, ustuvorlik va deadline.
- Bosqich o'tish state-machine'i va bosqichlar tarixi (`duration_minutes` bilan).
- Reja vs. amaldagi material sarfi va chiqindi hisobi (`V34__production_module`).

#### 📷 Buyurtma fotosuratlari va imzosi — Sprint 2
- Har bir buyurtma uchun foto-dalil va mijoz imzosi (`react-signature-canvas`), keyinroq native kamera bilan kuchaytirildi (`V35__order_photos`).

#### 📄 Rasmiy hujjatlar — Sprint 3
- Har bir buyurtma bo'yicha rasmiy PDF hujjatlar generatsiyasi (OpenPDF).

#### 💳 To'lov jadvallari va onlayn to'lov asosi — Sprint 4
- Buyurtma bo'yicha bo'lib-bo'lib to'lov jadvali (50/30/20: zaklad / tayyor bo'lganda / o'rnatishda), holatlar: `PENDING / PARTIAL / PAID / OVERDUE / CANCELLED`.
- **Click** va **Payme** uchun webhook poydevori va idempotentlik jadvali (`V36__payment_schedules`, `V37__online_payments`).

#### 🛡 Kafolat va servis tashriflari — Sprint 5
- Mijozlar o'rnatishdan keyin nuqson haqida shikoyat qila oladi; shop esa triaj qiladi, kafolatni baholaydi va texnik tashrifini rejalashtiradi.
- `warranty_claims` (CLM-00001 raqamlash) + `service_visits` (imzo, reyting, fikr) (`V38__warranty_claims`).

#### ⚙️ Avtomatlashtirish va yakuniy sayqal — Sprint 6
- Rejalashtirilgan vazifalar: to'lov eslatmalari (09:15), kafolat SLA nazorati (09:30).
- Mijoz kabineti uchun kafolat UI, ishlab chiqarish KPI'lari va Telegram buyruqlari.

#### 🔐 Webhook xavfsizligi va native kamera — Sprint 7
- To'lov webhooklarini qattiqlashtirish (signature tekshiruvi) va native kamera orqali rasm olish.

#### 🧩 Atribut oilalari ierarxiyasi (F0–F5)
- `AttributeFamily` ierarxik tuzilmasi: admin daraxt UI, property darajasidagi override, mahsulot sehrgarida barg (leaf) tanlash va server validatsiyasi (`V40__attribute_family_tree`).

#### 🛒 Buyurtma sehrgari yaxshilanishlari
- Sehrgar ichida yangi **mijoz** va yangi **mahsulot** yaratish.
- Yagona tur bo'yicha chegirma va formatlangan pul kiritish maydoni.
- Butun ilova bo'ylab telefon kiritish `PhoneInput` komponenti orqali yagonalashtirildi.

#### 🖼 Mahsulot va UX
- Mahsulot rasm galereyasi, yordam markazi (onboarding) va markazlashgan status yorliqlari (`V39__product_images`).
- Marketing tahlili uchun mijoz manbasini kuzatish (`V33__customer_source`).
- Dashboardga "Bugungi ish" paneli qo'shildi.

#### 🔢 Versiyalashtirish
- Markazlashgan versiya: `package.json` yagona manba → `__APP_VERSION__` (Vite define), UI'da ko'rinadi (Login, Sidebar, Footer).
- `ANDROID_BUILD.md` — Capacitor APK qurish bo'yicha to'liq qo'llanma.

### O'zgartirildi
- Login demo kirish ro'yxati yangilandi (sotuvchi roli olib tashlandi).
- Manager tayinlash dropdowni endi `employeeId` yuboradi (`userId` emas).

### Tuzatildi
- HQL `EXTRACT(EPOCH FROM Duration)` o'rniga native query qo'llanildi.
- `assign-measurer` `500` xatosi: sanaga vaqt qo'shib yuborish bilan tuzatildi.
- Manager buyurtma amallarida backend xato xabari endi to'g'ri ko'rsatiladi.
- Managerlar buyurtmaga tayinlash uchun texniklar ro'yxatini yuklay oladi.

### Xavfsizlik
- Mijoz kabineti buyurtma tafsilotlari himoyalandi (egalik tekshiruvi).
- Yuklamalar (`uploads/`) papkasi `.gitignore` ga qo'shildi; xato joylangan fotosuratlar olib tashlandi.

---

## [1.0.0] — 2026-05-03

> Birinchi ommaviy reliz: Capacitor asosidagi Android APK va production-ready konfiguratsiya.

### Qo'shildi
- **Mobil ilova:** APK qurish uchun Capacitor Android loyihasi (`appId: uz.jalyuzi.epr`).
- Ommaviy **Maxfiylik siyosati** sahifasi (Play Store talabi).
- Android release imzolash (keystore) va Play Store assetlari.

### O'zgartirildi
- API va WebSocket URL'lari endi muhit o'zgaruvchilari (env) orqali sozlanadi.

### Xavfsizlik
- CORS ro'yxatiga Capacitor APK manbalari (`https://localhost`, `capacitor://localhost`) qo'shildi.

### Infratuzilma
- `generate-app-assets` skriptidagi ESLint xatolari tuzatildi; `scripts` va `android` papkalari lint'dan chiqarildi.

---

## [0.5.0] — 2026-04-15

> O'rnatuvchilar boshqaruvi, Telegram integratsiyasi va production domeni.

### Qo'shildi
- Admin panelga **o'rnatuvchilar (installer) boshqaruvi** bo'limi (`V31__installer_management_permissions`).
- Shop mijoz autentifikatsiyasini telefon raqami orqali tasdiqlash uchun **Telegram bot** integratsiyasi (`V32__telegram_integration`).
- Loyiha `README` (sozlash va deploy hujjatlari).

### O'zgartirildi
- Sidebar logotipi bosilganda bosh sahifaga o'tadigan qilindi.
- Login sahifasining mobil moslashuvchanligi yaxshilandi.

### Infratuzilma
- `kanjaltib.uz` production domeni sozlandi; nginx backend DNS'ni startda kuta oladigan (tolerant) qilindi.

---

## [0.4.0] — 2026-03-24

> DevOps poydevori: konteynerlashtirish, CI/CD va PWA.

### Qo'shildi
- **PWA** qo'llab-quvvatlashi (`vite-plugin-pwa`).

### Infratuzilma
- Coolify uchun **Docker** va production konfiguratsiyasi.
- **CI/CD** quvuri (GitHub Actions) va **Docker Compose**.

### Tuzatildi
- ESLint xatolari: `any` turlari almashtirildi, `case` bloki to'g'ri qamrab olindi.

---

## [0.3.0] — 2026-03-10

> Buyurtmalarni boshqarishning to'liq tizimi va mijoz kabineti boshqaruvi.

### Qo'shildi
- **Buyurtma boshqaruvi tizimi** — to'liq hayotiy sikl: yaratish → o'lchov → narxlash → zaklad → ishlab chiqarish → o'rnatish → to'lov → yakunlash.
  - 14 ta status, status o'tish validatsiyasi, m² asosidagi narx hisobi.
  - `OrderController` (16 endpoint), yakunlashda `Sale`/`Debt` generatsiyasi, ishlab chiqarish boshlanishida ombordan yechish.
  - Xodim sahifalari (ro'yxat + statistika, yaratish sehrgari, timeline'li tafsilot), o'rnatuvchi mobil interfeysi, mijoz kabineti sahifalari (`V27__order_management_system`).
- Buyurtma statusini orqaga qaytarish va universal to'lov yig'ish (`V30__order_revert_permission`).
- Mijoz kabineti boshqaruvi: PIN o'rnatish va kabinetni yoqish/o'chirish (`set-pin`, `toggle-portal`).
- Mobil-optimallashtirilgan manager paneli (pill-chip filtrlar, buyurtma yaratish tugmasi).

### O'zgartirildi
- Mijoz qatori bosilganda tafsilot sahifasiga o'tish.

### Tuzatildi
- `INSTALLER` roli enum'i yetishmasligi va manager `403` xatosi.
- Ko'p statusli filtr crash'i.
- Buyurtma tafsiloti endpoint'idagi `MultipleBagFetchException`.
- O'rnatuvchi va manager layoutlari uchun cross-tab sessiya sinxronizatsiyasi va rol guard'lari (`V29__fix_manager_order_permissions`).

---

## [0.2.1] — 2026-02-19

> Autentifikatsiya va sessiya barqarorligi.

### Tuzatildi
- Bir vaqtdagi token yangilash poyga holati (race condition) — navbat (queue) patterni bilan hal qilindi.
- SMS auth xatolari endi `500` o'rniga to'g'ri `400` qaytaradi.
- Eskirgan token sababli cheksiz redirect loop — Zustand auth holatini tozalash bilan tuzatildi.

---

## [0.2.0] — 2026-02-05

> Internet-do'kon (e-commerce) moduli va yangi jalyuzi turlari.

### Qo'shildi
- **Internet-do'kon (e-commerce)** moduli — SMS autentifikatsiyasi bilan (Eskiz.uz, 6 xonali kod) (`V26__sms_verification`).
- Yangi jalyuzi turlari, materiallar va mahsulot atributlari (`V25__extend_jalyuzi_attributes`).

### Tuzatildi
- Shop modulidagi kompilyatsiya xatolari.

---

## [0.1.0] — 2026-01-28

> Poydevor: ERP'ning "shina magazin"dan "jalyuzi o'rnatish kompaniyasi"ga transformatsiyasi
> hamda universal mahsulot tizimi. (Asosiy platforma — RBAC, sessiyalar, audit, xodimlar,
> mijoz kabineti, bildirishnomalar — `V1`–`V21` migratsiyalarida.)

### Qo'shildi
- ERP "shina magazin"dan **jalyuzi o'rnatish kompaniyasi**ga aylantirildi (`V22__jalyuzi_transformation`).
- **Universal mahsulot tizimi**: tayyor mahsulotlar, xom ashyo va aksessuarlar (`V23__universal_product_system`).
- **Mahsulot turi konstruktori** — JSONB sxema asosida (`V24__product_type_constructor`):
  - Vizual tur tanlash kartalari bilan dinamik mahsulot modali.
  - Sxema asosida render qilinadigan dinamik mahsulot formasi.
  - Yangi mahsulot yaratish uchun 3 bosqichli sehrgar.
- Claude Code uchun `CLAUDE.md` hujjati.

### Tuzatildi
- `V24` migratsiyasidagi `permissions` jadvali ustun nomlari.
- `AttributeSchema` JSON deserializatsiyasi va kod validatsiyasi.
- Mahsulot formasida barcha turlar dinamik ko'rsatiladigan qilindi.

---

[Reja qilinmagan / Unreleased]: https://github.com/shavkatbegmatov/jalyuzi-epr/compare/v1.1.2...HEAD
[1.1.2]: https://github.com/shavkatbegmatov/jalyuzi-epr/releases/tag/v1.1.2
[1.1.1]: https://github.com/shavkatbegmatov/jalyuzi-epr/releases/tag/v1.1.1
[1.1.0]: https://github.com/shavkatbegmatov/jalyuzi-epr/releases/tag/v1.1.0
[1.0.0]: https://github.com/shavkatbegmatov/jalyuzi-epr/releases/tag/v1.0.0
[0.5.0]: https://github.com/shavkatbegmatov/jalyuzi-epr/releases/tag/v0.5.0
[0.4.0]: https://github.com/shavkatbegmatov/jalyuzi-epr/releases/tag/v0.4.0
[0.3.0]: https://github.com/shavkatbegmatov/jalyuzi-epr/releases/tag/v0.3.0
[0.2.1]: https://github.com/shavkatbegmatov/jalyuzi-epr/releases/tag/v0.2.1
[0.2.0]: https://github.com/shavkatbegmatov/jalyuzi-epr/releases/tag/v0.2.0
[0.1.0]: https://github.com/shavkatbegmatov/jalyuzi-epr/releases/tag/v0.1.0
