# Jalyuzi ERP

To'liq stack ERP tizimi: jalyuzi va o'rnatish xizmatlari kompaniyasi uchun boshqaruv paneli.

**Production**: [https://kanjaltib.uz](https://kanjaltib.uz)

## Texnologiyalar

**Backend**
- Spring Boot 3.5.5, Java 17
- PostgreSQL 16
- Spring Security + JWT
- Flyway migrations
- WebSocket (STOMP)
- Apache POI (Excel), OpenPDF (PDF) export

**Frontend**
- React 18 + TypeScript
- Vite
- Zustand (state management)
- TanStack Query (server state)
- Tailwind CSS + DaisyUI
- i18next (Uzbek)

**DevOps**
- Docker + Docker Compose
- GitHub Actions (CI/CD)
- Coolify (deployment)
- Nginx (frontend + reverse proxy)

## Loyiha tuzilishi

```
jalyuzi-epr/
├── jalyuzi-epr-api/       # Spring Boot backend
├── jalyuzi-epr-front/     # React frontend
├── docker-compose.yml     # Production stack
└── docker-compose.dev.yml # Development stack
```

## Lokal ishga tushirish

### Talablar
- Java 17+
- Node.js 18+
- PostgreSQL 16
- Maven 3.9+ (yoki Maven Wrapper)

### Backend

```bash
cd jalyuzi-epr-api
mvn spring-boot:run
```

Backend manzili: http://localhost:8170/api
Swagger UI: http://localhost:8170/api/swagger-ui.html

### Frontend

```bash
cd jalyuzi-epr-front
npm install
npm run dev
```

Frontend manzili: http://localhost:5175

### Docker Compose (dev)

```bash
docker compose -f docker-compose.dev.yml up
```

## Environment Variables

### Backend (`jalyuzi-epr-api`)

| Nom | Tavsif | Misol |
|---|---|---|
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database nomi | `jalyuzi_epr_db` |
| `DB_USERNAME` | DB foydalanuvchi | `postgres` |
| `DB_PASSWORD` | DB paroli | `***` |
| `JWT_SECRET` | JWT signing key (base64) | `***` |
| `APP_CORS_ALLOWED_ORIGINS` | Ruxsat etilgan origin'lar (vergul bilan) | `https://kanjaltib.uz,https://www.kanjaltib.uz` |

### Frontend (`jalyuzi-epr-front`)

Frontend `/api` relative URL orqali backend bilan ishlaydi (nginx proxy qiladi). Shuning uchun alohida env variable kerak emas.

## Test foydalanuvchilar (dev)

| Rol | Username | Parol |
|---|---|---|
| Admin | `admin` | `admin123` |
| Manager | `manager` | `manager123` |
| Installer | `installer` | `installer123` |

> ⚠️ **Production'da bu parollarni albatta o'zgartiring!**

## Asosiy xususiyatlar

- 🔐 JWT autentifikatsiya (24h access + 7d refresh)
- 👥 RBAC — granular permissions, rollar boshqaruvi
- 📦 Mahsulot va ombor boshqaruvi
- 💰 Savdo va qarzdorlik tizimi
- 🔧 Buyurtmalar va o'rnatuvchilar
- 📊 Hisobotlar va eksport (Excel/PDF)
- 🔔 Real-time bildirishnomalar (WebSocket)
- 🌐 PWA qo'llab-quvvatlash
- 📱 Responsive dizayn
- 🇺🇿 Uzbek tilida UI

## Database migratsiyalar

Migratsiya fayllari: `jalyuzi-epr-api/src/main/resources/db/migration/`

Format: `V{number}__{description}.sql`

Flyway avtomatik ravishda yangi migratsiyalarni qo'llaydi.

## Deployment

### Coolify orqali

1. Coolify'da yangi **Application** yarating
2. Git repo'ni ulang: `https://github.com/shavkatbegmatov/jalyuzi-epr.git`
3. Docker image'ni ko'rsating: `ghcr.io/shavkatbegmatov/jalyuzi-epr-front:latest`
4. Domain qo'shing: `https://kanjaltib.uz,https://www.kanjaltib.uz`
5. Environment variables kiriting (yuqorida ko'rsatilgan)
6. **Deploy** bosing

Coolify avtomatik:
- Let's Encrypt SSL sertifikatini oladi
- www/non-www redirect'ni boshqaradi
- Healthcheck'ni yuritadi
- GitHub webhook orqali auto-deploy qiladi

### CI/CD (GitHub Actions)

`main` branch'ga push bo'lganda:

1. Docker image'lar build qilinadi
2. GitHub Container Registry (`ghcr.io`) ga push qilinadi
3. Coolify webhook orqali avtomatik deploy qilinadi

GitHub Secrets:
- `COOLIFY_API_TOKEN`
- `COOLIFY_WEBHOOK_URL` (backend)
- `COOLIFY_FRONTEND_WEBHOOK_URL` (frontend)

## Buyruqlar

### Backend

```bash
mvn spring-boot:run        # Dev server (port 8170)
mvn test                   # Testlarni ishga tushirish
mvn clean install          # Build qilish
./mvnw.cmd clean install   # Maven Wrapper (Windows)
```

### Frontend

```bash
npm run dev       # Dev server (port 5175)
npm run build     # Production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

## Timezone

Loyiha **Asia/Tashkent (UTC+5)** zonasida ishlaydi:
- Backend UTC'da saqlaydi, Jackson orqali konvert qiladi
- Frontend `formatDate()` / `formatDateTime()` utility'lari ishlatiladi (`config/constants.ts`)

## Loyiha muallifi

[@shavkatbegmatov](https://github.com/shavkatbegmatov)

## Litsenziya

Proprietary — Jalyuzi ERP
