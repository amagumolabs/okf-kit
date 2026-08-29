## 1. Contract Stubs

Dropped. The change adds no new code surface for a test to import - every unit
test calls the existing `check()` export against a fixture repository, or reads
the shipped schema and template files. Recorded in test-plan.md under Contract
Stubs.

## 2. Pre-Implementation Unit Tests

- [x] 2.1 Add a fixture helper to `test/run.mjs` that writes an `okf-link.md` with both tables, parameterised by the related rows, so a test names only what it varies
- [x] 2.2 Write UT-601, UT-602 for the missing-table finding and its hardening at the archive boundary (BR-13, BR-14)
- [x] 2.3 Write UT-603, UT-604, UT-605 and NEG-602 for the filled, silent, stated-empty, and zero-to-one row cases (BR-7, BR-13, BR-14)
- [x] 2.4 Write UT-606, UT-607, UT-609 and NEG-603 for row resolution, including a `.okf/decisions/` path and a repeated row (BR-1, BR-10, BR-13)
- [x] 2.5 Write UT-608 and UT-614 for the obligation boundary - a file in both tables, and a related entry owed no evidence or attestation (BR-1, BR-2)
- [x] 2.6 Write UT-610, UT-611, UT-612 and NEG-604, NEG-605 for candidate derivation from `code_paths` and `affects_features`, its severity, its freshness, and its scoping to this change (BR-3, BR-15)
- [x] 2.7 Write UT-613, UT-615, UT-616 for the three things the gate must NOT do: refuse over a wider set, judge relevance, read a relation field (BR-3, BR-5, BR-13, BR-15)
- [x] 2.8 Write NEG-601 for a change directory with no `okf-link.md` at all (BR-13)
- [x] 2.9 Write UT-617..UT-623 against the shipped template and schema instructions (BR-1, BR-3..BR-10)
- [x] 2.10 Run `npm test` and record every actual assertion failure in test-plan.md Initial Status, replacing `planned` - a row that comes out green instead says why in the same shape

## 3. Integration And E2E Skeletons

- [x] 3.1 Add IT-601 and IT-602 to `test/run.mjs` declared with `todo(...)`, the harness's pending mechanism, asserting nothing yet
- [x] 3.2 Set Initial Status to `skeleton` for both rows in test-plan.md, leaving Status at `skeleton` until group 5 promotes them

## 4. Implementation

- [x] 4.1 Parse the Related Knowledge table in `readChangeState`, resolving each row's path the way OKF Link rows are resolved, and return it alongside `linked` without merging the two sets
- [x] 4.2 Derive candidates in the same read: feature entries whose `code_paths` intersect a linked entry's, and decisions whose `affects_features` names a linked capability, scoped to this change's linked rows
- [x] 4.3 Report the structural findings in `checkChange`: missing or silent table through `hardensAtArchive`, an unresolved row as an error, one finding per distinct path
- [x] 4.4 Report an intersection between the two tables as an error naming the file
- [x] 4.5 Report an underived-but-unmentioned candidate as a warning through `report.warn`, never through `hardensAtArchive`, and report nothing when the recorded set is wider than the derivation
- [x] 4.6 Keep the related rows out of every existing consumer of `linked` - Rule Evidence, `pending_changes`, and the attestation checks read the linked set only
- [x] 4.7 Add the Related Knowledge section to `openspec/schemas/okf-gated-feature/templates/okf-link.md`, with the signal, reason, and reading-target columns and the stated-empty form
- [x] 4.8 Extend the `okf-link` artifact instruction in `schema.yaml`: both signals, `.okf/decisions/` as a place to read, candidate-not-verdict, judgement as a source, the row's required content, and the stated-empty escape
- [x] 4.9 Extend the `proposal` instruction's reconcile step to re-run the scan against the settled Capabilities section, and leave every later artifact's instruction free of a rescan
- [x] 4.10 Extend the `verification` instruction: re-read the related entries when a `BR-n` changes, and raise `conflict` where the edit reaches one
- [x] 4.11 Run `npm test` until group 2 is green, changing code and never the pre-written tests - if a rule turns out to be wrong, repair the OKF entry, then the spec, then the test-plan row, then the test, then the code

## 5. Integration Tests

- [x] 5.1 Promote IT-601 to executable: a fixture change with both tables filled and every candidate mentioned, asserting `okf check --archive` reports no error and no candidate warning
- [x] 5.2 Promote IT-602 to executable: assert the pre-existing archive-gate findings still fire on their own fixtures at the same level
- [x] 5.3 Move Status to `passing` for both rows and clear them from Known Gaps

## 6. E2E Tests

Dropped. The kit has no network interface and no user interface, so both E2E
levels are discharged with reasons in test-cases.md and test-plan.md rather than
left as empty groups.

## 7. Verification And OKF Pass

- [x] 7.1 Run `npm test`, `npm run lint`, and `openspec validate add-okf-related-knowledge --strict`, and record the real output in verification.md including the Static Analysis table
- [x] 7.2 For every BR-n touched - okf-related-knowledge BR-1..BR-10 and okf-archive-gate BR-13..BR-15 - find its evidence in the code (`file:line` or the protecting test) and fill the Rule Evidence table
- [x] 7.3 Apply the verdicts: update the entry where it was stale (`okf-gap`), fix the code where the rule was right (`code-gap`), ask on `conflict`
- [x] 7.4 Re-read the entries listed in this change's own Related Knowledge table before writing any rule edit, and raise `conflict` where an edit reaches one - the duty this change introduces applies to itself
- [x] 7.5 For both linked entries: set `verified` and `verified_at`, fill `code_paths`, remove this change id from `pending_changes`, and append a Verification History row
- [x] 7.6 Promote the durable decisions from design.md to `.okf/decisions/` - the two-table separation, derivation from existing frontmatter, the derivation as a floor, and structure-read-candidates-reported - or record why one is change-local
- [x] 7.7 Run `okf index` to regenerate `.okf/index.md` and `.okf/log.md`
- [x] 7.8 Validate the synced baseline specs: `openspec validate okf-related-knowledge --strict` and `openspec validate okf-archive-gate --strict` - run after the sync step, both valid

## 8. Archive Readiness

- [x] 8.1 Run `okf check --archive add-okf-related-knowledge` and fix everything it reports
- [x] 8.2 Complete the Archive Readiness checklist in verification.md
