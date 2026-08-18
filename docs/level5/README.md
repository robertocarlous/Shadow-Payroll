# Full Moon cohort (Preview)

- Network: **preview**
- Allowlist root: `884c9d18ae415cc36a46805c88e2ebff25c14dab03a5ef181418b2bb08c35682`
- Total budget: 6375 tNight

`credentials/` holds one disposable payout credential per cohort payee —
deliberately-public Preview test data, same reasoning as
`docs/try-it-yourself/`. Each credential claims the payee's private
allocation with a zero-knowledge proof against the allowlist root above.

## Deploying this payroll to Preview

```bash
npm run setup -- --network preview   # deploy a fresh contract, then
npm run cli                          # choose "Fund payroll" and paste root.json values
```

Then update `frontend/.env` `VITE_CONTRACT_ADDRESS` to the new address. The
dashboard progress bar then tracks claims against that payroll.
