# Test Plan

# Test Strategy

- Unit: fixture tests in `test/run.mjs` driving `check()` directly - build a tiny
  repo in a temp dir, break one thing, assert the finding. This is where every
  status-column rule is exercised (UT-001 - UT-007, NEG-001, NEG-002).
- Integration: assertions over the shipped schema payload itself - the real
  `templates/tasks.md`, `templates/test-plan.md`, and `schema.yaml`, not copies -
  plus one fixture change filled from the new template that must pass `check`
  clean (IT-001 - IT-005).
- API E2E: Not Applicable because the kit ships a CLI and a schema payload, with
  no HTTP surface to exercise black-box.
- Browser E2E: Not Applicable because this repo has no UI and this change adds
  none.

This repo's harness has no pending mechanism, so `skeleton` cannot be expressed
today. The skeleton task group therefore adds a `todo()` helper to `test/run.mjs`
first - a registered, reported, bodyless test - and the integration cases below
start there. That is the assumption recorded in the OKF entry being resolved
rather than waived.

This plan uses the two-column form this change introduces: `Initial Status` is
where each row stood when implementation began, `Status` is where it stands now.

# Status Vocabulary

- `planned`  - a row in this file only; no test file exists yet.
- `skeleton` - the test file exists and is declared with the runner's own pending
  mechanism (`it.todo`, `test.todo`, `test.fixme`, or this repo's `todo()`). It
  compiles and lints clean because it has no body.
- `failing`  - the test is executable and fails on its ASSERTION, not on a
  missing import or a type error.
- `passing`  - green.

# Contract Stubs

| Contract | File | Signature Or Shape | Notes |
| --- | --- | --- | --- |
| `liveStatusColumn` | `lib/check.mjs` | `function liveStatusColumn(headerCells): number \| null` - body `throw new Error('not implemented')` | Answers "which column is this table's current status", per design D2 |
| `todo` | `test/run.mjs` | `function todo(name): void` - registers a pending test and reports it; no assertion body | The pending mechanism the skeleton rows depend on |

# Pre-Implementation Unit Tests

<!--
Two of these nine reach a red state, and the other seven do not. That is not an
oversight: this change adds one new behaviour (the missing-initial-status
warning) and changes one existing one (which column feeds the pending list).
The rest of the rules it cites are already implemented, so their tests are
regression guards with no implementation task to precede - a guard that starts
red would mean the behaviour it guards does not exist yet. Each such row says so
in Notes rather than borrowing a red state it never had.
-->

| Test Case ID | Rule (BR-n) | Test File | Test Name | Initial Status | Notes |
| --- | --- | --- | --- | --- | --- |
| UT-001 | BR-1 | `test/run.mjs` | `UT-001 an unknown word in Initial Status is an error` | passing | Regression guard: vocabulary already reaches both columns and must keep doing so |
| UT-002 | BR-1 | `test/run.mjs` | `UT-002 a failing status keeps its assertion message` | passing | Regression guard: guards the existing parse against the column change |
| UT-003 | BR-5 | `test/run.mjs` | `UT-003 a promoted skeleton needs no Known Gaps row` | failing: `1 !== 0` - a historical `skeleton` was counted as a live gap | The false positive the new column creates until D2 lands |
| UT-004 | BR-5 | `test/run.mjs` | `UT-004 a surviving skeleton still needs an owner` | passing | Regression guard: the behaviour UT-003 must not break |
| UT-005 | BR-5 | `test/run.mjs` | `UT-005 a table with only Initial Status uses it as live` | passing | Regression guard on the fallback in design D2 |
| UT-006 | BR-6 | `test/run.mjs` | `UT-006 an empty Initial Status warns and does not error` | failing: no warning matched `/records no status from before implementation/` | The new invariant; asserts the level too, not just presence |
| UT-007 | BR-6 | `test/run.mjs` | `UT-007 a waived level emits no missing-status warning` | passing | Guards against implementing UT-006 per level instead of per row |
| NEG-001 | BR-1 | `test/run.mjs` | `NEG-001 an invalid Status is not excused by a valid Initial Status` | passing | Regression guard: both columns validated independently |
| NEG-002 | BR-6 | `test/run.mjs` | `NEG-002 status-free and blank rows produce no warning` | passing | Guards against implementing UT-006 over every table and every row |

# Integration Tests

| Test Case ID | Test File | Test Name | Initial Status | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| IT-001 | `test/run.mjs` | `IT-001 the skeleton group precedes implementation` | skeleton | passing | Reads the shipped `templates/tasks.md` headings in order |
| IT-002 | `test/run.mjs` | `IT-002 nothing promotes a skeleton nothing creates` | skeleton | passing | Every promote group has an earlier creating group |
| IT-003 | `test/run.mjs` | `IT-003 the group order sentence matches the template` | skeleton | passing | `schema.yaml` prose vs template headings |
| IT-004 | `test/run.mjs` | `IT-004 both status columns ship in the test-plan template` | skeleton | passing | Integration and E2E table headers |
| IT-005 | `test/run.mjs` | `IT-005 a plan filled from the new template checks clean` | skeleton | passing | No error and no warning, in normal and archive mode |

# E2E Tests

<!-- Both E2E levels are declared Not Applicable under Test Strategy with a specific reason; no rows. -->

# Test Data And Fixtures

| Fixture Or Data | Used By | Setup Method | Cleanup Method |
| --- | --- | --- | --- |
| Temp repo scaffold | UT-001 - UT-007, NEG-001, NEG-002, IT-005 | `scaffold(root)` in `test/run.mjs`, into `mkdtempSync` | `rmSync` in the harness `finally` |
| The shipped schema payload | IT-001 - IT-004 | Read from `openspec/schemas/okf-gated-feature/` in the repo itself | None - read only |
| A test-plan filled from the new template | IT-005 | Written into the scaffolded change directory | Removed with the temp repo |

# Commands

## Unit

    npm test

## Integration

    npm test

## E2E

    # Not Applicable - see Test Strategy

## OpenSpec Validation

    openspec validate skeleton-tests-before-implementation --strict

## OKF Validation

    node bin/okf.mjs check
    node bin/okf.mjs check --archive skeleton-tests-before-implementation

# Test Change Rules

- Pre-written tests are not changed to match the implementation.
- A pre-written test may change only when the OKF entry or spec changed first, or
  the test has a mechanical bug (wrong fixture, typo, bad assertion syntax).
- When implementation reveals that a business rule must be different, stop:
  amend `.okf/features/test-first-gate.md` and the spec first, record it below,
  then change the test and the code. Never the other way round.

# Test Changes After Implementation Started

| Date | Test | Reason | Rule (BR-n) Or Spec Change |
| --- | --- | --- | --- |

# Known Gaps

| Test Case ID | Status Left At | Reason | Owner | Follow-Up |
| --- | --- | --- | --- | --- |
