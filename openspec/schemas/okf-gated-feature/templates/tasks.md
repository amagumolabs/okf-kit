<!--
Group order below is the workflow, not a suggestion: contracts, then red tests,
then code. Rename and split groups to fit the change, but do not reorder them,
and do not merge test groups into implementation groups.

Every task must be a checkbox `- [ ] X.Y <description>` - apply parses this
format to track progress. Drop a group entirely if it does not apply to this
change (say why in test-plan.md rather than leaving an empty group).
-->

## 1. Contract Stubs

<!-- Types, signatures, routes returning 501. Bodies only `throw new Error('not implemented')` - no logic, or test-first is already lost. -->

- [ ] 1.1 <!-- Declare <contract> in <file> -->

## 2. Pre-Implementation Unit Tests

<!-- Write the unit tests for the business rules and run them. Each must fail on its ASSERTION, and the actual failure message goes into test-plan.md. -->

- [ ] 2.1 <!-- Write <test name> for BR-n in <test file> -->
- [ ] 2.2 <!-- Run unit tests and record the assertion failures in test-plan.md Initial Status -->

## 3. Implementation

<!-- Replace stubs with real behavior until the tests from group 2 go green. -->

- [ ] 3.1 <!-- Implement <behavior> -->

## 4. Integration Tests

- [ ] 4.1 <!-- Promote <skeleton test> to executable and make it pass -->

## 5. E2E Tests

- [ ] 5.1 <!-- Promote <skeleton scenario> to executable, or record it in test-plan.md Known Gaps with an owner -->

## 6. Verification And OKF Pass

- [ ] 6.1 Run the full test suite and openspec validate, record results in verification.md
- [ ] 6.2 For every BR-n touched, find its evidence in the code (`file:line` or protecting test) and fill the Rule Evidence table
- [ ] 6.3 Apply the verdicts: update the `.okf` entry where it was stale (`okf-gap`), fix the code where the rule was right (`code-gap`), ask a human on `conflict`
- [ ] 6.4 For each linked entry: set `verified` and `verified_at`, fill `code_paths`, remove this change id from `pending_changes`
- [ ] 6.5 Promote any durable decision from design.md to `.okf/decisions/`, or record why not
- [ ] 6.6 Run `okf index` to regenerate `.okf/INDEX.md`, and fill the Needs Revision Ledger note if any entry ended at `needs-revision`

## 7. Archive Readiness

- [ ] 7.1 Run `okf check --archive <change-id>` and fix everything it reports
- [ ] 7.2 Complete the Archive Readiness checklist in verification.md
