# Level 6 Users — Preview

User tracking moved to a live Google Sheet — see
**[the user feedback form responses](https://docs.google.com/spreadsheets/d/1LeJv0qy7mZjlCg-Ub7vBJuRgfbs-mkhn/edit?gid=1346840953#gid=1346840953)**.
Every row is a real payee who claimed and then filled in the form: it
carries their wallet address, network, and structured feedback in one
place, so it doubles as both the user registry and the feedback record
(see [docs/FEEDBACK.md](docs/FEEDBACK.md) for the mined themes).

> **Network note:** Preprod was unavailable this cycle (documented indexer /
> DUST failures), so onboarding runs on Midnight **Preview** — the
> identical code path. Wallet addresses in the sheet are Preview addresses,
> verifiable on-chain against the contract's allowlist root.

**Data quality note:** of the 49 raw rows in that sheet, ~20 (the
2026-07-13/14 batch) are pairs with word-for-word identical free-text
answers submitted at the identical second under different names —
almost certainly ~10 duplicated submissions rather than 20 independent
ones. Treat the sheet as ~40 unique verified respondents, not 49; see
"Feedback #5" in [docs/FEEDBACK.md](docs/FEEDBACK.md) for the full
breakdown.

The onboarding pipeline itself (Lace wallet setup, faucet funding,
credential import, on-chain claim with a ZK proof) is documented in
[docs/USAGE.md](docs/USAGE.md) and was verified end-to-end with the
50-user Level 5 cohort ([USERS.md](USERS.md)); credential files for
that cohort are in [`docs/level5/credentials/`](docs/level5/credentials/).
