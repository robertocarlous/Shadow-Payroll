// Indexer GraphQL helpers for reading public Midnight ledger state.
//
// This module is the read side of the dashboard and tests: pure I/O +
// parsing, no wallet SDK, so it is unit-testable with a stubbed fetch. It
// resolves transaction identifiers against the public indexer and extracts
// the unshielded outputs they carry.
//
// Indexer facts relied on (queried against the Preview indexer v4 API):
//   - transactions(offset: { identifier }) is a cursor: it returns the
//     transaction whose `identifiers` array contains that identifier, plus
//     everything after it. submitTransaction() returns such an identifier.
//   - the same query exposes block { height } and
//     unshieldedCreatedOutputs[].owner — the bech32 address an unshielded
//     output belongs to.
//   - the Transaction.hash field is a separate canonical hash, NOT the
//     identifier submitTransaction() returns, so we never match on it.

export interface OnchainClient {
  indexerUrl: string;
  fetch: FetchFn;
}

export type FetchFn = (
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
  },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export interface IndexerTx {
  identifier: string;
  blockHeight: number | null;
  owners: string[];
}

export interface ContractState {
  address: string;
  state: string;
}

export class OnchainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OnchainError';
  }
}

const TX_FRAGMENT = `
  fragment TxOwners on Transaction {
    __typename
    ... on RegularTransaction { identifiers }
    block { height }
    unshieldedCreatedOutputs { owner }
  }
`;

export function createOnchainClient(indexerUrl: string, fetchImpl: FetchFn = fetch as FetchFn): OnchainClient {
  return { indexerUrl, fetch: fetchImpl };
}

interface GraphqlBody {
  query: string;
  variables?: Record<string, unknown>;
}

async function graphql(client: OnchainClient, body: GraphqlBody, maxAttempts = 3): Promise<unknown> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await client.fetch(client.indexerUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) {
        throw new OnchainError(`indexer responded with HTTP ${res.status}`);
      }
      const parsed = (await res.json()) as {
        data?: unknown;
        errors?: Array<{ message?: string }>;
      };
      if (parsed.errors && parsed.errors.length > 0) {
        throw new OnchainError(`indexer error: ${parsed.errors[0].message}`);
      }
      if (parsed.data === undefined || parsed.data === null) {
        throw new OnchainError('indexer returned no data');
      }
      return parsed.data;
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new OnchainError(String(lastError));
}

function toIndexerTx(raw: unknown, requestedIdentifier: string): IndexerTx | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  const identifiers = obj.identifiers;
  if (!Array.isArray(identifiers) || !identifiers.includes(requestedIdentifier)) return null;

  let blockHeight: number | null = null;
  const block = obj.block;
  if (typeof block === 'object' && block !== null) {
    const h = (block as Record<string, unknown>).height;
    if (typeof h === 'number') blockHeight = h;
  }

  const owners: string[] = [];
  const outputs = obj.unshieldedCreatedOutputs;
  if (Array.isArray(outputs)) {
    for (const output of outputs) {
      const owner = (output as Record<string, unknown>)?.owner;
      if (typeof owner === 'string') owners.push(owner);
    }
  }
  return { identifier: requestedIdentifier, blockHeight, owners };
}

/**
 * Resolve a funding transaction by the identifier submitTransaction()
 * returned. Returns null when the indexer has no transaction carrying that
 * identifier.
 */
export async function fetchTxByIdentifier(client: OnchainClient, identifier: string): Promise<IndexerTx | null> {
  const data = await graphql(client, {
    query: `
      query TxByIdentifier($identifier: HexEncoded!) {
        transactions(offset: { identifier: $identifier }) {
          ...TxOwners
        }
      }
      ${TX_FRAGMENT}
    `,
    variables: { identifier },
  });
  const list = (data as Record<string, unknown>).transactions;
  if (!Array.isArray(list)) return null;
  for (const entry of list) {
    const tx = toIndexerTx(entry, identifier);
    if (tx) return tx;
  }
  return null;
}

/**
 * Resolve several funding transactions. Results preserve input order and
 * include null entries for identifiers the indexer has no record of.
 */
export async function fetchTxsByIdentifier(
  client: OnchainClient,
  identifiers: string[],
): Promise<Array<IndexerTx | null>> {
  const out: Array<IndexerTx | null> = [];
  for (const identifier of identifiers) {
    out.push(await fetchTxByIdentifier(client, identifier));
  }
  return out;
}

/** Confirm a contract address is present on-chain and return its ledger state. */
export async function fetchContractState(client: OnchainClient, address: string): Promise<ContractState | null> {
  const data = await graphql(client, {
    query: `
      query ContractByAddress($address: HexEncoded!) {
        contract(address: $address) {
          address
          state
        }
      }
    `,
    variables: { address },
  });
  const contract = (data as Record<string, unknown>).contract;
  if (typeof contract !== 'object' || contract === null) return null;
  const c = contract as Record<string, unknown>;
  if (typeof c.address !== 'string' || typeof c.state !== 'string') return null;
  return { address: c.address, state: c.state };
}

export interface FundingTxRecord {
  identifier: string;
  blockHeight?: number;
}

export interface CoverageReport {
  cohortTotal: number;
  funded: string[];
  missing: string[];
  /** Whether the ledger state commitment for the cohort root resolves on-chain. */
  contractResolved: boolean;
  txs: Array<{ identifier: string; found: boolean; blockHeight: number | null; owners: string[] }>;
}

/**
 * Pure coverage computation: given the cohort addresses, the funding tx
 * records, and the indexer-resolved transactions, produce a report of which
 * cohort addresses are provably on-chain.
 */
export function computeCoverageReport(
  cohortAddresses: readonly string[],
  records: readonly FundingTxRecord[],
  resolved: ReadonlyArray<IndexerTx | null>,
  contractResolved: boolean,
): CoverageReport {
  const cohort = new Set(cohortAddresses);
  const funded = new Set<string>();

  const txs = records.map((record, i) => {
    const tx = resolved[i];
    const found = tx !== null;
    if (found && tx) {
      for (const owner of tx.owners) {
        if (cohort.has(owner)) funded.add(owner);
      }
    }
    return {
      identifier: record.identifier,
      found,
      blockHeight: found && tx ? tx.blockHeight : null,
      owners: found && tx ? tx.owners : [],
    };
  });

  const missing = cohortAddresses.filter((address) => !funded.has(address));

  return {
    cohortTotal: cohortAddresses.length,
    funded: [...funded].sort(),
    missing,
    contractResolved,
    txs,
  };
}
