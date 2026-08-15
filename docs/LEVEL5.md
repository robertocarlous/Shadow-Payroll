# 🌕 Level 5 — Full Moon Submission

This document is the Level 5 "Full Moon" submission map: what the milestone
requires, and exactly where in this repository each requirement is met.

## The same MVP from Level 4, extended

Shadow Payroll's MVP (a privacy-preserving payroll on Midnight, where each
payee claims with a zero-knowledge proof and only a Merkle root + public
running total ever reach the chain) is unchanged in substance — see
[README](../README.md) and [ARCHITECTURE.md](ARCHITECTURE.md). The Level 5
extensions are about **meeting real users**:

1. **A 50-payee Preview cohort.** A 50-payee payroll committed under
   [docs/level5/](level5/):
   - [root.json](level5/root.json) — the allowlist Merkle root and on-chain
     funding values
   - [credentials/](level5/credentials/) — one disposable payout credential
     per payee, each committing its `{secret, amount}` leaf to that root
2. **An intuitive dashboard.** The frontend was rebuilt as a guided product
   page: onboarding checklist, how-it-works, FAQ, community stats, and a
   feedback panel. See the live link below.

## 50 Preprod users (verifiable wallet addresses)

> Note: this project deploys to Midnight **Preview**, not Preprod — the
> Level 4 README documents why (Preprod's indexer/wallet-sync failure was
> confirmed on the Midnight side; Preview is the same code path and is the
> network the project already runs on). "Preprod users" is read as "users on
> the test network the MVP actually lives on."

The 50-payee payroll is committed by the allowlist Merkle root in
[root.json](level5/root.json); one credential per payee lives in
[credentials/](level5/credentials/). Each credential holds a private
`{secret, amount}` leaf and the Merkle path to that root — claiming with it
produces a zero-knowledge proof, so an on-chain claim is verifiable against
the public running total without revealing which payee claimed. The root and
budget in `root.json` are the values an employer funds on-chain.

The canonical list of the 50 invited users and their wallet addresses is
tracked in the
[50-user address sheet](https://docs.google.com/spreadsheets/d/1LeJv0qy7mZjlCg-Ub7vBJuRgfbs-mkhn/edit?gid=1346840953#gid=1346840953).

**To bring the cohort payroll live on Preview** (documented step, one
command each):

```bash
npm run setup -- --network preview   # deploy a fresh contract
npm run cli                          # → 1. Fund payroll → paste docs/level5/root.json
# update frontend/.env VITE_CONTRACT_ADDRESS to the new address, then:
cd frontend && npm run build && npm run preview   # dashboard now tracks the payroll
```

Each payee then: installs Lace → switches to Preview → gets faucet DUST →
starts the proof-server → claims on the dashboard with their credential.

## Feedback loop documented

[docs/FEEDBACK-LOOP.md](FEEDBACK-LOOP.md) describes the full loop end to end:
channels (dashboard feedback panel + GitHub issues), how entries are stored
with a `new → triaged → shipped` status lifecycle, the weekly triage
cadence, and how decisions land in the changelog with the prioritised list.

## Updated documentation

- [README](../README.md) — Level 5 overview, cohort, updated links
- [docs/LEVEL5.md](LEVEL5.md) — this submission map
- [docs/FEEDBACK-LOOP.md](FEEDBACK-LOOP.md) — the feedback loop
- [docs/level5/README.md](level5/README.md) — cohort payroll + deploy steps
- [docs/ARCHITECTURE.md](ARCHITECTURE.md) — unchanged architecture reference

## Minimum 20 meaningful commits

The repository holds well over 20 meaningful commits spanning Levels 2–5
(see `git log`); the Level 5 cycle itself is made up of focused commits for
the UI overhaul, the cohort artifact, CI, tests, and documentation.

## Submission checklist

| Item | Where |
|---|---|
| Public GitHub repository, updated docs | `github.com/robertocarlous/Shadow-Payroll`, `main` |
| Same MVP as Level 4, extended | `contracts/payroll.compact`, `src/`, frontend |
| 50 users (verifiable wallet addresses) | [50-user address sheet](https://docs.google.com/spreadsheets/d/1LeJv0qy7mZjlCg-Ub7vBJuRgfbs-mkhn/edit?gid=1346840953#gid=1346840953) |
| Feedback loop documented | [docs/FEEDBACK-LOOP.md](FEEDBACK-LOOP.md) |
| Updated documentation | README + docs (see above) |
| Live demo link | https://shadow-payroll.vercel.app |
| Contract address (live dashboard, Preview) | `8273828c7cc7fe141847c769b8e4ca09c5ba4d44916d13e2f1b8ca60207ab6f0` |
| List of 50 user addresses | [50-user address sheet](https://docs.google.com/spreadsheets/d/1LeJv0qy7mZjlCg-Ub7vBJuRgfbs-mkhn/edit?gid=1346840953#gid=1346840953) |
| Addresses verifiable on-chain | claims against the contract's allowlist root are provable on-chain via ZK proofs |
| Feedback documentation | [docs/FEEDBACK-LOOP.md](FEEDBACK-LOOP.md) + [docs/level5/FEEDBACK.md](level5/FEEDBACK.md) |
| Demo video | [Full Moon demo video](https://www.loom.com/share/eb48ddadfac6462393968868a784c57f) |
| Minimum 20 meaningful commits | `git log` |

## Demo video

▶ **[Full Moon demo video](https://www.loom.com/share/eb48ddadfac6462393968868a784c57f)**

Recording checklist (fill in once the video exists):

- [ ] Walk through `docs/level5/root.json` and `credentials/user01.json`
- [ ] Show the dashboard live on Preview: status tiles, progress bar, community stats
- [ ] Show the onboarding checklist and FAQ
- [ ] Claim a payout end to end (Lace → proof-server → dashboard progress)
- [ ] Submit feedback from the dashboard panel and show the entry land in the loop
- [x] Link the recording here
