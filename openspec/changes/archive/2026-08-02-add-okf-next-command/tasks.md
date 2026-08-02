## 1. Contract Stubs

- [x] 1.1 Extract `readChangeState(root, changeId)` from `checkChange` in `lib/check.mjs`, with `checkChange` calling it - the existing suite is the regression test for this step alone
- [x] 1.2 Declare `next(root, changeId)` in a new `lib/next.mjs`, returning `{ answered: true, owed: [] }` and nothing else
- [x] 1.3 Add `case 'next'` to `bin/okf.mjs`, printing what `next` returned, plus help text

## 2. Pre-Implementation Unit Tests

- [x] 2.1 Add the `treeSnapshot` helper to `test/run.mjs`
- [x] 2.2 Write UT-301, UT-302, UT-303, UT-310, NEG-301, NEG-304 - the owed-step derivation
- [x] 2.3 Write UT-304, UT-307 - the shape of the answer
- [x] 2.4 Write UT-305, UT-306 - the boundary with `openspec status`
- [x] 2.5 Write UT-308, UT-309, NEG-302, NEG-303, NEG-305 - read-only, exit status, argument handling
- [x] 2.6 Write UT-311 - advisor and gate agree
- [x] 2.7 Run `npm test` and record each actual assertion failure in the test-plan's Initial Status

## 3. Integration And E2E Skeletons

- [x] 3.1 Record IT-301 in test-plan Known Gaps with an owner, and IT-302 as `passing`

## 4. Implementation

- [x] 4.1 Implement the owed-step derivation in `lib/next.mjs` from `readChangeState`
- [x] 4.2 Give every owed step its command string
- [x] 4.3 Implement the no-okf-link branch, naming `openspec status` and stopping
- [x] 4.4 Implement the nothing-owed statement, naming `okf check --archive`
- [x] 4.5 Implement argument handling: unknown id, archived id, and no argument
- [x] 4.6 Run `npm test` until every test from group 2 is green, with no test edited to get there

## 5. Integration Tests

- [x] 5.1 Run `npm test` in full and confirm IT-302 - the `readChangeState` extraction regressed nothing

## 6. E2E Tests

<!-- Dropped: the kit has neither a network interface nor a UI. Stated in test-plan.md. -->

## 7. Verification And OKF Pass

- [x] 7.1 Run the full suite, `npm run lint`, and `openspec validate`; record real results in verification.md
- [x] 7.2 Fill the Static Analysis table in verification.md
- [x] 7.3 For BR-1..BR-6, find the evidence in `lib/next.mjs` and `bin/okf.mjs` and fill the Rule Evidence table with real `file:line` references
- [x] 7.4 Promote IT-301 to `passing` and delete its Known Gaps row
- [x] 7.5 Set `verification_state`, `verified`, `verified_at` and `code_paths` on `okf-next`, and clear `pending_changes`
- [x] 7.6 Promote any durable decision from design.md to `.okf/decisions/`, or record why not
- [x] 7.7 Run `okf index`, then `openspec validate okf-next --strict` against the synced baseline spec

## 8. Archive Readiness

- [x] 8.1 Run `okf check --archive add-okf-next-command` and fix everything it reports
- [x] 8.2 Complete the Archive Readiness checklist in verification.md
