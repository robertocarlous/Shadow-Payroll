# Shadow Payroll — User Guide

A plain-English guide to receiving and claiming your payroll payout on
Midnight. No coding required — just a wallet, a browser, and a few minutes.

> **Which network?** This launch runs on Midnight **Preview**. Preprod is
> the official testnet but was unavailable during this cycle (the indexer
> fall-behind/DUST failures documented in the [README](../README.md)), so
> we use **Preview** — the identical code path. The steps below are the same
> on either network; just pick the matching faucet and network name.

## Getting Started on Preview

Here's everything you need, end to end:

1. **Install the Lace wallet** — a browser extension from
   [lace.io](https://www.lace.io/). Create a new wallet and back up your
   recovery phrase somewhere safe.
2. **Switch Lace to the Preview network** — open Lace → Settings →
   Network → **Midnight Preview** and save.
3. **Get a little test money** — claims cost a tiny amount of DUST. Grab
   some free tNight/DUST from the
   [Preview faucet](https://midnight-tmnight-preview.nethermind.dev) and
   send it to your wallet address.
4. **Run the local proof-server** (one command) — Lace doesn't create
   Midnight zero-knowledge proofs in-wallet yet, so proving happens against
   a tiny service on your own machine. From a terminal:
   ```bash
   docker compose up -d proof-server
   ```
5. **Open the dashboard** — https://shadow-payroll.vercel.app and press
   **Connect Lace** at the top right. Your address appears in the chip.
6. **Claim your payout** — see [Your First Transaction](#your-first-transaction).

> If you installed Lace a while ago, make sure it's unlocked and on the
> same network as the dashboard (Preview). The checklist on the dashboard
> page walks you through all of this live.

## Your First Transaction

1. On the dashboard, confirm the top-right chip says **Connected** (it
   shows your wallet address).
2. Get your **credential file** — the employer issued you one
   (e.g. `user07.json`). It is private to you: anyone holding it can claim
   your exact allocation, so keep it to yourself.
3. Scroll to the **Claim your payout** panel. Drag your credential file
   into the box, or click to browse, or paste its JSON into the text area.
4. Press **Claim payout**. The dashboard proves your claim locally, then
   submits it through your wallet. Wait 30–60 seconds.
5. You'll see a green **“Claimed”** banner with a transaction ID, and the
   progress bar / “Claims made” counter on the page goes up.

> **It worked, but what actually happened?** You just proved, with a
> zero-knowledge proof that reveals nothing about *which* payee you are or
> *how much* anyone else got, that (a) you're on the payroll, (b) you
> haven't claimed before, and (c) the payroll stays within budget. The
> amount you claimed appears only as a delta on the public running total —
> **who** claimed it stays private.

## Things that changed in this version (from your feedback)

- The dashboard's onboarding **checklist and FAQ** make the first-run
  experience obvious — landing on the page now tells you exactly what to do
  first.
- **Clearer claim errors** — if something goes wrong (already-claimed
  credential, stale wallet connection, missing DUST), the panel tells you
  in plain words instead of an opaque failure.
- **Faucet + network links are live** in the checklist, so the getting-test
  money step is one click.
- A **USERS.md / LAUNCH_USERS.md** tracker keeps the Preprod(Preview) cohort
  and their verifiable wallet addresses in the repo.

## Common questions

**Is my amount private?** Yes — your allocation is hidden inside a Merkle
root and your claim proves membership with zero knowledge. Your amount is
never shown to anyone.

**Can someone see I claimed?** They can see that *a* claim happened (the
counter goes up), but not which payee did it — the proof is unlinkable.

**Is this real money?** No — this is a testnet demo payroll. The
credentials are public disposable test data so you can safely try the full
flow.

**I'm stuck.** Open a GitHub issue on the repo. The team answers setup
questions, can re-issue a lost credential, and triages feedback weekly.

**Want to help shape it?** Report a bug or suggest a feature via GitHub
issues — every entry is picked up in the weekly triage and logged in
[docs/FEEDBACK.md](FEEDBACK.md).
