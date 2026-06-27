# ADR-003: Domain-Driven Design — Module Boundaries

**Status:** Accepted  
**Date:** 2026-06-27  
**Deciders:** CTO, Senior Architect

---

## Context

Detaili Home to złożona domena biznesowa z wieloma kontekstami:
- Rezerwacje (Bookings) — core business
- Klienci (Customers) — profil, historia, adresy
- Detailerzy (Detailers) — grafik, wizyty, performance
- Usługi (Services) — pakiety, add-ony, cennik
- Płatności (Payments) — Stripe, faktury, abonamenty
- AI/Insights — rekomendacje, churn prediction
- B2B — kontrakty, billing cykliczny
- Franczyza (Franchise) — multi-tenant, KPI

Bez jasnych granic modułów kod staje się "big ball of mud": wszystko zależy od wszystkiego, zmiany w jednym miejscu psują inne, testowanie jest niemożliwe.

---

## Decision

**Stosujemy Domain-Driven Design (DDD) z Bounded Contexts.**

Każdy moduł backendowy jest niezależnym Bounded Context z własnym:
- Domain layer (entities, value objects, domain events)
- Application layer (use cases, commands, queries)
- Infrastructure layer (repositories, external services)

---

## Bounded Contexts i ich granice

### 1. Identity & Access (IAM)
**Odpowiedzialność:** Uwierzytelnianie, autoryzacja, role, uprawnienia  
**Modele:** User, Role, Permission, Session  
**Nie zależy od:** żadnego innego kontekstu biznesowego  
**Wystawia:** UserCreatedEvent, UserLoggedInEvent

### 2. Bookings (Core Domain)
**Odpowiedzialność:** Cykl życia rezerwacji (state machine)  
**Modele:** Booking, BookingHistory, TimeSlot  
**Zależy od:** Customer (ID), Detailer (ID), Service (ID) — tylko przez ID, nie przez join  
**Wystawia:** BookingCreatedEvent, BookingCompletedEvent, BookingCancelledEvent

### 3. Customers
**Odpowiedzialność:** Profil klienta, adresy, preferencje  
**Modele:** Customer, Address, CustomerPreference  
**Zależy od:** IAM (userId)  
**Wystawia:** CustomerUpdatedEvent

### 4. Detailers
**Odpowiedzialność:** Profil detailera, grafik, dostępność  
**Modele:** Detailer, Schedule, Availability, Performance  
**Zależy od:** IAM (userId)  
**Wystawia:** AvailabilityUpdatedEvent

### 5. Services & Catalog
**Odpowiedzialność:** Pakiety usług, add-ony, cennik  
**Modele:** Service, AddOn, Pricing  
**Zależy od:** nic (root domain)  
**Wystawia:** ServiceUpdatedEvent

### 6. Payments
**Odpowiedzialność:** Stripe integration, faktury, płatności  
**Modele:** Payment, Invoice, PaymentMethod, Subscription  
**Zależy od:** Booking (ID), Customer (ID)  
**Słucha:** BookingCreatedEvent → tworzy PaymentIntent

### 7. Reports & Detailing
**Odpowiedzialność:** Sesja detailera, checklist, raporty, zdjęcia  
**Modele:** DetailingSession, Checklist, Report, Photo  
**Zależy od:** Booking (ID), Detailer (ID)  
**Słucha:** BookingCompletedEvent → generuje raport

### 8. AI & Insights
**Odpowiedzialność:** Rekomendacje, churn prediction, insights  
**Modele:** AIInsight, PredictedChurn, RecommendedService  
**Zależy od:** wszystkie inne (read-only, przez events/projections)  
**Nie wystawia eventów** — tylko odpytuje

### 9. B2B
**Odpowiedzialność:** Kontrakty biznesowe, billing cykliczny  
**Modele:** BusinessClient, Contract, BillingCycle  
**Zależy od:** Customer (ID), Payments  

### 10. Franchise (Multi-Tenant)
**Odpowiedzialność:** Zarządzanie franczyzą, KPI, tenant isolation  
**Modele:** Tenant, Franchise, FranchiseMetrics  
**Zależy od:** wszystkie inne (agreguje dane per tenant)

---

## Consequences

### Plusy
- Niezależne deployowanie modułów
- Testowanie w izolacji (mock tylko przez ID/events)
- Onboarding — nowy dev rozumie jeden moduł bez wiedzy o całości
- Skalowalność — moduły z dużym obciążeniem (Bookings, Payments) mogą być wyodrębnione w osobne serwisy

### Minusy
- Więcej boilerplate (każdy moduł ma swoje DTOs, repository interfaces)
- Eventual consistency — komunikacja przez eventy jest asynchroniczna
- Wymaga dyscypliny — łatwo przypadkowo przebić granicę modułu (cross-module import)

---

## Reguły granicy (Enforcement)

```
1. Moduły NIE importują modeli innych modułów bezpośrednio
   ✅ bookingService.getCustomerName(booking.customerId) 
      → query do Customers module przez interface
   ❌ import { Customer } from '../customers/customer.entity'

2. Komunikacja przez Domain Events (nie synchroniczne wywołania)
   ✅ EventBus.publish(new BookingCreatedEvent(bookingId))
   ❌ paymentsService.createPayment(booking) — tight coupling

3. Każdy moduł ma własne typy/DTOs — nie re-eksportuje innych
```
