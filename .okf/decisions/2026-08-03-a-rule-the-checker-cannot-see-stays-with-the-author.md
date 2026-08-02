---
type: Decision
title: A rule the checker cannot see stays with the author
date: 2026-08-03
status: stable
decision_status: accepted
description: Where a rule's satisfaction is not observable from the file, the template carries the pressure and the checker reports only total silence - never a count, never an error.
affects_features:
  - test-first-gate
  - okf-archive-gate
sources:
  - id: change-tighten-test-case-coverage
    resource: change:tighten-test-case-coverage
  - id: review-2026-08-02-rulebook
    resource: 'Comparison of okf-kit against a hand-written agent rulebook, 2026-08-02, which demanded named boundary values and four UI render states where this kit named neither.'
linked_changes:
  - tighten-test-case-coverage
---

# Decision

When a rule asks an author to have *considered* something, the prompt lives in
the template and the checker reports only the one state it can actually observe:
that nothing was written at all. It warns, it never errors, and it counts rows
rather than the thing the rule is about.

`checkBoundaryCoverage` is the instance: BR-13 names six boundary classes, the
template seeds a row for each, and `okf check` says nothing unless the Negative
And Boundary Cases table is entirely empty while the change's specs carry
scenarios.

# Context

Nothing in a file distinguishes a considered row from a fabricated one. A gate
that erred on a missing class would be satisfied by six rows written to satisfy
it, which is strictly worse than the silence it replaced: the matrix would then
look considered, and the reviewer would have one fewer signal rather than one
more.

The kit had already reached this conclusion once, for test ordering - it records
which group ran first and does not verify it, because the evidence is not in the
tree by the time the check runs. Boundary classes are the same shape of problem
arriving from a different direction.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| Error when a named class has no row | Produces six rows written to satisfy the gate. The check cannot read them, so the cost lands entirely on honest authors |
| Count distinct classes and require six | Requires the checker to judge what a class is - a taxonomy in code, which is the judgement this whole change refuses to make |
| Warn per missing class rather than on an empty table | Six warnings on every change that legitimately discharges five classes trains people to ignore the channel |
| No check at all, template only | Total silence is genuinely observable and genuinely means nobody was asked. Declining to report the one visible state gives up the only signal available |

# Consequences

Makes easy: adding a prompt to a template without also having to make it
mechanically enforceable - the two are now separable, and the second is not the
price of the first.

Makes hard: claiming in a future change that "the gate enforces boundary
coverage". It does not, deliberately, and a change that promotes this warning to
an error reverses a decision rather than tightening a loose one.

Locks in: the split between what the template asks and what `okf check` reports.
The checker's jurisdiction is what is observable in the file; everything else is
review's, and the escape from review is a stated reason, not a deleted row
(BR-14).

# Revisit When

A mechanical signal appears that distinguishes a considered row from a
fabricated one - a per-class citation into the specs, say, that would resolve or
dangle. That would move the rule into the checker's jurisdiction on its own
merits rather than by wishing.
