# prompt-ab-testing-platform Architecture

## System Diagram
The following Mermaid.js sequence diagram maps the core workflow and interactions within the system:

```mermaid
sequenceDiagram
    Client->>API: Get Prompt(ExperimentID)
API->>DB: Assign Variant A or B
DB-->>API: Prompt String
API-->>Client: Prompt
Client->>API: Log Metric (Thumbs Up/Down)
API->>DB: Record Success
```

## Component Breakdown
- **Core Technology**: Node.js, PostgreSQL
- **Design Paradigm**: Emphasizes high availability, fault tolerance, and security boundaries.

## Security & Scaling Considerations
- Strict input validations and sanitization.
- Horizontal scalability achieved via stateless workers and queues where applicable.
- Encrypted data at rest and in transit.
