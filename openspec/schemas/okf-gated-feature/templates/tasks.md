<!--
Group order is the workflow: contracts, red tests, remaining test files as
skeletons, then code. Rename, split or drop groups to fit the change; do not
reorder them. No test file may first appear after group 3.

Every task is a checkbox `- [ ] X.Y <description>`.
-->

## 1. Contract Stubs

- [ ] 1.1 <!-- Declare <contract> in <file>, body only `throw new Error('not implemented')` -->

## 2. Pre-Implementation Unit Tests

- [ ] 2.1 <!-- Write <test name> for BR-n in <test file> -->
- [ ] 2.2 Run the unit tests and record each assertion failure in test-plan.md Initial Status

## 3. Integration And E2E Skeletons

- [ ] 3.1 <!-- Add <skeleton test> in <test file>, declared pending -->

## 4. Implementation

<!-- The code adapts to the tests. If the RULE is wrong, repair upstream first: OKF entry, spec, Test Changes row, test, code. -->

- [ ] 4.1 <!-- Implement <behavior> -->

## 5. Integration Tests

- [ ] 5.1 <!-- Promote <skeleton test> to executable and make it pass -->

## 6. E2E Tests

- [ ] 6.1 <!-- Promote <skeleton scenario>, or record it in Known Gaps with an owner -->

## 7. Verification And OKF Pass

- [ ] 7.1 Run the tests, lint and openspec validate; record the results in verification.md
- [ ] 7.2 Fill Rule Evidence with a `file:line` or test name and a verdict for every BR-n touched
- [ ] 7.3 Act on verdicts: update stale entries (`okf-gap`), fix the code (`code-gap`), ask on `conflict`
- [ ] 7.4 For each linked entry: set `verification_state` and `verified_at`, fill `code_paths`, remove this change from `pending_changes`, add a Verification History row
- [ ] 7.5 Promote durable decisions from design.md to `.okf/decisions/`, update `.okf/index.md`, run the AGENTS.md self-check
