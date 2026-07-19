// Testbed to exercise the payroll contract's circuits without a real
// network, wallet, or proof server. Mirrors the pattern used by Midnight's
// own example contracts (see e.g. midnightntwrk/example-bboard's
// BBoardSimulator): a thin wrapper around the compiled Contract class that
// tracks circuit context across calls.
import {
  type CircuitContext,
  QueryContext,
  sampleContractAddress,
  createConstructorContext,
  CostModel,
} from '@midnight-ntwrk/compact-runtime';
import { Contract, type Ledger, ledger } from '../../contracts/managed/payroll/contract/index.js';
import { makeWitnesses } from '../witnesses.js';
import type { PayeeCredential } from '../allowlist.js';

type PrivateState = Record<string, never>;

export class PayrollSimulator {
  readonly contract: Contract<PrivateState>;
  circuitContext: CircuitContext<PrivateState>;

  constructor(credential: PayeeCredential | null = null) {
    this.contract = new Contract<PrivateState>(makeWitnesses(credential) as never);
    const { currentPrivateState, currentContractState, currentZswapLocalState } =
      this.contract.initialState(createConstructorContext({}, '0'.repeat(64)));
    this.circuitContext = {
      currentPrivateState,
      currentZswapLocalState,
      costModel: CostModel.initialCostModel(),
      currentQueryContext: new QueryContext(currentContractState.data, sampleContractAddress()),
    };
  }

  /** Swap in a different payee's credential before calling claim(). */
  public useCredential(credential: PayeeCredential | null) {
    (this.contract as unknown as { witnesses: unknown }).witnesses = makeWitnesses(credential);
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public fundPayroll(root: Uint8Array, budget: bigint): Ledger {
    this.circuitContext = this.contract.impureCircuits.fundPayroll(
      this.circuitContext,
      root,
      budget,
    ).context;
    return this.getLedger();
  }

  public claim(): Ledger {
    this.circuitContext = this.contract.impureCircuits.claim(this.circuitContext).context;
    return this.getLedger();
  }

  public isReconciled(): boolean {
    return this.contract.impureCircuits.isReconciled(this.circuitContext).result;
  }
}
