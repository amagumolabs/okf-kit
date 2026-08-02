## 1. Contract Stubs

- [x] 1.1 Declare `stripCodeSpans(text)` in `lib/check.mjs` as a no-op returning its input
- [x] 1.2 Give `checkHygiene` an `{ archiveMode }` option and route its reports through `hardensAtArchive`, defaulting to today's behaviour for the two existing callers
- [x] 1.3 Call `checkHygiene` from the change-artifact walk in `checkChange`

## 2. Pre-Implementation Unit Tests

- [x] 2.1 Add the `setArtifact` and `hygieneFindings` helpers to `test/run.mjs`
- [x] 2.2 Write UT-200, UT-201, UT-202, UT-206, NEG-201 - the widened scan and its escalation
- [x] 2.3 Write UT-203, UT-204, UT-205, NEG-204, NEG-205 - the quoting exemption and its ordering
- [x] 2.4 Write UT-207 - the instruction-comment escalation
- [x] 2.5 Write UT-208, NEG-202, NEG-203 - no allowlist, and the inherited skips
- [x] 2.6 Write UT-209 - archived changes are not scanned
- [x] 2.7 Run `npm test` and record each actual assertion failure in the test-plan's Initial Status

## 3. Integration And E2E Skeletons

- [x] 3.1 Record IT-201 in test-plan Known Gaps with an owner, and IT-202 as `passing`

## 4. Implementation

- [x] 4.1 Implement `stripCodeSpans`, stripping fences first so a stray backtick cannot swallow the file
- [x] 4.2 Apply it in `checkHygiene` alongside `stripFences`, for every caller
- [x] 4.3 Walk the artifacts of each active change and call `checkHygiene`, excluding `openspec/changes/archive/`
- [x] 4.4 Escalate the instruction-comment finding at the archive boundary
- [x] 4.5 Run `npm test` until every test from group 2 is green, with no test edited to get there

## 5. Integration Tests

- [x] 5.1 Run `npm test` in full and confirm IT-202
- [x] 5.2 Run `okf check` against this repository and fix every real finding it surfaces on the active changes

## 6. E2E Tests

<!-- Dropped: the kit has neither a network interface nor a UI. Stated in test-plan.md. -->

## 7. Verification And OKF Pass

- [x] 7.1 Run the full suite, `npm run lint`, and `openspec validate`; record real results in verification.md
- [x] 7.2 Fill the Static Analysis table in verification.md
- [x] 7.3 For BR-1..BR-6, find the evidence in `lib/check.mjs` and fill the Rule Evidence table with real `file:line` references
- [x] 7.4 Promote IT-201 to `passing` and delete its Known Gaps row
- [x] 7.5 Discharge the risk row in `.okf/features/okf-archive-gate.md` that recorded this exposure, and say so in the Rule Evidence action column
- [x] 7.6 Set `verification_state`, `verified`, `verified_at` and `code_paths` on `artifact-hygiene`, and clear `pending_changes`
- [x] 7.7 Promote any durable decision from design.md to `.okf/decisions/`, or record why not
- [x] 7.8 Run `okf index`, then `openspec validate artifact-hygiene --strict` against the synced baseline spec

## 8. Archive Readiness

- [x] 8.1 Run `okf check --archive add-change-artifact-hygiene` and fix everything it reports
- [x] 8.2 Complete the Archive Readiness checklist in verification.md
