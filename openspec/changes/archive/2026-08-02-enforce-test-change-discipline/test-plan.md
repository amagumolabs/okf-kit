# Test Plan

# Test Strategy

- Unit: fixture tests in `test/run.mjs` driving `check()` directly - a Test
  Changes row is written into the scaffolded plan, broken one way at a time, and
  the finding asserted (UT-101 - UT-106, NEG-101, NEG-102).
- Integration: assertions over the shipped schema payload itself - the real
  `templates/tasks.md`, `templates/test-plan.md`, and `schema.yaml`
  (IT-101 - IT-103).
- API E2E: Not Applicable because the kit ships a CLI and a schema payload, with
  no HTTP surface to exercise black-box.
- Browser E2E: Not Applicable because this repo has no UI and this change adds
  none.

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
| `testChangeGround` | `lib/check.mjs` | `function testChangeGround(cells, header): {kind, value}` - body `throw new Error('not implemented')` | Reads a Test Changes row and says which of the two grounds it stands on, per design D1 |

# Pre-Implementation Unit Tests

| Test Case ID | Rule (BR-n) | Test File | Test Name | Initial Status | Notes |
| --- | --- | --- | --- | --- | --- |
| UT-101 | BR-9 | `test/run.mjs` | `UT-101 a test change that names no test is caught` | failing: no error matched `/names no test/` | |
| UT-102 | BR-9 | `test/run.mjs` | `UT-102 a test change citing an unknown rule is caught` | failing: no error matched `/BR-9/` | |
| UT-103 | BR-9 | `test/run.mjs` | `UT-103 a test change citing a missing spec is caught` | failing: no error matched the dangling spec path | |
| UT-104 | BR-8, BR-9 | `test/run.mjs` | `UT-104 a declared mechanical defect is a complete answer` | passing | The only clean no-citation path |
| UT-105 | BR-9 | `test/run.mjs` | `UT-105 a test change standing on nothing is caught` | failing: no error matched `/states no ground/` | |
| UT-106 | BR-9 | `test/run.mjs` | `UT-106 an empty Test Changes table is clean` | passing | Guards against a check that pushes toward omitting rows |
| NEG-101 | BR-9 | `test/run.mjs` | `NEG-101 a mechanical defect must name what was wrong` | failing: no error matched `/states no ground/` | The bar the kit sets for "not applicable" |
| NEG-102 | BR-9 | `test/run.mjs` | `NEG-102 a resolving citation needs no declared ground` | passing | Boundary in the other direction |

# Integration Tests

| Test Case ID | Test File | Test Name | Initial Status | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| IT-101 | `test/run.mjs` | `IT-101 the implementation group states the direction` | skeleton | passing | Reads the shipped `templates/tasks.md` |
| IT-102 | `test/run.mjs` | `IT-102 the tasks instruction states the order of repair` | skeleton | passing | Reads `schema.yaml` |
| IT-103 | `test/run.mjs` | `IT-103 the Test Changes table shows both grounds` | skeleton | passing | Reads the shipped `templates/test-plan.md` |

# E2E Tests

<!-- Both E2E levels are declared Not Applicable under Test Strategy with a specific reason; no rows. -->

# Test Data And Fixtures

| Fixture Or Data | Used By | Setup Method | Cleanup Method |
| --- | --- | --- | --- |
| Temp repo scaffold | UT-101 - UT-106, NEG-101, NEG-102 | `scaffold(root)` in `test/run.mjs`, into `mkdtempSync` | `rmSync` in the harness `finally` |
| A Test Changes row written into the scaffolded plan | UT-101 - UT-106, NEG-101, NEG-102 | `setTestChanges(root, rows)` helper | Removed with the temp repo |
| The shipped schema payload | IT-101 - IT-103 | Read from `openspec/schemas/okf-gated-feature/` in the repo itself | None - read only |

# Commands

## Unit

    npm test

## Integration

    npm test

## E2E

    # Not Applicable - see Test Strategy

## OpenSpec Validation

    openspec validate enforce-test-change-discipline --strict

## OKF Validation

    node bin/okf.mjs check
    node bin/okf.mjs check --archive enforce-test-change-discipline

# Test Change Rules

- Pre-written tests are not changed to match the implementation.
- A pre-written test may change only when the OKF entry or spec changed first, or
  the test has a mechanical defect (wrong fixture, typo, bad assertion syntax).
- When implementation reveals that a business rule must be different, stop:
  amend `.okf/features/test-first-gate.md` and the spec first, record it below,
  then change the test and the code. Never the other way round.

# Test Changes After Implementation Started

| Date | Test | Ground | Rule (BR-n) Or Spec Change |
| --- | --- | --- | --- |
| 2026-08-02 | `IT-102 the tasks instruction states the order of repair` | mechanical defect: the assertion scanned the whole `tasks` instruction with `indexOf`, so "spec" and "code" matched unrelated earlier prose and the order read as violated. Scoped to the order-of-repair sentence. The claim the test makes is unchanged | - |

# Known Gaps

| Test Case ID | Status Left At | Reason | Owner | Follow-Up |
| --- | --- | --- | --- | --- |
