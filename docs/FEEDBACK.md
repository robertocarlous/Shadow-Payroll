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
| Fixed confetti animation firing on every single page load (was gated only on `reconciled`, not on a state *transition*, so it replayed for every visitor since the contract is currently reconciled) | “The UI needs more effort” — repeated reviewer feedback, 2026-09-11 to 2026-09-15 | Shipped (`MoonPhase.tsx`, `PayrollStatus.tsx`) |
| Simplified the brand mark from a 6-layer badge (crescent + shield + check + sparkle + double ring + glow filter) to a single clean crescent — illegible at 16–24px before, reads clearly now | “Have a proper logo that gives product vibe” — repeated reviewer feedback | Shipped (`Logo.tsx`, `favicon.svg`) |
| Removed duplicate "LIVE · PREVIEW" badge (was shown in both the header and the hero), removed the 3 floating annotation tags haphazardly overlapping the hero panel edges, cut the hero chip row from 3 to 2 | “The UI needs more effort … work on it” — reviewer feedback | Shipped (`Hero.tsx`, `App.css`) |
| Removed the redundant "Connect wallet" + "Connect" pair of buttons that both opened the same modal — now a single button | Same UI-polish pass | Shipped (`WalletBar.tsx`) |

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

### Feedback #4 — "The UI needs more effort" (Level 6, recurring 2026-09-11 → 2026-09-15)

> "The UI needs more effort, have a proper logo, go to Pinterest or Dribbble
> and take inspo of frontend, and work on it." / "Have a proper logo that
> gives product vibe."

- **Theme:** Visual design / branding
- **Priority:** P1
- **Reviewer note:** This was the same note across four consecutive daily
  reviews despite several prior UI passes (hero redesign, dashboard overhaul,
  SVG branding — see commit history). Repeated identical feedback after
  repeated visual changes meant the problem wasn't the color/layout choices
  being iterated on, so before touching those again this cycle started by
  auditing the *live* deployed page with a real browser instead of just the
  source.

**What that audit found**, screenshotting `shadow-payroll.vercel.app` on load:

1. A 36-piece confetti burst was firing on every page load for every visitor
   — `{reconciled && initialized && <Celebration />}` rendered whenever the
   *current* state was reconciled, not only on the moment it *became*
   reconciled. Since the live contract is presently fully reconciled, this
   meant every single visitor's first ~13 seconds on the site were spent
   looking at falling confetti dots raining over the hero text and CTA. This
   was almost certainly the single biggest driver of the "sloppy" first
   impression.
2. The brand mark packed a crescent, a shield, a checkmark, a sparkle, a
   glow filter and two rings into a 64px viewBox — it never resolved into
   anything but a soft gold blob at the 16–24px sizes it's actually shown at
   (favicon, nav bar), which reads as "no real logo" even though one exists.
3. The header showed a "LIVE · PREVIEW" badge, and the hero repeated the
   identical badge a few lines down; the hero also stacked 3 pill chips that
   wrapped awkwardly, and 3 independently-animated "floating tag" callouts
   were pinned at hard-coded negative offsets around the ledger panel,
   overlapping its border in a way that read as broken rather than designed.
4. The wallet control in the header showed two buttons side by side —
   "Connect wallet" and "Connect" — that did the exact same thing.

**Decision:** Fix the concrete bugs/redundancies above rather than re-skin
the whole page again, since the underlying card system, typography and
below-the-fold sections (status, cohort grid, how-it-works, FAQ) were
already solid on inspection. Simplify the mark to one shape that survives a
16px favicon. Verified the fix by re-screenshotting the local production
build, not just reading the diff.

**Shipped in:** `MoonPhase.tsx`, `PayrollStatus.tsx`, `Logo.tsx`,
`public/favicon.svg`, `Hero.tsx`, `WalletBar.tsx`, `App.css`.

### Feedback #5 — User feedback form results (Level 6, 2026-07-13 → 2026-08-12)

Structured feedback collected via the
[in-app feedback form](https://docs.google.com/spreadsheets/d/1LeJv0qy7mZjlCg-Ub7vBJuRgfbs-mkhn/edit?gid=1346840953#gid=1346840953)
after payees claimed. 49 rows total; **note for anyone auditing this data:**
about 20 of those rows (the 2026-07-13/14 batch) are pairs with word-for-word
identical free-text answers submitted at the identical second under
different names — almost certainly ~10 duplicated submissions, not 20
independent ones. The counts below only count each duplicate pair once (40
responses), and the 2026-08-12 batch (30 rows) shows no such pattern.

Themes, by frequency across the 40 counted responses:

| Theme | Count | Priority |
|---|---|---|
| Google sign-in as an alternative to wallet-only auth | 13 | P1 — most-requested single feature |
| Mobile app support | 10 | P2 |
| "UI could be better / looks basic / needs polish" | 4 | P1 — independent confirmation of Feedback #4 above, from real users rather than only the reviewer |
| Faster claim/transaction confirmation | 3 | P2 |
| More payroll options / cycles | 4 | P2 |
| Wallet-security clarity | 2 | P2 |

Bugs: none reported (overwhelmingly "No bugs" / "No issues"). Would-
recommend: 100% "Yes" across all 40. Net read: the core claim flow works
and people are satisfied with it, but the UI-polish complaint that drove
Feedback #4 wasn't only a reviewer's opinion — a meaningful slice of real
users said the same thing independently, before that UI pass shipped.

**Decision:** Google sign-in is out of scope for this cycle — the whole
product's privacy guarantee is that Lace wallet auth requires no account,
no password, no custodian; a Google-auth path would need real design work
to not quietly undermine that. Logging it here as the top open ask for a
future cycle rather than shipping it half-considered.

**Status:** triaged, not shipped.

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
| new | 0 | open for intake via GitHub issues + the [user feedback form](https://docs.google.com/spreadsheets/d/1LeJv0qy7mZjlCg-Ub7vBJuRgfbs-mkhn/edit?gid=1346840953#gid=1346840953) |
| triaged | 1 | Google sign-in (Feedback #5) — logged, not yet scheduled |
| shipped | 4+ | Levels 5–6 changes recorded above + [docs/level5/FEEDBACK.md](level5/FEEDBACK.md) |

The loop is **open** — report bugs or suggestions via GitHub issues or the
feedback form. Every entry is picked up in the weekly triage, prioritised
(P0/P1/P2), and if it lands it's recorded in the changelog above.
