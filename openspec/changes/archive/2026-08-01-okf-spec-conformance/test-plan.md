# Test Plan

# Test Strategy

- **Unit**: the bulk of the work. `test/run.mjs` builds a fixture bundle in a temp
  directory, breaks one thing, and asserts the right finding fires. Every
  frontmatter rule, every coupling invariant, the index and log generation, the
  audit selection change, and the whole migration surface are covered this way.
  The existing helpers (`test`, `projectTest`, `auditTest`, `gitRepo`, `entry`,
  `assertError`, `find`) already provide everything needed; `entry()` itself has
  to move to the new field shape, which is the first change.
- **Integration**: exercised through `bin/okf.mjs` with `execFileSync`, the
  pattern `test/run.mjs` already uses for `okf check --archive`. Covers upgrade's
  payload boundary, migrate-then-check, the migration report, and the profile
  document. IT-006 uses the existing `gitRepo` helper to assert the committed
  index path is lowercase.
- **API E2E**: Not Applicable because the kit has no HTTP surface - every command
  is a local CLI over the filesystem and git.
- **Browser E2E**: Not Applicable because the kit has no UI.

Everything reaches `failing` before implementation. This repository has no
infrastructure gap that would justify a `skeleton`: fixtures are temp directories
built by the harness itself, and the only external tool is git, for which a helper
already exists.

# Status Vocabulary

Used as defined by the schema: `planned`, `skeleton`, `failing`, `passing`.

# Contract Stubs

| Contract | File | Signature Or Shape | Notes |
| --- | --- | --- | --- |
| Migration entry point | `lib/migrate.mjs` | `export function migrate(root, { dryRun = false } = {}) -> { examined, rewritten, alreadyCurrent, unparseable }` | Body throws `new Error('not implemented')` until UT-027..UT-032 are red |
| CLI subcommand | `bin/okf.mjs` | `migrate` case in the command dispatch, calling `migrate()` and printing the report | Prints nothing until the library lands |
| Coupling invariant severity | `lib/check.mjs` | `const COUPLING_SEVERITY = 'warn'` read by the invariant, switched to `'error'` in the release after this one | Named so the promotion in D6 is a one-line change, not a search |

No stub contains logic. `check.mjs`, `index-gen.mjs`, and `audit.mjs` need no stubs
- they already export the functions these tests call, and the change is to their
behavior rather than their surface.

# Pre-Implementation Unit Tests

| Test Case ID | Rule (BR-n) | Test File | Test Name | Initial Status | Notes |
| --- | --- | --- | --- | --- | --- |
| UT-001 | bundle BR-1 | test/run.mjs | `a well-formed entry in the new shape is clean` | failing: expected [], got `verified: "[object Object],[object Object]" is not one of unverified \| verified \| needs-revision` + `status: "stable" is not one of active \| deprecated` | Lands with the `entry()` helper change |
| UT-002 | bundle BR-1 | test/run.mjs | `unknown verification_state is caught` | failing: expected an error matching /verification_state: "reviewed"/, got none | |
| UT-003 | bundle BR-1 | test/run.mjs | `a scalar in the specification's verified key is caught` | failing: expected an error matching /holds a scalar/, got none | |
| UT-004 | bundle BR-3, migrate BR-4 | test/run.mjs | `verified without an attestation is a warning, not an error` | failing: expected a WARNING matching /attestation/, got none | Asserts severity, not just presence |
| UT-005 | bundle BR-3 | test/run.mjs | `verified_at disagreeing with the newest attestation is caught` | failing: expected an error matching /2026-07-30/, got none | |
| UT-006 | bundle BR-4 | test/run.mjs | `needs-revision still carrying an attestation is caught` | failing: expected an error matching /key is present/, got none | |
| UT-007 | bundle BR-4 | test/run.mjs | `unverified still carrying an attestation is caught` | failing: expected an error matching /key is present/, got none | |
| UT-008 | bundle BR-5 | test/run.mjs | `high criticality verified without a human actor is a warning` | failing: expected a WARNING matching /human:/, got none | Must assert the run's exit status is unaffected |
| UT-009 | bundle BR-5 | test/run.mjs | `high criticality with a human actor is clean` | failing: expected [], got the old `verified` vocabulary error | |
| UT-010 | bundle BR-5 | test/run.mjs | `normal criticality without a human actor is clean` | failing: expected [], got the old `verified` vocabulary error | |
| UT-011 | bundle BR-7 | test/run.mjs | `a bundle markdown file without frontmatter is caught` | failing: expected an error matching /type/, got none | |
| UT-012 | bundle BR-7 | test/run.mjs | `reserved index.md and log.md are not concept documents` | passing (guard): asserts the absence of a rule that must not over-reach once BR-7 lands | |
| UT-013 | bundle BR-9 | test/run.mjs | `a bare actor name is caught` | failing: expected an error matching /producer/, got none | |
| UT-014 | bundle BR-9 | test/run.mjs | `a producer-qualified actor is clean` | passing (guard): asserts the conventional form is never rejected | Red only after UT-013 lands |
| UT-015 | bundle BR-9 | test/run.mjs | `a human actor is accepted and counts as human review` | failing: expected [], got the old `verified` vocabulary error | |
| UT-016 | bundle BR-10 | test/run.mjs | `the previous status vocabulary is caught` | failing: expected an error matching /draft \| stable \| deprecated/, got none | |
| UT-017 | bundle BR-10 | test/run.mjs | `a decision separating status from decision_status is clean` | failing: expected [], got `status: "stable" is not one of accepted \| superseded \| reversed` | |
| UT-018 | bundle BR-10 | test/run.mjs | `unknown decision_status is caught` | failing: expected an error matching /decision_status: "retired"/, got none | |
| UT-019 | bundle BR-8 | test/run.mjs | `a missing bundle root index is caught` | failing: expected a finding on `.okf/index.md`, got one on `.okf/INDEX.md` | |
| UT-020 | bundle BR-8 | test/run.mjs | `the regenerated index carries okf_version` | failing: ENOENT reading `.okf/index.md` | |
| UT-021 | bundle BR-7 | test/run.mjs | `the generated log lists the newest date first` | failing: ENOENT reading `.okf/log.md` | |
| UT-022 | bundle BR-7 | test/run.mjs | `a log with no verification history is still written` | failing: expected `.okf/log.md` to exist, got false | |
| UT-023 | bundle BR-1 | test/run.mjs | `the index Features table reads verification_state` | failing: ENOENT reading `.okf/index.md` | |
| UT-024 | audit BR-10 | test/run.mjs | `a verified entry with no attestation is still audited` | failing: expected verdict 'current', got 'skipped' | Uses `auditTest` + `gitRepo` |
| UT-025 | audit BR-4 | test/run.mjs | `needs-revision is skipped by the audit` | failing: expected note matching /needs-revision/, got `no verified field - already surfaced by okf check` | Regression against the rename |
| UT-026 | audit BR-5, BR-6 | test/run.mjs | `a deprecated entry stays skipped under the new status vocabulary` | passing (guard): already skipped for the right reason; locks it against the status vocabulary move | |
| UT-027 | migrate BR-1 | test/run.mjs | `migrate moves a verified entry without writing an attestation` | failing: not implemented | |
| UT-028 | migrate BR-1 | test/run.mjs | `migrate moves an unverified entry` | failing: not implemented | |
| UT-029 | migrate BR-5 | test/run.mjs | `migrate run twice writes nothing the second time` | failing: not implemented | |
| UT-030 | migrate BR-5 | test/run.mjs | `migrate rewrites only the entries still on the old shape` | failing: not implemented | |
| UT-031 | migrate BR-6 | test/run.mjs | `migrate leaves the body and unrelated keys byte-identical` | failing: not implemented | |
| UT-032 | migrate BR-6 | test/run.mjs | `migrate leaves an unparseable entry untouched and reports it` | failing: not implemented | |
| NEG-001 | bundle BR-3 | test/run.mjs | `an empty attestation list counts as no attestation` | failing: expected a WARNING matching /attestation/, got none | |
| NEG-002 | bundle BR-9 | test/run.mjs | `an attestation missing by is caught` | failing: expected an error matching /\bby\b/, got none | |
| NEG-003 | bundle BR-9 | test/run.mjs | `an attestation with a malformed at is caught` | failing: expected an error matching /\bat\b/, got none | |
| NEG-004 | bundle BR-3 | test/run.mjs | `verified_at matching the older of two attestations is caught` | failing: expected an error matching /verified_at/, got none | |
| NEG-005 | bundle BR-8 | test/run.mjs | `an index without okf_version is caught` | failing: expected an error matching /okf_version/, got none | |
| NEG-006 | migrate BR-5 | test/run.mjs | `migrate on a bundle with no features directory reports nothing to do` | failing: not implemented | |
| NEG-007 | bundle BR-3 | test/run.mjs | `a bare attestation mapping is read as a one-element list` | failing: expected [], got ``frontmatter is missing `verified``` - the frontmatter reader does not parse a nested mapping yet | The specification requires consumers to accept this form |

# Integration Tests

| Test Case ID | Test File | Test Name | Status | Notes |
| --- | --- | --- | --- | --- |
| IT-001 | test/run.mjs | `upgrade writes nothing under features or decisions` | failing: expected entry hashes unchanged, got a rewritten `.okf/features/user-auth.md` | Uses `projectTest` and `install(..., { mode: 'upgrade' })`; hashes every entry file before and after |
| IT-002 | test/run.mjs | `migrate then check exits clean` | failing: not implemented | Runs `bin/okf.mjs migrate` then `check` via `execFileSync`, asserts exit 0 with warnings present |
| IT-003 | test/run.mjs | `migrate reports every file it touched` | failing: not implemented | Three old-shape entries, all three named in stdout |
| IT-004 | test/run.mjs | `templates named .md.tmpl are not concept documents` | failing: expected clean, got error /type/ | |
| IT-005 | test/run.mjs | `the profile document names the kit's divergences` | failing: file does not exist | Asserts the kit-defined keys, the targeted version, and the sentence refusing to vouch for a human attestation |
| IT-006 | test/run.mjs | `the bundle index is committed at a lowercase path` | failing: expected .okf/index.md in git ls-files, got .okf/INDEX.md | Uses `gitRepo`; guards the case-insensitive filesystem trap in design D8 |

# Test Data And Fixtures

| Fixture Or Data | Used By | Setup Method | Cleanup Method |
| --- | --- | --- | --- |
| Temp bundle | every unit case | `test()` / `projectTest()` create a temp dir and call `scaffold(root)` | `fs.rmSync(root, { recursive: true, force: true })` in the harness `finally` |
| `entry()` helper | frontmatter and audit cases | Extend its options from `{ verified }` to `{ verificationState, attestations }`, keeping `verifiedAt`, `status`, `codePaths` | none |
| Old-shape entry factory | UT-027..UT-032, IT-001..IT-003 | New `legacyEntry()` helper writing the pre-migration frontmatter verbatim, so migration tests do not depend on `entry()` tracking the new shape | none |
| Git repository with dated commits | UT-024..UT-026, IT-006 | Existing `gitRepo()` helper | Temp dir removal |
| Installed kit payload | IT-001, IT-005 | Existing `install(KIT, root, version)` | Temp dir removal |

# Commands

## Unit

    node test/run.mjs

## Integration

    node test/run.mjs

## OpenSpec Validation

    openspec validate okf-spec-conformance --strict

## OKF Validation

    node bin/okf.mjs index
    node bin/okf.mjs check
    node bin/okf.mjs check --archive okf-spec-conformance    # before archiving

# Test Change Rules

- Pre-written tests are not changed to match the implementation.
- A pre-written test may change only when the OKF entry or spec changed first, or
  the test has a mechanical bug (wrong fixture, typo, bad assertion syntax).
- When implementation reveals that a business rule must be different, stop:
  amend `.okf/features/<capability>.md` and the spec first, record it below, then
  change the test and the code. Never the other way round.

One exception is planned rather than discovered: every existing case that builds
an entry through `entry()` or asserts on the `verified` field has to move to the
new shape. That is a mechanical fixture change caused by the rename this change
exists to make, not a test being bent toward an implementation. Each such edit is
recorded below.

# Known Gaps

| Test Case ID | Status Left At | Reason | Owner | Follow-Up |
| --- | --- | --- | --- | --- |

<!-- Empty at planning time. Any row still at `skeleton` or `planned` when archive
readiness is assessed must be listed here with a reason and an owner. -->
