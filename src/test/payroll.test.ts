import { describe, it, expect } from 'vitest';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { PayrollSimulator } from './payroll-simulator.js';
import { buildAllowlist, verifyCredential } from '../allowlist.js';

setNetworkId('undeployed');

describe('Shadow Payroll contract', () => {
  it('starts uninitialized with zeroed public state', () => {
    const sim = new PayrollSimulator();
    const l = sim.getLedger();
    expect(l.initialized).toBe(false);
    expect(l.totalBudget).toEqual(0n);
    expect(l.totalClaimed).toEqual(0n);
    expect(l.usedNullifiers.isEmpty()).toBe(true);
  });

  it('off-chain allowlist credentials verify against their own root', () => {
    const { root, credentials } = buildAllowlist([
      { payeeId: 'alice', amount: 100n },
      { payeeId: 'bob', amount: 250n },
      { payeeId: 'carol', amount: 50n },
    ]);
    for (const c of credentials) {
      expect(verifyCredential(root, c)).toBe(true);
    }
  });

  it('funds the payroll and exposes the declared root/budget publicly', () => {
    const { root, totalBudget } = buildAllowlist([
      { payeeId: 'alice', amount: 100n },
      { payeeId: 'bob', amount: 250n },
    ]);
    const sim = new PayrollSimulator();
    const l = sim.fundPayroll(root, totalBudget);
    expect(l.initialized).toBe(true);
    expect(l.allowlistRoot).toEqual(root);
    expect(l.totalBudget).toEqual(350n);
    expect(l.totalClaimed).toEqual(0n);
  });

  it('lets an allowlisted payee claim their exact private amount', () => {
    const { root, totalBudget, credentials } = buildAllowlist([
      { payeeId: 'alice', amount: 100n },
      { payeeId: 'bob', amount: 250n },
    ]);
    const alice = credentials[0];
    const sim = new PayrollSimulator(alice);
    sim.fundPayroll(root, totalBudget);
    const l = sim.claim();
    expect(l.totalClaimed).toEqual(100n);
    expect(l.usedNullifiers.isEmpty()).toBe(false);
    expect(sim.isReconciled()).toBe(false);
  });

  it('reconciles once every payee has claimed', () => {
    const { root, totalBudget, credentials } = buildAllowlist([
      { payeeId: 'alice', amount: 100n },
      { payeeId: 'bob', amount: 250n },
    ]);
    const sim = new PayrollSimulator(credentials[0]);
    sim.fundPayroll(root, totalBudget);
    sim.claim();
    sim.useCredential(credentials[1]);
    const l = sim.claim();
    expect(l.totalClaimed).toEqual(l.totalBudget);
    expect(sim.isReconciled()).toBe(true);
  });

  it('rejects a second claim from the same payee (double-claim / nullifier reuse)', () => {
    const { root, totalBudget, credentials } = buildAllowlist([
      { payeeId: 'alice', amount: 100n },
    ]);
    const sim = new PayrollSimulator(credentials[0]);
    sim.fundPayroll(root, totalBudget);
    sim.claim();
    expect(() => sim.claim()).toThrow('Payout already claimed');
  });

  it('rejects a claim with a tampered amount (breaks the Merkle path)', () => {
    const { root, totalBudget, credentials } = buildAllowlist([
      { payeeId: 'alice', amount: 100n },
    ]);
    const tampered = { ...credentials[0], amount: 999n };
    const sim = new PayrollSimulator(tampered);
    sim.fundPayroll(root, totalBudget);
    expect(() => sim.claim()).toThrow('Not a member of the payroll allowlist');
  });

  it('rejects a claim from someone not on the allowlist', () => {
    const { root, totalBudget } = buildAllowlist([{ payeeId: 'alice', amount: 100n }]);
    const outsider = {
      payeeId: 'mallory',
      secret: new Uint8Array(32).fill(7),
      amount: 100n,
      siblings: Array.from({ length: 8 }, () => new Uint8Array(32)),
      directions: Array.from({ length: 8 }, () => false),
    };
    const sim = new PayrollSimulator(outsider);
    sim.fundPayroll(root, totalBudget);
    expect(() => sim.claim()).toThrow('Not a member of the payroll allowlist');
  });

  it('rejects a claim before the payroll has been funded', () => {
    const { credentials } = buildAllowlist([{ payeeId: 'alice', amount: 100n }]);
    const sim = new PayrollSimulator(credentials[0]);
    expect(() => sim.claim()).toThrow('Payroll has not been funded yet');
  });

  it('rejects funding twice', () => {
    const { root, totalBudget } = buildAllowlist([{ payeeId: 'alice', amount: 100n }]);
    const sim = new PayrollSimulator();
    sim.fundPayroll(root, totalBudget);
    expect(() => sim.fundPayroll(root, totalBudget)).toThrow('Payroll has already been funded');
  });

  it('enforces solvency: total claimed can never exceed the declared budget', () => {
    // Two payees allocated 100 each (budget 200), but craft a claim for a
    // third, higher amount against alice's real leaf -- her Merkle path only
    // verifies for her true (secret, amount) pair, so tampering the amount
    // is already caught by the allowlist check above. This test instead
    // confirms the in-circuit solvency assert exists by funding a budget
    // smaller than what a legitimate single claim would need.
    const { root, credentials } = buildAllowlist([{ payeeId: 'alice', amount: 100n }]);
    const sim = new PayrollSimulator(credentials[0]);
    sim.fundPayroll(root, 50n); // under-funded on purpose
    expect(() => sim.claim()).toThrow('Claim would exceed deposited budget');
  });
});
