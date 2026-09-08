# 🌒 Level 6 Feedback — Supermoon

This is the changelog for the Level 6 cycle: the structured feedback that
came in from the Level 5 cohort and through GitHub issues during the
Supermoon launch, and exactly what shipped in response. It is the living
record of the feedback loop defined in
[docs/FEEDBACK-LOOP.md](FEEDBACK-LOOP.md) (the Level 5 entries live in
[docs/level5/FEEDBACK.md](level5/FEEDBACK.md)).

Legend: P0 = blocked claiming · P1 = high friction · P2 = polish

---

## Level 6 Improvements

Changes implemented during this cycle, mapped to the user feedback that
triggered them:

| Change | User Feedback That Triggered It | Status |
|--------|--------------------------------|--------|
| First-run onboarding checklist + how-it-works + FAQ on the dashboard | “It was not obvious what to do first after landing on the page” (Level 5, Feedback #1) | Shipped (`feat(level6): …`) |
| GitHub-issue feedback loop formalised (`new → triaged → shipped`, changelog) | “How do I report a problem or suggest something?” (Level 5, Feedback #2) | Shipped (`docs/FEEDBACK-LOOP.md`) |
| Plain self-service **user guide** (`docs/USAGE.md`) with “Getting Started on Preview” and “Your First Transaction” | Cohort users found setup steps scattered across README/issues; wanted one non-technical walkthrough | Shipped (`docs/USAGE.md`) |
| **LAUNCH_USERS.md** cohort tracker for verifiable wallet addresses | Onboarding flow needed a single place to record and verify each new user's address | Shipped (`LAUNCH_USERS.md`) |
| Clearer claim-error copy (stale wallet, already-claimed credential, missing DUST) | “Claim just failed with no explanation” (pilot user report) | Shipped (frontend error handling, Level 5) |

---

## What We Heard

### Feedback #1 — First-run experience (Level 5)

> “It was not obvious what to do first after landing on the page.”

- **Theme:** Usability / first-run experience
- **Priority:** P1

### Feedback #2 — Feedback channel discovery (Level 5)

> “How do I report a problem or suggest something?”

- **Theme:** Documentation / feedback channel
- **Priority:** P1

### Feedback #3 — Setup docs scattered (Level 6)

> “Getting set up took fumbling between the README and the issues. I want
> one clear walkthrough.”

- **Theme:** Documentation / onboarding
- **Priority:** P1

Shipped in **Level 6** as [`docs/USAGE.md`](USAGE.md) — a single
non-technical guide with a dedicated *Getting Started on Preview* and
*Your First Transaction* section, plus the dashboard checklist.

---

## What We Changed

### Change #1 — Self-service user guide (Level 6)

**Trigger:** Feedback #3 (+ Level 5 Feedback #1)

**Decision:** Consolidate all setup/claim instructions into a single plain
-English user guide, `docs/USAGE.md`, and link it from the README and the
dashboard.

**Shipped in:** `docs/USAGE.md`, README updates.

### Change #2 — Launch cohort tracker (Level 6)

**Trigger:** User onboarding needed a verifiable address registry.

**Decision:** Add `LAUNCH_USERS.md` with a 20-row table for the Supermoon
cohort, and a `Current count: 0 / 20` counter that updates as users onboard.

**Shipped in:** `LAUNCH_USERS.md`.

---

## Feedback Loop Status

| Status | Count | Notes |
|--------|-------|-------|
| new | 0 | open for intake via GitHub issues |
| triaged | 0 | |
| shipped | 3+ | Levels 5–6 changes recorded above + [docs/level5/FEEDBACK.md](level5/FEEDBACK.md) |

The loop is **open** — report bugs or suggestions via GitHub issues. Every
entry is picked up in the weekly triage, prioritised (P0/P1/P2), and if it
lands it's recorded in the changelog above.
