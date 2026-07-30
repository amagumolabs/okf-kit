---
type: Decision
title: verified_at is a date, and comparisons against it are date comparisons
description: Drift comparisons use YYYY-MM-DD granularity, and a same-day commit is not drift.
date: 2026-07-30
status: accepted
supersedes:
superseded_by:
affects_features:
  - okf-audit
sources:
  - id: design
    resource: change:add-okf-audit
linked_changes:
  - add-okf-audit
---

# Decision

`verified_at` carries date precision only (`YYYY-MM-DD`), and every consumer
compares against it as a date. A commit dated the same day as `verified_at` is
treated as already covered by that verification, not as drift.

# Context

`okf audit` was the first tool to read `verified_at`, which forced the question of
what the field actually means. Nothing recorded a verification *time*, and the
verification pass is a human-plus-agent activity spread over minutes to hours -
there is no single instant to record honestly.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| Record a full ISO timestamp and compare instants | Nothing produces a trustworthy instant. An entry verified in the morning would look stale from an afternoon commit whose code the verifier had already read, which is a false positive on the most common workflow: verify, then finish the change. |
| Treat a same-day commit as drift | Verification happens *after* the code it verifies, so the same day is the normal case, not the exception. This reading would mark almost every freshly verified entry stale immediately. |
| Compare against the change's merge commit instead of a date | Ties knowledge state to git branching topology, which differs per team, and breaks entirely for knowledge captured during explore with no commit at all. |

# Consequences

- Drift detection has a one-day blind spot: a commit made later on the
  verification date is invisible to the audit. Accepted deliberately - the
  alternative trades a rare miss for constant false positives, and a tool people
  stop believing detects nothing at all.
- Comparisons stay string comparisons on `YYYY-MM-DD`, so no date library is
  needed and the kit keeps zero dependencies.
- Any future consumer of `verified_at` inherits this contract and must not
  introduce time-of-day precision without revisiting it.

# Revisit When

A team reports real drift that the audit missed inside the verification day, and
the miss caused a wrong decision rather than mild surprise.
