# Level 5 Feedback Changelog

This is the running log of structured feedback received through the
dashboard feedback panel (and GitHub issues), and the shipped changes that
came out of it. Each entry records the feedback that triggered it, what was
decided, and where it shipped.

Legend: P0 = blocked claiming · P1 = high friction · P2 = polish

---

## What We Heard

Feedback was collected through the dashboard feedback panel (1-5 rating +
free-text comments) and GitHub issues during the Level 5 cohort launch.
Two structured feedback entries were received and acted on before the
cohort kickoff:

### Feedback #1 — First-run experience (rating 3/5)

> "It was not obvious what to do first after landing on the page."

- **Theme:** Usability / first-run experience
- **Priority:** P1 (high friction, affects many users)
- **Date received:** 2026-08-13

### Feedback #2 — Feedback channel discovery (rating 4/5)

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

**Decision:** Formalise the loop: a dashboard feedback panel (one tap opens
a pre-filled GitHub issue), a `new → triaged → shipped` lifecycle, and this
changelog.

**Shipped in:** `docs/FEEDBACK-LOOP.md`, the dashboard feedback panel
component.

**Code changes:**
- Added feedback panel component to the dashboard
- Created `docs/FEEDBACK-LOOP.md` documenting the full loop
- Created this changelog (`docs/level5/FEEDBACK.md`)

**Impact:** Users can now report problems and suggest features directly
from the dashboard with a single tap.

---

## Feedback Loop Status

| Status | Count |
|--------|-------|
| new | 0 |
| triaged | 0 |
| shipped | 2 |

The loop is open and accepting new entries via the dashboard feedback
panel and GitHub issues.

---

## How to add an entry

1. Pick up new `new`-status entries from the dashboard feedback panel and
   GitHub issues.
2. Tag (`bug` / `usability` / `feature` / `question`) and prioritise
   (P0/P1/P2) per `docs/FEEDBACK-LOOP.md`.
3. Ship the change, then add a dated entry above with "What We Heard" and
   "What We Changed" sections, referencing the feedback id and the commit
   that closed it.
