# Test Strategy

- Unit: every branch of the widened scan, as fixture repositories in a temp dir.
- Integration: the real repository, plus the whole prior suite re-run.
- API E2E: Not Applicable because the kit exposes no network interface.
- Browser E2E: Not Applicable because the kit has no UI.

# Contract Stubs

| Contract | File | Signature Or Shape | Notes |
| --- | --- | --- | --- |
| `stripCodeSpans` | `lib/check.mjs` | `(text: string) => string` | Empty body returning its input unchanged. A no-op is the logic-free stub for a text transform, and it makes the exemption tests fail on their assertion rather than on an exception |
| Call site | `lib/check.mjs` | `checkHygiene(where, text, report, { archiveMode })` called from the change-artifact walk in `checkChange` | The extra parameter is what lets one implementation report at two severities |

# Pre-Implementation Unit Tests

| Test Case ID | Rule (BR-n) | Test File | Test Name | Initial Status | Falsified By | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| UT-200 | BR-1 | test/run.mjs | UT-200 the clean fixture carries no hygiene finding on a change artifact | passing: vacuous at the stub stage - `checkChangeHygiene` scans nothing, so no finding is possible yet. It becomes an assertion at task 4.3 | Making the widened scan fire on clean input | Predicted red. It is not: the fixture's change artifacts turned out to hold no residue, so nothing had to be removed |
| UT-201 | BR-1, BR-5 | test/run.mjs | UT-201 a placeholder in a change artifact warns in flight | failing: expected 1 warning matching /unfilled placeholder/, got 0 | Removing the `checkHygiene` call from the change walk | |
| UT-202 | BR-5 | test/run.mjs | UT-202 the same placeholder errors at archive | failing: expected an error matching /unfilled placeholder/, the report held none | Passing a fixed reporter instead of `hardensAtArchive` | |
| UT-203 | BR-2, BR-4 | test/run.mjs | UT-203 a placeholder inside an inline code span is not residue | passing: vacuous at the stub stage for the same reason as UT-200; red once the walk lands and `stripCodeSpans` is still a no-op | Removing `stripCodeSpans` from the scan | |
| UT-204 | BR-2 | test/run.mjs | UT-204 a placeholder inside a fenced block is not residue | passing: `stripFences` already ran, so this pins existing behaviour against the code-span change breaking it | Stripping spans before fences, so a stray backtick swallows the fence | A regression guard, which only a green-from-the-start test can be |
| UT-205 | BR-4 | test/run.mjs | UT-205 the code-span exemption applies to bundle files too | failing: got `[error] .okf/features/user-auth.md: unfilled placeholder(s): <the capability this change touches>` | Stripping spans only on the change-artifact path | The assertion that keeps one rule from becoming two |
| UT-206 | BR-1 | test/run.mjs | UT-206 a blank table row in a change artifact is reported | failing: expected an error matching /empty table row/, the report held none | Scanning only for placeholders on the change path | |
| UT-207 | BR-6 | test/run.mjs | UT-207 a leftover instruction comment warns then errors | failing: expected 1 warning matching /template instruction comment/, got 0 | Leaving the comment finding at a fixed warn level | |
| UT-208 | BR-3 | test/run.mjs | UT-208 no file is excused by name | passing: no allowlist exists yet, so this locks the property before the change that could introduce one | Adding a path or filename exemption to silence a false positive | The test that makes BR-3 enforceable rather than aspirational |
| UT-209 | BR-1 | test/run.mjs | UT-209 an archived change is not scanned | passing: vacuous at the stub stage, and still green after 4.3 because `activeChangeIds` never yields `archive` and the walk skips it again | Walking `openspec/changes/` without excluding `archive/` | Predicted red. Two independent guards mean no implementation step ever makes it red |
| NEG-201 | BR-1 | test/run.mjs | NEG-201 a bare list item in a change artifact is reported | failing: expected an error matching /empty list item/, the report held none | As UT-206 | |
| NEG-202 | BR-1 | test/run.mjs | NEG-202 an autolink is not reported | passing: inherited from the existing heuristic, and pinned here because widening the scan is what would expose a regression in it | Removing the autolink skip | |
| NEG-203 | BR-1 | test/run.mjs | NEG-203 a stray HTML tag is not reported | passing: same inheritance, same reason | Removing the stray-tag skip | |
| NEG-204 | BR-4 | test/run.mjs | NEG-204 a fence containing a backtick does not swallow the rest of the file | failing: expected an error matching /unfilled placeholder/, the report held none | Stripping spans before fences | The ordering bug this test exists to prevent is invisible without it |
| NEG-205 | BR-4 | test/run.mjs | NEG-205 an unbalanced backtick does not swallow the rest of the file | failing: expected an error matching /unfilled placeholder/, the report held none | A greedy code-span pattern | |
| UT-210 | BR-2, BR-6 | test/run.mjs | UT-210 the marker named inside a code span is not the comment finding | failing: got a warn on `.okf/features/user-auth.md` and an error on `openspec/changes/add-mfa/design.md`, both reading "still carries the template instruction comment" | Testing the raw text for the marker again, or stripping comments before looking for it | Not pre-implementation, and recorded as what it is: written during the verification pass, after `okf check` reported this change's own verification.md for naming the marker it had to explain. Red on its assertion when written, green after the one-line fix |

# Integration Tests

| Test Case ID | Test File | Test Name | Initial Status | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| IT-201 | (command) `node bin/okf.mjs check` | `okf check` against this repository | skeleton | passing | 0 errors, 28 warnings - the same 28 the pre-change checker reports against the same tree, so the widened scan added none. A probe file carrying a slot, written under `specs/artifact-hygiene/` and deleted after, was reported, so the silence is a clean result rather than a walk that never ran |
| IT-202 | test/run.mjs | the full prior suite | passing | passing | Already green; the assertion is that it stays green |

# E2E Tests

Not Applicable because the kit has neither a network interface nor a UI; see
Test Strategy.

# Test Data And Fixtures

| Fixture Or Data | Used By | Setup Method | Cleanup Method |
| --- | --- | --- | --- |
| `setArtifact(root, name, text)` | UT-201..UT-207, NEG-201..NEG-205 | New helper writing one change artifact verbatim, so a fixture's residue is visible in the test rather than patched in by a replace that might match nothing | none - temp dir per test |
| An archived change directory | UT-209 | Written under `openspec/changes/archive/2026-01-01-old/` carrying obvious residue | none |
| `hygieneFindings(report)` | all | Findings whose message matches the hygiene vocabulary, at any level | none |

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

    openspec validate add-change-artifact-hygiene --strict

## OKF Validation

    okf check
    okf check --archive add-change-artifact-hygiene    # before archiving

# Test Change Rules

- Pre-written tests are not changed to match the implementation.
- A pre-written test may change only when the OKF entry or spec changed first, or
  the test has a mechanical bug (wrong fixture, typo, bad assertion syntax).
- When implementation reveals that a business rule must be different, stop:
  amend `.okf/features/artifact-hygiene.md` and the spec first, record it below,
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
| 2026-08-02 | IT-005 a plan filled from the new template checks clean | Mechanical defect: the fixture filled the strategy bullets and both test tables but left the shipped template's Commands section untouched, so it stopped representing an honestly filled plan the moment the scan reached that section. Its assertion is unchanged - the fixture now fills the six command and change-id slots it always should have | - |

# Known Gaps

| Test Case ID | Status Left At | Reason | Owner | Follow-Up |
| --- | --- | --- | --- | --- |
