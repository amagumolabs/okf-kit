## 1. Contract Stubs

- [x] 1.1 Declare `migrate(root, { dryRun })` in `lib/migrate.mjs` returning `{ examined, rewritten, alreadyCurrent, unparseable }`, body `throw new Error('not implemented')`
- [x] 1.2 Wire a `migrate` case into `bin/okf.mjs` command dispatch, calling `migrate()` and printing nothing yet
- [x] 1.3 Declare `COUPLING_SEVERITY = 'warn'` in `lib/check.mjs` next to the existing vocabulary constants, so promoting it to `'error'` in the next release is a one-line change

## 2. Pre-Implementation Unit Tests

- [x] 2.1 Add `okfEntry()` (new shape) and `legacyEntry()` (pre-migration shape, frozen) to `test/run.mjs`. `entry()` and the `ENTRY` fixture stay on the old shape until group 3 - moving them now would turn 88 existing tests red for a fixture reason and bury the new tests' assertion messages
- [x] 2.2 Write UT-001, UT-002, UT-003 for the `verification_state` vocabulary and the freed `verified` key (bundle BR-1)
- [x] 2.3 Write UT-004, UT-005, UT-006, UT-007, NEG-001, NEG-004, NEG-007 for the coupling invariants (bundle BR-3, BR-4; migrate BR-4) - UT-004 must assert warning severity and an unaffected exit status
- [x] 2.4 Write UT-008, UT-009, UT-010 for the high-criticality human-review warning (bundle BR-5)
- [x] 2.5 Write UT-011, UT-012 for the concept-document rule and the reserved filenames (bundle BR-7)
- [x] 2.6 Write UT-013, UT-014, UT-015, NEG-002, NEG-003 for the actor convention (bundle BR-9)
- [x] 2.7 Write UT-016, UT-017, UT-018 for the `status` and `decision_status` vocabularies (bundle BR-10)
- [x] 2.8 Write UT-019, UT-020, UT-023, NEG-005 for the bundle root index and `okf_version` (bundle BR-8)
- [x] 2.9 Write UT-021, UT-022 for `.okf/log.md` generation (bundle BR-7)
- [x] 2.10 Write UT-024, UT-025, UT-026 for the audit's selection by `verification_state` (audit BR-4, BR-5, BR-6, BR-10)
- [x] 2.11 Write UT-027 through UT-032 and NEG-006 for migration (migrate BR-1, BR-5, BR-6)
- [x] 2.12 Run `node test/run.mjs` and record each actual assertion failure in test-plan.md under Initial Status

## 3. Implementation

- [x] 3.1 Rename `verified` to `verification_state` in `lib/check.mjs` required-key and vocabulary validation, and reject a scalar in the `verified` key (bundle BR-1)
- [x] 3.2 Implement the two coupling invariants in `lib/check.mjs` at `COUPLING_SEVERITY`, comparing `verified_at` against the newest `at` by date (bundle BR-3, BR-4)
- [x] 3.3 Implement the high-criticality warning for a verified entry with no `human:` actor - warning only, never an error (bundle BR-5)
- [x] 3.4 Implement the concept-document rule over every `.md` file under `.okf/`, exempting `index.md` and `log.md` (bundle BR-7)
- [x] 3.5 Implement actor-convention validation for `generated.by` and `verified[].by` (bundle BR-9)
- [x] 3.6 Move `status` to `draft | stable | deprecated`, and validate `decision_status` as `accepted | superseded | reversed` on decision entries (bundle BR-10)
- [x] 3.7 Update `lib/index-gen.mjs` to read `verification_state`, write `.okf/index.md` instead of `INDEX.md`, and emit `okf_version` frontmatter (bundle BR-1, BR-8)
- [x] 3.8 Generate `.okf/log.md` from every entry's Verification History, grouped by date newest first (bundle BR-7)
- [x] 3.9 Update `lib/audit.mjs` to select entries by `verification_state` and never by the presence of an attestation (audit BR-4, BR-6, BR-10)
- [x] 3.10 Implement `migrate()` in `lib/migrate.mjs`: move the field, write no attestation, stay idempotent, touch only the keys being migrated (migrate BR-1, BR-5, BR-6)
- [x] 3.11 Print the migration report from `bin/okf.mjs` and add `migrate` to the CLI help text and exit-code documentation
- [x] 3.12 Rename `.okf/INDEX.md` to `.okf/index.md` through a temporary name in two `git mv` steps, because APFS is case-insensitive (design D8)
- [x] 3.13 Rename the entry templates to `.md.tmpl` and update every reference in `openspec/schemas/okf-gated-feature/schema.yaml`, `openspec/config.yaml`, and the addendum (design D7)
- [x] 3.14 Give `.okf/README.md` frontmatter with a non-empty `type` (bundle BR-7)
- [x] 3.15 Write the profile document naming every kit-defined key, every narrowed rule, the targeted spec version, and the kit's refusal to vouch for a `human:` attestation; add it to `PAYLOAD_FILES` in `lib/install.mjs` so it is kit-owned (bundle BR-6, BR-11)
- [x] 3.16 Migrate this repository's own three feature entries and three decision entries by running the new command, not by hand
- [x] 3.17 Update `openspec/schemas/okf-gated-feature/schema.yaml` step 5 of the verification instruction, and the matching rules in `openspec/config.yaml`, to write `verification_state`, replace rather than append `verified[]`, and remove the key on a `conflict` verdict (bundle BR-2, BR-4)
- [x] 3.18 Update the OKF addendum block in `CLAUDE.md` and `AGENTS.md` to match, keeping the two files identical
- [x] 3.19 Update `README.md`: add `okf migrate` to the command table, correct the ownership table, and fix the stale fixture-test count
- [x] 3.20 Extend `lib/frontmatter.mjs` to parse a nested mapping under a key, so a bare `verified` mapping is read as a one-element list as the specification requires of consumers (NEG-007)
- [x] 3.21 Move `entry()` and the `ENTRY` fixture in `test/run.mjs` to the new shape
- [x] 3.22 Run `node test/run.mjs` until every group 2 test is green

## 4. Integration Tests

- [x] 4.1 Write IT-001: `okf upgrade` leaves every file under `.okf/features/` and `.okf/decisions/` byte-identical (migrate BR-2)
- [x] 4.2 Write IT-002 and IT-003: migrate then check exits clean with warnings, and the report names every file touched (migrate BR-2, BR-3)
- [x] 4.3 Write IT-004: templates named `.md.tmpl` produce no concept-document finding (bundle BR-7)
- [x] 4.4 Write IT-005: the profile document names the kit's divergences and states what the kit does not claim (bundle BR-6, BR-11)
- [x] 4.5 Write IT-006: the committed bundle index path is lowercase, asserted through `git ls-files` (bundle BR-8)
- [x] 4.6 Run the full suite and make every integration test pass

## 6. Verification And OKF Pass

- [x] 6.1 Run `node test/run.mjs` and `openspec validate okf-spec-conformance --strict`, and record both results in verification.md
- [x] 6.2 For every BR-n touched, find its evidence in the code (`file:line` or the protecting test) and fill the Rule Evidence table - read the code rather than recalling what was intended
- [x] 6.3 Apply the verdicts: update the entry on `okf-gap`, fix the code on `code-gap`, ask a human on `conflict`
- [x] 6.4 For each of `okf-bundle-format`, `okf-migrate`, `okf-audit`: set `verification_state` and `verified_at`, write the `verified[]` attestation, fill `code_paths`, remove this change id from `pending_changes`, append a Verification History row
- [x] 6.5 Promote the durable decisions from design.md (D1, D2, D3, D4, D5, D6) into `.okf/decisions/`, and record D7 and D8 as change-local with their reason in the Decision Promotion table
- [x] 6.6 Run `okf index` to regenerate `.okf/index.md` and `.okf/log.md`, and fill the Needs Revision Ledger note if any entry ended at `needs-revision`
- [x] 6.7 Validate every capability spec synced into `openspec/specs/` with `openspec validate <capability> --strict`, including `okf-audit` whose baseline spec this change modifies

## 7. Archive Readiness

- [x] 7.1 Run `okf check --archive okf-spec-conformance` and fix everything it reports
- [x] 7.2 Complete the Archive Readiness checklist in verification.md
