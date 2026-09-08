# 🌕 Shadow Payroll — Level 6 Onboarding Script

Paste this to each incoming Level 6 user (personalize the `{{name}}` /
`{{credential}}` parts). The whole flow is also documented in plain English
in [USERS/USAGE guide](../docs/USAGE.md).

---

## Part 1 — What to install (2 minutes)

1. Install the **Lace wallet** browser extension from https://www.lace.io/.
   Create a new wallet and back up your recovery phrase somewhere safe.
2. Open Lace → Settings → **Network** → choose **Midnight Preview** and save.
3. Grab a little free test money from the **Preview faucet**:
   https://midnight-tmnight-preview.nethermind.dev
   Paste your wallet address into the faucet box and hit request.

## Part 2 — How to use the product on Preview (numbered steps)

1. Make sure Docker is running on your machine, then start the local
   proof-server once:
   ```bash
   docker compose up -d proof-server
   ```
   *(Lace can't generate Midnight zero-knowledge proofs in-wallet yet, so
   proving runs against this tiny local service. You only do this once.)*
2. Open the dashboard: **https://shadow-payroll.vercel.app**
3. Click **Connect Lace** (top right) and approve the connection. The chip
   should show your address.
4. Scroll to **Claim your payout**. Drag your credential file
   (e.g. `launch01.json`, sent to you privately) into the box — or paste its
   JSON.
5. The dashboard now **previews the credential** for you: which payee and
   how much (your own amount — never posted publicly).
6. Press **Claim payout**, wait 30–60 seconds for the zero-knowledge proof
   and the transaction, and watch the green **"Claimed"** banner appear and
   the on-chain progress bar move.

## Part 3 — Confirm your wallet address (10 seconds)

Your on-chain proof doubles as your verification. Please reply to me with:

```
My row: launch {XX}
Wallet address: <your address as shown in Lace>
```

That's the same address you connected to the dashboard with. I'll drop it
into [LAUNCH_USERS.md](../LAUNCH_USERS.md) against your row, and your
address is then verifiable on-chain (your claim produces a public,
verifiable zero-knowledge proof against the payroll's allowlist root).

---

## Troubleshooting (paste along if useful)

- **"Wallet is locked" / connection keeps dropping** — unlock Lace, then the
  dashboard auto-refreshes the connection and retries.
- **"Credential check" warning** — the JSON isn't a valid credential file;
  re-check you pasted the whole file (it starts with `{`).
- **No DUST** — the faucet step above; one request is enough for several
  claims.
- **Anything else** — open a GitHub issue on the repo; the team answers
  setup questions and triages feedback weekly.