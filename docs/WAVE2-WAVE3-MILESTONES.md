# Wave 2 & Wave 3 Milestones — Shadow Payroll (Midnight)

*(Copy-paste milestone plan for the AKINDO "Updates in this Wave" fields and your
internal roadmap. Wave 2: Sep 27 – Oct 17, 2026 · Wave 3: Oct 27 – Nov 16, 2026.)*

---

## Wave 2 Milestones (Sep 27 – Oct 17) — "Real tokens, real payrolls"

Theme: turn the simulator-tracked payroll into real money movement.

| # | Milestone | What it delivers | Verification |
|---|---|---|---|
| M2.1 | **Real token custody via Zswap** | Replace contract-tracked numeric claims with actual DUST/token transfers. `totalBudget`/`totalClaimed` become live balances; claiming pays the payee native coins while ZK membership/nullifier logic stays intact. Closes the core MVP's documented out-of-scope item. | On-chain claim tx shows a real token transfer; balance deltas on dashboard; double-claim still rejected; `removePayee` refunds. |
| M2.2 | **Multi-payroll management** | Employer dashboard + CLI to run several payrolls (per team/month) from one wallet, each with its own root/budget/deadline. | Create → fund → claim → reconcile 2 payrolls side-by-side; dashboard shows per-payroll cards. |
| M2.3 | **Recurring payrolls** | Schedule a template (allowlist, budget, cadence) that re-funds automatically each cycle, with per-cycle renewal proofs. | 2 consecutive funded cycles observed; expired cycle's unclaimed funds roll back. |
| M2.4 | **In-browser proving** | Remove the proof-server dependency in the dashboard (wasm provers + ZK config fetch), so "Claim" works with only Lace and zero local Docker. | Clean claim through the browser alone; README updated; CI build stays green. |
| M2.5 | **Revenue-split mode** | Contract circuit variant computing pro-rata splits of a pool among allowlisted parties in one ZK proof, no employer pre-computation. | Split proof verifies; dashboard shows pool + splits; tests added. |

**Wave 2 exit criteria:** at least M2.1 + M2.2 fully live on Preview, with new tests, updated README/architecture docs, a new demo video, and an expanded on-chain cohort.

---

## Wave 3 Milestones (Oct 27 – Nov 16) — "Amounts fully hidden"

Theme: the privacy endgame — nobody sees any numbers at all.

| # | Milestone | What it delivers | Verification |
|---|---|---|---|
| M3.1 | **Fully amount-hiding payroll** | Pedersen (or similar) commitments for each claim + ZK range proofs, so even the *public running total* reveals nothing about individual amounts. Replaces the current visible-as-delta model and closes the second documented out-of-scope gap. | All ledger amounts are commitments; `isReconciled` proven via a ZK sum proof; simulator + e2e tests; privacy-model table updated. |
| M3.2 | **Vesting & conditional release** | Per-payee vesting schedules (cliff/linear) enforced in-circuit; release provable only once conditions (time/milestone) are met. | Vesting test vectors pass; dashboard shows locked/vested splits; UI reflects it. |
| M3.3 | **Interoperability & governance** | Wire the payroll to Cardano and/or DAO tooling: a DAO proposal triggers funding or removal; cross-check a Cardano-side identity proof. | Payroll triggered via a proposal tx; cross-chain proof demonstrated. |
| M3.4 | **Large-scale optimization** | Larger allowlists (depth 12+), faster proving (batched claims), cheaper verification — demonstrated, benchmarked gains. | Benchmarks before/after; contract still compiles; tests pass. |

**Wave 3 exit criteria:** M3.1 live with the full claim flow fully private end-to-end, complete docs (updated ARCHITECTURE + privacy model), pitch deck + video, and a public evaluation instance judges can run.

---

## Copy-paste: Wave 2 "Updates in this Wave" draft

Wave 2 moves Shadow Payroll from contract-tracked numeric claims to real
money movement and real-world payroll operations:

1. Real token custody — claiming now transfers actual tokens (Zswap) while
   keeping the zero-knowledge allowlist/nullifier privacy logic intact
2. Multi-payroll management — run several independent payrolls per team or
   month from one wallet, each with its own allowlist root, budget, and
   deadline
3. Recurring payrolls — scheduled templates that re-fund each cycle on-chain
4. In-browser proving — removed the local proof-server dependency so payees
   claim straight from the browser + Lace wallet
5. Revenue-split mode — a new contract circuit for pro-rata pool splits in a
   single ZK proof

All changes are live on Midnight Preview with expanded test coverage, updated
architecture docs, and a new walkthrough video.

## Copy-paste: Wave 3 "Updates in this Wave" draft

Wave 3 delivers the privacy endgame for Shadow Payroll — no amount numbers
on-chain at all:

1. Fully amount-hiding payroll — individual claims and the running total are
   now commitments proven in zero knowledge (range proofs + ZK sum proof for
   reconciliation), so no observer learns what anyone earns
2. Vesting & conditional release — per-payee vesting schedules enforced
   in-circuit with provable release conditions
3. Interoperability & governance — payrolls can be triggered or amended by a
   DAO proposal, with cross-checked Cardano-side proofs
4. Large-scale optimization — deeper allowlists, batched claiming, and
   cheaper verification with benchmarked gains

The full claim flow is now private end to end, documented in the updated
architecture / privacy-model docs, with a public evaluation instance.

---

## Wave roadmap at a glance

| Wave | Window | Theme | Primary builds |
|---|---|---|---|
| Wave 1 | Aug 27 – Sep 16 | Core MVP live | ZK payroll contract, CLI, audit dashboard, 50-user Preview cohort, CI/tests |
| Wave 2 | Sep 27 – Oct 17 | Real tokens, real payrolls | Zswap custody, multi-payroll, recurring, in-browser proving, revenue splits |
| Wave 3 | Oct 27 – Nov 16 | Amounts fully hidden | Commitment/range-proof privacy, vesting, governance/interop, scale optimization |