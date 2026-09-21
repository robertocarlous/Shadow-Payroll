# `payroll.compact` — deployment log

Scoped copy of [docs/DEPLOYMENTS.md](../docs/DEPLOYMENTS.md), kept next to
the contract source it deploys. See that file for the full log, funding
transaction IDs, and the exact `curl` command to verify each entry
on-chain against the Midnight Preview indexer.

## Current — 2026-09-21

| Field | Value |
|---|---|
| Network | Preview |
| Contract address | `157bc413f2b308b850ae340cc0f1c22951f9ea1c2079c25b9df622f04bc635fe` |
| Deployed at | 2026-09-21T17:05:38.320Z |
| Code change | Added `extendDeadline` (employer can push the claim deadline later, never earlier) and `pauseClaims` / `unpauseClaims` (circuit breaker — freeze new claims without redeploying; claims already made are untouched). 7 circuits total, up from 4. |

## Superseded

| Date | Contract address | Note |
|---|---|---|
| 2026-09-18 | `2fc1931ba3dc4558254fd088a0e4db9d03244a8c885118240f699e35d62f0fe5` | Fresh redeploy, no code change |
| 2026-08-15 | `8273828c7cc7fe141847c769b8e4ca09c5ba4d44916d13e2f1b8ca60207ab6f0` | Original Level 5 / Wave 1 deployment |
