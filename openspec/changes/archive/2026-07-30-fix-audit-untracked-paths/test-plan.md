# Test Plan

# Test Strategy

- Unit: three new cases against `audit(root)`, reusing the existing git fixture
  helper. One of them needs a real `.gitignore`, which the helper does not write
  today.
- Integration: not applicable, git is the only boundary and the unit tests drive
  it for real.
- API E2E: not applicable, the kit exposes no API.
- Browser E2E: not applicable, the kit has no UI.

# Contract Stubs

<!--
No stubs needed. `audit(root)` and its result shape already exist; this change
adds one field to an existing return value, so the tests compile and run against
the current contract from the start and fail on their assertions.
-->

# Pre-Implementation Unit Tests

| Test Case ID | Rule (BR-n) | Test File | Test Name | Initial Status | Notes |
| --- | --- | --- | --- | --- | --- |
| UT-015 | BR-9 | test/run.mjs | audit reports an uncommitted path as not committed yet | failing: undefined is not [ 'src/brand-new.js' ] | Reproduces what this repository showed after add-okf-audit |
| UT-016 | BR-9 | test/run.mjs | audit treats ignored files as matching nothing | failing: undefined !== [] | Needs a `.gitignore` in the fixture |
| UT-017 | BR-8 | test/run.mjs | audit verdicts are unaffected by an uncommitted path | failing: undefined is not [ 'src/pending.js' ] | Guards the "wording only" promise |

# Test Data And Fixtures

| Fixture Or Data | Used By | Setup Method | Cleanup Method |
| --- | --- | --- | --- |
| Temporary git repository with controlled commit dates | UT-015, UT-016, UT-017 | existing `gitRepo()` helper | `fs.rm` in the harness `finally` |
| A `.gitignore` inside that repository | UT-016 | written and committed before the ignored file is created | same |

# Commands

## Unit

    node test/run.mjs

## Integration

    not applicable

## E2E

    not applicable

## OpenSpec Validation

    openspec validate fix-audit-untracked-paths --strict
    openspec validate okf-audit --strict

## OKF Validation

    node bin/okf.mjs check
    node bin/okf.mjs check --archive fix-audit-untracked-paths

# Test Change Rules

- Pre-written tests are not changed to match the implementation.
- A pre-written test may change only when the OKF entry or spec changed first, or
  the test has a mechanical bug.
- UT-012 must keep passing untouched: it is the regression guard for the case this
  change is carving an exception out of.

# Test Changes After Implementation Started

| Date | Test | Reason | Rule (BR-n) Or Spec Change |
| --- | --- | --- | --- |

# Known Gaps

| Test Case ID | Status Left At | Reason | Owner | Follow-Up |
| --- | --- | --- | --- | --- |
