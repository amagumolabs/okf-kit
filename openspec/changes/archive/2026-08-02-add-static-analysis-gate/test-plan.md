# Test Strategy

- Unit: every branch of `checkStaticAnalysis`, as fixture repositories built in a
  temp dir by `test/run.mjs`. This is the kit's only test level and the one the
  gate lives at.
- Integration: the real gate run against this repository's own change directory,
  and the whole pre-existing suite re-run to prove the new gate disturbs nothing.
- API E2E: Not Applicable because the kit exposes no network interface;
  `bin/okf.mjs` is its only entry point and the unit fixtures call `check()`
  directly.
- Browser E2E: Not Applicable because the kit is a command-line validator with no
  UI surface of any kind.

# Contract Stubs

<!--
`throw new Error('not implemented')` is the schema's example, not its rule: the
rule is that a stub carries no logic and that the test fails on its assertion.

For a reporter this repository's stub is the empty body. Every fixture asserts
that a finding WAS reported, so a no-op stub fails on the assertion - the real
red state. A throwing stub would fail the fixture on an exception instead, which
proves the function was reached and nothing about what it should report, and it
would break the twenty-odd existing tests that call `check()` for other reasons.
-->

| Contract | File | Signature Or Shape | Notes |
| --- | --- | --- | --- |
| `checkStaticAnalysis` | `lib/check.mjs` | `(verificationText, where, report, { archiveMode }) => void` | Empty body. Takes the parsed text rather than re-reading the file, matching `checkDecisionPromotion`'s shape. `changeDir` was dropped from the planned signature: unlike decision promotion this gate reads nothing outside `verification.md`, which is BR-12 visible in the type |
| Call site | `lib/check.mjs` | inside `checkVerification`, in the change-scoped block beside `checkDecisionPromotion`, but outside the `if (archiveMode)` guard | The guard is what makes a gate archive-only; this one reports at both levels through `hardensAtArchive`, so it must sit outside it (BR-9) |
| `REQUIRED_CHECKS` | `lib/check.mjs` | `['Lint', 'Typecheck']` | Named constant, so BR-10's required set has one home |

# Pre-Implementation Unit Tests

| Test Case ID | Rule (BR-n) | Test File | Test Name | Initial Status | Falsified By | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| UT-100 | BR-9 | test/run.mjs | UT-100 the clean fixture stays archivable with a satisfied static analysis table | passing: the fixture gained a satisfied table in the same task, so this locks it against a gate that fires on correct input | Making any required-row check fire on a satisfied row | |
| UT-101 | BR-9 | test/run.mjs | UT-101 archive mode blocks a verification with no static analysis table | failing: expected an error matching /Static Analysis table/, got no findings | Removing the empty-table branch from `checkStaticAnalysis` | |
| UT-102 | BR-9 | test/run.mjs | UT-102 the same verification only warns before the archive boundary | failing: expected a WARNING matching /Static Analysis table/, got no findings | Replacing `hardensAtArchive` with `report.error`, or with `report.warn` | Asserts level, and that the non-archive run has zero errors |
| UT-103 | BR-10 | test/run.mjs | UT-103 a table with no Typecheck row is blocked | failing: expected an error matching /Typecheck/, got no findings | Dropping `Typecheck` from `REQUIRED_CHECKS` | |
| UT-104 | BR-10 | test/run.mjs | UT-104 a table with no Lint row is blocked | failing: expected an error matching /Lint/, got no findings | Dropping `Lint` from `REQUIRED_CHECKS` | Both rows tested separately, so a matcher that only ever finds the first is caught |
| UT-105 | BR-11 | test/run.mjs | UT-105 a row with an empty result is blocked | failing: expected an error matching /Typecheck/, got no findings | Removing the empty-result branch | |
| UT-106b | BR-11 | test/run.mjs | UT-106b a row left as a template placeholder is reported through its empty result | failing: expected an error matching /Typecheck/, got no findings | Gating the command column instead of the result column | Replaces the original UT-106, whose premise about `checkHygiene` was false - see Test Changes below |
| UT-107 | BR-10, BR-11 | test/run.mjs | UT-107 a row discharged with a stated reason is accepted | passing: the no-op stub reports nothing, so this asserts the gate will not over-fire on a discharged row rather than that it fires | Removing the `notApplicableDeclaration` branch, which turns the stated reason into a rejected result | A guard against over-firing, which only a green-from-the-start test can be |
| UT-108 | BR-12 | test/run.mjs | UT-108 the gate reads reported results and runs nothing | passing: `lib/check.mjs` never imported `node:child_process`, so this pins an existing boundary rather than introducing one | Adding any `execSync` / `spawnSync` call to `lib/check.mjs` | Asserted over the source. An ESM import binds at import time, so patching the namespace at runtime leaves a captured binding live and the test would pass while the gate shelled out |
| UT-109 | BR-1 | test/run.mjs | UT-109 the static analysis gate reaches a change with no linked entries | failing: expected an error matching /Static Analysis table/, got no findings | Moving the call inside a branch keyed on `linked.length` | The exact failure the promotion gate already made once |
| UT-110 | BR-7 | test/run.mjs | UT-110 the schema and verification template state the table is enforced | failing: the instruction must name the artifact it demands | Describing the table as advisory in either file | Reads the shipped files from `KIT`, as the existing workflow-text assertions do |
| UT-111 | BR-10 | test/run.mjs | UT-111 an extra row is accepted and unconstrained | passing: the no-op stub reports nothing, so this asserts the required set stays a floor and never becomes a closed vocabulary | Rejecting any Check name outside `REQUIRED_CHECKS` | |
| UT-112 | BR-7 | test/run.mjs | UT-112 the test-plan template carries lint and typecheck commands | failing: the plan is where the command is chosen | Leaving the Commands section untouched | |
| UT-113 | BR-7 | test/run.mjs | UT-113 no shipped template names an ecosystem | passing: no template named one yet, so this locks the property before the section that could break it is written | Shipping `npm run lint` as a template default | The assertion that would have caught the original draft of this change |
| UT-114 | BR-7 | test/run.mjs | UT-114 the test-plan instruction names AGENTS.md as the declaration site | failing: the declaration site must be named, or every change re-derives it | Leaving the instruction silent about where commands come from | |
| NEG-101 | BR-11 | test/run.mjs | NEG-101 a result cell holding a dash is blocked | failing: expected an error matching /Typecheck/, got no findings | Treating `-` as a filled cell | `cellEmpty` already encodes this convention; the test pins it |
| NEG-102 | BR-11 | test/run.mjs | NEG-102 a bare Not Applicable with no reason is blocked | failing: expected an error matching /Typecheck/, got no findings | Accepting the phrase without applying `REASON_MIN` | |
| NEG-103 | BR-11 | test/run.mjs | NEG-103 a result reading not run is blocked | failing: expected an error matching /Typecheck/, got no findings | Dropping the non-result vocabulary | |
| NEG-104 | BR-9 | test/run.mjs | NEG-104 a table holding only the template blank row counts as empty | failing: expected an error matching /Static Analysis table/, got no findings | Counting blank rows as rows | Mirrors NEG-002 in the promotion gate |
| NEG-105 | BR-10 | test/run.mjs | NEG-105 a Check cell spelled Type check is accepted | passing: the no-op stub reports nothing, so this asserts the matcher will stay loose rather than that it is | Matching the Check column exactly instead of loosely | |

# Integration Tests

| Test Case ID | Test File | Test Name | Initial Status | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| IT-101 | (command) `npm run check:archive` | `okf check --archive add-static-analysis-gate` against this repo | skeleton | passing | Started as a skeleton because it needs this change's own `verification.md`; promoted in task 7.7 once the verification pass wrote it |
| IT-102 | test/run.mjs | the full pre-existing suite | passing | passing | Already green; the assertion is that it stays green after the shared `VERIFICATION` fixture gains a table |

# E2E Tests

Not Applicable because the kit has neither a network interface nor a UI; see
Test Strategy.

# Test Data And Fixtures

| Fixture Or Data | Used By | Setup Method | Cleanup Method |
| --- | --- | --- | --- |
| `VERIFICATION` constant | every archive-mode test | Gains a satisfied Static Analysis section, so the ~20 existing archive assertions do not start failing on the new gate | none - built per test in a temp dir |
| `setStaticAnalysis(root, rows)` | UT-101..UT-111, NEG-101..NEG-105 | New helper mirroring `setPromotion`: rewrites the Static Analysis section of the fixture's `verification.md` with the given body rows | none |
| `noChildProcess(fn)` | UT-108 | Replaces `execFileSync`, `execSync`, `spawnSync` and `spawn` on `node:child_process` with throwing stubs for the duration of `fn`, then restores them | restored in a `finally` |
| Shipped kit files under `KIT` | UT-110, UT-112, UT-113, UT-114 | Read directly from the repository, not copied into the temp dir | none |

# Commands

## Unit

    npm test

## Integration

    node bin/okf.mjs check --archive add-static-analysis-gate

## Lint

    <lint-command>

## Typecheck

    <typecheck-command>

## OpenSpec Validation

    openspec validate add-static-analysis-gate --strict

## OKF Validation

    okf check
    okf check --archive add-static-analysis-gate    # before archiving

<!--
The lint and typecheck commands above are filled from this project's declaration
in AGENTS.md, outside the okf-kit markers. This change adds that declaration and
the `lint` script it names, so both are placeholders until task group 4 lands -
which is the honest state, not an unfilled template.
-->

# Test Change Rules

- Pre-written tests are not changed to match the implementation.
- A pre-written test may change only when the OKF entry or spec changed first, or
  the test has a mechanical bug (wrong fixture, typo, bad assertion syntax).
- When implementation reveals that a business rule must be different, stop:
  amend `.okf/features/okf-archive-gate.md` and the spec first, record it below,
  then change the test and the code. Never the other way round.
- These are not grounds, and naming them here is the point - the two admissible
  grounds are a closed list, and every reason below sounds reasonable at the
  moment it is needed:
  - having run the behaviour manually and seen it work
  - intending to fix the test afterwards
  - the time already spent on the implementation
  - this case being different from the ones the rule was written for
  - the test being "too strict" about something the code does differently

# Test Changes After Implementation Started

| Date | Test | Ground | Rule (BR-n) Or Spec Change |
| --- | --- | --- | --- |
| 2026-08-02 | UT-106 (removed, replaced by UT-106b) | BR-11 changed first: it asserted that a placeholder command is caught by the existing hygiene check, which is false - `checkHygiene` is called at `lib/check.mjs:451` and `:489` only, over `.okf/` bundle files, and has never run over `openspec/changes/`. The clause was dropped rather than implemented, because extending hygiene to change artifacts flags a design that legitimately quotes a placeholder while explaining one | BR-11, and the spec scenario "A row still carrying the template placeholder" |
| 2026-08-02 | UT-108 | mechanical defect: the assertion swept every file in `lib/`, but `lib/audit.mjs` shells out to git by design. BR-12 constrains the gate, not the kit. Scoped to `lib/check.mjs`, which is where the gate lives; what the test asserts is unchanged | - |
| 2026-08-02 | UT-110 | mechanical defect: the slice boundary `indexOf('apply:')` also matches the design instruction's "Write a real design if any apply:", so the slice ran backwards and the assertion read an empty string. Anchored to `/^apply:/m`; what the test asserts is unchanged | - |

# Known Gaps

| Test Case ID | Status Left At | Reason | Owner | Follow-Up |
| --- | --- | --- | --- | --- |
