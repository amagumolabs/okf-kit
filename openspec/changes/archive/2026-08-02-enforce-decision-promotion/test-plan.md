# Test Plan

# Test Strategy

- Unit: every rule case runs through `test/run.mjs`, the existing dependency-free
  harness - build a temp repo with `scaffold()`, break exactly one thing, assert
  the finding fires at the right level. `check()` is the public contract; nothing
  reaches into `checkVerification` or the row loop directly.
- Integration: Not Applicable because the kit is one module with no services,
  database, or network, and the unit fixtures already build a real repo on disk
  and run the whole of `check()` over it. A separate layer would re-run identical
  code paths under a second name.
- API E2E: one subprocess case through `bin/okf.mjs`, because the warning-versus-error
  tier in BR-6 is only observable as an exit status, and exit status is not
  visible from `check()`'s return value.
- Browser E2E: Not Applicable because `okf` is a CLI with no UI.

# Status Vocabulary

Only `planned`, `skeleton`, `failing`, `passing` are used below.

# Contract Stubs

| Contract | File | Signature Or Shape | Notes |
| --- | --- | --- | --- |
| `designShape(text)` | lib/check.mjs | `(text: string) => 'waived' \| 'has-decisions' \| 'unrecognised'` | Body throws `not implemented`. Reading `design.md` is the only inference this change makes, so it gets its own name rather than being inlined into the gate |
| `countDecisions(text)` | lib/check.mjs | `(text: string) => number` | Body throws `not implemented`. Deliberately heuristic per the design, which is why only BR-6 depends on it |
| `checkDecisionPromotion(root, changeDir, verificationText, where, report)` | lib/check.mjs | `(...) => void`, reports findings | Empty body, NOT throwing, unlike the two above. A throwing stub at this call site would crash `check()` and take all 68 existing tests down, so every new test would fail on the crash rather than on its own assertion - the scaffolding noise the stub rule exists to prevent. An empty body holds no logic and yields the real red state, "expected an error, got none". The two helpers above stay throwing because nothing reaches them until this one is implemented |

No stub contains logic. `scaffold()` in `test/run.mjs` also gains a `design.md`
and a Decision Promotion table; that is fixture data, not a stub, and it must land
with the tests rather than with the implementation - without it every archive-mode
test would fail on an unrecognised design shape instead of on its own assertion.

# Pre-Implementation Unit Tests

<!--
Nine of these rows record `passing` before implementation. They are negative-space
guards: each asserts the ABSENCE of a finding, so no implementation can make one go
red first. Recording them as `failing` would be a lie, and dropping them would
remove the only thing standing between this change and over-correction - BR-1 is
one bad edit away from making every no-domain-knowledge change fail on rule
evidence it could not possibly have. The nineteen assertions that could go red did.
-->

| Test Case ID | Rule (BR-n) | Test File | Test Name | Initial Status | Notes |
| --- | --- | --- | --- | --- | --- |
| UT-001 | BR-4 | test/run.mjs | archive mode blocks a design with decisions and an empty promotion table | failing: expected an error matching /Decision Promotion table is empty/, got none | - |
| UT-002 | BR-3 | test/run.mjs | a design waived with a reason needs no promotion row | passing: guard, asserts the waiver produces no finding | - |
| UT-003 | BR-5 | test/run.mjs | a promotion row pointing at a real decision file is accepted | passing: guard, asserts a satisfied row produces no finding | - |
| UT-004 | BR-5 | test/run.mjs | a promotion row pointing at a missing decision file is caught | failing: expected an error matching /does not exist on disk/, got none | - |
| UT-005 | BR-5 | test/run.mjs | a promotion row with a reason and no target is accepted | passing: guard, asserts a reason discharges a row | - |
| UT-006 | BR-5 | test/run.mjs | a promotion row with neither a target nor a reason is caught | failing: expected an error matching /neither a promoted path nor a reason/, got none | - |
| UT-007 | BR-8 | test/run.mjs | an unrecognised design shape requires a promotion row | failing: expected an error matching /cannot be waived/, got none | - |
| UT-008 | BR-6 | test/run.mjs | fewer promotion rows than decisions is a warning, not an error | failing: warning count 0 !== 1 | Asserts on `report.errors` being empty as well as on the warning |
| UT-009 | BR-4, BR-6 | test/run.mjs | a row per decision reports nothing | passing: guard, asserts the fixture's two-for-two table stays silent | - |
| UT-010 | BR-1 | test/run.mjs | a change declaring only "no domain knowledge" is still gated on decisions | failing: expected an error matching /Decision Promotion table is empty/, got none | The regression this change exists for |
| UT-011 | BR-2 | test/run.mjs | a change with no okf-link.md reports the missing artifact, not a promotion gap | passing: guard, the missing-artifact error already existed | - |
| UT-012 | BR-1 | test/run.mjs | entry-scoped gates stay silent when no okf-link row resolves | passing: guard, entry-scoped gates were already correctly scoped | Guards against over-correcting BR-1 into false rule-evidence errors |
| UT-013 | BR-7 | test/run.mjs | the clean fixture stays archivable with a satisfied promotion table | passing: guard, asserts the happy path stays reachable | Complements the harness's existing clean-fixture assertion |
| UT-014 | BR-6 | test/run.mjs | bold-paragraph and numbered decision syntaxes count alike | failing: warning count 0 !== 1 for the numbered style | - |
| UT-015 | BR-7, BR-8 | test/run.mjs | the waiver phrase the gate matches occurs in the schema own design rule | passing: guard, the schema already mandates the phrase; it fails if that stops being true | Reads `openspec/schemas/okf-gated-feature/schema.yaml` from the kit, not from a fixture |
| NEG-001 | BR-5 | test/run.mjs | a promotion target outside .okf/decisions/ is caught | failing: expected an error matching /not under .okf\/decisions/, got none | - |
| NEG-002 | BR-4 | test/run.mjs | a promotion table holding only the template blank row counts as empty | failing: expected an error matching /Decision Promotion table is empty/, got none | - |
| NEG-003 | BR-8 | test/run.mjs | an empty design.md requires a promotion row | failing: expected an error matching /cannot be waived/, got none | - |
| NEG-004 | BR-6 | test/run.mjs | a Decisions section with no recognisable decision counts zero | passing: guard, asserts zero counted decisions produce no warning | - |

# E2E Tests

| Test Case ID | Test File | Test Name | Status | Notes |
| --- | --- | --- | --- | --- |
| E2E-001 | test/run.mjs | a promotion warning alone exits 0 and reports ready to archive | failing: expected output matching /okf check: 0 error(s), 1 warning(s)/, got a clean run | Runs `node bin/okf.mjs check --archive` via `execFileSync` against a temp repo, the same way the harness already shells out |

# Test Data And Fixtures

| Fixture Or Data | Used By | Setup Method | Cleanup Method |
| --- | --- | --- | --- |
| `scaffold()` temp repo | every unit case and E2E-001 | Existing `test/run.mjs` helper, extended with a `design.md` holding two decisions and a satisfied Decision Promotion table in `VERIFICATION` | Existing `fs.rmSync` in the harness's `test()` wrapper |
| `DESIGN` fixture constant | UT-001, UT-002, UT-007, UT-008, UT-009, UT-014, NEG-003, NEG-004 | New constant in `test/run.mjs` plus per-test `edit()` calls that rewrite it into the shape under test | Per-test temp dir removal |
| A real decision file under `.okf/decisions/` | UT-003, UT-013 | `write(root, '.okf/decisions/2026-07-30-<slug>.md', ...)` using `.okf/templates/decision.template.md` as the shape | Per-test temp dir removal |
| Kit schema on disk | UT-015 | Read `openspec/schemas/okf-gated-feature/schema.yaml` from `KIT`, the constant the harness already defines | None; read-only |

# Commands

## Unit

    npm test

## API E2E

    npm test

## OpenSpec Validation

    npx openspec validate enforce-decision-promotion --strict
    npx openspec validate okf-archive-gate --strict

## OKF Validation

    node bin/okf.mjs check
    node bin/okf.mjs check --archive enforce-decision-promotion

# Test Change Rules

- Pre-written tests are not changed to match the implementation.
- A pre-written test may change only when the OKF entry or spec changed first, or
  the test has a mechanical bug (wrong fixture, typo, bad assertion syntax).
- When implementation reveals that a business rule must be different, stop:
  amend `.okf/features/okf-archive-gate.md` and the spec first, record it below,
  then change the test and the code. Never the other way round.

# Test Changes After Implementation Started

<!-- No rows yet: implementation has not started. -->

| Date | Test | Reason | Rule (BR-n) Or Spec Change |
| --- | --- | --- | --- |

# Known Gaps

<!--
Resolved rather than carried forward: no row is left at `planned` or `skeleton`.
All 20 cases are implemented and `passing`; `npm test` reports 88 passed, up from
the 68 that existed before this change.
-->

| Test Case ID | Status Left At | Reason | Owner | Follow-Up |
| --- | --- | --- | --- | --- |
