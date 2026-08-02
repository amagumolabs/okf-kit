---
type: Decision
title: A rule ships where it is needed, not where it can be dogfooded
date: 2026-08-03
status: stable
decision_status: accepted
description: The kit ships rules for capabilities it does not itself have - the UI render states among them - and discharges them on its own changes through the same stated-reason escape it offers downstream.
affects_features:
  - test-first-gate
sources:
  - id: change-tighten-test-case-coverage
    resource: change:tighten-test-case-coverage
  - id: review-2026-08-02-rulebook
    resource: 'Comparison of okf-kit against a hand-written agent rulebook, 2026-08-02. The four-state gap it exposed was observed in a downstream project with a UI, not in this kit.'
linked_changes:
  - tighten-test-case-coverage
---

# Decision

okf-kit ships rules addressed to capabilities it does not have. BR-15's four
render states are the instance: this repository is a command-line validator with
no interface of any kind, and the rule ships anyway.

The kit's own changes discharge such a rule through the same mechanism it offers
downstream - a row in the Not Applicable table with a stated reason - rather than
through an exemption for the kit.

# Context

A rule can only be dogfooded by a project that has the capability it governs.
Requiring dogfooding as a condition of shipping means the kit can only ever
encode rules about validating markdown, which is a small fraction of what a
downstream project needs and none of what the rulebook comparison surfaced.

The alternative reading - that an undogfoodable rule is untested - confuses two
things. What ships is a template and an instruction, and those are tested here
by asserting the shipped text (UT-401, UT-403). What is not tested here is
whether the rule improves a UI change, which no test in this repository could
establish either way.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| Ship only rules this kit can exercise | The gap that prompted BR-15 was observed downstream and would never have been closed. The kit would encode only its own shape |
| Ship the rule, exempt the kit from it | An exemption is invisible in the artifact. Discharging with a stated reason puts the same fact in the file where a reader finds it |
| Split UI rules into a separate optional schema | A second schema to maintain, and an author of a UI change would have to know to opt into it - which is exactly the author who does not know the states exist |

# Consequences

Makes easy: encoding what downstream projects need, including for stacks this
repository will never run.

Makes hard: claiming the kit's green suite is evidence that a rule works in
practice. For rules of this kind the evidence is downstream and arrives as
review feedback, not as a test.

Locks in: the Not Applicable table as the kit's own escape as well as its users',
which is what keeps that escape honest - a mechanism its author has to use is one
whose cost its author feels.

# Revisit When

Discharging inapplicable rules becomes the bulk of what a change's test-cases
file says, which would mean the rule set has drifted from the projects using it
rather than ahead of them.
