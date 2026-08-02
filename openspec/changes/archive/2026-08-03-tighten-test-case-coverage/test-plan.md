# Test Strategy

- Unit: the shipped template and instruction text, plus the one new warning.
- Integration: this change's own artifacts, plus the prior suite.
- API E2E: Not Applicable because the kit exposes no network interface.
- Browser E2E: Not Applicable because the kit has no user interface - which is
  also why this change cannot dogfood BR-15, and says so.

# Contract Stubs

| Contract | File | Signature Or Shape | Notes |
| --- | --- | --- | --- |
| `checkBoundaryCoverage` | `lib/check.mjs` | `(changeDir, testCasesText, where, report) => void` | Empty body. A no-op makes UT-405 fail on its assertion - no warning reported - which is the real red state for a reporter |

# Pre-Implementation Unit Tests

| Test Case ID | Rule (BR-n) | Test File | Test Name | Initial Status | Falsified By | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| UT-401 | BR-13 | test/run.mjs | UT-401 the test-cases template seeds one row per boundary class | failing: without a column of its own a class is a comment again, and a comment is read once and scrolled past | Replacing the seeded rows with a prose comment | |
| UT-402 | BR-14 | test/run.mjs | UT-402 the test-cases instruction says discharge rather than delete | failing: the instruction never names the "Absence" class | Leaving the instruction silent on what to do with an untouched class | |
| UT-403 | BR-15 | test/run.mjs | UT-403 the browser section names four render states and the console question | failing: the browser section never names the loading state - three of the four are what an author never sees | Naming only the populated state | |
| UT-404 | BR-16 | test/run.mjs | UT-404 the test-plan and verification templates carry an Artifacts column | failing: the plan is where a test says what it will produce | Adding it to one template only | |
| UT-405 | BR-13 | test/run.mjs | UT-405 an empty boundary table warns while specs hold scenarios | failing: 0 !== 1 - an empty table records that nobody was asked to think of any boundary class | Never reporting, or reporting an error | Asserts level explicitly, since the whole decision here is that it is a warning |
| UT-406 | BR-13 | test/run.mjs | UT-406 a filled boundary table is silent | passing: the no-op stub reports nothing, so this guards against the warning firing on a filled table rather than proving it fires | Warning whenever the table exists, regardless of rows | |
| UT-407 | BR-16 | test/run.mjs | UT-407 no shipped template names a browser-automation tool | passing: no template names one yet, so this locks the property before the section that could break it lands | Shipping a tool name in the Artifacts guidance | The assertion that keeps BR-16 about the artefact rather than the tool |
| UT-408 | BR-15 | test/run.mjs | UT-408 a change with no interface discharges the class cleanly | passing: the no-op stub reports nothing, so this guards against the new check firing on a properly discharged change | Reporting whenever the browser table is empty, ignoring the Not Applicable row | |
| NEG-401 | BR-13 | test/run.mjs | NEG-401 a boundary table holding only a blank row counts as empty | failing: 0 !== 1 - the template ships a blank row, so counting it as a row makes the warning unreachable | Counting a blank row as a row | Mirrors NEG-002 in the promotion gate and NEG-104 in the static analysis gate |
| NEG-402 | BR-13 | test/run.mjs | NEG-402 two rows for one class are both accepted | passing: the no-op stub reports nothing, so this pins that the check counts rows and never classes | Counting distinct classes, which would require judging what a class is | |

# Integration Tests

| Test Case ID | Test File | Test Name | Initial Status | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| IT-401 | (command) `node bin/okf.mjs check --archive tighten-test-case-coverage` | this change's own artifacts | skeleton | passing | Promoted in the verification group once `verification.md` existed. Clean, with the UI class discharged by a stated reason rather than deleted |
| IT-402 | test/run.mjs | the full prior suite | passing | passing | Already green; the assertion is that it stays green |

# E2E Tests

Not Applicable because the kit has neither a network interface nor a UI.

# Test Data And Fixtures

| Fixture Or Data | Used By | Setup Method | Cleanup Method |
| --- | --- | --- | --- |
| `setBoundaryTable(root, rows)` | UT-405, UT-406, NEG-401, NEG-402 | New helper rewriting the fixture's Negative And Boundary Cases section, asserting its replace matched something | none - temp dir per test |
| A fixture `test-cases.md` | UT-405, UT-406, UT-408 | The scaffold gains one, since no fixture carries this artifact today | none |
| Shipped templates under `KIT` | UT-401..UT-404, UT-407 | Read from the repository directly | none |

# Commands

## Unit

    npm test

## Integration

    node bin/okf.mjs check --archive tighten-test-case-coverage

## Lint

    npm run lint

## Typecheck

    Not Applicable because this kit is plain ESM with JSDoc and has adopted no type checker - see the declaration in AGENTS.md

## OpenSpec Validation

    openspec validate tighten-test-case-coverage --strict

## OKF Validation

    okf check
    okf check --archive tighten-test-case-coverage    # before archiving

# Test Change Rules

- Pre-written tests are not changed to match the implementation.
- A pre-written test may change only when the OKF entry or spec changed first, or
  the test has a mechanical bug (wrong fixture, typo, bad assertion syntax).
- When implementation reveals that a business rule must be different, stop:
  amend `.okf/features/test-first-gate.md` and the spec first, record it below,
  then change the test and the code. Never the other way round.
- These are not grounds, and naming them here is the point:
  - having run the behaviour manually and seen it work
  - intending to fix the test afterwards
  - the time already spent on the implementation
  - this case being different from the ones the rule was written for
  - the test being "too strict" about something the code does differently

# Test Changes After Implementation Started

| Date | Test | Ground | Rule (BR-n) Or Spec Change |
| --- | --- | --- | --- |

# Known Gaps

| Test Case ID | Status Left At | Reason | Owner | Follow-Up |
| --- | --- | --- | --- | --- |
