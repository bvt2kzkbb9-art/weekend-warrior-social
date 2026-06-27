# ADR-005: API Design — REST vs GraphQL Hybrid

**Status:** Accepted  
**Date:** 2026-06-27  
**Deciders:** CTO, Senior Architect, Full Stack Dev

---

## Context

Detaili Home ma kilka klientów z różnymi potrzebami danych:

| Klient | Charakterystyka |
|--------|-----------------|
| Customer Portal (Next.js) | Złożone widoki, wiele danych naraz (booking + customer + service + detailer) |
| Detailer App (PWA) | Offline-first, minimalna ilość danych, szybkość |
| Admin Dashboard | Złożone zapytania analityczne, raporty |
| Mobile (Capacitor) | Niski bandwidth, bateria |
| B2B Integrations | Zewnętrzne systemy, REST API |
| Franczyza (multi-tenant) | Izolacja danych, analytics per tenant |

Problemy z "pure REST":
- Over-fetching — `/api/bookings` zwraca za dużo pól, których klient nie potrzebuje
- Under-fetching — strona potrzebuje 4 endpointów żeby zebrać dane do jednego widoku
- N+1 problem — lista rezerwacji + dla każdej customer name = N+1 zapytań

Problemy z "pure GraphQL":
- Złożoność implementacji — N+1 wymaga DataLoader
- Caching — HTTP cache nie działa natywnie z POST queries
- File upload — skomplikowane w GraphQL
- Learning curve — nie każdy frontend dev zna GraphQL

---

## Decision

**Stosujemy REST + opcjonalne GraphQL dla złożonych widoków.**

- **REST API** (primary): wszystkie CRUD operacje, Stripe webhooks, file upload, zewnętrzne integracje
- **GraphQL** (secondary, tylko dla internal apps): Admin Dashboard i Customer Portal gdzie potrzebny flexible querying
- **OpenAPI 3.0**: dokumentacja REST API (Swagger UI)

---

## Consequences

### Plusy
- REST — prostota, HTTP caching, standardowe narzędzia, zewnętrzne integracje
- GraphQL (opcjonalny) — eliminuje over/under-fetching dla złożonych widoków dashboardu
- Pragmatyzm — nie narzucamy GraphQL wszędzie (zwiększa złożoność)
- Swagger UI — automatyczna dokumentacja REST dla integracji B2B
- OpenAPI → TypeScript types — generowanie typów z schematu

### Minusy
- Dwa protokoły API do utrzymania
- GraphQL wymaga resolverów + DataLoader (ochrona przed N+1)
- Ryzyko: REST może okazać się wystarczające i GraphQL będzie niepotrzebny — weryfikacja w Phase 2

---

## Alternatives Considered

### Pure REST
- **Za:** Prostota, HTTP caching, szeroka znajomość
- **Przeciw:** Over-fetching na złożonych widokach admina, konieczność wielu requestów

### Pure GraphQL
- **Za:** Flexible queries, jedna schema jako source of truth
- **Przeciw:** Skomplikowany caching, trudniejszy file upload, wyższy próg dla nowych deweloperów, Stripe webhooks i B2B integracje wymagają REST i tak

### tRPC
- **Za:** End-to-end type safety, zero schema, świetny DX w TypeScript monorepo
- **Przeciw:** Tylko TypeScript klienty, nie nadaje się dla zewnętrznych B2B integracji, nie pasuje do NestJS architecture

### gRPC
- **Za:** Szybkość, binary protocol, bi-directional streaming
- **Przeciw:** Overkill dla web aplikacji, słabe wsparcie przeglądarek (wymaga grpc-web proxy)

---

## Implementation

```
REST API (NestJS):
├── /api/auth/*           — Autentykacja
├── /api/bookings/*       — Rezerwacje CRUD
├── /api/customers/*      — Klienci CRUD  
├── /api/detailers/*      — Detailerzy
├── /api/services/*       — Usługi i cennik
├── /api/payments/*       — Stripe webhooks + płatności
├── /api/reports/*        — Generowanie raportów PDF
└── /api/webhooks/*       — Zewnętrzne webhooks

Dokumentacja:
└── /api/docs             — Swagger UI (OpenAPI 3.0)

GraphQL (opcjonalny — Phase 2):
└── /graphql              — Apollo Server, tylko dla internal apps

Response format (REST):
{
  "data": {},         // payload
  "meta": {           // paginacja, totals
    "page": 1,
    "total": 100
  },
  "error": null       // lub { "code": "...", "message": "..." }
}
```

### Versioning Strategy

```
/api/v1/bookings    — current stable
/api/v2/bookings    — breaking changes (nowe pola required, zmiany typów)

Zasada: nowe nieobowiązkowe pola → bez nowej wersji
        usunięcie pola lub zmiana typu → nowa wersja
```
