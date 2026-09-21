# Deployment log

A committed, running record of every contract deployment to a public
network — so "is this current?" has a concrete, dated answer in the repo
itself, not just a claim in prose. Contains only public data (contract
address, deployer's public wallet address, timestamps, transaction IDs).
Wallet seeds are never committed — see `.midnight-state.json` (gitignored,
local only) for the private deployment state this log is generated from.

A scoped copy lives at [contracts/DEPLOYMENTS.md](../contracts/DEPLOYMENTS.md),
next to the contract source itself.

Every entry below is independently verifiable on-chain via the Midnight
Preview indexer:

```
curl -s -X POST https://indexer.preview.midnight.network/api/v4/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ contractAction(address: \"<address>\") { __typename transaction { hash block { height timestamp } } } }"}'
```

---

## Preview network

### 2026-09-21 — current

| Field | Value |
|---|---|
| Contract address | `157bc413f2b308b850ae340cc0f1c22951f9ea1c2079c25b9df622f04bc635fe` |
| Deployer (public address) | `mn_addr_preview10ufjd264h8lw7cj4sv2hqj7r0ar2m3xzczrh0rzmt2uyvhs5wursaeq4yr` |
| Deployed at | 2026-09-21T17:05:38.320Z |
| Funded (`fundPayroll`) | budget 100, tx `00933fc956e778b22b3c62837c6097033f0004218fec7a748ac6a469948eab9a48` |
| Allowlist | `.payroll-fresh-v2/root.json` (same clean demo round reused — leaf/nullifier circuits unchanged, so existing credentials still verify) |
| Why redeployed | Real contract code change (see below), not just a fresh instance. |
| Code change from previous | Added three employer-only circuits: `extendDeadline` (push `claimDeadline` later, never earlier), `pauseClaims`/`unpauseClaims` (circuit breaker — freeze new claims without redeploying; claims already made are untouched). `payroll.compact` now compiles 7 circuits, up from 4. |

This is the address in `frontend/.env.production`, the Vercel production
env var, and the README's "Public Network Deployment Status" table.

### 2026-09-18 — superseded

| Field | Value |
|---|---|
| Contract address | `2fc1931ba3dc4558254fd088a0e4db9d03244a8c885118240f699e35d62f0fe5` |
| Deployed at | 2026-09-18T02:50:38.161Z |
| Deploy tx | block 913655 |
| Funded (`fundPayroll`) | budget 100, tx `003d804a07975448bd57215c593739c601ce9da0b582b1e38c68fbcb28fe939482`, block 964509 |
| Why superseded | Reviewer feedback flagged the Aug 15 deployment (below) as stale. Redeployed fresh with no code changes at the time — superseded three days later by the code change above. |

### 2026-08-15 — superseded

| Field | Value |
|---|---|
| Contract address | `8273828c7cc7fe141847c769b8e4ca09c5ba4d44916d13e2f1b8ca60207ab6f0` |
| Deployed at | 2026-08-15T20:25:51.845Z |

Referenced (frozen, not updated) in [docs/LEVEL5.md](LEVEL5.md) and
[docs/WAVE1-UPDATES.md](WAVE1-UPDATES.md) as the address live at the time
of those submissions.
