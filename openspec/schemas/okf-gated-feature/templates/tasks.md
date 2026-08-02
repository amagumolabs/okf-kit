<!--
Group order below is the workflow, not a suggestion: contracts, then red tests,
then every remaining test file as a skeleton, then code. Rename and split groups
to fit the change, but do not reorder them, and do not merge test groups into
implementation groups.

Nothing after group 3 may be the first place a test file comes into existence.
Groups 5 and 6 promote skeletons that group 3 wrote.

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

## 3. Integration And E2E Skeletons

<!--
Write the files, not just the rows. Each is declared with the runner's own
pending mechanism (`it.todo`, `test.todo`, `test.fixme`) so it compiles and lints
clean with no body, and each gets `skeleton` as its Initial Status in
test-plan.md. A level whose harness does not exist yet is still written now and
promoted later - what must not happen is the file appearing for the first time
after the code it covers.

Drop this group only if the change has no integration or E2E coverage at all,
and say so in test-plan.md.
-->

- [ ] 3.1 <!-- Add <skeleton test> in <test file>, declared pending, asserting nothing yet -->
- [ ] 3.2 <!-- Record each new skeleton in test-plan.md with Initial Status `skeleton` -->

## 4. Implementation

<!--
Replace stubs with real behavior until the tests from group 2 go green.

The code adapts to the tests, never the other way round. When the implementation
and a pre-written test disagree, the default is that the code is wrong - that
disagreement is the only thing the test was ever going to produce, and editing
the test to end it throws the finding away.

If the RULE turns out to be wrong rather than the code, stop and repair upstream
first: the OKF entry, then the spec that cites it, then the row in test-plan.md
recording the change, then the test, then the code. A test may otherwise change
only for a mechanical defect - wrong fixture, typo, bad assertion syntax - which
leaves what it asserts untouched. Either way the change goes in the test-plan
table, which is checked.
-->

- [ ] 4.1 <!-- Implement <behavior> -->

## 5. Integration Tests

- [ ] 5.1 <!-- Promote <skeleton test> from group 3 to executable and make it pass -->

## 6. E2E Tests

- [ ] 6.1 <!-- Promote <skeleton scenario> from group 3 to executable, or record it in test-plan.md Known Gaps with an owner -->

## 7. Verification And OKF Pass

- [ ] 7.1 Run the full test suite and openspec validate, record results in verification.md
- [ ] 7.2 For every BR-n touched, find its evidence in the code (`file:line` or protecting test) and fill the Rule Evidence table
- [ ] 7.3 Apply the verdicts: update the `.okf` entry where it was stale (`okf-gap`), fix the code where the rule was right (`code-gap`), ask a human on `conflict`
- [ ] 7.4 For each linked entry: set `verified` and `verified_at`, fill `code_paths`, remove this change id from `pending_changes`
- [ ] 7.5 Promote any durable decision from design.md to `.okf/decisions/`, or record why not
- [ ] 7.6 Run `okf index` to regenerate `.okf/index.md`, and fill the Needs Revision Ledger note if any entry ended at `needs-revision`

## 8. Archive Readiness

- [ ] 8.1 Run `okf check --archive <change-id>` and fix everything it reports
- [ ] 8.2 Complete the Archive Readiness checklist in verification.md
