---
type: Decision
title: The check reaches the recorded test change only, and the kit says so
description: Enforcement closes the gap between recording a test change and justifying it, and leaves the gap between making one and recording it to review.
date: 2026-08-02
status: stable
decision_status: accepted
affects_features:
  - test-first-gate
sources:
  - id: change-enforce-test-change-discipline
    resource: change:enforce-test-change-discipline
linked_changes:
  - enforce-test-change-discipline
---

# Decision

`okf check` validates the rows a change wrote into its Test Changes table. It
does not, and will not, attempt to detect that a test was changed and never
recorded. The workflow documentation and the OKF entry both state this boundary
rather than implying a stronger guarantee.

# Context

A change that bends its assertions to fit the implementation and records nothing
passes every check in the kit. This follows from what a finished-file reader can
know: the check sees the test as it now stands, not as it once stood.

The temptation is to reach for git - compare when test files and source files
were touched. That was rejected once already, for the ordering question, in
`2026-08-02-the-kit-records-test-ordering-it-does-not-verify-it.md`, and it fails
here for the same reasons: commit granularity is not the kit's to control, a
squashed branch erases the evidence, and one extra commit makes any claim true.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| Reconstruct test edits from git history | Already settled against for the same class of question; the signal is not the kit's to trust |
| Snapshot assertion text at the end of the red phase and diff it at archive | A test-first workflow expects skeleton bodies to change during promotion, so the diff is noise; and the snapshot is written by the same agent it constrains |
| Say nothing about the limit | The most expensive option. A record trusted as proof is worse than a record known to be partial, because it stops anyone from reading the diff |

# Consequences

The check taxes honesty and misses dishonesty: recording a test change costs a
citation, hiding one costs nothing. That asymmetry is stated in the OKF entry's
Risks table so nobody discovers it by being surprised.

What the check does buy is that a recorded change cannot be vague. Combined with
the direction of adaptation being stated where implementation happens, the
remaining failure mode requires an agent to knowingly omit the record - which is
a different kind of act from drifting into it, and one a reviewer reading `.okf`
and test diffs can name.

# Revisit When

The kit gains a trustworthy execution trace of its own workflow - not a
reconstruction from version control.
