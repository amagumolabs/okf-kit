<!--
This change's own groups follow the order it introduces: contracts, red unit
tests, integration/E2E skeletons, then code. The E2E group is dropped whole -
test-plan.md states why under Test Strategy.
-->

## 1. Contract Stubs

- [x] 1.1 Add `liveStatusColumn(headerCells)` in `lib/check.mjs` with a body that only `throw new Error('not implemented')` (design D2)
- [x] 1.2 Add a `todo(name)` helper to `test/run.mjs` that registers a bodyless pending test and reports it in the run summary - this is the pending mechanism the skeleton rows below depend on

## 2. Pre-Implementation Unit Tests

- [x] 2.1 Write UT-001, UT-002 and NEG-001 (status vocabulary reaches both columns, and neither column excuses the other) in `test/run.mjs`
- [x] 2.2 Write UT-003, UT-004 and UT-005 (promoted skeleton needs no Known Gaps row; surviving skeleton still does; a table with only `Initial Status` reads it as live) in `test/run.mjs`
- [x] 2.3 Write UT-006, UT-007 and NEG-002 (empty `Initial Status` warns and does not error; a waived level stays silent; status-free and blank rows stay silent) in `test/run.mjs`
- [x] 2.4 Run `npm test` and record each actual assertion failure message in test-plan.md Initial Status - must be `failing`, not a crash on the throwing stub

## 3. Integration And E2E Skeletons

- [x] 3.1 Add IT-001 - IT-004 as `todo()` skeletons in `test/run.mjs`, named as in test-plan.md, asserting nothing yet
- [x] 3.2 Add IT-005 as a `todo()` skeleton in `test/run.mjs`
- [x] 3.3 Update test-plan.md Integration Tests rows to `skeleton`, and confirm `npm test` still exits 0 with the pending tests reported

## 4. Implementation

- [x] 4.1 Implement `liveStatusColumn`: prefer a column headed `Status`, fall back to `Initial Status` only when the table has no `Status` column (design D2)
- [x] 4.2 Rewrite the pending-row collection in `checkTestPlan` to read only the live status column, leaving vocabulary validation on every status column (BR-1, BR-5)
- [x] 4.3 Warn when a row in a status-bearing table has a non-empty live status and an empty `Initial Status`, skipping blank and separator rows and tables with no status column (BR-6)
- [x] 4.4 Honour the existing Test Strategy waiver so a level declared not applicable emits no missing-status warning (BR-6)
- [x] 4.5 Add the `Initial Status` column to the Integration Tests and E2E Tests tables in `templates/test-plan.md`, and require it in the `test-plan` artifact instruction in `schema.yaml` (BR-6)
- [x] 4.6 Add the integration and E2E skeleton group to `templates/tasks.md` before the implementation group, and renumber every group after it (BR-4, design D1)
- [x] 4.7 Update the group order sentence in the `tasks` artifact instruction in `schema.yaml` to match the new template, and state that implementation must never be the step that first creates a test file (BR-4, BR-7)
- [x] 4.8 Make UT-001 - UT-007, NEG-001 and NEG-002 pass without weakening any assertion
- [x] 4.9 Update `docs/openspec-okf-workflow.md` §7 with the ordering and the two-column test-plan form

## 5. Integration Tests

- [x] 5.1 Promote IT-001 - IT-004 from skeleton to executable against the shipped payload and make them pass
- [x] 5.2 Promote IT-005 to executable - a fixture change filled from the new template must produce no error and no warning in both normal and archive mode - and make it pass
- [x] 5.3 Update test-plan.md statuses to `passing`, leaving each row's `Initial Status` untouched

## 6. Verification And OKF Pass

- [x] 6.1 Create `verification.md` from the schema template; run `npm test`, `node bin/okf.mjs check`, and `openspec validate skeleton-tests-before-implementation --strict`; record the real results
- [x] 6.2 Fill Rule Evidence with a real `file:line` or test name for BR-1, BR-4, BR-5, BR-6 and BR-7 of `test-first-gate`
- [x] 6.3 Apply the verdicts: `okf-gap` updates the entry, `code-gap` is fixed in code, `conflict` goes to a human
- [x] 6.4 On `.okf/features/test-first-gate.md`: set `verification_state` and `verified_at`, fill `code_paths`, remove this change id from `pending_changes`, append a Verification History row, and write the `verified[]` attestation
- [x] 6.5 Promote D1, D2 and D4 to `.okf/decisions/`; record D3 as change-local, citing the standing decision it applies
- [x] 6.6 Sync `specs/test-first-gate/spec.md` into `openspec/specs/test-first-gate/` and run `openspec validate test-first-gate --strict`
- [x] 6.7 Run `node bin/okf.mjs index` and `node bin/okf.mjs check`

## 7. Archive Readiness

- [x] 7.1 Run `node bin/okf.mjs check --archive skeleton-tests-before-implementation` and fix everything it reports
- [x] 7.2 Complete the Archive Readiness checklist in verification.md
