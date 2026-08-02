# Test Plan

<!--
Create this after test-cases.md and before implementation. It maps behavior test
cases to concrete test files, names, fixtures, and commands.

This file is a mandatory gate - it must exist before implementation starts,
however small the change. If the change is genuinely not testable (a pure
documentation or config rename with no observable behavior), write
"Not Applicable because <specific reason>" under Test Strategy instead of
leaving sections empty or skipping the file.

Delete any section that has no real content. Do not leave empty table rows.
-->

# Test Strategy

<!-- What is covered at each level, and any deliberate gap. If not applicable, state why here. -->

- Unit:
- Integration:
- API E2E:
- Browser E2E:

# Status Vocabulary

<!--
Exactly four values, in this order. Do not invent others.

- `planned`  - a row in this file only; no test file exists yet.
- `skeleton` - the test file exists and is declared with the runner's own pending
               mechanism (`it.todo`, `test.todo`, `test.fixme`). It compiles and
               lints clean because it has no body. Use this when the
               infrastructure the test needs is not ready yet - it is the answer
               to "writing E2E tests first makes the linter scream".
- `failing`  - the test is executable and fails on its ASSERTION, not on a
               missing import or a type error. This is the real red state.
- `passing`  - green.
-->

# Contract Stubs

<!--
How a unit test reaches `failing` instead of "does not compile": declare the
contract first - types, function or method signatures, a route that returns 501 -
with bodies that only `throw new Error('not implemented')`.

A stub MUST NOT contain logic. If behavior leaks into a stub, test-first has
already been lost at the first step.

Omit this section for changes with no new code surface.
-->

| Contract | File | Signature Or Shape | Notes |
| --- | --- | --- | --- |

# Pre-Implementation Unit Tests

<!--
Unit tests for business rules. Each must reach `failing` before its
implementation task starts, and Initial Status must record the actual assertion
failure (e.g. `failing: expected 403, got 200`), not the bare word "failing".

Quote the OKF rule id so the trail BR-n -> spec -> test -> code stays intact.
-->

| Test Case ID | Rule (BR-n) | Test File | Test Name | Initial Status | Notes |
| --- | --- | --- | --- | --- | --- |

# Integration Tests

<!--
The file is authored before implementation and starts as `skeleton` when the
fixtures or infrastructure are not ready yet. Record that starting point in
Initial Status and leave it alone afterwards: Status moves, Initial Status is
history. A table where both columns end up `passing` is what a change that wrote
its tests last produces too.
-->

| Test Case ID | Test File | Test Name | Initial Status | Status | Notes |
| --- | --- | --- | --- | --- | --- |

# E2E Tests

<!-- Same two columns, same reason. Designed before implementation, `skeleton` until the API/UI flow is stable enough to run. -->

| Test Case ID | Test File | Test Name | Initial Status | Status | Notes |
| --- | --- | --- | --- | --- | --- |

# Test Data And Fixtures

<!-- Seed data, factories, mocks, sandbox accounts, auth tokens, database state, queues, service stubs. -->

| Fixture Or Data | Used By | Setup Method | Cleanup Method |
| --- | --- | --- | --- |

# Commands

<!-- Real repo commands, copy-pasteable, no prose. -->

## Unit

    <unit-test-command>

## Integration

    <integration-test-command>

## E2E

    <e2e-test-command>

## OpenSpec Validation

    openspec validate <change-id> --strict

## OKF Validation

    okf check
    okf check --archive <change-id>    # before archiving

# Test Change Rules

- Pre-written tests are not changed to match the implementation.
- A pre-written test may change only when the OKF entry or spec changed first, or
  the test has a mechanical bug (wrong fixture, typo, bad assertion syntax).
- When implementation reveals that a business rule must be different, stop:
  amend `.okf/features/<capability>.md` and the spec first, record it below, then
  change the test and the code. Never the other way round.

# Test Changes After Implementation Started

<!--
Every row answers with exactly one of two things, and this table is checked:

- a citation that resolves - the `BR-n` or the `openspec/specs/` path that changed
  FIRST, before the test did
- a mechanical defect, declared as `mechanical defect: <what was wrong>` in
  Ground. Naming the defect is the point; the bare phrase is not a reason

A row that answers with neither is an error. So is a row that does not say which
test it concerns.

Leave the table empty if no pre-written test changed - that is the normal case,
and an empty table is clean.
-->

| Date | Test | Ground | Rule (BR-n) Or Spec Change |
| --- | --- | --- | --- |

# Known Gaps

<!--
Every row still at `skeleton` or `planned` when archive readiness is assessed
MUST appear here with a reason and an owner. A `skeleton` that quietly survives
into the archive is an untested requirement wearing a test's name.
-->

| Test Case ID | Status Left At | Reason | Owner | Follow-Up |
| --- | --- | --- | --- | --- |
