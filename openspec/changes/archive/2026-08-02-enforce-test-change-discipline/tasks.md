<!--
Groups follow the schema's order. The E2E group is dropped whole - test-plan.md
states why under Test Strategy.
-->

## 1. Contract Stubs

- [x] 1.1 Add `testChangeGround(cells, header)` in `lib/check.mjs` with a body that only `throw new Error('not implemented')` (design D1)

## 2. Pre-Implementation Unit Tests

- [x] 2.1 Add a `setTestChanges(root, rows)` helper to `test/run.mjs` that writes rows into the scaffolded plan's Test Changes table
- [x] 2.2 Write UT-101, UT-102 and UT-103 (a row naming no test; a citation to a rule no linked entry carries; a citation to a spec path that does not resolve) in `test/run.mjs`
- [x] 2.3 Write UT-104, UT-105 and NEG-101 (a declared mechanical defect is complete; a row standing on nothing is an error; a defect declared without naming one is an error) in `test/run.mjs`
- [x] 2.4 Write UT-106 and NEG-102 (an empty table is clean; a resolving citation needs no declared ground) in `test/run.mjs`
- [x] 2.5 Run `npm test` and record each actual assertion failure message in test-plan.md Initial Status - must be `failing`, not a crash on the throwing stub

## 3. Integration And E2E Skeletons

- [x] 3.1 Add IT-101 - IT-103 as `todo()` skeletons in `test/run.mjs`, named as in test-plan.md, asserting nothing yet
- [x] 3.2 Update test-plan.md Integration Tests rows to `skeleton` and confirm `npm test` still exits 0 with the pending tests reported

## 4. Implementation

- [x] 4.1 Implement `testChangeGround`: a resolving citation (`BR-n` carried by a linked entry, or an existing path under `openspec/specs/`), or a mechanical defect declared with a specific reason (BR-8, BR-9, design D1)
- [x] 4.2 Check the Test Changes table in `checkTestPlan`: error on a row with no test named, on a citation that does not resolve, and on a row that states no ground; report nothing for an empty table (BR-9)
- [x] 4.3 Rename the Test Changes `Reason` column to `Ground` in `templates/test-plan.md` and describe the two admissible answers there (BR-9)
- [x] 4.4 State in the implementation group of `templates/tasks.md` that the code adapts to the tests, and what to do instead when the rule is what is wrong (BR-8)
- [x] 4.5 State the order of repair - entry, spec, record, test, code - in the `tasks` artifact instruction in `schema.yaml` (BR-10)
- [x] 4.6 Make UT-101 - UT-106, NEG-101 and NEG-102 pass without weakening any assertion
- [x] 4.7 Update `docs/openspec-okf-workflow.md` §7 with the direction of adaptation and the checked record

## 5. Integration Tests

- [x] 5.1 Promote IT-101 - IT-103 from skeleton to executable against the shipped payload and make them pass
- [x] 5.2 Update test-plan.md statuses to `passing`, leaving each row's `Initial Status` untouched

## 6. Verification And OKF Pass

- [x] 6.1 Create `verification.md` from the schema template; run `npm test`, `node bin/okf.mjs check`, and `openspec validate enforce-test-change-discipline --strict`; record the real results
- [x] 6.2 Fill Rule Evidence with a real `file:line` or test name for BR-8, BR-9 and BR-10 of `test-first-gate`
- [x] 6.3 Apply the verdicts: `okf-gap` updates the entry, `code-gap` is fixed in code, `conflict` goes to a human
- [x] 6.4 On `.okf/features/test-first-gate.md`: refresh `verified_at` and `code_paths`, remove this change id from `pending_changes`, append a Verification History row, and replace the `verified[]` attestation so it covers BR-8 - BR-10
- [x] 6.5 Promote D1 and D3 to `.okf/decisions/`; record D2 as change-local, citing the standing decision whose scope it reads
- [x] 6.6 Sync `specs/test-first-gate/spec.md` into `openspec/specs/test-first-gate/` and run `openspec validate test-first-gate --strict`
- [x] 6.7 Run `node bin/okf.mjs index` and `node bin/okf.mjs check`

## 7. Archive Readiness

- [x] 7.1 Run `node bin/okf.mjs check --archive enforce-test-change-discipline` and fix everything it reports
- [x] 7.2 Complete the Archive Readiness checklist in verification.md
