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
mvn spring-boot:run        # Run on port 8170
mvn test                   # Run tests
mvn clean install          # Build project
./mvnw.cmd clean install   # Maven Wrapper (Windows)
```

### Development URLs
- Frontend: http://localhost:5175
- Backend API: http://localhost:8170/api
- Swagger UI: http://localhost:8170/api/swagger-ui.html

## Architecture Overview

Full-stack ERP system with Spring Boot backend and React frontend.

### Tech Stack
- **Backend**: Spring Boot 3.5.5, Java 17, PostgreSQL, Spring Security + JWT, Flyway migrations
- **Frontend**: React 18, TypeScript, Vite, Zustand (state), TanStack Query, Tailwind + DaisyUI

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
controller/   # REST endpoints
service/      # Business logic + export/ subdirectory for PDF/Excel
repository/   # Spring Data JPA
entity/       # JPA entities with base/ for common fields
dto/          # request/, response/, websocket/ DTOs
security/     # JWT provider, filters, UserDetailsService
audit/        # Entity change auditing with AuditEntityListener
config/       # Security, WebSocket, Timezone configs
annotation/   # @ExportColumn, @ExportEntity for export features
```

### Database Migrations
- Location: `src/main/resources/db/migration/`
- Format: `V{number}__{description}.sql`
- Currently at V21

## Key Patterns

### Timezone Handling
- Standard: Asia/Tashkent (UTC+5)
- Backend stores UTC, converts on output via Jackson config
- Frontend uses `formatDate()`, `formatDateTime()` from `config/constants.ts`

### Authentication
- JWT with 24h access + 7d refresh tokens
- RBAC with granular permissions
- Frontend: `ProtectedRoute` wrapper + `usePermission()` hook
- Backend: `SecurityConfig.java` + `JwtTokenProvider`

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
- Zustand for global state (auth, cart, notifications, UI)
- TanStack Query for server state caching