# Test Plan

<!--
Create this file after test-cases.md and before implementation.
This plan maps behavior test cases to concrete test files, test names, fixtures, and commands.
-->

# Test Strategy

<!-- Summarize what will be covered at unit, integration, and E2E levels. Explain any deliberate gaps. -->

- Unit:
- Integration:
- API E2E:
- Browser E2E:

# Pre-Implementation Unit Tests

<!-- These tests should be written before feature implementation. They should fail or be pending for the right reason before code is added. -->

| Test Case ID | Test File | Test Name | Initial Status | Notes |
| --- | --- | --- | --- | --- |
|  |  |  | planned |  |

# Integration Tests

<!-- These may be written before or during implementation depending on available boundaries, fixtures, and test infrastructure. -->

| Test Case ID | Test File | Test Name | Status | Notes |
| --- | --- | --- | --- | --- |
|  |  |  | planned |  |

# E2E Tests

<!-- E2E scenarios are designed before implementation and made executable when the API/UI flow is stable enough. -->

| Test Case ID | Test File | Test Name | Status | Notes |
| --- | --- | --- | --- | --- |
|  |  |  | planned |  |

# Test Data And Fixtures

<!-- Identify seed data, factories, mocks, sandbox accounts, auth tokens, database state, queues, or external service stubs. -->

| Fixture Or Data | Used By | Setup Method | Cleanup Method |
| --- | --- | --- | --- |
|  |  |  |  |

# Commands

<!-- Replace placeholders with real repo commands. Keep commands copy-pasteable and prose-free. -->

## Unit

    <unit-test-command>

## Integration

    <integration-test-command>

## E2E

    <e2e-test-command>

## OpenSpec Validation

    openspec validate <change-id> --strict

# Test Change Rules

- Pre-written tests must not be changed to match implementation.
- A pre-written test may change only when it contradicts OKF/OpenSpec, the requirement changes and OpenSpec is updated first, or the test has a mechanical bug.
- If a test is changed after implementation starts, record the reason in this file.

# Test Changes After Implementation Started

| Date | Test | Reason | Linked Spec Or OKF Change |
| --- | --- | --- | --- |
|  |  |  |  |

# Known Gaps

<!-- Record accepted gaps, skipped tests, unavailable environments, or follow-up work. -->

- 
