---
type: Decision
title: The falsifier is recorded in the test-plan, not in test-cases
description: What would make a test fail is a claim about the implementation, so it belongs with the mechanics of a specific test rather than with the behaviour the test describes.
date: 2026-08-02
status: stable
decision_status: accepted
affects_features:
  - test-first-gate
sources:
  - id: change-require-tests-that-can-fail
    resource: change:require-tests-that-can-fail
linked_changes:
  - require-tests-that-can-fail
---

# Decision

The `Falsified By` column lives in the Pre-Implementation Unit Tests table of
`test-plan.md`. `test-cases.md` continues to describe behaviour — Given/When/Then,
derived from the specs — and records nothing about the implementation.

# Context

BR-12 requires every pre-implementation unit test to name the production change
that would make it fail. Two artifacts could have held it: `test-cases.md`, which
already carries a `Source` column citing `BR-n`, or `test-plan.md`, which records
each test's file, name, and status.

The falsifier is a claim about code, not about behaviour, which settles it on
meaning alone. Two practical reasons point the same way: the unit table is already
parsed by `checkTestPlan`, so nothing new had to learn to read a table; and an
eighth column on a seven-column behaviour table would have been filled from the
scenario text rather than thought about.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| An eighth column in `test-cases.md` | The row already says Given/When/Then; a falsifier written beside them gets paraphrased from the Then cell, which is exactly the tautology the column exists to catch |
| A prose section rather than a column | Nothing mechanical can find a per-test answer in prose, so presence could not be checked at all |
| Both files, one authoritative | Two copies of the same claim drift, and the gate already refuses that shape everywhere else |

# Consequences

`test-cases.md` stays a behaviour document that a non-implementer can write from
the specs alone. `test-plan.md` absorbs anything implementation-facing, which is a
boundary the next artifact-shaped question can be answered against instead of
reopened.

The cost is that a test case and its falsifier live in different files, joined by
the test case id. That join already exists for status, file, and name.

# Revisit When

A level other than unit tests needs a falsifier. Integration and E2E rows start as
skeletons, before an assertion exists to have one, so the question was not asked of
them - a change that makes those rows executable from the start would reopen it.
