## 1. Contract Stubs

- [x] 1.1 Declare `checkBoundaryCoverage(changeDir, testCasesText, where, report)` in `lib/check.mjs` with an empty body
- [x] 1.2 Call it from the change walk where `test-cases.md` is already read

## 2. Pre-Implementation Unit Tests

- [x] 2.1 Add a `test-cases.md` to the scaffold fixture and the `setBoundaryTable` helper
- [x] 2.2 Write UT-405, UT-406, UT-408, NEG-401, NEG-402 - the warning and its silence
- [x] 2.3 Write UT-401, UT-402, UT-403, UT-404, UT-407 - the shipped template and instruction text
- [x] 2.4 Run `npm test` and record each actual assertion failure in the test-plan's Initial Status

## 3. Integration And E2E Skeletons

- [x] 3.1 Record IT-401 in test-plan Known Gaps with an owner, and IT-402 as `passing`

## 4. Implementation

- [x] 4.1 Add the Class column and one seeded row per class to `templates/test-cases.md`
- [x] 4.2 Name the four render states and the console-error question in that template's Browser E2E section
- [x] 4.3 Add the Artifacts column to the browser rows of `templates/test-plan.md` and `templates/verification.md`
- [x] 4.4 Extend `test-cases.instruction` in `schema.yaml`: name the classes, and state that an untouched one is discharged with a reason
- [x] 4.5 Implement `checkBoundaryCoverage` as a warning on an empty table while specs hold scenarios - never an error
- [x] 4.6 Bump `version` in `schema.yaml`
- [x] 4.7 Run `npm test` until every test from group 2 is green, with no test edited to get there

## 5. Integration Tests

- [x] 5.1 Run `npm test` in full and confirm IT-402

## 6. E2E Tests

<!-- Dropped: the kit has neither a network interface nor a UI. Stated in test-plan.md. -->

## 7. Verification And OKF Pass

- [x] 7.1 Run the full suite, `npm run lint`, and `openspec validate`; record real results in verification.md
- [x] 7.2 Fill the Static Analysis table in verification.md
- [x] 7.3 For BR-13..BR-16, find the evidence in the shipped files and `lib/check.mjs` and fill the Rule Evidence table with real `file:line` references
- [x] 7.4 Promote IT-401 to `passing` and delete its Known Gaps row
- [x] 7.5 Re-check this change's own test-cases against the new template - it was written before the template existed, so the dogfood is only real if it still holds
- [x] 7.6 Set `verified` and `verified_at` on `test-first-gate`, fill `code_paths`, and clear `pending_changes`
- [x] 7.7 Promote any durable decision from design.md to `.okf/decisions/`, or record why not
- [x] 7.8 Run `okf index`, then `openspec validate test-first-gate --strict` against the synced baseline spec

## 8. Archive Readiness

- [x] 8.1 Run `okf check --archive tighten-test-case-coverage` and fix everything it reports
- [x] 8.2 Complete the Archive Readiness checklist in verification.md
