# Design references

Reviewer feedback (2026-09) asked for a frontend built from real UI
references, not iterative tweaks to the existing layout. This is the
record of what was actually looked at and what was borrowed from each,
so the result is traceable rather than a claim.

## References

| Product | What was studied | What was borrowed |
|---|---|---|
| [Linear](https://linear.app) | Oversized, tight-leading headline (`letter-spacing: -2.5px`, `line-height: 1.04`); a dimmed, real product screenshot placed directly under the headline instead of illustrative copy | The hero type scale (`clamp(40px, 4.6vw, 68px)`), and the "prove it's real" pattern: a browser-chrome-framed screenshot of the actual claim panel, not a mockup graphic |
| [Mercury](https://mercury.com) | Full-bleed hero that ignores the page's content width entirely; restraint — one message, generous negative space, no competing cards | Made the hero break out of `.page`'s 1120px constraint (`width: 100vw` + negative margins) instead of sitting boxed on the page background like every other section |
| [Deel](https://deel.com) | Split hero with a photo/visual on one side annotated by small floating white cards (`+150 Currencies`, `O-1A Visa Approved`) that show real product state at a glance | The three floating "proof" cards (`Verified`, `Reconciled`, `100% distributed`) over the moon visual — kept from the previous iteration, since the pattern already matched this reference |

## What changed as a direct result

- **Hero**: went from a rounded card floating on the page background (same
  treatment as every other section) to a full-bleed dark panel that reads
  as the dominant moment on the page, with a headline roughly 35% larger
  and tighter-set than before.
- **Product proof section** (new): a browser-chrome-framed screenshot of
  the real claim panel, pulled up to straddle the hero/page boundary. This
  is the single biggest gap the previous iterations had — everything was
  copy and illustrative cards, nothing showed the actual product.
- **Onboarding steps**: went from six identical bordered boxes (the
  clearest "assembled from a component library" tell on the page) to a
  connected vertical timeline with a rail running behind numbered nodes —
  one sequence, not six unrelated cards.
- **Removed the reflexive hover-lift** (`transform: translateY(-3px)`) that
  was applied to every section card regardless of whether it was
  interactive. Onboarding, Claim, and FAQ aren't clickable as whole cards;
  they shouldn't animate like they are.

## What was deliberately left alone

FAQ and footer already read as intentional, not generic, when checked
against the same references (accordion pattern, minimal footer meta row)
— they weren't rebuilt for the sake of rebuilding.
