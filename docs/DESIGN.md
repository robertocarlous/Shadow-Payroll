# Design references

Reviewer feedback (2026-09-28) asked for a frontend built from real UI
references, not iterative tweaks to the existing layout. This is the
record of what was actually looked at and what was borrowed from each,
so the result is traceable rather than a claim.

## References

| Product | What was studied | What was borrowed |
|---|---|---|
| [Linear](https://linear.app) | Oversized, tight-leading headline (`letter-spacing: -2.5px`, `line-height: 1.04`); a dimmed, real product screenshot placed directly under the headline instead of illustrative copy | The hero type scale (`clamp(40px, 4.6vw, 68px)`), and the "prove it's real" pattern: a browser-chrome-framed screenshot of the actual claim panel, not a mockup graphic |
| [Mercury](https://mercury.com) | Restraint — one message, generous negative space, no color-block panel competing with the rest of the page | Dropped the idea of a separate colored hero panel entirely — the final hero sits on the page's own background with just an accent glow, not a costume |
| [Deel](https://deel.com) | Split hero with a photo/visual on one side annotated by small floating white cards showing real product state at a glance | First pass only: informed the floating "proof" cards, since dropped (see below) |

## Two passes — and why the first one wasn't enough

**Pass 1** kept the existing purple-gradient/moon hero and only changed its
*structure*: full-bleed instead of boxed, a ~35% larger headline, a new
browser-framed screenshot section, and a timeline-style onboarding list.
Shipped, then reviewed by the project owner directly: it still read as
"the same design," because it was — same purple gradient, same moon
graphic, same three floating cards, same gold accent. Restructuring a
color-block hero that's already been through several rejected rounds
doesn't give a reviewer anything new to react to, no matter how much the
proportions improve.

**Pass 2** (what's live now) is a full pivot, not a refinement:

- **Color**: every gold/amber token (`--accent`, `--accent-2`,
  `--accent-deep`, `--accent-grad`, and every hardcoded gold hex literal in
  `App.css`) replaced with a deep emerald/green family. This cascades to
  every link, badge, and button site-wide, not just the hero, so the new
  color reads as one decision rather than a hero-only patch.
- **Hero background**: the dark purple gradient panel is gone entirely.
  The hero now sits on the page's own light background with a soft accent
  glow (`radial-gradient` at very low opacity) for atmosphere instead of a
  color-block costume.
- **Hero visual**: the moon graphic and the three floating annotated cards
  are gone. In their place, a plain typographic stat row (`100% · 0 · ZK`)
  under the CTA — the real product screenshot right below now carries the
  "prove it" weight, so nothing needs to re-illustrate the same claims a
  second time.
- **Kept from pass 1**: the oversized headline scale, the browser-framed
  real-screenshot section, and the connected-timeline onboarding list —
  these were structural fixes independent of the color story, and held up
  under the "is this actually different" test.

## Pass 3 (2026-09-29) — references from approved Level 6 projects

Pass 2 pivoted the hero to a light theme. The project owner then pointed
to three other Midnight Level 6 submissions that had already been
**approved**, asking for the frontend to be rebuilt in line with what was
actually getting accepted. All three were screenshotted directly (not
guessed from memory) and studied in full before writing any code:

| Product | What was studied | What was borrowed |
|---|---|---|
| [Midnight Vault](https://midnight-vault-nine.vercel.app/) (approved) | Pure near-black background, one restrained glowing-moon visual with no competing decoration, a distinct dark-navy zone for the functional app below the hero, monospace numbered steps ("01 · Connect Wallet") | Confirmed dark-mode + monospace technical accents is the right register for this domain — not "avoid dark," but "avoid clutter within dark" |
| [BallotBox](https://ballotbox-beige.vercel.app/) (approved) | A live status pill above the headline ("LIVE ON MIDNIGHT PREPROD · 71 TESTERS"), a dedicated features grid ("Everything a private vote needs, and nothing to trust"), a closing CTA banner before the footer, a richer multi-link footer | The `hero__status-pill` live-status badge, the new `Features` grid section, the `ClosingCta` banner, and the expanded footer nav (user guide / faucet / deployment log / issues) |
| [Ghost](https://ghost-kappa-one.vercel.app/) (approved) | Fully dark end-to-end (no light section), oversized left-aligned headline, monospace technical accents throughout, real code/SDK content for credibility | Confirmed committing to dark for the *entire* page (not just the hero) reads more cohesive than a dark-hero/light-body split |

**What this pass actually changed, on top of pass 2:**

- **Reverted to dark end-to-end.** All three approved references are
  dark-mode; none use a light card-soup layout. Every design token
  (`--bg`, `--surface-glass`, `--text-primary`, etc.) was re-themed to a
  near-black base with light text, not just the hero section. This also
  surfaced and fixed a real bug: `.btn--primary` was styled
  `background: var(--text-primary)` for the old light theme, which under
  the new dark tokens made every primary button (Claim, Connect Wallet)
  render as white-on-white. Fixed by giving `.btn--primary` the accent
  gradient directly, which also made every primary button site-wide
  consistently on-brand instead of only the hero's.
- **New: a live-status pill** (`LIVE · MIDNIGHT PREVIEW · 50-PERSON
  COHORT`) in monospace above the headline, replacing the plain eyebrow
  label — a concrete-status convention borrowed from BallotBox rather than
  an asserted claim.
- **New: a features grid** (`Features.tsx`) — six concrete ZK guarantees
  with icons, content this project never had a dedicated section for
  before. Directly modeled on BallotBox's and Ghost's feature-grid
  sections.
- **New: a closing CTA banner** (`ClosingCta.tsx`) before the footer —
  every reference project has a final conversion moment; this project
  previously ended cold at the FAQ.
- **Footer enriched** with a resources nav (user guide, faucet, deployment
  log, issue tracker) instead of just two social icons — matching the
  multi-link footers all three references use, proportional to this
  project's smaller scope (not a full 3-column marketing footer).
- Headline scale pushed further (`clamp(42px, 5.4vw, 78px)`, was
  `clamp(40px, 4.6vw, 68px)`) toward Ghost's more confident scale.

## What was deliberately left alone

The small crescent logo mark in the nav/footer keeps its own navy-violet
badge colors; it's a tiny, separate brand anchor, not part of the page's
main visual treatment. The onboarding timeline and browser-framed
screenshot section from pass 1 were kept as-is — structural decisions
independent of color or theme, and none of the three new references gave
a reason to change them.
