---
type: Decision
title: Every test file is created before implementation, in a task group of its own
description: Integration and E2E skeletons get their own task group ahead of implementation rather than being folded into the unit-test group or left to the promotion step.
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

The `tasks` template carries a group named for integration and E2E skeletons,
positioned between the unit tests and the implementation. Every test file a
change plans is created in or before that group; the groups after implementation
only promote files that already exist.

# Context

The template asked agents to "promote" skeletons that no group created. An agent
executing it faithfully has an input nothing produces, and resolves that the
cheapest way available - by creating the file at the point where it is first
needed, which is after the code. This was found in a downstream change where the
E2E skeletons were authored two groups after the implementation they covered.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| Append the skeleton tasks to the Pre-Implementation Unit Tests group | Group headings are what an agent scans when deciding where work belongs, and a heading saying "Unit Tests" is exactly where integration work does not get filed |
| Insert a decimal group (`2b`) to avoid renumbering | Preserves stale numbering at the cost of a template nobody can read as a sequence; the numbering is not the thing being protected |
| Leave the ordering to prose in the instruction only | The template is what gets executed; an instruction that disagrees with it loses |

# Consequences

Renumbering the later groups is accepted as a one-off. Any future group added to
this template must answer the same question - does it create a test file, or
promote one - and take its position from that answer, not from convenience.

A change with no integration or E2E coverage drops the group whole and states
why in `test-plan.md`, the same escape the rest of the schema uses.

# Revisit When

A level appears whose test file genuinely cannot be authored before the code -
not merely whose harness is unavailable, which the `skeleton` status already
covers.
