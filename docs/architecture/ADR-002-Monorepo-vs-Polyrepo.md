# ADR-002: Repository Structure — Monorepo vs Polyrepo

**Status:** Accepted  
**Date:** 2026-06-27  
**Deciders:** CTO, Senior Architect, Full Stack Dev

---

## Context

Detaili Home składa się z wielu aplikacji i pakietów współdzielących kod:

**Aplikacje:**
- `apps/web` — Landing Page + Customer Portal (Next.js)
- `apps/detailer` — Detailer Mobile App (React PWA)
- `apps/admin` — Admin Panel (React + Vite)
- `apps/api` — Backend API (NestJS)

**Pakiety współdzielone:**
- `packages/ui` — Design System (komponenty, tokeny)
- `packages/types` — Wspólne TypeScript types (DTO, entities)
- `packages/utils` — Wspólne narzędzia (formatowanie, walidacja)

Pytanie: Czy trzymać wszystko w jednym repozytorium (monorepo) czy w osobnych repozytoriach (polyrepo)?

---

## Decision

**Wybieramy Monorepo z Turborepo.**

---

## Consequences

### Plusy
- Atomowe commity — zmiana w `packages/types` i `apps/api` w jednym PR
- Wspólne `packages/ui` i `packages/types` bez publikowania na npm
- Single source of truth — jedna wersja TypeScript, ESLint, Prettier
- Refactoring cross-package — IDE widzi cały kod
- CI/CD — Turborepo cache skraca buildy (tylko to co się zmieniło)
- Prostsze onboarding — `git clone` + `npm install` → wszystko działa

### Minusy
- Większe repozytorium — wolniejsze `git clone` z historią
- Wymaga narzędzia (Turborepo/Nx) do zarządzania build pipeline
- Permissions — wszyscy deweloperzy widzą cały kod (mitygacja: CODEOWNERS)

---

## Alternatives Considered

### Polyrepo (osobne repozytoria per aplikacja)
- **Za:** Izolacja, niezależne deployy, osobne uprawnienia
- **Przeciw:** Synchronizacja `packages/types` między repozytoriami wymaga npm publish lub git submodules, trudniejszy atomic refactoring, duplikacja konfiguracji

### Nx Monorepo
- **Za:** Bardziej zaawansowany niż Turborepo (generators, affected commands)
- **Przeciw:** Większa złożoność, dłuższa krzywa uczenia, Turborepo wystarczy dla naszego rozmiaru

---

## Implementation Notes

```
Struktura:
detaili-home/
├── apps/
│   ├── web/          (Next.js 14+)
│   ├── detailer/     (React + Vite + Capacitor)
│   ├── admin/        (React + Vite)
│   └── api/          (NestJS 10+)
├── packages/
│   ├── ui/           (React components + Tailwind)
│   ├── types/        (shared TypeScript interfaces)
│   └── utils/        (shared utilities)
├── turbo.json        (Turborepo config)
├── package.json      (workspace root)
└── pnpm-workspace.yaml

Package manager: pnpm (workspaces support, performance)
Build orchestration: Turborepo
```
