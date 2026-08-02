## 1. Contract Stubs

- [x] 1.1 Declare `REQUIRED_CHECKS = ['Lint', 'Typecheck']` in `lib/check.mjs`, beside `REASON_MIN`
- [x] 1.2 Declare `checkStaticAnalysis(changeDir, verificationText, where, report, { archiveMode })` in `lib/check.mjs` with an empty body and no logic
- [x] 1.3 Call it from `checkVerification`, in the change-scoped block beside `checkDecisionPromotion` and outside the `if (archiveMode)` guard

## 2. Pre-Implementation Unit Tests

<!--
Written against the empty stub, so each fails on its own assertion - the finding
it expects is absent. Group 4 makes them green without any of them changing.
-->

- [x] 2.1 Add the `setStaticAnalysis(root, rows)` helper to `test/run.mjs`, mirroring `setPromotion`
- [x] 2.2 Add a satisfied Static Analysis section to the shared `VERIFICATION` fixture, so the existing archive assertions keep passing
- [x] 2.3 Write UT-100..UT-102 - the clean fixture stays clean, a missing table errors at archive, and only warns before it
- [x] 2.4 Write UT-103, UT-104, UT-111, NEG-105 - required rows present, extra rows unconstrained, loose Check matching
- [x] 2.5 Write UT-105, UT-107, NEG-101, NEG-102, NEG-103, NEG-104 - the result cell's accepted and rejected shapes
- [x] 2.6 Write UT-106b - a row left as a template placeholder is reported through its empty result (replaces UT-106, whose premise was false; see test-plan Test Changes)
- [x] 2.7 Write UT-108 over `lib/check.mjs` source - the gate imports nothing that spawns
- [x] 2.8 Write UT-109 - the gate reaches a change whose okf-link rows all declare no domain knowledge
- [x] 2.10 Write UT-110, UT-112, UT-113, UT-114 - moved here from group 4, because writing them beside the files they assert about is test-after
- [x] 2.9 Run `npm test` and record each actual assertion failure in the test-plan's Initial Status column, replacing the bare word `failing`

## 3. Integration And E2E Skeletons

<!-- IT-101 cannot run until this change has its own verification.md, so it is written now and stays `skeleton` until task 7.7 promotes it. -->

- [x] 3.1 Add the `check:archive` script to `package.json` so IT-101 has a command to be a skeleton of
- [x] 3.2 Confirm IT-101 is recorded in test-plan Known Gaps with an owner, and IT-102 as `passing`

## 4. Implementation

<!--
The tests from group 2 are fixed. If one disagrees with the implementation, the
code is wrong unless a rule turned out to be wrong - in which case the repair
order is BR, spec, test-plan row, test, code, and never any other order.
-->

- [x] 4.1 Implement `checkStaticAnalysis`: read the table under `/Static Analysis/i`, drop blank rows, report the empty-table finding through `hardensAtArchive`
- [x] 4.2 Implement the required-row check against `REQUIRED_CHECKS`, matching case- and separator-insensitively
- [x] 4.3 Implement the result-cell check: `cellEmpty` and the non-result vocabulary reject, `notApplicableDeclaration` with a reason of at least `REASON_MIN` accepts
- [x] 4.4 Add the Static Analysis section to `templates/verification.md`, with `<lint-command>` / `<typecheck-command>` placeholders, plus the Summary rows and the Archive Readiness line
- [x] 4.5 Add `## Lint` and `## Typecheck` placeholders under Commands in `templates/test-plan.md`
- [x] 4.6 Add the static analysis step to `verification.instruction` in `schema.yaml`, naming the required rows and the reason-or-result escape
- [x] 4.7 Add the `AGENTS.md` sourcing step to `test-plan.instruction` in `schema.yaml` - read the declaration, else derive from the manifest, confirm, and record it outside the markers
- [x] 4.8 Bump `version` in `schema.yaml`
- [x] 4.10 Add the dependency-free `lint` script to `package.json` (`node --check` over every `.mjs`)
- [x] 4.11 Add the Static Analysis declaration to `AGENTS.md` and `CLAUDE.md` outside the okf-kit markers, identical in both, naming what `npm run lint` actually proves
- [x] 4.12 Run `npm test` until every test from group 2 and 4.9 is green, with no test edited to get there

## 5. Integration Tests

- [x] 5.1 Run `npm test` in full and confirm IT-102 - no pre-existing assertion regressed

## 6. E2E Tests

<!-- Dropped: the kit has neither a network interface nor a UI. Stated in test-plan.md under Test Strategy and E2E Tests. -->

## 7. Verification And OKF Pass

- [x] 7.1 Run the full suite, `openspec validate add-static-analysis-gate --strict`, and `npm run lint`; record real results in verification.md
- [x] 7.2 Fill this change's own Static Analysis table in verification.md - the first real use of the thing being built
- [x] 7.3 For BR-1, BR-7, BR-9, BR-10, BR-11, BR-12, find the evidence in `lib/check.mjs` and the shipped files and fill the Rule Evidence table with real `file:line` references
- [x] 7.4 Apply the verdicts: update `.okf/features/okf-archive-gate.md` where it was stale (`okf-gap`), fix the code where the rule was right (`code-gap`), ask on `conflict`
- [x] 7.5 Set `verified` and `verified_at` on the entry, fill `code_paths`, remove `add-static-analysis-gate` from `pending_changes`, append a Verification History row, and write the `verified[]` attestation
- [x] 7.6 Promote the durable decisions from design.md to `.okf/decisions/` - at minimum the reads-but-never-runs boundary - and fill the Decision Promotion table for the rest
- [x] 7.7 Promote IT-101 to `passing` in test-plan.md and delete its Known Gaps row
- [x] 7.8 Run `okf index` to regenerate `.okf/index.md` and `.okf/log.md`
- [x] 7.9 Run `openspec validate okf-archive-gate --strict` against the synced baseline spec, not only the change

## 8. Archive Readiness

- [x] 8.1 Run `okf check --archive add-static-analysis-gate` and fix everything it reports
- [x] 8.2 Complete the Archive Readiness checklist in verification.md
