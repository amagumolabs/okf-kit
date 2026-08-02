## Context

The test-first gate lives in two artifacts that must agree: `templates/tasks.md`,
which an agent executes, and `templates/test-plan.md`, which a reviewer reads.
Today they disagree. The tasks template asks for promotion of skeletons it never
creates, and the test-plan template records only where the integration and E2E
tests ended up, never where they started. Neither file is wrong on its own; the
gap is between them, which is why it survived several changes without being
noticed.

The constraint that shapes every decision below: `okf check` reads finished
files. It cannot observe when a file was created, so it can never prove the
ordering happened — it can only require that the ordering be *recorded*, and make
an absent record visible. Every mechanism here is chosen with that ceiling in
mind.

## Goals / Non-Goals

**Goals:**

- Make the schema produce a `tasks.md` in which no test file is first created by
  the implementation step.
- Make a finished `test-plan.md` distinguishable from one a test-last change
  would have produced.
- Introduce the new column without turning the archive gate into a false-positive
  generator.

**Non-Goals:**

- Proving the ordering. See Context.
- Any change to the `okf-*` capabilities or the CLI surface.
- Rewriting changes already in flight or already archived.

## Decisions

### D1: The skeletons get their own task group, before implementation

Alternative considered: append skeleton tasks to the existing
"Pre-Implementation Unit Tests" group. Rejected — the group headings are what an
agent scans when deciding where work belongs, and a heading that says "Unit
Tests" is exactly where integration work does not get filed. A separate,
correctly named group before implementation is the only version that survives an
agent skimming the template.

Consequence: the groups after it renumber. That is accepted rather than worked
around with a decimal group like `2b`, which would preserve stale numbering at
the cost of a template nobody can read as a sequence.

### D2: A table's live status is `Status`; `Initial Status` is history

With two status columns in one table, "is this row still a skeleton" needs a
single answer. The rule: read `Status`; fall back to `Initial Status` only when
the table has no `Status` column at all. That fallback is what keeps the
Pre-Implementation Unit Tests table — which has only `Initial Status` — behaving
as it does today.

This matters beyond the archive gate. Any future reader of these tables faces the
same question, so the rule belongs to the table format, not to the one check that
happens to ask first.

Without it, adding the column would immediately break the archive gate: a row
that started `skeleton` and ended `passing` would be reported as an unowned
skeleton about to be archived, and the fix a downstream project would reach for
is deleting the honest history.

### D3: The empty-`Initial Status` check starts as a warning

This is the existing kit-wide rule applied, not a new judgement: see
`.okf/decisions/2026-08-01-a-new-invariant-starts-as-a-warning.md`. A change
already mid-flight was written against a template with no such column, and
erroring on it would fail work that was correct when it started.

### D4: The schema records the ordering; it does not verify it

An agent can create a skeleton and rewrite it wholesale after implementation, and
no static check will see the difference. Rather than build a check that appears
to close that hole, the design states the boundary: the mechanical layer
guarantees the record exists and is internally consistent; whether the record is
honest is a review question. Stating this is what keeps the gate from being
trusted for more than it does.

## Risks / Trade-offs

- **[Two status columns invite copy-paste, where the initial status is filled in
  at the end to match]** -> Unfixable mechanically; D4 states it. The warning
  fires on an empty cell, not on a dishonest one, and the design says so rather
  than implying otherwise.
- **[Renumbered groups make older `tasks.md` files look inconsistent with the
  template]** -> Templates are read at creation time only; an existing
  `tasks.md` is never re-derived, so nothing breaks. The inconsistency is
  cosmetic and visible only when comparing an old change to a new template.
- **[The fallback in D2 hides a table that lost its `Status` column by
  accident]** -> Accepted. The alternative, erroring on a table with only
  `Initial Status`, would break the unit-test table that is correct today.

## Migration Plan

None needed. The template change affects only changes created after it, and the
check change is additive: a `test-plan.md` written against the old template keeps
validating, gaining one warning per integration or E2E row.

Rollback is reverting the commit; no state is written anywhere that a rollback
would have to undo.

## Open Questions

None. The one question worth asking — whether the empty-`Initial Status` check
should ever become an error — is answered by the standing decision cited in D3,
which promotes a warning to an error a release later if it proves quiet.
