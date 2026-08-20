# Level 5 Feedback Changelog

This is the running log of structured feedback received through GitHub
issues, and the shipped changes that came out of it. Each entry records
the feedback that triggered it, what was decided, and where it shipped.

> **Note:** An earlier dashboard feedback panel component was shipped as
> part of Change #2 below, then removed in a later commit
> (`feat(ui): remove feedback panel`). GitHub issues is now the sole
> feedback channel.

Legend: P0 = blocked claiming · P1 = high friction · P2 = polish

---

## What We Heard

Feedback was collected through GitHub issues during the Level 5 cohort
launch. Two structured feedback entries were received and acted on before
the cohort kickoff:

### Feedback #1 — First-run experience

> "It was not obvious what to do first after landing on the page."

- **Theme:** Usability / first-run experience
- **Priority:** P1 (high friction, affects many users)
- **Date received:** 2026-08-13

### Feedback #2 — Feedback channel discovery

> "How do I report a problem or suggest something?"

- **Theme:** Documentation / feedback channel
- **Priority:** P1 (high friction, affects many users)
- **Date received:** 2026-08-13

---

## What We Changed

### Change #1 — Dashboard onboarding checklist

**Trigger:** Feedback #1 ("not obvious what to do first")

**Decision:** Add a persisted step-by-step onboarding checklist, a
how-it-works explainer, and an FAQ before the claim panel.

**Shipped in:** `feat(ui): guided onboarding, FAQ, and feedback panel for
new users`

**Code changes:**
- Added onboarding checklist component with step-by-step guidance
- Added how-it-works explainer section
- Added FAQ section covering common questions
- Added community stats panel showing cohort progress
- See `frontend/src/` for the dashboard components

**Impact:** Users now land on a guided page with clear next steps instead
of an opaque claim panel.

### Change #2 — Feedback loop formalised

**Trigger:** Feedback #2 ("how do I report a problem?")

**Decision:** Formalise the loop: a `new → triaged → shipped` lifecycle,
this changelog, and a documented feedback process via GitHub issues.

**Shipped in:** `docs/FEEDBACK-LOOP.md`

**Code changes:**
- Created `docs/FEEDBACK-LOOP.md` documenting the full loop
- Created this changelog (`docs/level5/FEEDBACK.md`)

**Impact:** Users can now report problems and suggest features via
GitHub issues with a clear lifecycle.

---

## Feedback Loop Status

| Status | Count |
|--------|-------|
| new | 0 |
| triaged | 0 |
| shipped | 2 |

The loop is open and accepting new entries via GitHub issues.

---

## How to add an entry

1. Pick up new `new`-status entries from GitHub issues.
2. Tag (`bug` / `usability` / `feature` / `question`) and prioritise
   (P0/P1/P2) per `docs/FEEDBACK-LOOP.md`.
3. Ship the change, then add a dated entry above with "What We Heard" and
   "What We Changed" sections, referencing the feedback id and the commit
   that closed it.
