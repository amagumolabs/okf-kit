# Test Plan

# Test Strategy

- Unit: fixture tests in `test/run.mjs` driving `check()` directly — a test-plan is
  scaffolded into a temp repo, one cell broken at a time, and the finding asserted
  (UT-201 – UT-211, NEG-201 – NEG-204).
- Integration: assertions over the shipped schema payload itself — the real
  `templates/test-plan.md` and `schema.yaml` (IT-201 – IT-204).
- API E2E: Not Applicable because the kit ships a CLI and a schema payload, with
  no HTTP surface to exercise black-box.
- Browser E2E: Not Applicable because this repo has no UI and this change adds
  none.

This plan carries the `Falsified By` column the change introduces. A change that
adds a rule and exempts itself from it has not tested the rule.

# Status Vocabulary

- `planned`  - a row in this file only; no test file exists yet.
- `skeleton` - the test file exists and is declared with this repo's `todo()`,
  the harness's pending mechanism. It compiles and lints clean because it has no
  body.
- `failing`  - the test is executable and fails on its ASSERTION, not on a
  missing import or a type error.
- `passing`  - green.

# Contract Stubs

| Contract | File | Signature Or Shape | Notes |
| --- | --- | --- | --- |
| `hardensAtArchive` | `lib/check.mjs` | `function hardensAtArchive(report, archiveMode): (where, message) => void` - body `throw new Error('not implemented')` | The one escalation shape from design decision 1: warn in flight, error under `--archive` |
| `explainedStatus` | `lib/check.mjs` | `function explainedStatus(raw): {word, reason}` - body `throw new Error('not implemented')` | Splits `passing: <reason>` and `failing: <message>` the way the status loop already splits on `[\s:]` |
| `falsifierColumn` | `lib/check.mjs` | `function falsifierColumn(header): number \| null` - body `throw new Error('not implemented')` | Header-name lookup, like every other column resolver in this file |

# Pre-Implementation Unit Tests

| Test Case ID | Rule (BR-n) | Test File | Test Name | Initial Status | Falsified By | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| UT-201 | BR-11 | `test/run.mjs` | `UT-201 a bare green initial status is a warning` | failing: expected a WARNING matching `/green before its implementation\|passing/`, got no findings | Accepting the bare word `passing` in `Initial Status`, or emitting the finding only under `--archive` | |
| UT-202 | BR-11 | `test/run.mjs` | `UT-202 a green initial status with its reason is clean` | passing: asserts the absence of a finding that does not exist yet; it becomes a real constraint the moment UT-201 is made to pass | Reporting every `passing` initial status regardless of the reason after the colon | |
| UT-203 | BR-11 | `test/run.mjs` | `UT-203 a reason too short is not a reason` | failing: expected a WARNING matching `/green before its implementation\|passing/`, got no findings | Dropping the ten-character minimum, so any non-empty text after the colon passes | |
| UT-204 | BR-11 | `test/run.mjs` | `UT-204 a green live status is untouched` | passing: the fixture's E2E row already ends `passing`, and nothing reports it; guards the blast radius of UT-201 | Applying the BR-11 check to the `Status` column as well as `Initial Status` | |
| UT-205 | BR-12 | `test/run.mjs` | `UT-205 a unit row with no falsifier is a warning` | failing: expected a WARNING matching `/falsif/i`, got no findings | Removing the empty-cell branch, or only checking that the column exists | |
| UT-206 | BR-12 | `test/run.mjs` | `UT-206 a filled falsifier is clean whether or not it is apt` | passing: asserts an absence, and becomes a constraint once UT-205 passes | Adding any judgement of the cell's content — a keyword list, a length floor above zero | |
| UT-207 | BR-12 | `test/run.mjs` | `UT-207 a missing falsifier column is one finding for the table` | failing: 0 !== 1 | Moving the missing-column finding inside the row loop, so it fires once per row | |
| UT-208 | BR-12 | `test/run.mjs` | `UT-208 integration and e2e tables need no falsifier` | passing: asserts an absence, and becomes a constraint once UT-205 and UT-207 pass | Running the falsifier check on every table that has a status column | |
| UT-209 | BR-3 | `test/run.mjs` | `UT-209 a bare red state stays a warning in flight` | passing: the assertion-message warning already exists and is already not an error; this locks that half against task 4.1 | Raising the assertion-message finding to an error in non-archive runs | |
| UT-210 | BR-5 | `test/run.mjs` | `UT-210 the known gaps owner is found by header name` | failing: 1 !== 0 | Reverting either the id or the Owner lookup to a fixed index | First written so that the positional read happened to succeed; corrected before implementation started |
| UT-211 | BR-5 | `test/run.mjs` | `UT-211 a surviving skeleton with no owner is still an error` | passing: the error already fires; this is the behaviour the UT-210 fix must not lose | Treating the presence of a Known Gaps row as sufficient without reading the Owner cell | |
| NEG-201 | BR-11 | `test/run.mjs` | `NEG-201 a bare green initial status is an error at archive` | failing: expected an error matching `/green before its implementation\|passing/`, got no findings | Leaving the BR-11 finding at warning level under `--archive` | |
| NEG-202 | BR-12 | `test/run.mjs` | `NEG-202 an empty falsifier is an error at archive` | failing: expected an error matching `/falsif/i`, got no findings | Leaving the BR-12 finding at warning level under `--archive` | |
| NEG-203 | BR-3 | `test/run.mjs` | `NEG-203 a bare red state is an error at archive` | failing: got `[warn] "failing" records no assertion message`, expected an error | Leaving the assertion-message finding at warning level under `--archive` | |
| NEG-204 | BR-12 | `test/run.mjs` | `NEG-204 a blank row triggers neither new check` | passing: `isBlankRow` already skips the row; guards the placement of both new checks | Placing either new check before the `isBlankRow` guard | |

<!--
Eight rows started green, and each says why in the cell (BR-11). Seven of them
assert an absence that only becomes a constraint once the red rows go green, and
that is the honest reading: they are blast-radius guards, not evidence that the
rule was already enforced. UT-209 and UT-211 are different - they lock behaviour
that exists today and that tasks 4.1 and 4.4 could plausibly break.
-->

# Integration Tests

| Test Case ID | Test File | Test Name | Initial Status | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| IT-201 | `test/run.mjs` | `IT-201 the template names the inadmissible grounds` | skeleton | passing | Reads the shipped `templates/test-plan.md` |
| IT-202 | `test/run.mjs` | `IT-202 the template carries the falsifier column` | skeleton | passing | Reads the shipped `templates/test-plan.md` |
| IT-203 | `test/run.mjs` | `IT-203 the test-plan instruction asks for what the template shows` | skeleton | passing | Reads `schema.yaml` |
| IT-204 | `test/run.mjs` | `IT-204 mock call counts are named as a non-answer` | skeleton | passing | Reads `schema.yaml` |

# E2E Tests

<!-- Both E2E levels are declared Not Applicable under Test Strategy with a specific reason; no rows. -->

# Test Data And Fixtures

| Fixture Or Data | Used By | Setup Method | Cleanup Method |
| --- | --- | --- | --- |
| Temp repo scaffold | UT-201 – UT-211, NEG-201 – NEG-204 | `scaffold(root)` in `test/run.mjs`, into `mkdtempSync` | `rmSync` in the harness `finally` |
| A Pre-Implementation Unit Tests table written into the scaffolded plan | UT-201 – UT-209, NEG-201 – NEG-204 | a `setUnitTests(root, rows, { columns })` helper, alongside the existing `setTestChanges` | Removed with the temp repo |
| A Known Gaps table with reordered columns | UT-210, UT-211 | written directly into the scaffolded plan | Removed with the temp repo |
| The shipped schema payload | IT-201 – IT-204 | Read from `openspec/schemas/okf-gated-feature/` in the repo itself | None — read only |

Assertions run against `check()`'s real findings. No collaborator inside
`lib/check.mjs` is mocked: a test asserting that a helper was called has no
production change that would falsify it.

# Commands

## Unit

    npm test

## Integration

    npm test

## E2E

    # Not Applicable - see Test Strategy

## OpenSpec Validation

    openspec validate require-tests-that-can-fail --strict

## OKF Validation

    node bin/okf.mjs check
    node bin/okf.mjs check --archive require-tests-that-can-fail    # before archiving

# Test Change Rules

- Pre-written tests are not changed to match the implementation.
- A pre-written test may change only when the OKF entry or spec changed first, or
  the test has a mechanical bug (wrong fixture, typo, bad assertion syntax).
- When implementation reveals that a business rule must be different, stop:
  amend `.okf/features/test-first-gate.md` and the spec first, record it below,
  then change the test and the code. Never the other way round.
- These are not grounds: having run the behaviour manually, intending to fix the
  test afterwards, the time already spent on the implementation, or this case
  being different from the ones the rule was written for.

# Test Changes After Implementation Started

| Date | Test | Ground | Rule (BR-n) Or Spec Change |
| --- | --- | --- | --- |

# Known Gaps

| Test Case ID | Status Left At | Reason | Owner | Follow-Up |
| --- | --- | --- | --- | --- |
