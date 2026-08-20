import { describe, it, expect } from 'vitest';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { PayrollSimulator } from './payroll-simulator.js';
import { buildAllowlist, verifyCredential } from '../allowlist.js';

setNetworkId('undeployed');

const EMP_SECRET = new Uint8Array(32).fill(0xab);
const FAR_FUTURE = BigInt('4102444800'); // 2100-01-01

describe('Shadow Payroll contract', () => {
  it('starts uninitialized with zeroed public state', () => {
    const sim = new PayrollSimulator();
    const l = sim.getLedger();
    expect(l.initialized).toBe(false);
    expect(l.totalBudget).toEqual(0n);
    expect(l.totalClaimed).toEqual(0n);
    expect(l.usedNullifiers.isEmpty()).toBe(true);
    expect(l.removedPayees.isEmpty()).toBe(true);
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
    const l = sim.fundPayroll(root, totalBudget, FAR_FUTURE, EMP_SECRET);
    expect(l.initialized).toBe(true);
    expect(l.allowlistRoot).toEqual(root);
    expect(l.totalBudget).toEqual(350n);
    expect(l.totalClaimed).toEqual(0n);
    expect(l.removedPayees.isEmpty()).toBe(true);
  });

  it('lets an allowlisted payee claim their exact private amount', () => {
    const { root, totalBudget, credentials } = buildAllowlist([
      { payeeId: 'alice', amount: 100n },
      { payeeId: 'bob', amount: 250n },
    ]);
    const alice = credentials[0];
    const sim = new PayrollSimulator(alice);
    sim.fundPayroll(root, totalBudget, FAR_FUTURE, EMP_SECRET);
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
    sim.fundPayroll(root, totalBudget, FAR_FUTURE, EMP_SECRET);
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
    sim.fundPayroll(root, totalBudget, FAR_FUTURE, EMP_SECRET);
    sim.claim();
    expect(() => sim.claim()).toThrow('Payout already claimed');
  });

  it('rejects a claim with a tampered amount (breaks the Merkle path)', () => {
    const { root, totalBudget, credentials } = buildAllowlist([
      { payeeId: 'alice', amount: 100n },
    ]);
    const tampered = { ...credentials[0], amount: 999n };
    const sim = new PayrollSimulator(tampered);
    sim.fundPayroll(root, totalBudget, FAR_FUTURE, EMP_SECRET);
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
    sim.fundPayroll(root, totalBudget, FAR_FUTURE, EMP_SECRET);
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
    sim.fundPayroll(root, totalBudget, FAR_FUTURE, EMP_SECRET);
    expect(() => sim.fundPayroll(root, totalBudget, FAR_FUTURE, EMP_SECRET)).toThrow(
      'Payroll has already been funded',
    );
  });

  it('enforces solvency: total claimed can never exceed the declared budget', () => {
    const { root, credentials } = buildAllowlist([{ payeeId: 'alice', amount: 100n }]);
    const sim = new PayrollSimulator(credentials[0]);
    sim.fundPayroll(root, 50n, FAR_FUTURE, EMP_SECRET); // under-funded on purpose
    expect(() => sim.claim()).toThrow('Claim would exceed deposited budget');
  });

  // ── Claim expiration ───────────────────────────────────────────────

  it('rejects a claim after the deadline has passed', () => {
    const { root, totalBudget, credentials } = buildAllowlist([
      { payeeId: 'alice', amount: 100n },
    ]);
    const sim = new PayrollSimulator(credentials[0]);
    sim.fundPayroll(root, totalBudget, 1000n, EMP_SECRET); // deadline = 1000
    // Pass timeOverride = 2000 (> deadline) to simulate a claim after expiry
    expect(() => sim.claim(2000n)).toThrow('Claim deadline has passed');
  });

  it('allows a claim before the deadline', () => {
    const { root, totalBudget, credentials } = buildAllowlist([
      { payeeId: 'alice', amount: 100n },
    ]);
    const sim = new PayrollSimulator(credentials[0]);
    sim.fundPayroll(root, totalBudget, 1000n, EMP_SECRET); // deadline = 1000
    // Pass timeOverride = 500 (< deadline) to simulate a claim before expiry
    const l = sim.claim(500n);
    expect(l.totalClaimed).toEqual(100n);
  });

  // ── Payee removal ─────────────────────────────────────────────────

  it('allows the employer to remove a payee', () => {
    const { root, totalBudget, credentials } = buildAllowlist([
      { payeeId: 'alice', amount: 100n },
    ]);
    const sim = new PayrollSimulator();
    sim.fundPayroll(root, totalBudget, FAR_FUTURE, EMP_SECRET);
    const l = sim.removePayee(credentials[0].secret, EMP_SECRET);
    expect(l.removedPayees.isEmpty()).toBe(false);
    expect(l.removedPayees.size()).toEqual(1n);
  });

  it('prevents a removed payee from claiming', () => {
    const { root, totalBudget, credentials } = buildAllowlist([
      { payeeId: 'alice', amount: 100n },
    ]);
    const sim = new PayrollSimulator(credentials[0]);
    sim.fundPayroll(root, totalBudget, FAR_FUTURE, EMP_SECRET);
    sim.removePayee(credentials[0].secret, EMP_SECRET);
    expect(() => sim.claim()).toThrow('Payee has been removed from the payroll');
  });

  it('rejects removePayee from a non-employer', () => {
    const { root, totalBudget, credentials } = buildAllowlist([
      { payeeId: 'alice', amount: 100n },
    ]);
    const sim = new PayrollSimulator();
    sim.fundPayroll(root, totalBudget, FAR_FUTURE, EMP_SECRET);
    const wrongSecret = new Uint8Array(32).fill(0xff);
    expect(() => sim.removePayee(credentials[0].secret, wrongSecret)).toThrow(
      'Only the employer can remove payees',
    );
  });

  it('allows removing a payee who has already claimed (no-op)', () => {
    const { root, totalBudget, credentials } = buildAllowlist([
      { payeeId: 'alice', amount: 100n },
      { payeeId: 'bob', amount: 250n },
    ]);
    const sim = new PayrollSimulator(credentials[0]);
    sim.fundPayroll(root, totalBudget, FAR_FUTURE, EMP_SECRET);
    sim.claim(); // alice claims
    // Removing alice after she claimed is a no-op (nullifier already in usedNullifiers)
    const l = sim.removePayee(credentials[0].secret, EMP_SECRET);
    expect(l.removedPayees.isEmpty()).toBe(false);
    expect(l.removedPayees.size()).toEqual(1n);
  });

  it('can remove multiple payees', () => {
    const { root, totalBudget, credentials } = buildAllowlist([
      { payeeId: 'alice', amount: 100n },
      { payeeId: 'bob', amount: 250n },
      { payeeId: 'carol', amount: 50n },
    ]);
    const sim = new PayrollSimulator();
    sim.fundPayroll(root, totalBudget, FAR_FUTURE, EMP_SECRET);
    sim.removePayee(credentials[0].secret, EMP_SECRET);
    sim.removePayee(credentials[1].secret, EMP_SECRET);
    const l = sim.removePayee(credentials[2].secret, EMP_SECRET);
    expect(l.removedPayees.size()).toEqual(3n);
  });
});
