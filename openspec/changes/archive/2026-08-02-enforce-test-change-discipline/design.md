## Context

The direction of adaptation was already the kit's stated position; what it never
had was a place in the execution path and a check. Both gaps have the same
origin: the rule was written where it is easiest to say (the plan and the
retrospective) rather than where it is hardest to follow (the middle of an
implementation task that will not go green).

The constraint that bounds this change is the one already settled in
`.okf/decisions/2026-08-02-the-kit-records-test-ordering-it-does-not-verify-it.md`:
`okf check` reads finished files. It cannot see that an assertion moved. So the
enforceable half is the *recorded* case — a row that names no ground, or a ground
that points at nothing — and the design says so rather than implying more.

## Goals / Non-Goals

**Goals:**

- Put BR-8 where an agent is standing when it is tempted to break it.
- Make the Test Changes table a checked record instead of an unread one.
- Keep an empty table completely clean, so the check never pushes anyone toward
  omitting a row.

**Non-Goals:**

- Detecting an unrecorded test change, or judging whether a stated ground is
  true.
- Reopening what counts as an admissible ground.

## Decisions

### D1: The row answers with a citation or a declared defect, never with silence

This is the kit's existing reason-or-path escape, applied to a fourth table. The
Decision Promotion table already works this way (a path that resolves, or a
stated reason), as does the Known Gaps ledger and the Not Applicable declaration.
Reusing the shape means a reader who has met one of them can read this one, and
means the failure message can say the same kind of thing.

A citation is checked for resolving, not for being apt: `BR-3` must exist in an
entry this change links, and a spec path must exist on disk. Whether `BR-3` is
really why the test changed is a review question, and D3 below says so.

### D2: These findings are errors, not warnings

The standing decision that a new invariant ships as a warning
(`.okf/decisions/2026-08-01-a-new-invariant-starts-as-a-warning.md`) is scoped to
invariants introduced *with a migration*, where a project is measured against a
rule it had no opportunity to satisfy. That shape is absent here: the check fires
only on rows a project chose to write, and a project that changed no test after
implementation started sees nothing. A row that names no ground is not a
transitional state — it is the failure this change exists to name.

### D3: The check reaches the recorded case only, and says so

A change that rewrites its tests and records nothing passes. That is not an
oversight to be fixed later with a cleverer check; it follows from what a
finished-file reader can know. The honest framing is that this closes the gap
between *recording* a test change and *justifying* it, and leaves the gap between
changing one and recording it to review — where the diff is visible.

The alternative worth naming: reconstructing test edits from git history. It was
rejected once already for the ordering question and fails here for the same
reason — commit granularity is not the kit's to control, and a squashed branch
erases the evidence the check would depend on.

## Risks / Trade-offs

- **[The check taxes honesty: recording a test change costs a citation, hiding
  one costs nothing]** -> Real and unfixable at this layer. Mitigated only by
  keeping the cost low — one column, one citation that already exists elsewhere
  in the change — and by stating it in the entry so nobody mistakes the check for
  full coverage.
- **["Mechanical defect" becomes the universal excuse]** -> The declaration must
  name the specific defect, the same requirement the kit already puts on "not
  applicable". A mechanical fix that moves an assertion is not mechanical, and
  that is visible in the diff even though it is not visible to the check.
- **[A fourth table with its own rules adds to what an agent must hold]** ->
  Mitigated by D1: it is the same rule shape as the three tables it sits beside,
  not a fourth idiom.

## Migration Plan

None. The template change affects only test-plans created after it. An existing
test-plan with an empty Test Changes table stays clean; one with rows that name
no ground starts failing, which is the intent.

## Open Questions

None.
