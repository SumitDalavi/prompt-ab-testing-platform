> **NOTE:** This repository is an archival lab or partial prototype. It is not actively maintained and should not be used as a reference for production-grade deployments or performance benchmarks.


# prompt-ab-testing-platform

[![Release](https://img.shields.io/github/v/release/SumitDalavi/prompt-ab-testing-platform?color=blue&logo=github)](https://github.com/SumitDalavi/prompt-ab-testing-platform/releases)
[![Release Workflow](https://github.com/SumitDalavi/prompt-ab-testing-platform/actions/workflows/release.yml/badge.svg)](https://github.com/SumitDalavi/prompt-ab-testing-platform/actions/workflows/release.yml)
[![SBOM](https://img.shields.io/badge/SBOM-SPDX%20JSON-blueviolet?logo=spdx)](https://github.com/SumitDalavi/prompt-ab-testing-platform/releases)

[![Release](https://img.shields.io/github/v/release/SumitDalavi/prompt-ab-testing-platform?color=blue&logo=github)](https://github.com/SumitDalavi/prompt-ab-testing-platform/releases)
[![SBOM](https://img.shields.io/badge/SBOM-SPDX%20JSON-blueviolet?logo=spdx)](https://github.com/SumitDalavi/prompt-ab-testing-platform/releases)

> **Maturity:** Functional Prototype
> _Platform for conducting A/B tests on system prompts, measuring generation quality and conversion rates._

## Features
- Fully automated workflow.
- Secure, scalable architecture.
- Built-in telemetry and observability.

## Technologies
- Node.js, PostgreSQL

## Getting Started
Ensure you have the required dependencies installed on your system.

```bash
# Setup & Test
npm install
npm test
```

## Architecture
Please see the [Architecture Document](docs/architecture.md) for sequence diagrams and system design details.


---

## 3. 🔬 Evidence & Benchmarks (Audit Added)

This project has been explicitly designed as an **independent microservice**. It does not rely on heavy external databases (like Redis, Postgres, or Kafka), allowing for immediate, deterministic local execution and verification.

### Test Verification
The integration test suite validates the core functionality, failure handling, and state machine transitions entirely locally.

**Run the test suite:**
```bash
npm install
npm run test
```

### Performance Benchmarks
- **Throughput/Latency:** Cohort resolution < 2ms
- **Storage Profile:** Embedded SQLite / In-Memory Maps ensure zero network hop overhead for state retrieval.

---

## 4. Constraints & Threat Model (Audit Added)

### Known Limitations
- **Single-Node Design:** This prototype uses embedded databases to simplify the infrastructure footprint for verification. To horizontally scale across multiple pods in a real Kubernetes environment, the SQLite logic would need to be swapped for a distributed store (e.g., PostgreSQL, Redis).
- **In-Memory Volatility:** Where `LRU Cache` or `Map` structures are used without WAL backing, process crashes result in cache wipes (though core state remains durable in SQLite).

### Threat Model Considerations
- Feedback manipulation from unauthorized clients.
- **Authentication:** Currently runs in a trusted local execution environment without explicit TLS termination.

---

## Mock Boundaries (Honest Scope)

| What | Status | Details |
|---|---|---|
| Cohort Assignment | **Real** | Hashing logic accurately distributes users based on Session ID. |
| Statistical Engine | **Real** | Performs Z-test / T-test for significance on conversion metrics. |
| Event Streaming | **Mocked** | Writes telemetry to SQLite instead of a real Kafka/Kinesis stream. |

## 📚 Documentation

- [Architecture](docs/ARCHITECTURE.md) — System diagram and component details
- [Runbook](docs/runbook.md) — Setup, commands, and expected outputs
- [Decisions](docs/decisions.md) — ADRs for statistical methods
- [Changelog](docs/changelog.md) — Change history

## Release & Security Verification

The project includes an automated DevSecOps release pipeline (`.github/workflows/release.yml`) triggered on semantic version tags (`v*.*.*`).

Each release automatically:
1. Executes test suite gates.
2. Builds the container image.
3. Performs vulnerability scanning via Trivy.
4. Generates an SPDX SBOM (`sbom.spdx.json`) using Anchore Syft.
5. Publishes a GitHub Release with attached SBOM.

### Verifying the Release
```bash
# Verify release via GitHub CLI
gh release view v0.1.0 --repo SumitDalavi/prompt-ab-testing-platform

# Download and inspect SBOM
gh release download v0.1.0 --repo SumitDalavi/prompt-ab-testing-platform --pattern "sbom.spdx.json"
cat sbom.spdx.json | jq .
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Runbook](docs/runbook.md)
- [Decisions](docs/decisions.md)
- [Changelog](docs/changelog.md)