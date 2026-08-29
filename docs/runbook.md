# Runbook — prompt-ab-testing-platform
> Last updated: 2026-08-29

## Quick Start
```bash
npm install
npm run start
```
API runs on `http://localhost:3000`.

## Run Tests
```bash
npm test
bash tests/e2e/test_statistical_significance.sh
```

## Environment Variables
| Variable | Default | Purpose |
|---|---|---|
| PORT | `3000` | HTTP listening port |
| SALT | `experiment_salt` | Salt used for hashing session IDs into cohorts |
