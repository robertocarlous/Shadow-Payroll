// Private witness implementation for the payroll contract's `claim` circuit.
//
// Each payee holds a private "claim credential" (see src/allowlist.ts) that
// never leaves their machine except as inputs consumed locally by the
// prover. The witness functions below hand those values to the circuit at
// proving time; only what the circuit's `disclose(...)` calls choose to
// reveal (the nullifier, and the claimed amount added to the public running
// total) ever reaches the chain.
import type { PayeeCredential } from './allowlist';

export interface WitnessContextLike {
  privateState: unknown;
}

/**
 * Builds the witness object for the `claim` circuit from one payee's
 * credential. Pass `null` when no claim will be made in this process
 * (e.g. funding the payroll or just reading public state) — the returned
 * functions will throw with a clear message if a circuit unexpectedly
 * tries to use them.
 */
export function makeWitnesses(credential: PayeeCredential | null) {
  function require_(): PayeeCredential {
    if (!credential) {
      throw new Error(
        'No payee credential loaded — pass one to makeWitnesses() before calling claim().',
      );
    }
    return credential;
  }

  return {
    payeeSecret: (ctx: WitnessContextLike): [unknown, Uint8Array] => [
      ctx.privateState,
      require_().secret,
    ],
    payeeAmount: (ctx: WitnessContextLike): [unknown, bigint] => [
      ctx.privateState,
      require_().amount,
    ],
    payeeSiblings: (ctx: WitnessContextLike): [unknown, Uint8Array[]] => [
      ctx.privateState,
      require_().siblings,
    ],
    payeeDirections: (ctx: WitnessContextLike): [unknown, boolean[]] => [
      ctx.privateState,
      require_().directions,
    ],
  };
}
