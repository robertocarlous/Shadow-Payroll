// Cohort/community metadata shown on the dashboard.
//
// This is the Level 5 "Full Moon" cohort: 50 invited Preview users, each with
// a real derived Midnight address and a claim credential. The on-chain claim
// count is read live in CommunityStats; this file carries the static facts
// that are committed with the repo (see docs/level5/).
export const COHORT = {
  size: 50,
  network: 'preview',
  // A short display name for the cohort payroll (shown in the dashboard hero
  // and community panel). Can be overridden per-deployment via env.
  name: import.meta.env.VITE_COHORT_NAME ?? 'Full Moon cohort',
} as const;
