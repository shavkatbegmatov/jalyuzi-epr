# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Run Commands

### Frontend (jalyuzi-epr-front/)
```bash
npm run dev       # Development server (port 5175)
npm run build     # TypeScript compile + Vite production build
npm run lint      # ESLint check
npm run preview   # Preview production build
```

### Backend (jalyuzi-epr-api/)
```bash
.\mvnw.cmd spring-boot:run    # Run on port 8170 (Windows)
.\mvnw.cmd clean compile      # Compile only
.\mvnw.cmd package -DskipTests # Build .jar (no tests yet)
```

> Test infrastructure: `src/test/` directory does not exist yet. No JUnit tests are present.

### Mobile (Android via Capacitor)
```bash
npm run android:sync          # Build + sync to Android
npm run android:open          # Open Android Studio
npm run android:store-assets  # Generate Play Store icons (512x512, 1024x500)
```

### Development URLs
- Frontend: http://localhost:5175
- Backend API: http://localhost:8170/api
- Swagger UI: http://localhost:8170/api/swagger-ui.html

### Production
- Domain: https://kanjaltib.uz
- API: https://kanjaltib.uz/api
- Hosting: Coolify (auto-deploy via GitHub Actions on `main` push)
- Docker images: `ghcr.io/shavkatbegmatov/jalyuzi-epr-api:latest`

## Architecture Overview

Full-stack ERP system with Spring Boot backend and React frontend.

### Tech Stack
- **Backend**: Spring Boot 3.5.5, Java 17, PostgreSQL, Spring Security + JWT, Flyway migrations
- **Frontend**: React 18, TypeScript, Vite 7, Zustand (state), TanStack Query, Tailwind + DaisyUI 4
- **Mobile**: Capacitor 8 (Android APK, appId: `uz.jalyuzi.epr`)
- **Real-time**: WebSocket STOMP (`@stomp/stompjs` + SockJS)
- **i18n**: i18next (uz-UZ default, ru fallback)
- **Charts**: Recharts; **Export**: XLSX, jsPDF, Apache POI, OpenPDF
- **External**: Eskiz.uz SMS, Telegram Bot API

### Frontend Structure (jalyuzi-epr-front/src/)
```
api/          # Axios services per domain (auth.api.ts, products.api.ts, etc.)
store/        # Zustand stores (authStore, cartStore, notificationsStore, uiStore)
pages/        # Page components organized by feature
components/   # Reusable components (layout/, common/, ui/)
hooks/        # Custom hooks (usePermission, useSessionMonitor, useCrossTabSync)
router/       # React Router v6 config with lazy loading
services/     # WebSocket STOMP service
types/        # TypeScript interfaces
utils/        # Export utilities, helpers
i18n/         # Internationalization (Uzbek)
```

### Backend Structure (jalyuzi-epr-api/src/main/java/uz/jalyuziepr/api/)
```
controller/   # REST endpoints (~30 controllers, including TelegramBotController, CustomerPortalController)
service/      # Business logic + export/ subdirectory for PDF/Excel
repository/   # Spring Data JPA
entity/       # JPA entities with base/ for common fields
dto/          # request/, response/, websocket/ DTOs
security/     # JWT provider, filters, UserDetailsService (staff + customer separated)
audit/        # AuditEntityListener, correlation ID, sensitive data masker
config/       # Security, WebSocket, CORS (WebConfig), Timezone, SMS, Telegram
annotation/   # @ExportColumn, @ExportEntity, @RequiresPermission
exception/    # GlobalExceptionHandler + custom exceptions
scheduler/    # @Scheduled jobs (DebtReminderScheduler)
```

### Database Migrations
- Location: `src/main/resources/db/migration/`
- Format: `V{number}__{description}.sql`
- Currently at **V32** (telegram_integration); active areas: jalyuzi product transformation (V22-25), order management (V27-30), installer + telegram (V31-32)

## Key Patterns

### Timezone Handling
- Standard: Asia/Tashkent (UTC+5)
- Backend stores UTC, converts on output via Jackson config
- Frontend uses `formatDate()`, `formatDateTime()` from `config/constants.ts`

### Authentication
- JWT with 24h access + 7d refresh tokens
- **Two separate auth flows**: staff (`/v1/auth/**`) and customer portal (`/v1/customer-auth/**`, `/v1/shop/auth/**`)
- RBAC with granular permissions via `@RequiresPermission` aspect
- Frontend: `ProtectedRoute` wrapper + `usePermission()` hook + `PermissionGate`
- Backend: `SecurityConfig.java` + `JwtTokenProvider` + `PermissionAspect`
- Brute-force protection via `LoginAttemptService`
- SMS verification via Eskiz.uz (6-digit codes, 5min TTL, max 3 attempts)
- JWT secret: `JWT_SECRET` env var required in production (default in `application.yml` is dev-only)

### Real-time Updates
- WebSocket over STOMP protocol
- Frontend service: `services/websocket.ts`
- Vite proxies WebSocket to backend at port 8170

### Data Export
- Backend: Apache POI (Excel), OpenPDF (PDF) with `@ExportColumn` annotations
- Frontend: XLSX, jsPDF in `utils/exportUtils.ts`

### API Communication
- Base URL: `/api` (proxied by Vite in dev)
- Axios interceptors in `api/axios.ts` handle auth tokens
- Domain-specific API files (products.api.ts, sales.api.ts, etc.)

## Code Conventions

### Language
- UI text and messages are in Uzbek (uz-UZ)
- i18next configured in `src/i18n/`

### Styling
- Tailwind CSS with DaisyUI components
- Custom themes: `jalyuzi` (light), `jalyuzi-dark` (dark)
- Theme config in `tailwind.config.js`

### State Management
- Zustand for global state (auth, cart, notifications, UI, shop)
- TanStack Query for server state caching

### Mobile (Capacitor Android)
- Config: `jalyuzi-epr-front/capacitor.config.ts` (`appId: uz.jalyuzi.epr`, scheme `https`)
- WebView origin: `https://localhost` and `capacitor://localhost` (CORS allowlist)
- Production API in APK: `.env.production` → `VITE_API_URL=https://kanjaltib.uz/api`
- Release signing: `android/keystore.properties` (gitignored), R8 minify + ProGuard rules
- Play Store listing: see `PLAY_STORE_LISTING.md` and `RELEASE.md`

### Telegram Integration
- Webhook: `POST /v1/telegram/webhook` (validated via `X-Telegram-Bot-Api-Secret-Token` header)
- Used for shop customer auth via phone number (`TelegramPhoneLink` entity)
- Bot config in `application.yml` under `telegram.bot.*` (env vars required)

### Public Endpoints (no auth, see SecurityConfig.java)
- `/v1/auth/**`, `/v1/customer-auth/**`, `/v1/shop/auth/**`
- `/v1/shop/products/**`, `/v1/shop/categories`, `/v1/shop/brands`, `/v1/shop/calculate-price`
- `/v1/telegram/**` (webhook + register-webhook)
- `/swagger-ui/**`, `/api-docs/**`, `/actuator/**`
- `/v1/ws/**` (JWT validated by `JwtChannelInterceptor`)