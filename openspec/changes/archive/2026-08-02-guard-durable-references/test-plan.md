# Test Strategy

- Unit: all 21 cases plus 5 negative/boundary cases land in `test/run.mjs`, the
  existing fixture harness. Each `test()` builds a temp repo, breaks exactly one
  thing, and asserts the expected finding fires. UT-018 uses `projectTest()`,
  which runs against the kit's own tree rather than a fixture.
- Integration: Not Applicable because the kit is one dependency-free module with
  no services, database, or network — the reason and precedent are recorded in
  test-cases.md under Not Applicable.
- API E2E: Not Applicable because the kit has no HTTP surface.
- Browser E2E: Not Applicable because `okf` is a CLI with no UI.

# Contract Stubs

| Contract | File | Signature Or Shape | Notes |
| --- | --- | --- | --- |
| `classifyChangeReference` | `lib/check.mjs` | `(text: string) => 'prose' \| 'locator'` for a single matched occurrence | The shared shape classifier from design D1. Stub throws `not implemented`; both call sites depend on it |
| `checkDurableReferences` | `lib/check.mjs` | `(root: string, report: Report) => void` | New bundle-wide scan from design D4. Stub throws `not implemented` |

# Pre-Implementation Unit Tests

| Test Case ID | Rule (BR-n) | Test File | Test Name | Initial Status | Notes |
| --- | --- | --- | --- | --- | --- |
| UT-001 | BR-1 | test/run.mjs | a sources path under openspec/changes is caught | passing | Already exists (line 384); listed to pin it as a regression guard, not to rewrite it |
| UT-002 | BR-1 | test/run.mjs | change: and quoted-text provenance are accepted | passing | Already exists (line 393); same role |
| UT-003 | BR-1 | test/run.mjs | a locator error names the durable change: form | failing: the locator must be reported at all | Asserts on message content, which no existing test does |
| UT-004 | BR-2 | test/run.mjs | a locator in an entry body is caught | failing: expected an error matching /renamed at archive time/, got none | |
| UT-005 | BR-2 | test/run.mjs | a locator inside a table cell is caught | failing: expected an error matching /renamed at archive time/, got none | |
| UT-006 | BR-2 | test/run.mjs | adding the body scan does not change the frontmatter finding | passing | Regression guard for the refactor in design's migration step 1; green before and after by design |
| UT-007 | BR-3 | test/run.mjs | the bare openspec/changes prefix is prose | passing vacuously | Guards against over-reporting, so it can only go red once the scan exists |
| UT-008 | BR-3 | test/run.mjs | the bare archive prefix is prose | passing vacuously | As UT-007 |
| UT-009 | BR-3 | test/run.mjs | a placeholder change segment is prose | passing vacuously | As UT-007 |
| UT-010 | BR-3 | test/run.mjs | a concrete change directory is a locator without a file suffix | failing: expected an error matching /renamed at archive time/, got none | |
| UT-011 | BR-4 | test/run.mjs | a locator inside a fenced block is not reported | passing vacuously | As UT-007 |
| UT-012 | BR-4 | test/run.mjs | a fenced block does not excuse a locator in sources | passing | Green via the existing frontmatter path |
| UT-013 | BR-4 | test/run.mjs | prose after a closed fence is still scanned | failing: expected an error matching /renamed at archive time/, got none | |
| UT-014 | BR-2 | test/run.mjs | a locator in log.md is caught | failing: expected an error matching /renamed at archive time/, got none | |
| UT-015 | BR-2 | test/run.mjs | index.md without a type is still exempt from the concept-document rule | passing | Guards that D3 narrows the exemption's meaning without removing it |
| UT-016 | BR-6 | test/run.mjs | an unresolvable change id is not reported | passing vacuously | As UT-007 |
| UT-017 | BR-5 | test/run.mjs | a newly added bundle file is scanned on the same terms | failing: expected an error matching /renamed at archive time/, got none | |
| UT-018 | BR-3, BR-5 | test/run.mjs | no bundle file in this repo carries a locator | passing vacuously | `projectTest`, mirroring the v0.3.1 uppercase-path guard |
| UT-019 | BR-6 | test/run.mjs | a clean run makes no claim about reference resolution | passing vacuously | As UT-007 |
| UT-020 | BR-7 | test/run.mjs | a path into an archived change is caught | failing: an archived path is a location, and the id is right there in the directory name | |
| UT-021 | BR-7 | test/run.mjs | an archived path that exists on disk is still caught | failing: expected an error matching /still a location/, got none | Fixture creates the directory before asserting |
| NEG-001 | BR-4 | test/run.mjs | a locator inside an HTML comment is not reported | passing vacuously | As UT-007 |
| NEG-002 | BR-3 | test/run.mjs | openspec/changes with no trailing slash is prose | passing vacuously | As UT-007 |
| NEG-003 | BR-2 | test/run.mjs | a file with two locators is reported | failing: one finding or two is an implementation choice; silence is not | Asserts at least one finding; does not pin the count |
| NEG-004 | BR-2 | test/run.mjs | a bundle with no markdown files does not crash | passing vacuously | As UT-007 |
| NEG-005 | BR-2 | test/run.mjs | a .tmpl file carrying a locator is not scanned | passing vacuously | As UT-007 |

**Red state recorded at 148 passed, 10 failed.** The ten failures are every case
asserting that a locator IS caught; each fails on its assertion, not on a missing
import. The rows marked `passing vacuously` assert that something is NOT reported,
so a stub that reports nothing satisfies them trivially — they are guards against
the implementation over-reporting and become meaningful only once it exists. They
are recorded honestly rather than dressed up as red, because a test that cannot
fail yet has not yet proven anything.

## Stub Form

The schema asks a contract stub to throw `not implemented`. Both stubs did, and
the suite went to 51 passed / 83 failed — every failure the throw itself, which
proves the call is reachable but tells you nothing about any rule. They were then
reduced to their null form (`classifyChangeReference` returns `'prose'`,
`checkDurableReferences` reports nothing) to get the assertion-level red state
above. Neither stub contains logic, so test-first holds: the null form of a check
is "finds nothing", and that is what makes the ten assertions speak.

# Test Data And Fixtures

| Fixture Or Data | Used By | Setup Method | Cleanup Method |
| --- | --- | --- | --- |
| Temp repo scaffold | UT-001 to UT-017, UT-019 to UT-021, NEG-001 to NEG-005 | `scaffold(root)` in test/run.mjs (line 238), already used by every existing case | `fs.rmSync` in the harness `finally` block (line 33) |
| Archived change directory | UT-021 | `write(root, 'openspec/changes/archive/2026-01-01-add-mfa/design.md', ...)` | Same harness cleanup |
| The kit's own tree | UT-018 | `projectTest` reads `KIT` directly; no fixture | None - read-only |

# Commands

## Unit

    npm test

## OpenSpec Validation

    openspec validate guard-durable-references --strict
    openspec validate okf-durable-references --strict    # after sync, per the schema's verification rule

## OKF Validation

    okf check
    okf check --archive guard-durable-references    # before archiving

# Test Change Rules

- Pre-written tests are not changed to match the implementation.
- A pre-written test may change only when the OKF entry or spec changed first, or
  the test has a mechanical bug (wrong fixture, typo, bad assertion syntax).
- When implementation reveals that a business rule must be different, stop:
  amend `.okf/features/okf-durable-references.md` and the spec first, record it
  below, then change the test and the code. Never the other way round.
- UT-001 and UT-002 are existing green tests. If the refactor in design's
  migration step 1 makes either fail, the refactor is wrong — neither test is to
  be adjusted to accommodate it.

# Test Changes After Implementation Started

| Date | Test | Reason | Rule (BR-n) Or Spec Change |
| --- | --- | --- | --- |
| 2026-08-02 | None | No pre-written test was altered. Two implementation defects surfaced instead, and both were fixed in code: the body scan double-reported a frontmatter locator (UT-006 caught it), and trailing punctuation was being absorbed into the matched path, which broke UT-018 against this repo's own bundle | None - the rules were right, the code was not |

# Known Gaps

None. Every row above is `passing` after implementation — `npm test` reports 158
passed, 0 failed. No row was left at `planned` or `skeleton`.
