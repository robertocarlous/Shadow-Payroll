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

## What was deliberately left alone

FAQ and footer already read as intentional, not generic (accordion
pattern, minimal footer meta row) — they weren't rebuilt for the sake of
rebuilding. The small crescent logo mark in the nav/footer keeps its
existing navy-violet badge colors; it's a tiny, separate brand anchor, not
part of the hero's visual treatment.
