## 1. Contract Stubs

- [x] 1.1 Declare `classifyChangeReference(text)` in `lib/check.mjs`, returning `'prose' | 'locator'` for one matched occurrence; body throws `not implemented`
- [x] 1.2 Declare `checkDurableReferences(root, report)` in `lib/check.mjs` next to `checkBundleFiles`; body throws `not implemented`
- [x] 1.3 Wire `checkDurableReferences` into `check()` alongside the other bundle-level calls, so the stub's throw is reachable from the suite

## 2. Pre-Implementation Unit Tests

- [x] 2.1 Write UT-003 (error names the `change:<id>` form) for BR-1 in `test/run.mjs`
- [x] 2.2 Write UT-004, UT-005, UT-006 (body prose, table cell, frontmatter regression) for BR-2
- [x] 2.3 Write UT-007, UT-008, UT-009, UT-010 (the three prose shapes and the rejected one) for BR-3
- [x] 2.4 Write UT-011, UT-012, UT-013 (fence excludes; fence launders neither frontmatter nor later prose) for BR-4
- [x] 2.5 Write UT-014, UT-015 (locator in `log.md`; `index.md` keeps its `type` exemption) for BR-2
- [x] 2.6 Write UT-016, UT-019 (unresolvable id is silent; no overstated success output) for BR-6
- [x] 2.7 Write UT-017 and UT-018 (a new bundle file is scanned; `projectTest` over this repo's own bundle) for BR-5
- [x] 2.8 Write UT-020, UT-021 (archived path is a locator; existing on disk does not excuse it) for BR-7
- [x] 2.9 Write NEG-001 to NEG-005 (HTML comment, no trailing slash, two locators, empty bundle, `.tmpl` file)
- [x] 2.10 Run `npm test` and record each actual assertion failure in test-plan.md Initial Status, replacing `planned`
- [x] 2.11 Confirm UT-001 and UT-002 are still green and untouched — they are the regression guard for group 3's refactor

## 3. Implementation

- [x] 3.1 Implement `classifyChangeReference`: prose for the bare prefix, the bare `archive/` form, and a `<placeholder>` segment; locator for a literal segment, including one under `archive/` (BR-3, BR-7)
- [x] 3.2 Refactor `checkProvenance` (lines 152-174) to call the classifier, keeping its existing message wording byte-for-byte (UT-001, UT-002, UT-006 stay green)
- [x] 3.3 Implement `checkDurableReferences`: walk every `.md` under `.okf/` including `index.md` and `log.md`, strip comments and fences the way `checkHygiene` does, classify each occurrence, report locators (BR-2, BR-4, D3)
- [x] 3.4 Make the error message name the durable form, matching `checkProvenance`'s wording (BR-1)
- [x] 3.5 Run `npm test` until every test from group 2 is green

## 4. Integration Tests

Dropped: Not Applicable, with the reason and precedent recorded in test-cases.md and test-plan.md.

## 5. E2E Tests

Dropped: Not Applicable, with the reason recorded in test-cases.md and test-plan.md.

## 6. Verification And OKF Pass

- [x] 6.1 Run `npm test`, `openspec validate guard-durable-references --strict`, and `okf check`; record the real output in verification.md
- [x] 6.2 Fill the Rule Evidence table with a `file:line` or test name for BR-1 through BR-7
- [x] 6.3 Apply the verdicts: `okf-gap` updates the entry, `code-gap` is fixed in code, `conflict` goes to the user
- [x] 6.4 Set `verification_state` and `verified_at` on `.okf/features/okf-durable-references.md`, fill `code_paths`, remove `guard-durable-references` from `pending_changes`, append a Verification History row, and write the `verified[]` attestation
- [x] 6.5 Promote D1 (shape over allowlist), D2 (fencing as the sanctioned escape hatch), and D3 (reserved files are content-scanned) to `.okf/decisions/`; record D4 as change-local in the Decision Promotion table
- [x] 6.6 Sync the spec and run `openspec validate okf-durable-references --strict` against the assembled baseline
- [x] 6.7 Run `okf index` to regenerate `.okf/index.md` and `.okf/log.md`
- [x] 6.8 Review the diff for any file excused by name, and record the finding against acceptance criterion 10

## 7. Archive Readiness

- [x] 7.1 Run `okf check --archive guard-durable-references` and fix everything it reports
- [x] 7.2 Complete the Archive Readiness checklist in verification.md
