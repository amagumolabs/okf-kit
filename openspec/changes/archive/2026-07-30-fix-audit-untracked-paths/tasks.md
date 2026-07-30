## 1. Contract Stubs

<!-- Not needed: audit(root) exists and this change adds a field to its result. See test-plan.md. -->

## 2. Pre-Implementation Unit Tests

- [x] 2.1 Extend the git fixture helper so a test can write and commit a `.gitignore`
- [x] 2.2 Write UT-015, UT-016, UT-017 against the current `audit(root)`
- [x] 2.3 Run `node test/run.mjs` and record the real assertion failures in test-plan.md

## 3. Implementation

- [x] 3.1 Add `untrackedPaths` to the audit result shape and its typedef
- [x] 3.2 Query untracked files per path with `git ls-files --others --exclude-standard`, so ignored files do not count as present (BR-9, criterion 4)
- [x] 3.3 Classify each declared path: tracked, untracked-but-present, or matching nothing (BR-9)
- [x] 3.4 Report the two states with distinct wording in `bin/okf.mjs`
- [x] 3.5 Confirm no verdict changed - UT-001 to UT-014 must pass untouched (BR-8)

## 4. Integration Tests

<!-- Not applicable, see test-cases.md. -->

## 5. E2E Tests

<!-- Not applicable, see test-cases.md. -->

## 6. Verification And OKF Pass

- [x] 6.1 Run `node test/run.mjs`, `openspec validate fix-audit-untracked-paths --strict`, and record results
- [x] 6.2 Fill the Rule Evidence table for BR-9 with a `file:line` reference, and re-check BR-3 and BR-8 since this change touched their requirement
- [x] 6.3 Apply the verdicts
- [x] 6.4 Set `verified_at`, refresh `code_paths`, remove `fix-audit-untracked-paths` from `pending_changes`
- [x] 6.5 Promote a durable decision if one emerged, or record that none did
- [x] 6.6 Run `node bin/okf.mjs index`

## 7. Archive Readiness

- [x] 7.1 Sync the delta into `openspec/specs/okf-audit/spec.md` and run `openspec validate okf-audit --strict`
- [x] 7.2 Run `node bin/okf.mjs check --archive fix-audit-untracked-paths`
- [x] 7.3 Complete the Archive Readiness checklist in verification.md
