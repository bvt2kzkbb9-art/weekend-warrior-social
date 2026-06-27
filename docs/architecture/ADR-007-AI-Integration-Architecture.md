# ADR-007: AI Integration Architecture

**Status:** Proposed  
**Date:** 2026-06-27  
**Deciders:** CTO, Senior Architect, Product Owner

---

## Context

Detaili Home planuje integrację AI w kilku obszarach:

1. **Service Recommendations** — "Ostatnio klient nie robił impregnacji — zaproponuj"
2. **Churn Prediction** — "Ten klient nie bookował od 90 dni — wyślij ofertę"
3. **Smart Scheduling** — optymalizacja tras detailerów, grupowanie wizyt geograficzne
4. **Detaili Passport™** — AI-generated insights z historii usług
5. **Customer Support** — chatbot dla FAQ (godziny, cennik, status rezerwacji)
6. **Photo Analysis** — automatyczna ocena jakości (przed/po) na podstawie zdjęć

Pytania architektoniczne:
- Własne modele ML czy zewnętrzne API (OpenAI/Anthropic)?
- Kiedy AI działa synchronicznie (real-time) vs asynchronicznie (batch)?
- Jak przechowywać AI insights bez zanieczyszczania głównej domeny?
- Koszt vs jakość vs prywatność danych klientów?

---

## Decision

**Stosujemy External AI APIs (Claude/OpenAI) dla feature-level AI + własna logika dla prostych reguł.**

| Feature | Podejście | Uzasadnienie |
|---------|-----------|--------------|
| Service Recommendations | Reguły + Claude API | Proste reguły wystarczą na start; Claude dla kontekstowych rekomendacji |
| Churn Prediction | Reguły (days since last booking) | ML overkill na Phase 1; prosta heurystyka działa |
| Smart Scheduling | Algorytm (greedy routing) | Google Maps Distance Matrix API |
| Detaili Passport™ | Claude API (summary generation) | LLM idealny do narracyjnych podsumowań |
| Customer Support | Claude API (RAG) | FAQ + knowledge base + booking status |
| Photo Analysis | Vision API (Claude/GPT-4V) | Phase 3+ |

---

## Consequences

### Plusy
- Szybki start — brak potrzeby trenowania własnych modeli
- Jakość — Claude/GPT-4 klasy enterprise dla rozumienia języka i kontekstu
- Koszt na MVP — pay-per-use, brak kosztów infrastruktury ML
- Elastyczność — łatwa zmiana providera (abstrakcja AIService)

### Minusy
- Prywatność — dane klientów wysyłane do zewnętrznego API
  - Mitygacja: dane anonimizowane przed wysłaniem (bez PII), contractual DPA z Anthropic/OpenAI
- Latencja — Claude API dodaje 1–3s do czasu odpowiedzi
  - Mitygacja: wyłącznie asynchroniczne wywołania (queue), nie blokują głównych flow
- Koszt przy skali — przy 10k+ użytkownikach może być drożej niż własny model
  - Mitygacja: cache odpowiedzi AI (Redis), batch processing

---

## Alternatives Considered

### Własne modele ML (scikit-learn, PyTorch)
- **Za:** Pełna kontrola, brak kosztów API przy skali, prywatność danych
- **Przeciw:** Wymaga data science expertise, długi czas do pierwszych wyników, potrzeba dużo danych treningowych (których nie mamy na Phase 1)

### Vertex AI / AWS SageMaker
- **Za:** Managed ML platform, własne modele bez infrastruktury
- **Przeciw:** Wysoka złożoność, koszt, overkill na Phase 1

### Langchain / LlamaIndex (local LLMs)
- **Za:** Prywatność (dane nie opuszczają infrastruktury), brak kosztów per-token
- **Przeciw:** Wymaga GPU, lokalne LLM (Llama 3) gorsze jakościowo od Claude/GPT-4

---

## Implementation Architecture

```typescript
// Abstrakcja — niezależna od providera
interface AIService {
  generateServiceRecommendations(customerId: string): Promise<ServiceRecommendation[]>;
  generatePassportSummary(customerId: string): Promise<string>;
  predictChurnRisk(customerId: string): Promise<ChurnRisk>;
  answerCustomerQuery(query: string, context: BookingContext): Promise<string>;
}

// Implementacja — Claude API
class ClaudeAIService implements AIService {
  constructor(private anthropic: Anthropic) {}
  // ...
}

// Fallback — reguły biznesowe (Phase 1)
class RuleBasedAIService implements AIService {
  // Proste reguły: "nie bookował >60 dni → churn risk HIGH"
}
```

```
Architektura asynchroniczna:

User Action → API → Queue (BullMQ/Redis) → AI Worker → DB (AIInsight)
                                                 ↓
                                         Claude API (external)

Wyniki AI nigdy nie blokują głównych flow.
Dashboard pokazuje pre-computed insights, nie generuje ich on-demand.
```

### Moduł AI w backendzie

```
/apps/api/src/modules/ai/
├── ai.module.ts
├── ai.service.ts            — fasada
├── providers/
│   ├── claude.provider.ts   — Claude API integration
│   └── rules.provider.ts    — rule-based fallback
├── processors/
│   ├── recommendations.processor.ts  — BullMQ worker
│   └── churn.processor.ts
├── entities/
│   ├── ai-insight.entity.ts
│   └── predicted-churn.entity.ts
└── dto/
    └── ai-insight.dto.ts
```

### Privacy & Data Handling

```
Zasady wysyłania danych do AI API:
✅ Wysyłamy: typy usług, daty wizyt, metraż, czas od ostatniej wizyty
❌ NIE wysyłamy: imię/nazwisko, adres, dane karty, email, telefon
```

### Zalecany model (Phase 1–2)

```
Claude claude-haiku-4-5-20251001 — szybki, tani, wystarczający dla rekomendacji
Claude claude-sonnet-4-6 — dla bardziej złożonych podsumowań (Passport™)
```
