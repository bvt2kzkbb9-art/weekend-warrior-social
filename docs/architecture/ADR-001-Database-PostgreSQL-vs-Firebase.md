# ADR-001: Database — PostgreSQL vs Firebase

**Status:** Accepted  
**Date:** 2026-06-27  
**Deciders:** CTO, Senior Architect, Full Stack Dev

---

## Context

Detaili Home wymaga przechowywania danych strukturalnych z silnymi relacjami:
- Rezerwacje powiązane z klientami, detailerami, usługami
- Multi-tenant (franczyza) — izolacja danych per tenant
- Transakcje (płatności, zmiany statusów)
- Złożone zapytania analityczne (KPI, raporty, churn prediction)
- RBAC (Role-Based Access Control) z fine-grained permissions

Firebase (Firestore) sprawdza się w prostych, realtime CRUD aplikacjach, ale Detaili Home wymaga:
- ACID transactions na wielu dokumentach/rekordach
- Relacyjnych joinów (booking → customer → detailer → service)
- Złożonych indeksów i zapytań agregujących
- Type-safe schema z automatyczną walidacją

---

## Decision

**Wybieramy PostgreSQL 15 z Prisma ORM.**

---

## Consequences

### Plusy
- ACID transactions — atomowość zmian statusu rezerwacji, płatności
- Relacyjny model — naturalne wyrażenie domeny (booking ma customer, detailer, service)
- Dojrzały ekosystem — Prisma, pgvector (AI embeddings), PostGIS (geolokalizacja)
- Row-Level Security (RLS) — natywna izolacja danych per tenant
- Pełne wsparcie dla analityki i raportowania (window functions, CTEs)
- Koszt: tańszy niż Firebase przy skalowaniu powyżej 100k dokumentów/miesiąc

### Minusy
- Wymaga zarządzania migracjami (Prisma Migrate)
- Brak natywnego realtime (nadrabiane przez Supabase Realtime lub WebSockets)
- Konfiguracja multi-tenant wymaga dodatkowej logiki (tenantId + RLS)

---

## Alternatives Considered

### Firebase / Firestore
- **Za:** Szybki start, wbudowany realtime, Google auth
- **Przeciw:** Brak joinów, kosztowny przy złożonych zapytaniach, trudny RBAC, brak transakcji cross-collection, vendor lock-in

### MongoDB
- **Za:** Flexybilny schemat, popularność
- **Przeciw:** Brak ACID transactions na poziomie cross-collection (pre-4.x), słabszy model relacji, trudniejszy multi-tenant

### Supabase (PostgreSQL + Realtime)
- **Rozważamy jako hosting layer** — Supabase używa PostgreSQL pod spodem; może być opcją dla szybkiego startu bez rezygnacji z PostgreSQL

---

## Implementation Notes

```
Tech stack:
- Database: PostgreSQL 15
- ORM: Prisma 5+
- Migrations: Prisma Migrate
- Connection pooling: PgBouncer (produkcja)
- Multi-tenant: tenantId column + Row-Level Security policies
- Vector search (AI): pgvector extension
```
