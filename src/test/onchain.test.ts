import { describe, it, expect } from 'vitest';
import {
  createOnchainClient,
  computeCoverageReport,
  fetchTxByIdentifier,
  fetchContractState,
  type FetchFn,
  type IndexerTx,
} from '../onchain';

const COHORT = ['mn_addr_preview1', 'mn_addr_preview2', 'mn_addr_preview3'];

const FUNDING_TX: IndexerTx = {
  identifier: '00aabb',
  blockHeight: 100,
  owners: ['mn_addr_preview1', 'mn_addr_preview2', 'mn_addr_preview3', 'mn_addr_someone_else'],
};

const FUNDING_TX_RAW = {
  __typename: 'RegularTransaction',
  identifiers: ['00aabb', '00ccdd'],
  block: { height: 100 },
  unshieldedCreatedOutputs: [
    { owner: 'mn_addr_preview1' },
    { owner: 'mn_addr_preview2' },
    { owner: 'mn_addr_preview3' },
    { owner: 'mn_addr_someone_else' },
  ],
};

function stubFetch(bodies: Record<string, unknown>): FetchFn {
  return async (_url: string, init?: Parameters<FetchFn>[1]) => {
    const body = init?.body ? JSON.parse(init.body) : {};
    const query = typeof body.query === 'string' ? body.query : '';
    const identifier = (body.variables as { identifier?: string } | undefined)?.identifier;
    let data: unknown = null;
    if (query.includes('TxByIdentifier')) {
      const requested = identifier ?? '';
      data = { transactions: requested === '00aabb' ? [FUNDING_TX_RAW] : [] };
    } else if (query.includes('ContractByAddress')) {
      data = { contract: { address: '0xbeef', state: 'deadbeef' } };
    }
    return { ok: true, status: 200, json: async () => ({ data }) };
  };
}

describe('fetchTxByIdentifier', () => {
  it('resolves a funding transaction and extracts its owners', async () => {
    const client = createOnchainClient('https://indexer.test/graphql', stubFetch({}));
    const tx = await fetchTxByIdentifier(client, '00aabb');
    expect(tx).toEqual({
      identifier: '00aabb',
      blockHeight: 100,
      owners: ['mn_addr_preview1', 'mn_addr_preview2', 'mn_addr_preview3', 'mn_addr_someone_else'],
    });
  });

  it('returns null for an unknown identifier', async () => {
    const client = createOnchainClient('https://indexer.test/graphql', stubFetch({}));
    expect(await fetchTxByIdentifier(client, '00unknown')).toBeNull();
  });
});

describe('fetchContractState', () => {
  it('returns the on-chain ledger state commitment', async () => {
    const client = createOnchainClient('https://indexer.test/graphql', stubFetch({}));
    const contract = await fetchContractState(client, '0xbeef');
    expect(contract).toEqual({ address: '0xbeef', state: 'deadbeef' });
  });
});

describe('computeCoverageReport', () => {
  it('flags every cohort address that appears in a resolved funding tx', () => {
    const report = computeCoverageReport(COHORT, [{ identifier: '00aabb' }], [FUNDING_TX], true);
    expect(report.funded).toEqual([...COHORT].sort());
    expect(report.missing).toEqual([]);
    expect(report.contractResolved).toBe(true);
    expect(report.txs[0].found).toBe(true);
    expect(report.txs[0].blockHeight).toBe(100);
  });

  it('reports addresses missing when the funding tx is not found', () => {
    const report = computeCoverageReport(COHORT, [{ identifier: '00gone' }], [null], false);
    expect(report.funded).toEqual([]);
    expect(report.missing).toEqual([...COHORT]);
    expect(report.txs[0].found).toBe(false);
    expect(report.contractResolved).toBe(false);
  });

  it('only counts owners that are actually cohort members', () => {
    const cohort = [COHORT[1], 'mn_addr_preview_never_funded'];
    const report = computeCoverageReport(cohort, [{ identifier: '00aabb' }], [FUNDING_TX], true);
    expect(report.funded).toEqual([COHORT[1]]);
    expect(report.missing).toEqual(['mn_addr_preview_never_funded']);
  });
});
