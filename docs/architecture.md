# Architecture: Prompt Versioning and A/B Testing Platform

## System Diagram
The following Mermaid.js sequence diagram maps the core workflow and interactions:

```mermaid
sequenceDiagram
Request->>Splitter: Hash user_id
Splitter->>VariantA: 80% traffic
Splitter->>VariantB: 20% traffic
VariantB->>Metrics: Log score
Metrics->>Stats: t-test significance
Stats-->>Dashboard: Variant B wins
```

## Component Breakdown
- **Core Technology**: TypeScript, PostgreSQL, SciPy (via Python worker)
- **Design Paradigm**: Emphasizes high availability, fault tolerance, and security.
