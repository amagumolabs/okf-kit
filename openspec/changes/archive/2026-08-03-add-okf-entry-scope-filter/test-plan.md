# Test Strategy

- Unit: the shipped instruction, template and addendum text, read from the
  repository at test time. This change produces no runtime behaviour, so the text
  is the artefact and the assertions are over it.
- Integration: the finding count on this repository is unchanged, plus the prior
  suite.
- API E2E: Not Applicable because the kit exposes no network interface.
- Browser E2E: Not Applicable because the kit has no user interface.

# Contract Stubs

<!--
None needed, and that is worth stating rather than leaving as an empty section.
This change adds no function and no call site: every assertion reads a shipped
file, and each one is red until the text it looks for is written. The stub step
exists so a unit test can fail on its assertion instead of on a missing import,
and a test that reads a file has no import to miss.
-->

Not required because this change adds no code surface - every test reads a
shipped file, so nothing has to exist before a test can fail on its assertion.

# Pre-Implementation Unit Tests

| Test Case ID | Rule (BR-n) | Test File | Test Name | Initial Status | Falsified By | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| UT-501 | BR-14 | test/run.mjs | UT-501 the okf-link instruction names what does not belong in an entry | failing: the filter must name content that does not belong | Removing the filter from the instruction | |
| UT-502 | BR-15 | test/run.mjs | UT-502 the durability test asks about a second change, not about truth | failing: the durability test is a question about a second change | Rewording the test as "is this durable", which anyone who just wrote the line answers yes | The assertion that keeps the rule from collapsing into the thing it replaces |
| UT-503 | BR-14 | test/run.mjs | UT-503 the feature template carries the same filter | failing: an agent creating an entry reads the template, not the schema | Stating it only in the schema, where an agent creating an entry may not look | |
| UT-504 | BR-14 | test/run.mjs | UT-504 the verification section review directs removal of change-local detail | failing: the section review must name the content to remove | Leaving the section review about staleness only | |
| UT-505 | BR-16 | test/run.mjs | UT-505 the proposal instruction says a question the entry answers is not asked | failing: the rule is about what the entry already answers, not a blanket ban on questions | Leaving the instruction silent, so reading the entry has no consequence | |
| UT-506 | BR-17 | test/run.mjs | UT-506 the same instruction names Assumptions and Open Questions as what generates a question | failing: shipping BR-16 alone produces assuming instead of asking | Shipping BR-16 alone, which produces assuming instead of asking | Deliberately a separate test: the two halves fail independently, and shipping one is the failure mode |
| UT-507 | BR-16, BR-17 | test/run.mjs | UT-507 the addendum carries the rule and is identical in both marker files | failing: the addendum must carry BR-16 | Editing one marker file and not the other | Extends the existing marker-agreement assertion rather than replacing it |
| UT-508 | - | test/run.mjs | UT-508 the clean fixture produces the same findings as before | passing: findings.length === 0 on the clean fixture | Adding any finding to `lib/check.mjs` for this change | The test that makes "this change adds no check" a claim rather than an intention |

# Integration Tests

| Test Case ID | Test File | Test Name | Initial Status | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| IT-501 | (command) `npm run check` | the finding count on this repository | passing | passing | Green now and required to stay green; recorded because an unchanged count is this change's central claim |
| IT-502 | test/run.mjs | the full prior suite | passing | passing | Already green |

# E2E Tests

Not Applicable because the kit has neither a network interface nor a UI.

# Test Data And Fixtures

| Fixture Or Data | Used By | Setup Method | Cleanup Method |
| --- | --- | --- | --- |
| Shipped schema, template and marker files under `KIT` | UT-501..UT-507 | Read from the repository directly, as the existing workflow-text assertions do | none |
| `instructionFor(schema, artifactId)` | UT-501, UT-502, UT-504, UT-505, UT-506 | New helper slicing one artifact's instruction out of the schema, anchored at line start - a bare `indexOf` on the next id matched prose inside an earlier instruction once already | none |
| Baseline finding count | UT-508 | Captured from the clean fixture before this change and asserted equal after | none |

# Commands

## Unit

    npm test

## Integration

    node bin/okf.mjs check

## Lint

    npm run lint

## Typecheck

    Not Applicable because this kit is plain ESM with JSDoc and has adopted no type checker - see the declaration in AGENTS.md

## OpenSpec Validation

    openspec validate add-okf-entry-scope-filter --strict

## OKF Validation

    okf check
    okf check --archive add-okf-entry-scope-filter    # before archiving

# Test Change Rules

- Pre-written tests are not changed to match the implementation.
- A pre-written test may change only when the OKF entry or spec changed first, or
  the test has a mechanical bug (wrong fixture, typo, bad assertion syntax).
- When implementation reveals that a business rule must be different, stop:
  amend `.okf/features/okf-bundle-format.md` and the spec first, record it below,
  then change the test and the code. Never the other way round.
- These are not grounds, and naming them here is the point:
  - having run the behaviour manually and seen it work
  - intending to fix the test afterwards
  - the time already spent on the implementation
  - this case being different from the ones the rule was written for
  - the test being "too strict" about something the code does differently

# Test Changes After Implementation Started

| Date | Test | Ground | Rule (BR-n) Or Spec Change |
| --- | --- | --- | --- |

# Known Gaps

<!-- Empty: no test row starts at `planned` or `skeleton`, because every assertion reads a file that exists. -->

| Test Case ID | Status Left At | Reason | Owner | Follow-Up |
| --- | --- | --- | --- | --- |
