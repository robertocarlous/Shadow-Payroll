# 🔁 Shadow Payroll — the feedback loop

Level 5's core skill is learning from users instead of building in private.
This document defines Shadow Payroll's feedback loop concretely enough that
anyone can run it: how feedback gets in, how it is triaged and prioritised,
and how a decision becomes a shipped change with a changelog entry.

## 1. Collect — where feedback comes from

| Channel | How it works | Data |
|---|---|---|
| Dashboard feedback panel | 1–5 rating buttons, then a free-text comment; one tap opens a pre-filled GitHub issue | One tap to send; identical format |
| GitHub issues | Report a bug or suggestion on the repo | Standard issue tracker |

Every feedback entry records: **who** (GitHub username / email), **rating**,
**comment**, **timestamp**, and a **status** the loop can advance.

## 2. Triage — weekly cadence

- **Weekly (Monday):** an operator (any maintainer) exports new entries from
  the dashboard feedback panel and GitHub issues, deduplicates, and tags
  each one:
  - `bug` — something is broken (e.g. claim fails, wrong copy)
  - `usability` — a step was confusing or took too long
  - `feature` — something missing the user wanted
  - `question` — answered out of band; mark triaged without a code change
- Recurring themes get a **theme ticket** (e.g. "proof-server setup too
  hard") so patterns, not single reports, drive priorities.

## 3. Prioritise — what changes next

Feedback is ranked by impact × effort:

| Priority | Meaning | Example |
|---|---|---|
| P0 | Blocks a user from claiming at all | Credential won't parse; proof-server instructions wrong |
| P1 | High friction, affects many users | Wallet connection confusing; faucet step unclear |
| P2 | Nice-to-have polish | Better success copy; extra FAQ entry |

Each accepted item is turned into a small, dated task and worked in the open
(a GitHub issue or a commit that references the feedback entry id).

## 4. Ship — the changelog

Every shipped decision is recorded in
[docs/level5/FEEDBACK.md](level5/FEEDBACK.md) as a dated entry with:

- the feedback that triggered it (rating + theme),
- what was decided, and
- the commit/PR that shipped it.

Users can watch their feedback land there — the loop is not a black box.

## 5. Re-check

After a change ships, the next triage round looks for new entries on the
same theme to confirm the fix actually helped (e.g. "connection is easier
now"). The weekly cadence keeps this closed.

## Status lifecycle

`new` → `triaged` → `shipped`

- `new`: captured but not yet reviewed
- `triaged`: reviewed, tagged, and either decided (→ shipped) or answered
- `shipped`: the change is in the repo/dashboard and the entry is recorded
  in the changelog

## Keeping docs in sync

The feedback loop is also how documentation stays current: any P1+
"documentation was confusing" feedback produces a docs change in the same
ship step, and the changelog notes it. The README, this page, and
`docs/level5/FEEDBACK.md` are updated together so the docs never describe a
feature that has since changed.
