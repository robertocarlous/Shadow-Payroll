// Private witness implementation for the browser's claim() call.
//
// Unlike a wallet-address-derived secret, a payroll credential is bound to
// the payee, not to whichever wallet happens to pay the transaction fee --
// the same credential file used from the CLI (src/witnesses.ts) or the
// browser proves the same allocation. The credential never leaves this
// browser tab except as the parts the circuit's disclose(...) calls choose
// to reveal (the nullifier, and the claimed amount added to the public
// running total).
export interface PayeeCredential {
  payeeId: string;
  secret: Uint8Array;
  amount: bigint;
  siblings: Uint8Array[];
  directions: boolean[];
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim();
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function parseCredential(raw: string): PayeeCredential {
  const json = JSON.parse(raw);
  if (
    typeof json.payeeId !== 'string' ||
    typeof json.secret !== 'string' ||
    (typeof json.amount !== 'string' && typeof json.amount !== 'number') ||
    !Array.isArray(json.siblings) ||
    !Array.isArray(json.directions)
  ) {
    throw new Error('That does not look like a valid claim credential file.');
  }
  return {
    payeeId: json.payeeId,
    secret: hexToBytes(json.secret),
    amount: BigInt(json.amount),
    siblings: json.siblings.map(hexToBytes),
    directions: json.directions,
  };
}

export interface WitnessContextLike {
  privateState: unknown;
}

export function makeWitnesses(credential: PayeeCredential) {
  return {
    payeeSecret: (ctx: WitnessContextLike): [unknown, Uint8Array] => [ctx.privateState, credential.secret],
    payeeAmount: (ctx: WitnessContextLike): [unknown, bigint] => [ctx.privateState, credential.amount],
    payeeSiblings: (ctx: WitnessContextLike): [unknown, Uint8Array[]] => [ctx.privateState, credential.siblings],
    payeeDirections: (ctx: WitnessContextLike): [unknown, boolean[]] => [ctx.privateState, credential.directions],
  };
}
