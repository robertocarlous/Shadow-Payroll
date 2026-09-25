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

## Preprod network — deployment not currently possible

No contract has ever been deployed to Preprod — not "pending," attempted
and blocked by infrastructure, most recently re-verified below.

### 2026-09-25 — re-attempted, still not viable

Preprod's indexer answers simple queries fine (`curl` against
`https://indexer.preprod.midnight.network/api/v4/graphql` returns a current
block height), which made it look worth retrying. A real wallet sync tells
a different story:

| Attempt | Heap ceiling | Result |
|---|---|---|
| 1 | default (~4 GB) | OOM crash after ~585s, heap at 3.3 GB and still growing |
| 2 | `--max-old-space-size=8192` | OOM crash after ~1474s, heap at 6.8 GB and still growing |

Heap usage roughly doubled between the two runs rather than plateauing —
this is unbounded memory growth during wallet sync against the Preprod
indexer, not a fixed memory requirement that a bigger ceiling would clear.
Doubling the ceiling only bought ~2.4x more runtime before the same crash.
This is a confirmed Midnight Preprod infrastructure issue, not a contract,
client, or address bug — the deployed contract code is identical across
networks (see the Preview entries above), so there's nothing network-specific
for a Preprod redeploy to fix.

Preview remains the deployed, documented, and independently-verifiable
network (see above) until Preprod's indexer/wallet-sync path is stable
enough to complete a sync without crashing.
