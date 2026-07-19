# Architecture

## Ledger state (public)

| Field | Type | Meaning |
|---|---|---|
| `allowlistRoot` | `Bytes<32>` | Merkle root committing the private `{payee, amount}` list |
| `totalBudget` | `Uint<64>` | Employer's declared budget, set once by `fundPayroll` |
| `totalClaimed` | `Uint<64>` | Running sum of claims |
| `usedNullifiers` | `Set<Bytes<32>>` | One entry per successful claim; prevents double-claims |
| `initialized` | `Boolean` | Whether `fundPayroll` has run |

Nothing else is stored on-chain. In particular, there is no on-chain list of
payees, no per-payee balance, and no mapping from any public identifier to
an amount.

## Circuits

### `fundPayroll(root: Bytes<32>, budget: Uint<64>)`

Plain public arguments, not witnesses — the whole point of this call is to
publish the root and budget, so there's no private value to protect here.
Asserts the payroll hasn't already been initialized, then sets
`allowlistRoot`, `totalBudget`, and `totalClaimed = 0`.

### `claim()`

All four inputs are **witnesses** — private values supplied locally by the
claiming payee via `src/witnesses.ts`, never passed as public circuit
arguments:

- `payeeSecret: Bytes<32>` — the payee's private allocation secret
- `payeeAmount: Uint<64>` — their allocated amount
- `payeeSiblings: Vector<8, Bytes<32>>` — Merkle sibling path
- `payeeDirections: Vector<8, Boolean>` — left/right bits for that path

The circuit:

1. Recomputes `leaf = persistentHash("shadow-payroll:leaf:v1", secret, amount)`
   and walks it up through 8 levels of
   `persistentHash("shadow-payroll:node:v1", left, right)` using the private
   siblings/directions, asserting the result equals the public
   `allowlistRoot`. This is the membership proof: it proves the payee's
   `(secret, amount)` pair is one of the leaves committed at deploy time,
   without revealing *which* leaf or any other leaf's value.
2. Computes `nullifier = persistentHash("shadow-payroll:nullifier:v1", secret)`
   — deliberately **independent of amount**, so a payee can't manufacture a
   second, different nullifier by claiming a different amount than their
   real one (the Merkle check would fail anyway, but this keeps the
   nullifier scheme itself amount-agnostic on principle). Asserts the
   nullifier isn't already in `usedNullifiers`, then inserts it.
3. Asserts `totalClaimed + amount <= totalBudget` (the solvency guard) and
   updates `totalClaimed`.

Domain-separated hash tags (`"...:leaf:v1"`, `"...:node:v1"`,
`"...:nullifier:v1"`) prevent a value computed for one purpose from being
replayed as if it were a different kind of value.

### `isReconciled()`

Pure read: `initialized && totalClaimed == totalBudget`.

## Off-chain: building the allowlist

`src/allowlist.ts` builds the Merkle tree locally (the employer's machine,
never on-chain) from a plain `{payeeId, amount}[]` list:

1. Generate a random 32-byte `secret` per payee.
2. `leaf = persistentHash(...)` per payee (same construction as the circuit).
3. Build the tree bottom-up to depth 8 (256 leaves; unused slots are filled
   with a fixed, publicly-derivable filler leaf — claiming one only ever
   adds 0 to `totalClaimed`, so it's inert, not a security hole).
4. For each real payee, extract their sibling path + direction bits.
5. Write one **credential file** per payee: `{payeeId, secret, amount,
   siblings, directions}`. This file is what a payee needs to claim — treat
   it as a bearer credential and distribute it out-of-band.

This off-chain code reuses the *actual* `@midnight-ntwrk/compact-runtime`
`persistentHash`/`CompactTypeVector`/`CompactTypeBytes`/`convertFieldToBytes`
functions — the same ones the compiled circuit calls — rather than
reimplementing the hash independently. That was confirmed by inspecting the
compiled `contracts/managed/payroll/contract/index.js` output directly
(the exact byte layout of the domain tags, e.g. UTF-8 bytes zero-padded to
32, and the exact hash call signatures), so there's no risk of the off-chain
tree silently diverging from what the circuit checks.

## Threat model / what this does and doesn't hide

**Hidden:**
- The full allowlist (who's eligible, and for how much) — only a single
  root hash is ever public.
- Which allowlist entry any given `claim()` transaction corresponds to —
  the nullifier reveals nothing about which leaf/secret produced it beyond
  "some valid leaf did," and nullifiers for different payees are
  unlinkable to each other or to any public identity.

**Visible:**
- That a claim happened, and its amount, as the delta on `totalClaimed`
  between the previous and current public state at the time of that
  transaction. An observer watching the chain sees "someone claimed X"
  events accumulate, but cannot tell *who*.
- The total budget and the running claimed total at all times.

This is a deliberate scope decision, made explicit rather than glossed
over: fully hiding the amount itself (not just the identity) from the
public running total would require homomorphic commitments to the amounts
plus a ZK range/sum proof that the sum of all commitments equals the
committed budget — meaningfully more cryptographic machinery than an MVP
on this timeline should take on. What's implemented here is genuine and
useful privacy (nobody can tell which of N allowlisted people got paid how
much, or see the allowlist at all) — just not *complete* amount secrecy
against a chain observer correlating transaction deltas.

## Explicitly out of scope for this MVP

- **Real token custody.** `totalBudget`/`totalClaimed` are contract-enforced
  numeric commitments, not actual native-coin transfers via Zswap. A
  production version would escrow real funds and pay out on claim; that's
  a substantial additional integration surface (shielded coin handling,
  Zswap sends) that would dilute focus from the ZK/privacy logic this
  milestone is about.
- **Merkle depth beyond 8** (256 payees). Raising this is mechanical (more
  unrolled `hashLevel` calls in the circuit, matching depth in
  `src/allowlist.ts`) but each level adds circuit size/proving time, so it's
  left at a demo-appropriate size.
- **Partial/incremental funding.** `fundPayroll` is single-shot; topping up
  an already-funded payroll isn't supported.
