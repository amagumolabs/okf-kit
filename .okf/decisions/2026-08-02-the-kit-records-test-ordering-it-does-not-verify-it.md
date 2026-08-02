---
type: Decision
title: The kit records test ordering; it does not verify it
description: Mechanical checks guarantee that the record of when each test was written exists and is internally consistent, and the kit states plainly that it cannot judge whether the record is honest.
date: 2026-08-02
status: stable
decision_status: accepted
affects_features:
  - test-first-gate
sources:
  - id: change-skeleton-tests-before-implementation
    resource: change:skeleton-tests-before-implementation
linked_changes:
  - skeleton-tests-before-implementation
---

# Decision

`okf check` requires that a test-plan record where each test stood before
implementation, and reports the record's absence. It does not attempt to
establish that the recorded order actually happened. The workflow documentation
states this boundary rather than implying a stronger guarantee.

# Context

`okf check` reads finished files. An agent can create a skeleton, then rewrite it
wholesale once the code exists, and no static check distinguishes that from a
test written first. Git history would not settle it either: a single commit, or a
squash, erases the ordering the check would depend on.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| Compare commit timestamps of test and source files | Depends on commit granularity the kit does not control; a squashed branch reads as test-last even when it was not, and one extra commit makes any ordering claim true |
| Hash skeleton bodies and reject a body that changed too much during promotion | Promotion is supposed to change the body; a threshold would be arbitrary and would punish exactly the intended workflow |
| Say nothing about the limit and let the check imply the guarantee | The most expensive option: a gate trusted for more than it does is worse than a gate known to be partial |

# Consequences

The mechanical layer and the review layer have a stated division: the check
answers "is the record there and consistent", a human answers "is it true". This
is the same shape as the kit's other stated limits - `okf check` can confirm a
`BR-n` has an evidence reference but not that the reference proves the rule.

Anyone proposing to strengthen this must first say what new signal they have,
not merely which check to add.

# Revisit When

The kit gains a trustworthy per-file timeline it controls - an execution trace of
its own workflow, not a reconstruction from version control.
