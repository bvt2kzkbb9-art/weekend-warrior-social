# ADR-006: Deployment Strategy

**Status:** Accepted  
**Date:** 2026-06-27  
**Deciders:** CTO, Senior Architect

---

## Context

Detaili Home musi być:
- **Dostępna 24/7** — klienci bookują o każdej porze
- **Skalowalna** — szczytowe godziny (poranki, weekendy) vs. spokojne godziny
- **Bezpieczna** — dane płatności, adresy klientów, GDPR
- **Szybka w deploymencie** — iteracje co 1–2 tygodnie w fazie MVP
- **Tania na starcie** — minimalne koszty infrastruktury przed pierwszymi klientami

Etapy:
1. **Local Development** — docker-compose, szybki start
2. **Staging** — automatyczny deploy po push na `develop`
3. **Production** — deploy po merge do `main`, zero-downtime

---

## Decision

**Stosujemy Progressive Deployment: Docker local → Railway/Render staging → Railway + Vercel production.**

| Środowisko | Frontend | Backend | Database |
|------------|----------|---------|----------|
| Local | localhost:3000 (Next.js) | localhost:4000 (NestJS) | PostgreSQL w Docker |
| Staging | Vercel Preview | Railway dev | Railway PostgreSQL |
| Production | Vercel | Railway | Railway PostgreSQL (+ backups) |

CI/CD: **GitHub Actions**

---

## Consequences

### Plusy
- Vercel — zero-config Next.js deploy, edge CDN, preview URLs per PR
- Railway — Docker-native, PostgreSQL managed, proste skalowanie pionowe
- GitHub Actions — wbudowane w repo, darmowe dla open source / małych projektów
- Docker local — identyczne środowisko jak produkcja (parity)
- Niski koszt startu: Railway ~$5/miesiąc, Vercel free tier

### Minusy
- Railway nie ma auto-scaling horyzontalnego (limitem jest plan — do 8 vCPU)
  - Mitygacja: przy >10k DAU migracja na AWS ECS / Kubernetes
- Vercel vendor lock-in — Next.js features (Server Actions, Edge Runtime) mogą być Vercel-specific
  - Mitygacja: unikamy Vercel-only APIs, używamy standardowego Next.js
- Railway backups wymagają konfiguracji — nie są domyślnie włączone

---

## Alternatives Considered

### AWS (ECS + RDS + CloudFront)
- **Za:** Pełna kontrola, auto-scaling, SLA 99.99%
- **Przeciw:** Złożoność konfiguracji, koszt przy małym ruchu, dłuższy czas setup

### Heroku
- **Za:** Historycznie popularny, prosty
- **Przeciw:** Drogi w porównaniu do Railway, od 2022 brak free tier, wolniejszy cold start

### Self-hosted VPS (Hetzner + Coolify)
- **Za:** Najtańszy długoterminowo (~€5/miesiąc), pełna kontrola
- **Przeciw:** DevOps overhead, manual SSL, backupy, monitoring — zbyt duże obciążenie dla małego zespołu

### Google Cloud Run
- **Za:** Scale to zero, pay-per-use, Docker native
- **Przeciw:** Zimny start (~2s) nieakceptowalny dla API, bardziej złożona konfiguracja

---

## CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]

jobs:
  test:
    - Lint (ESLint, TypeScript)
    - Unit tests (Jest)
    - Integration tests
    - Security audit (npm audit)

  build:
    - Build Docker images
    - Build Next.js (static analysis)

  deploy-staging:    # tylko develop branch
    - Deploy API → Railway (staging)
    - Deploy Web → Vercel Preview
    - Run E2E tests (Playwright)

  deploy-production:  # tylko main branch
    - Deploy API → Railway (production)
    - Deploy Web → Vercel (production)
    - Run smoke tests
    - Notify Slack
```

### Environment Variables

```
Development:  .env.local (nie commitowane)
Staging:      Railway Environment Variables + Vercel Env
Production:   Railway Secrets + Vercel Env (encrypted)

Zasada: NIGDY nie commituj .env do repozytorium
        Używaj .env.example z placeholder values
```

### Zero-Downtime Deploy

```
Railway: rolling deployment (nowa instancja → health check → swap)
Prisma:  migracje przed deployem aplikacji
         (additive migrations only — no DROP COLUMN without deprecation period)
```
