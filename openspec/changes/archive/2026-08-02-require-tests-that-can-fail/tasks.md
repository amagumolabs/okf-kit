## 1. Contract Stubs

- [x] 1.1 Declare `hardensAtArchive(report, archiveMode)` in `lib/check.mjs`, body `throw new Error('not implemented')`
- [x] 1.2 Declare `explainedStatus(raw)` in `lib/check.mjs`, body `throw new Error('not implemented')`
- [x] 1.3 Declare `falsifierColumn(header)` in `lib/check.mjs`, body `throw new Error('not implemented')`
- [x] 1.4 Export whatever `test/run.mjs` needs to drive these — nothing: the fixture tests drive `check()` end to end, which is what makes them tests of the rule rather than of the helper

## 2. Pre-Implementation Unit Tests

- [x] 2.1 Add a `setUnitTests(root, rows, { columns })` fixture helper in `test/run.mjs`, alongside the existing `setTestChanges`
- [x] 2.2 Write UT-201 – UT-204 for BR-11 in `test/run.mjs`
- [x] 2.3 Write UT-205 – UT-208 and NEG-204 for BR-12 in `test/run.mjs`
- [x] 2.4 Write UT-209 for BR-3 in `test/run.mjs`
- [x] 2.5 Write UT-210 and UT-211 for BR-5 in `test/run.mjs`, with a Known Gaps table whose columns are reordered
- [x] 2.6 Write NEG-201 – NEG-203 for the `--archive` escalation of all three findings
- [x] 2.7 Run `npm test` and record each actual assertion failure in the test-plan `Initial Status` column, replacing `planned`

## 3. Integration And E2E Skeletons

- [x] 3.1 Add IT-201 – IT-204 in `test/run.mjs` declared with the harness's `todo()`, asserting nothing yet
- [x] 3.2 Set each of those rows to `Initial Status: skeleton` in test-plan.md

## 4. Implementation

- [x] 4.1 Implement `hardensAtArchive` — warn when `archiveMode` is false, error when true — and route the existing assertion-message finding through it (BR-3)
- [x] 4.2 Implement `explainedStatus` and reject a bare `passing` in the `Initial Status` column, with the same ten-character minimum `testChangeGround` applies to a declared defect (BR-11)
- [x] 4.3 Implement `falsifierColumn` and check the Pre-Implementation Unit Tests table only: one finding for a missing column, one per row for an empty cell, both after the `isBlankRow` guard (BR-12)
- [x] 4.4 Replace the positional Known Gaps owner read at `lib/check.mjs:1014` with a header-name lookup through `columnIndex` (BR-5)
- [x] 4.5 Add the `Falsified By` column to the Pre-Implementation Unit Tests table in `templates/test-plan.md`, with a worked example naming a production change
- [x] 4.6 Add the inadmissible grounds to the Test Change Rules section of `templates/test-plan.md` (BR-8)
- [x] 4.7 Extend the `test-plan` instruction in `schema.yaml` to ask for the falsifier and for the reason behind a green initial status (BR-7, BR-11, BR-12)
- [x] 4.8 Extend the `test-cases` instruction in `schema.yaml`: assertions run on real behaviour, because a mock call count has no production falsifier (BR-12)
- [x] 4.9 Update `docs/openspec-okf-workflow.md` so the gate's stated guarantee covers capability to fail, not only ordering

## 5. Integration Tests

- [x] 5.1 Promote IT-201 – IT-204 to executable and make them pass against the shipped payload

## 6. E2E Tests

<!-- Dropped: both E2E levels are Not Applicable, with the reason stated under Test Strategy in test-plan.md. -->

## 7. Verification And OKF Pass

- [x] 7.1 Run `npm test` and `openspec validate require-tests-that-can-fail --strict`, record results in verification.md
- [x] 7.2 For BR-3, BR-5, BR-8, BR-11 and BR-12, find the evidence in the code (`file:line` or protecting test) and fill the Rule Evidence table
- [x] 7.3 Apply the verdicts: update the entry where it was stale, fix the code where the rule was right, ask a human on a conflict
- [x] 7.4 Set `verified` and `verified_at` on `.okf/features/test-first-gate.md`, refresh `code_paths`, remove this change id from `pending_changes`
- [x] 7.5 Promote the two decisions flagged in design.md — the archive-boundary escalation and where the falsifier lives — into `.okf/decisions/`, or record why not
- [x] 7.6 Run `node bin/okf.mjs index` to regenerate `.okf/index.md` and `.okf/log.md`

## 8. Archive Readiness

- [x] 8.1 Run `node bin/okf.mjs check --archive require-tests-that-can-fail` and fix everything it reports, including whatever the new checks say about this change's own test-plan
- [x] 8.2 Complete the Archive Readiness checklist in verification.md
