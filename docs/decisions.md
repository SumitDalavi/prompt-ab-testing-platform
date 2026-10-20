# Decisions

## ADR-001: Statistical Significance Engine
**Date:** 2026-08-29  
**Status:** Accepted

**Context:**  
Comparing average ratings (1-5) between two prompt cohorts isn't enough; we need to know if the difference is statistically significant.

**Decision:**  
We implemented a Z-test/T-test statistical engine. When an experiment concludes, the engine calculates the p-value. If p < 0.05, the result is deemed statistically significant.

**Consequences:**  
- ✅ Prevents rolling out a "winning" prompt that only won due to random noise.
- ⚠️ Requires a minimum sample size per cohort before a conclusion can be drawn.

## ADR-002: Progressive Credential Loading (PCL) Architecture
- **Context:** Production hardening required live backends (PostgreSQL, Redis, OpenAI, Anthropic), but removing mocks would break CI pipelines and create high developer onboarding friction.
- **Decision:** Implement Progressive Credential Loading. Keep in-memory and local mock heuristics as the default safe baseline, while wrapping external integrations in auto-promoting factory adapters triggered by environment variables.
- **Consequences:** 
  - *Pros:* 100% CI pass rate without requiring external secrets; zero setup friction for new contributors; progressive upgrade to production clusters.
  - *Cons:* Adds lightweight factory abstraction layers and runtime credential detection logic.
