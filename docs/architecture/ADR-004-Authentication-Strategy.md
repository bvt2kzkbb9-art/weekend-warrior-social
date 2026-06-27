# ADR-004: Authentication Strategy

**Status:** Accepted  
**Date:** 2026-06-27  
**Deciders:** CTO, Senior Architect, Full Stack Dev

---

## Context

Detaili Home obsługuje wielu aktorów z różnymi poziomami dostępu:

| Aktor | Dostęp |
|-------|--------|
| Customer (B2C) | Rezerwacje, profil, historia, raporty |
| Detailer | Wizyty, checklist, zdjęcia, grafik |
| Admin | Pełny dostęp do systemu |
| Manager (franczyza) | Dostęp do danych swojego tenant |
| Business Client (B2B) | Kontrakty, faktury, rezerwacje |
| Guest | Landing page, cennik |

Wymagania:
- Stateless authentication (skalowalne horyzontalnie)
- Refresh token rotation (bezpieczeństwo)
- Social login (Google, Apple) — wygoda klientów
- Multi-tenant isolation — token musi kodować tenantId
- Revocation — możliwość unieważnienia sesji (logout ze wszystkich urządzeń)
- Mobile support — PWA + natywne aplikacje

---

## Decision

**Stosujemy JWT (Access Token + Refresh Token) z rotacją.**

- **Access Token:** JWT, TTL 15 minut, zawiera `userId`, `role`, `tenantId`
- **Refresh Token:** opaque token, TTL 30 dni, przechowywany w HttpOnly cookie + baza danych
- **Social Login:** OAuth 2.0 przez Google / Apple (opcjonalnie)
- **Multi-factor:** TOTP (2FA) opcjonalnie dla ról Admin/Manager

---

## Consequences

### Plusy
- Stateless — backend nie musi sprawdzać sesji przy każdym żądaniu (weryfikacja JWT z kluczem publicznym)
- Horizontal scaling — dowolna liczba instancji API bez shared session store
- Multi-tenant — `tenantId` w JWT, backend weryfikuje izolację bez dodatkowego zapytania DB
- Standard — NestJS, Next.js, mobile apps — wszystkie mają gotowe biblioteki JWT

### Minusy
- Revocation — JWT access token nie może być unieważniony przed wygaśnięciem (15 min window)
  - Mitygacja: krótki TTL + token blacklist w Redis dla krytycznych przypadków (logout, zmiana hasła)
- Rozmiar tokenu — JWT jest większy niż opaque token (koduje payload)
- Refresh token rotation wymaga atomowego update w DB (wyścig przy concurrent requests)

---

## Alternatives Considered

### Session-based (server-side sessions)
- **Za:** Natychmiastowe unieważnienie sesji, prostszy implementacja
- **Przeciw:** Wymaga shared session store (Redis), trudne horizontal scaling, nie działa dobrze z mobile

### OAuth 2.0 Only (zewnętrzny provider, np. Auth0, Clerk)
- **Za:** Outsourcing security, wbudowany social login, compliance
- **Przeciw:** Vendor lock-in, koszt (~$0.02/MAU), mniej kontroli nad user data, dodatkowa latencja

### Supabase Auth
- **Za:** Wbudowany w Supabase (jeśli używamy Supabase), prostota
- **Przeciw:** Ograniczona customizacja, nie pasuje do NestJS architecture

---

## Implementation

```typescript
// Token structure
interface JwtPayload {
  sub: string;       // userId
  email: string;
  role: UserRole;    // CUSTOMER | DETAILER | ADMIN | MANAGER
  tenantId: string;  // dla multi-tenant
  iat: number;
  exp: number;
}

// Access Token: 15min TTL
// Refresh Token: 30 days, HttpOnly cookie + DB record

// Endpoints:
// POST /api/auth/login        → { accessToken, (refreshToken in cookie) }
// POST /api/auth/refresh      → { accessToken }
// POST /api/auth/logout       → invalidate refresh token
// POST /api/auth/register     → create user + login
// POST /api/auth/google       → OAuth2 flow

// Guards:
// JwtAuthGuard — weryfikuje access token
// RolesGuard   — sprawdza role w JWT payload
// TenantGuard  — weryfikuje tenantId w JWT vs requested resource
```

### RBAC Model

```
ADMIN       → pełny dostęp
MANAGER     → dostęp do swojego tenant (tenantId match)
DETAILER    → własne wizyty, grafik
CUSTOMER    → własne dane, rezerwacje
```

### Security Checklist
- [ ] Bcrypt (cost factor 12) dla haseł
- [ ] Rate limiting na `/auth/login` (5 prób / 15 min)
- [ ] HttpOnly + Secure + SameSite=Strict dla refresh token cookie
- [ ] JWT podpisywany RS256 (asymetryczny — klucz publiczny dla weryfikacji)
- [ ] Refresh token rotation — stary token inwalidowany po użyciu
- [ ] Token family tracking — wykrywanie kradzieży refresh tokenu
