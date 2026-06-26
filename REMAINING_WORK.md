# Jalyuzi ERP — "Wow Effect" funksiyalar: davom etish rejasi (Handoff)

> Bu hujjat ishni boshqa kompyuterda / yangi sessiyada davom ettirish uchun.
> Mustaqil yozilgan — oldingi suhbat konteksti shart emas.
> Oxirgi sessiya: **2026-06-17/18**. Domen: **kanjaltib.uz** (Coolify auto-deploy, `main` push'да).

---

## 1. Hozirgi holat (qisqacha)

Bitta sessiyada **9 ta wow funksiya + 1 bugfix** productionga deploy qilindi. Migratsiyalar **V48–V54**.

⚠️ **MUHIM:** Faqat **shop checkout** jonli (E2E) sinaldi va ishladi. **Qolgan 9 funksiya faqat compile+build bilan tekshirilgan — jonli sinov O'TKAZILMAGAN.** Birinchi ish — ularni kanjaltib.uz'da sinash (5-bo'limdagi checklist).

---

## 2. Deploy qilingan funksiyalar

| # | Funksiya | Migratsiya | Asosiy fayllar | Qayerda |
|---|----------|:---:|---|---|
| 1 | "Jalyuzimni kuzat" ommaviy treker + Telegram deep-link | V48 | `OrderTrackingService`, `TrackingController` (`/v1/track/{code}`), `OrderTrackingPage.tsx` (`/t/:code`), `tracking.api.ts`, `TrackingLinkCard.tsx` | Mijoz (ommaviy) |
| 2 | Dala SOS / eskalatsiya | V49 | `OrderEscalation*`, `EscalationController`, `OrderEscalationSheet.tsx`, `ManagerEscalationsPage.tsx` | Montajchi → Menejer |
| 3 | Joyida qayta o'lchov + narx tasdiqlash | V50 | `OrderItemRevision*`, `OrderItemRevisionController`, `RemeasureSheet.tsx`, `PendingRemeasureCard.tsx` | Montajchi → Menejer |
| 4 | Jonli ishlab chiqarish wallboard (STOMP + bottleneck heat + TV rejim) | V51 | `ProductionService` (broadcast + `currentStageEnteredAt`), `useProductionBoardLive.ts`, `ProductionPage.tsx` | Sex/Menejer |
| 5 | "O'lchovdan keyin" zaklad follow-up scheduler | V52 | `QuoteFollowupService`, `QuoteFollowupScheduler`, `OrderTrackingService.sendQuoteFollowup` | Avto (cron 10:00) |
| 6 | QR job-traveler (telefon kamerasi bilan skanerlash) | — | `ProductionService.advanceToNextStage`, `ProductionScanPage.tsx` (`/production/scan/:id`), `QrTravelerModal.tsx` (qrcode lib) | Sex ishchisi |
| 7 | NPS / mijoz sharh halqasi | V53 | `OrderTrackingService.submitReview`, `TrackingController` (`POST /v1/track/{code}/review`), `OrderTrackingPage` ReviewCard | Mijoz → Xodim |
| 8 | Kafolat sertifikati + QR haqiqiylik | — | `WarrantyCertificateModal.tsx` (frontend-only, qrcode) | Mijoz/Xodim |
| 9 | RFM mijoz segmentatsiyasi (analitika) | — | `CustomerInsightsService`, `CustomerController` (`GET /v1/customers/rfm-insights`), `CustomerInsightsPage.tsx` (`/customers/insights`) | Egasi/Menejer |
| fix | Onlayn-do'kon checkout 500 tuzatildi | V54 | `Sale.createdBy` nullable (`sales.created_by DROP NOT NULL`) | — |

---

## 3. Qolgan ishlar (ustuvorlik bo'yicha)

### A. 🔴 E2E (jonli) sinov — ENG BIRINCHI
9 funksiyani kanjaltib.uz'da real sinash (5-bo'lim). Xato topilsa — Coolify **backend (API)** log'idan stack-trace olib tuzatish.

### B. ✅ Onlayn Sale → Order pipeline ko'prigi — BAJARILDI (kod tayyor, jonli sinov kutilmoqda)
**Yondashuv:** admin "Buyurtmaga aylantirish" tugmasi (avtomatik emas — vetting nazorati saqlandi).
Sotuv tafsilotida WEB buyurtma uchun tugma chiqadi → bir bosishda to'liq Order yaratiladi (status `YANGI`, tracking kod beriladi) → barcha wow funksiyalar (treker/SOS/wallboard/QR) onlayn buyurtmaларга ham tatbiq bo'ladi.
**Bitta Sale qoidasi:** yangi Sale yaratilmaydi — web Sale Order'ga bog'lanadi (`order.sale`); buyurtma yakunlanganda mavjud Sale yangilanadi (revenue ikki marta sanalmaydi). Web faktura raqami (`WEB...`) saqlanadi.
**Asosiy fayllar:**
- Backend: `OrderService.createOrderFromSale` + `createSaleFromOrder`/`updateSaleFromOrder` (qayta ishlatish) + `cancelOrder` sinxron; `SaleController` `POST /v1/sales/{id}/convert-to-order` (ruxsat: `ORDERS_CREATE`); `OrderRepository.findBySaleId`; `SaleResponse.convertedOrderId`.
- Frontend: `salesApi.convertToOrder`, `SaleDetailPage.tsx` (aylantirish/ochish kartasi), `Sale.convertedOrderId` tipi.
- ✔️ Backend `compile` + frontend `build` o'tdi. ⏳ Migratsiya **shart emas** edi (Order.createdBy = admin). Jonli sinov: WEB buyurtma ber → admin Sotuvlar'da aylantir → Order pipeline + treker ishlashini tekshir.

### C. 🟡 #4 Kafolat AI triage
Kafolat shikoyatlarini AI bilan klassifikatsiya + javob qoralamasi. **Talab:** `ANTHROPIC_API_KEY` env + Maven `anthropic-java` (yoki HTTP) bog'liqligi. Foydalanuvchi qaroriga bog'liq (deploy/byudjet).

### D. 🟢 Qolgan ~20 wow g'oya
referral dasturi (Telegram deep-link), lifecycle re-engagement scheduler (qayta-buyurtma + kafolat tugash nudge), talab prognozi & mavsumiy zaxira, AR "oynada ko'rish" (WebXR), GPS-muhrli foto + dala soati, offline-first dala rejimi, smart kunlik marshrut (navigatsiya), churn-risk board, AI foto/matndan narx, AI buyurtma yozuvchi (voice→draft), worker piece-rate payroll, cut & nesting optimizer, BOM auto material zaxira, va h.k.

---

## 4. Deploy va ish oqimi (MUHIM — laptopda ham shu qoidalar)

- **Til:** O'zbek, FAQAT lotin yozuvi. Texnik identifikatorlar original.
- **Commit:** AI-mualliflik qatori **QO'SHILMAYDI**. So'ralmaguncha push qilinmaydi.
- **Branch:** har funksiya alohida `feat/...` branch'da → commit → `main`ga `--ff-only` merge → push.
- **Deploy:** `main`ga push = Coolify **avtomatik production deploy** (kanjaltib.uz) + Flyway migratsiya. Har push **aniq foydalanuvchi tasdig'ini** talab qiladi.
- **Tekshiruv:** backend `.\mvnw.cmd -q compile -DskipTests`, frontend `npm run build` — har o'zgarishdan keyin.
- **Migratsiya:** keyingi raqam **V55** (oxirgisi V54). Format: `V{n}__{tavsif}.sql`.

### Windows/PowerShell gotcha
CWD buyruqlar orasida saqlanadi — `Set-Location`да **absolyut yo'l** ishlating (`Set-Location 'D:\Projects\JALYUZI_EPR\jalyuzi-epr\jalyuzi-epr-api'`), aks holda nisbiy yo'l adashadi. Commit xabarида qo'shtirnoq bo'lsa `-F fayl` orqali commit qiling (native git'да `"` buziladi).

---

## 5. Sinov checklist (har funksiya — kanjaltib.uz)

1. **Treker** — buyurtmaga zaklad qabul qiling → mijozга Telegram havola → `/t/{kod}` jonli timeline. Menejer panelida "Kuzatuv havolasi" kartasi. Deep-link tugmasi (`📦 Telegram'da yangilik oling`) ko'rinishi kerak (env to'g'ri bo'lsa).
2. **SOS** — montajchi tayinlangan buyurtmani ochadi → suzuvchi qizil tugma → sabab+foto → menejerда jonli ogohlantirish + "SOS" nav badge.
3. **Qayta o'lchov** — montajchi mahsulot yonidagi "Qayta o'lchov" → yangi o'lcham → narx farqi → menejerга yuborish → menejer dashboardида tasdiq.
4. **Wallboard** — `/production` kanban; kartani surib bosqich o'zgartiring → boshqa brauzerда jonli yangilanish; "Devor rejimi"; SLA oshган kartalar qizil/sariq.
5. **Follow-up** — avto (cron 10:00); narx tasdiqlangan, zakladsiz, 2+ kun turган buyurtmaга eslatma (`QUOTE_FOLLOWUP_DAYS`).
6. **QR traveler** — `/production` → karta → "QR" → chop etish → telefon kamerasi bilan skanerlash → "Keyingi bosqich".
7. **NPS** — yakunlangan buyurtma trekerida yulduz baho → xodim buyurtma tafsilotida ko'radi.
8. **Sertifikat** — yakunlangan buyurtma (treker/xodim) → "Kafolat sertifikati" → chop etish.
9. **RFM** — `/customers` → "Segmentatsiya" → segment kartalari + mijozlar.

---

## 6. Texnik ma'lumot

- **Backend:** `jalyuzi-epr-api/` — Spring Boot 3.5, Java 17, PostgreSQL, port 8170. Flyway migratsiyalar `src/main/resources/db/migration/`.
- **Frontend:** `jalyuzi-epr-front/` — React 18 + Vite + Zustand + TanStack Query + DaisyUI, port 5175. Yangi dep: `qrcode` + `@types/qrcode`.
- **Ikki auth tizimi:** xodim (`accessToken`, `/v1/auth/**`) va mijoz/do'kon (`shopAccessToken`, `/v1/shop/auth/**`) — alohida, bir brauzerда birga turishi normal.
- **Real-time:** STOMP `/v1/ws`. Topiclar: `/topic/staff/notifications`, `/topic/track/{code}`, `/topic/production/board`.
- **Telegram:** bot `@kanjaltib_jalyuzi_bot`. Env: `TELEGRAM_BOT_ENABLED=true`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` (Coolify'да o'rnatilgan ✅). Bot `/start track_<kod>` deep-link bilan obuna qiladi; plain `/start` = do'kon login kodi.
- **Sozlamalar (env):** `TRACKING_SMS_FALLBACK` (default `false` — SMS zaxira o'chiq, Telegram asosiy), `QUOTE_FOLLOWUP_DAYS` (default `2`).

---

## 7. Keyingi sessiyaga birinchi qadam

```
1. git pull (main)
2. REMAINING_WORK.md ni o'qish (shu fayl)
3. 5-bo'lim checklist bo'yicha kanjaltib.uz'да E2E sinov
4. Xato → Coolify backend log → tuzatish → feat/fix branch → tasdiq bilan deploy
5. Keyin: B (Sale→Order ko'prigi) yoki C (#4 AI) yoki D (yangi g'oya)
```
