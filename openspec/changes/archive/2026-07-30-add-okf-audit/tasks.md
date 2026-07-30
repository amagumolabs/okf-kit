## 1. Contract Stubs

- [x] 1.1 Create `lib/audit.mjs` exporting `audit(root)` with the shape from test-plan.md, body throwing `not implemented`
- [x] 1.2 Wire `audit` into `bin/okf.mjs` usage text and command dispatch (no logic yet)

## 2. Pre-Implementation Unit Tests

- [x] 2.1 Add a git-repo fixture helper to `test/run.mjs` that commits files with fixed `GIT_AUTHOR_DATE` / `GIT_COMMITTER_DATE`
- [x] 2.2 Write UT-001 through UT-012 against `audit(root)`
- [x] 2.3 Run `node test/run.mjs` and record the real assertion failures in test-plan.md Initial Status

## 3. Implementation

- [x] 3.1 Guard: `git rev-parse --git-dir` up front, return `ok: false` outside a repository (BR-3, criterion 10)
- [x] 3.2 Select auditable entries: `verified === 'verified'` and `status !== 'deprecated'`, everything else `skipped` (BR-4, BR-5)
- [x] 3.3 Empty `code_paths` yields `unauditable` (BR-3)
- [x] 3.4 Per declared path, read the newest commit date with `git log -1 --format=%cd --date=short -- ':(glob)<path>'` (BR-1, BR-7)
- [x] 3.5 Flag paths matching nothing via empty `git ls-files` for the same pathspec (BR-3, UT-012)
- [x] 3.6 Compare dates as strings; stale only when strictly greater than `verified_at` (BR-1, BR-2)
- [x] 3.7 Print the report, and exit non-zero when `stale > 0` or the audit could not run
- [x] 3.8 Confirm nothing writes under `.okf/` on any code path (BR-6)

## 4. Integration Tests

<!-- Not applicable: git is the only boundary and the unit tests drive it for real. See test-cases.md Not Applicable. -->

## 5. E2E Tests

<!-- Not applicable: no API, no UI. -->

## 6. Verification And OKF Pass

- [x] 6.1 Run `node test/run.mjs` and `openspec validate add-okf-audit --strict`, record results in verification.md
- [x] 6.2 For each of BR-1 to BR-7, find its evidence in the code (`file:line` or the protecting test) and fill the Rule Evidence table
- [x] 6.3 Apply the verdicts: update the entry where it was stale, fix code where the rule was right, ask on a genuine conflict
- [x] 6.4 Set `verified` and `verified_at` on `.okf/features/okf-audit.md`, fill `code_paths`, remove `add-okf-audit` from `pending_changes`
- [x] 6.5 Promote the date-granularity decision from design.md to `.okf/decisions/` (it outlives this change: it fixes what `verified_at` means for every future consumer)
- [x] 6.6 Run `node bin/okf.mjs index` and fill the Needs Revision Ledger note if anything ended at `needs-revision`

## 7. Archive Readiness

- [x] 7.1 Run `node bin/okf.mjs check --archive add-okf-audit` and fix everything it reports
- [x] 7.2 Update `README.md`, `.github/workflows/okf.yml` (scheduled, not a per-commit gate), and the drift limitation in `docs/openspec-okf-workflow.md`
- [x] 7.3 Complete the Archive Readiness checklist in verification.md
