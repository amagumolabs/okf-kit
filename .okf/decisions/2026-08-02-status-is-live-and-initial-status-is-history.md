---
type: Decision
title: A test-plan table's live status is Status; Initial Status is history
description: Where a test row stands now is read from the Status column, and Initial Status is read as a historical record that no gate treats as a current state.
date: 2026-08-02
status: stable
decision_status: accepted
affects_features:
  - test-first-gate
  - okf-archive-gate
sources:
  - id: change-skeleton-tests-before-implementation
    resource: change:skeleton-tests-before-implementation
linked_changes:
  - skeleton-tests-before-implementation
---

# Decision

A test-plan table with both status columns answers "where does this row stand
now" with `Status`. A table carrying only `Initial Status` - the
Pre-Implementation Unit Tests table - answers with that column, because a
starting point is all it ever records. Any reader asking whether a row is still
a gap uses that rule, not just the archive gate that asked first.

# Context

Recording where each integration and E2E test started requires a second status
column, and a table with two of them has to say which one describes the present.
The archive gate collected pending rows from every status column, so the moment
the new column existed a row that started `skeleton` and ended `passing` would
have been reported as an untested requirement about to be archived.

That false positive matters more than it looks: the cheapest way for a project
to silence it is to delete the honest history, which destroys precisely the
evidence the column was added to preserve.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| Keep reading every status column and require a Known Gaps row for historical skeletons | Turns an accurate record into a finding, and teaches projects that recording history costs them |
| Name the new column something no existing code matches | Hides the collision instead of resolving it, and leaves the next reader with the same ambiguous table |
| Error when a table has only `Initial Status` | Would reject the unit-test table, which is correct as it stands |

# Consequences

The rule belongs to the table format rather than to one check, so a future reader
of these tables inherits an answer instead of inventing one. The fallback means a
table that loses its `Status` column by accident degrades quietly to reading the
initial one; that is accepted, because the alternative breaks a table that is
correct today.

# Revisit When

A third status-shaped column is proposed, at which point "which column is live"
stops being answerable by a two-case rule.
