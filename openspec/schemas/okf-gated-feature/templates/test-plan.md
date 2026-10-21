# Test Plan

<!--
Written after test-cases.md and before implementation - it is a hard gate. If the
change is genuinely not testable, write "Not Applicable because <specific
reason>" under Test Strategy and delete the rest.

Status values: `planned` (row only), `skeleton` (file exists, declared pending),
`failing` (fails on its assertion), `passing`.

Initial Status is where a row stood when implementation started; Status is where
it stands now. Move Status, never rewrite Initial Status.

Delete any section with no real content. Do not leave empty table rows.
-->

# Test Strategy

- Unit:
- Integration:
- E2E:

# Contract Stubs

<!-- Types, signatures, routes returning 501. Bodies only `throw new Error('not implemented')` - no logic. Omit if there is no new code surface. -->

| Contract | File | Signature Or Shape |
| --- | --- | --- |

# Unit Tests

<!-- Business-rule tests reach `failing` before implementation. Record the actual failure, e.g. `failing: expected 403, got 200`. -->

| Test Case ID | Rule (BR-n) | Test File | Test Name | Initial Status | Status |
| --- | --- | --- | --- | --- | --- |

# Integration And E2E Tests

<!-- Written before implementation; may start as `skeleton` while the harness is not ready. -->

| Test Case ID | Test File | Test Name | Initial Status | Status |
| --- | --- | --- | --- | --- |

# Commands

<!-- From the Project commands section of AGENTS.md. -->

    <test-command>
    <lint-command>
    openspec validate <change-id>

# Test Changes

<!--
A pre-written test changes only when the OKF entry or spec changed first (cite
the BR-n or spec), or when it has a mechanical defect (name it). Leave empty if
no pre-written test changed.
-->

| Date | Test | Reason | BR-n, Spec, Or Defect |
| --- | --- | --- | --- |

# Known Gaps

<!-- Every row still `skeleton` or `planned` at archive, with an owner. -->

| Test Case ID | Status Left At | Reason | Owner |
| --- | --- | --- | --- |
