# 🌒 Shadow Payroll

**Private payroll and revenue splits on [Midnight](https://midnight.network).**

[![CI](https://github.com/robertocarlous/Shadow-Payroll/actions/workflows/ci.yml/badge.svg)](https://github.com/robertocarlous/Shadow-Payroll/actions/workflows/ci.yml)

- **Audit dashboard:** https://shadow-payroll.vercel.app (live, currently showing "not connected" — see [Public network deployment status](#public-network-deployment-status) below)
- **Contract address (Preview/Preprod):** _TODO: add once public-network deployment completes_
- **Product X profile:** _TODO: add link_
- **Demo video:** _TODO: add link_

## Public network deployment status

Being direct about where this actually stands rather than glossing over it:

The full pipeline — compile, deploy, fund, claim, double-claim rejection,
reconciliation — is **verified end-to-end against a real local Midnight
devnet with real ZK proofs** (not just the in-memory simulator): see the
[dashboard screenshot](docs/screenshots/audit-dashboard.png) above, taken
live off that deployment.

Getting the same deployment onto a public network hit two separate,
external infrastructure issues on the day of submission:

- **Preprod:** wallet sync against a fresh seed ran ~11 minutes before an
  out-of-memory crash at the default Node heap. Retried the next day with
  an 8GB heap: one attempt ran 20+ minutes with no OOM but also no
  completion; a second attempt OOM'd again after ~10 minutes. Consistent
  failure around the same ~10-minute mark regardless of heap size across
  three independent attempts on two different days points to unbounded
  memory growth in the wallet SDK's sync path against Preprod specifically,
  not a one-off fluke. This matches a previously-documented, team-confirmed
  Midnight indexer/wallet-sync issue hit in this author's earlier Level 2
  submission (a separate project, `midnight-newmoon`), which links the
  relevant Midnight forum report.
- **Preview:** the wallet *did* sync successfully (~35 minutes), but the
  official Preview faucet (`midnight-tmnight-preview.nethermind.dev`)
  returned "Services are currently unavailable. Please try again later" in
  the browser, and its own `/api/health` endpoint reported
  `{"status":"NOT_SERVING","reason":"SYNC_STUCK_RECOVERY","needsRestart":true}`
  — Midnight's own infrastructure explicitly flagging itself as needing a
  restart, re-confirmed the next day. Not something a client-side retry
  can work around.

Given that, this submission ships with the local-devnet deployment as the
verified, working MVP, and the audit dashboard deployed live to Vercel
(https://shadow-payroll.vercel.app) — currently showing "not connected"
because there is no public-network contract address yet, which is the
honest state rather than a fake one. The deploy pipeline itself needs no
further work: once Preprod/Preview funding succeeds (`npm run setup --
network preview` or `--network preprod`), updating
`VITE_CONTRACT_ADDRESS` in the Vercel project and this README is a
five-minute follow-up, not a rebuild.

## The problem

When a DAO, remote team, or contractor network pays people on a public
blockchain, every salary and split becomes visible to anyone — competitors,
coworkers, the public. Teams that want on-chain transparency and auditability
end up sacrificing personal financial privacy to get it.

## The idea

Shadow Payroll solves this with Midnight's selective disclosure and
zero-knowledge proofs:

1. An employer commits a **private allowlist** of `{payee, amount}` as a
   single Merkle root, and declares a total budget.
2. Each payee's actual allocation is known **only to them** — never
   transmitted to the network, the employer, or other payees.
3. To get paid, a payee generates a **local zero-knowledge proof** showing:
   they're a member of the allowlist, their claim hasn't been made before,
   and the claim keeps the payroll solvent — all without revealing which
   allowlist entry is theirs.
4. The contract verifies the proof and updates a **public running total**,
   so anyone can confirm the payroll was fully and correctly distributed
   without ever seeing individual amounts.
5. A public **audit dashboard** shows deposited / claimed / reconciled in
   real time.

## Privacy model — what's actually hidden

Being precise about this rather than oversimplifying it:

| Hidden | Visible |
|---|---|
| Who is on the allowlist at all (only a Merkle root is public) | The Merkle root commitment |
| Which allowlist entry a given claim transaction belongs to (nullifier is derived only from the payee's secret, unlinkable to identity) | That *some* claim happened, and its amount, as a delta on the public running total at that moment |
| Every payee's amount, to every other payee | The total budget and the running total claimed |

In short: **the amount claimed in a given transaction is visible as a number,
but who it belongs to is not** (unlinkability, not amount-hiding). Fully
hiding individual amounts even from the public running total would need
homomorphic commitments and ZK range/sum proofs — a substantially bigger
lift, and out of scope for this MVP. See
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full reasoning and the
nullifier/Merkle scheme.

Also out of scope for this MVP: real token custody. `totalBudget` /
`totalClaimed` are contract-tracked numeric commitments enforced by the
solvency assert in `claim`, not live native-coin transfers via Zswap. That
keeps the focus on the ZK/privacy logic, which is the point of this
milestone.

## Architecture

```
shadow-payroll/
├── contracts/payroll.compact   # the Compact smart contract
├── src/
│   ├── allowlist.ts            # off-chain Merkle tree builder (employer-side)
│   ├── allowlist-cli.ts        # `npm run build-allowlist` entry point
│   ├── witnesses.ts            # private witness wiring for claim()
│   ├── network.ts              # network config (undeployed/preview/preprod)
│   ├── wallet.ts / wallet-state.ts
│   ├── deploy.ts / setup.ts    # deploy pipeline
│   ├── cli.ts                  # interactive employer/payee CLI
│   ├── check-balance.ts
│   └── test/                   # contract simulator + vitest suite
├── frontend/                   # React + Vite public audit dashboard (read-only)
├── docker-compose.yml          # local devnet: node + indexer + proof-server
└── .github/workflows/ci.yml
```

The contract logic:

- `fundPayroll(root, budget)` — employer sets the allowlist root and budget
  once.
- `claim()` — payee proves membership (Merkle path over a depth-8 tree, i.e.
  up to 256 payees per payroll in this MVP), proves they haven't claimed
  before (nullifier derived from their secret, independent of amount), and
  the contract asserts `totalClaimed + amount <= totalBudget` before
  updating the running total.
- `isReconciled()` — `true` once `totalClaimed == totalBudget`.

## Setup

**Prerequisites:** Node.js 22+, Docker Desktop, and the
[Compact toolchain](https://docs.midnight.network):

```bash
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/download/compact-v0.5.1/compact-installer.sh | sh
compact update
```

Then:

```bash
npm install
npm run compile          # compiles contracts/payroll.compact -> contracts/managed/payroll
npm test                 # runs the contract simulator test suite (11 tests)
```

### Local devnet quickstart

```bash
npm run setup             # docker compose up (node+indexer+proof-server), compile, deploy
```

This deploys to the `undeployed` (local) network using the well-known
genesis seed. `npm run setup` is a shortcut for
`docker compose up -d --wait ... && npm run compile && npm run deploy`.

### Deploying to a public network

```bash
npm run setup -- --network preview   # or --network preprod
```

The first run generates a fresh wallet seed and saves it (along with the
deployed contract address) to `.midnight-state.json` — **never commit this
file**, it holds a private key (already gitignored). You'll be prompted to
fund the wallet from that network's faucet if its balance is zero, and the
script polls until funding lands before deploying. Wallet sync state is
cached under `.midnight-wallet-state/` so retries don't re-sync from zero.

> **Known Preprod risk:** Midnight's Preprod indexer has, at times,
> fallen behind the live chain badly enough to break DUST fee validity for
> every transaction (a team-confirmed infrastructure issue, not a
> client-side bug). If `npm run setup -- --network preprod` hangs on DUST
> registration for an extended period with no errors, that's almost
> certainly this. There's no client-side workaround — retry later, or fall
> back to `--network preview` (identical code path, different network) and
> note the substitution, same as this project did for an earlier milestone.

## Usage

**Employer: build the allowlist and fund the payroll**

```bash
npm run build-allowlist payroll-input.example.json
# writes .payroll/root.json and .payroll/credentials/<payeeId>.json

npm run cli
# → 1. Fund payroll (employer), paste .payroll/root.json
```

The input file ([payroll-input.example.json](payroll-input.example.json)) is
a plain array: `[{ "payeeId": "alice", "amount": 100 }]`.
Distribute each `.payroll/credentials/<payeeId>.json` to its payee privately
(e.g. encrypted email) — anyone holding that file can claim that payee's
exact allocation, so treat it like a bearer credential. `.payroll/` is
gitignored.

**Payee: claim your payout**

```bash
npm run cli
# → 2. Claim payout (payee), paste path to your credentials/<id>.json
```

**Anyone: check the public audit state**

```bash
npm run cli
# → 3. View public audit state
```

or open the [frontend dashboard](frontend/) for the same thing, live, with
no wallet needed to view.

## Frontend dashboard

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_NETWORK and VITE_CONTRACT_ADDRESS
npm run build && npm run preview
```

The dashboard is read-only and polls the public indexer directly — no
wallet connection needed to view deposited / claimed / reconciled. Deployed
to Vercel from this repo; see the live link at the top of this README.

![Audit dashboard showing a fully reconciled payroll](docs/screenshots/audit-dashboard.png)

*Verified live against a real local devnet deployment (2 payees, budget 350,
both claimed, zero console errors).*

> **Dev-mode note:** `npm run dev` currently hits a `vite`-dev-server +
> wasm-bindgen module-init ordering issue
> (`Cannot access '__wbindgen_start' before initialization`) coming from
> `@midnight-ntwrk/onchain-runtime-v3`'s WASM glue under Vite's on-demand
> ESM serving. The production path (`npm run build && npm run preview`,
> and the actual Vercel deployment) is unaffected — verified with zero
> console errors against a live local devnet. Use `build && preview` for
> local testing until this is tracked upstream.

## Testing

```bash
npm test
```

11 tests against a contract simulator (no network/proof server needed):
initial state, funding, a valid claim, full reconciliation, double-claim
rejection (nullifier reuse), tampered-amount rejection (breaks the Merkle
path), non-member rejection, claim-before-funding rejection,
double-funding rejection, and the solvency guard rejecting an over-budget
claim.

The full flow (deploy → fund → two claims → reconciled → rejected
double-claim) has also been verified against a real local devnet with real
ZK proofs, not just the simulator.

## CI/CD

`.github/workflows/ci.yml` runs on every push/PR to `main`:
compiles the contract (TS bindings + ZK circuits), runs the test suite, and
builds both the root package and the frontend dashboard.

## License

MIT — see [LICENSE](LICENSE).
