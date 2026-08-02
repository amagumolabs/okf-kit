---
type: Decision
title: The kit records the evidence a change reports; it never reproduces it
description: okf check reads what a change claims about lint, type checking and test ordering, and does not execute the project's commands to confirm it.
date: 2026-08-02
status: stable
decision_status: accepted
supersedes:
superseded_by:
affects_features:
  - okf-archive-gate
  - test-first-gate
sources:
  - id: design
    resource: change:add-static-analysis-gate
linked_changes:
  - add-static-analysis-gate
---

# Decision

`okf check` reads the evidence a change reports and does not re-run the work
that produced it. The static analysis gate reads the Result column of the Static
Analysis table; it never executes the command named beside it. This generalises
the boundary already drawn for test ordering into a property of the whole
validator: the kit checks that a claim was made, in a fixed place, in a shape a
reviewer can act on. It does not check that the claim is true.

# Context

The static analysis gate could have run the project's linter and type checker
itself, and would then have produced findings nobody could fake. Three things
argued against it.

Executing commands out of whatever repository the validator is pointed at is a
different trust boundary from reading its files, and one the kit had never
crossed. It is also the boundary CI already occupies - CI runs the commands, on
a clean checkout, on every push.

Running them would force the kit to know what a lint command looks like in each
ecosystem, which is exactly the coupling the Check/Command column split was
designed to avoid.

And the failure the gate exists to prevent is not a lying agent; it is a silent
one. A change used to archive with no statement about static analysis at all,
because there was nowhere to put one. Writing the claim down where a reviewer
can compare it against CI closes that, and closes it without the kit growing a
subprocess.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| Run lint and typecheck from `okf check` | A validator that executes arbitrary commands from an arbitrary repository is a different kind of tool, needs per-ecosystem knowledge, and duplicates CI. |
| Parse the reported output for a pass/fail token | Every tool's output differs, so the parser would be a permanent maintenance surface that is wrong for whichever tool nobody tested against. |
| Require CI to attest the result instead | Ties the kit to one CI provider, and leaves projects without CI unable to satisfy a required gate. |
| Drop the gate, since it cannot prove anything | Confuses "cannot prove" with "worth nothing". An absent record is invisible; a written one is reviewable, and the review is where the proof was always going to come from. |

# Consequences

- `lib/check.mjs` imports nothing that spawns a process, and a test asserts that
  over its source - the assertion is structural, so it cannot be satisfied by
  intent.
- A reported result can be wrong or invented. That is accepted and recorded in
  the risk table of `.okf/features/okf-archive-gate.md` rather than mitigated.
- The Command column of the Static Analysis table is documentation for the
  reader. It is not gated, and a project can change its tool without any change
  to the kit.
- Any future evidence gate inherits this shape: ask for the record, name where
  it goes, and leave the confirming to CI and to review.

# Revisit When

A concrete case appears of a reported result that was false and that a reviewer
did not catch. That would be evidence the written record is not enough, and the
first thing to reconsider is whether CI can attest the result rather than
whether the validator should run it.
