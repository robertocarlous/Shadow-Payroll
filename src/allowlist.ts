// Off-chain allowlist / Merkle-tree builder for Shadow Payroll.
//
// The employer runs this locally (never on-chain) to turn a plain
// {payeeId, amount} list into:
//   - a single public Merkle root (the only thing that goes on-chain, via
//     fundPayroll), and
//   - one private "claim credential" per payee, containing their secret,
//     amount, and Merkle inclusion path.
//
// The hashing here must byte-for-byte match the `allowlistLeaf`/`hashLevel`
// circuits in contracts/payroll.compact. Rather than re-implement Compact's
// persistentHash independently (and risk a subtle mismatch), this reuses the
// actual @midnight-ntwrk/compact-runtime implementation the circuit compiles
// down to, confirmed against the compiled contracts/managed/payroll output.
import * as crypto from 'node:crypto';
import {
  persistentHash,
  convertFieldToBytes,
  CompactTypeVector,
  CompactTypeBytes,
} from '@midnight-ntwrk/compact-runtime';

export const ALLOWLIST_DEPTH = 8;
export const ALLOWLIST_MAX_PAYEES = 2 ** ALLOWLIST_DEPTH; // 256

const bytes32 = new CompactTypeBytes(32);
const vec2 = new CompactTypeVector(2, bytes32);
const vec3 = new CompactTypeVector(3, bytes32);

function domainTag(tag: string): Uint8Array {
  const encoded = Buffer.from(tag, 'utf8');
  if (encoded.length > 32) throw new Error(`domain tag too long: ${tag}`);
  const padded = new Uint8Array(32);
  padded.set(encoded);
  return padded;
}

const LEAF_TAG = domainTag('shadow-payroll:leaf:v1');
const NODE_TAG = domainTag('shadow-payroll:node:v1');
const NULLIFIER_TAG = domainTag('shadow-payroll:nullifier:v1');

export function leafHash(secret: Uint8Array, amount: bigint): Uint8Array {
  const amountBytes = convertFieldToBytes(32, amount, 'allowlist.ts:leafHash');
  return persistentHash(vec3, [LEAF_TAG, secret, amountBytes]);
}

export function nodeHash(left: Uint8Array, right: Uint8Array): Uint8Array {
  return persistentHash(vec3, [NODE_TAG, left, right]);
}

export function nullifierHash(secret: Uint8Array): Uint8Array {
  return persistentHash(vec2, [NULLIFIER_TAG, secret]);
}

export interface PayeeCredential {
  payeeId: string;
  secret: Uint8Array;
  amount: bigint;
  siblings: Uint8Array[];
  directions: boolean[];
}

export interface AllowlistEntry {
  payeeId: string;
  amount: bigint;
}

export interface AllowlistBuildResult {
  root: Uint8Array;
  totalBudget: bigint;
  credentials: PayeeCredential[];
}

// A fixed, publicly-derivable filler secret for unused tree slots. Claiming
// a filler slot only ever adds 0 to totalClaimed and is not a security
// concern, but is also not something a real payee could benefit from.
const FILLER_SECRET = domainTag('shadow-payroll:filler-secret:v1');
const FILLER_LEAF = leafHash(FILLER_SECRET, 0n);

export function buildAllowlist(entries: AllowlistEntry[]): AllowlistBuildResult {
  if (entries.length === 0) throw new Error('Allowlist must have at least one payee');
  if (entries.length > ALLOWLIST_MAX_PAYEES) {
    throw new Error(`Allowlist supports at most ${ALLOWLIST_MAX_PAYEES} payees at depth ${ALLOWLIST_DEPTH}`);
  }

  const leaves: Uint8Array[] = new Array(ALLOWLIST_MAX_PAYEES).fill(FILLER_LEAF);
  const secrets: Uint8Array[] = new Array(ALLOWLIST_MAX_PAYEES).fill(FILLER_SECRET);

  entries.forEach((entry, i) => {
    const secret = crypto.randomBytes(32);
    secrets[i] = secret;
    leaves[i] = leafHash(secret, entry.amount);
  });

  // Build the tree bottom-up, keeping every level so we can extract sibling
  // paths afterwards.
  const levels: Uint8Array[][] = [leaves];
  let current = leaves;
  for (let d = 0; d < ALLOWLIST_DEPTH; d++) {
    const next: Uint8Array[] = [];
    for (let i = 0; i < current.length; i += 2) {
      next.push(nodeHash(current[i], current[i + 1]));
    }
    levels.push(next);
    current = next;
  }
  const root = current[0];

  const credentials: PayeeCredential[] = entries.map((entry, i) => {
    const siblings: Uint8Array[] = [];
    const directions: boolean[] = [];
    let index = i;
    for (let d = 0; d < ALLOWLIST_DEPTH; d++) {
      const levelNodes = levels[d];
      const isRight = index % 2 === 1;
      const siblingIndex = isRight ? index - 1 : index + 1;
      siblings.push(levelNodes[siblingIndex]);
      directions.push(isRight);
      index = Math.floor(index / 2);
    }
    return {
      payeeId: entry.payeeId,
      secret: secrets[i],
      amount: entry.amount,
      siblings,
      directions,
    };
  });

  const totalBudget = entries.reduce((sum, e) => sum + e.amount, 0n);

  return { root, totalBudget, credentials };
}

// Verifies a credential reconstructs to the given root -- used by tests and
// as a sanity check before writing credential files to disk.
export function verifyCredential(root: Uint8Array, credential: PayeeCredential): boolean {
  let node = leafHash(credential.secret, credential.amount);
  for (let d = 0; d < ALLOWLIST_DEPTH; d++) {
    const sibling = credential.siblings[d];
    const isRight = credential.directions[d];
    node = isRight ? nodeHash(sibling, node) : nodeHash(node, sibling);
  }
  return Buffer.from(node).equals(Buffer.from(root));
}
