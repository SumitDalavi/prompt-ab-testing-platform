# Architecture — prompt-ab-testing-platform
> Last updated: 2026-08-29 | Maturity: Partial Prototype
> _A/B testing platform for prompt variants with statistical rigor._

## System Diagram
```mermaid
flowchart TD
    Client(["API Client\n(Session ID)"])
    Router["A/B Router\n:3000"]
    Metrics["Metrics Aggregator"]
    DB[("SQLite\n(Telemetry)")]
    Stats["Statistical Engine"]

    Client -->|"Get Prompt"| Router
    Router -->|"Hash(SessionID)"| Router
    Router -->|"Return Variant A or B"| Client
    Client -->|"Submit Feedback (1-5)"| Router
    Router -->|"Log Event"| DB
    Metrics -->|"Query Cohort Data"| DB
    Metrics -->|"Calculate p-value"| Stats
```

## Component Table
| Component | File | Responsibility | Tech |
|---|---|---|---|
| Router | `src/router.ts` | Assigns cohorts deterministically | Node.js |
| Stats Engine | `src/stats.ts` | Calculates Z-score / T-test | Node.js |
| Storage | `src/db.ts` | Logs assignment and feedback events | SQLite |

## Dependency Honesty Table
| Dependency | Status | Notes |
|---|---|---|
| SQLite | **Real** | Used as a local data warehouse for telemetry. |
| LLM Provider | **Mocked** | Platform assumes prompt injection happens downstream. |


## Component Breakdown
- **Core Technology**: TypeScript, PostgreSQL, SciPy (via Python worker)
- **Design Paradigm**: Emphasizes high availability, fault tolerance, and security.