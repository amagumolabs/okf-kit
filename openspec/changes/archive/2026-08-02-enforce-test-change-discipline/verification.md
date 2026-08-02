# Verification

# Summary

| Area | Status | Notes |
| --- | --- | --- |
| OpenSpec validation | passed | Change and the `test-first-gate` baseline spec, both `--strict` |
| Unit tests | passed | 183 passed, 0 failed, 0 todo |
| Integration tests | passed | IT-101 - IT-103 promoted from skeleton and green |
| API E2E tests | not applicable | The kit ships a CLI and a schema payload; there is no HTTP surface |
| Browser E2E tests | not applicable | No UI exists in this repo, and none is added |
| OKF verification | passed | `test-first-gate` re-verified; BR-8, BR-9, BR-10 added and evidenced |
| OKF validation (`okf check`) | passed | 0 errors; one pre-existing warning on `okf-archive-gate.md` |
| Archive readiness | ready | `okf check --archive` exits clean |

# OpenSpec Validation

Command:

    openspec validate enforce-test-change-discipline --strict

Result:

    Change 'enforce-test-change-discipline' is valid

## Synced Capability Specs

| Capability | Command | Result |
| --- | --- | --- |
| test-first-gate | `openspec validate test-first-gate --strict` | `Specification 'test-first-gate' is valid` |

# Unit Tests

Command:

    npm test

Result:

    183 passed

Five of the eight unit cases were red on their assertions before implementation:
UT-101, UT-102, UT-103, UT-105 and NEG-101 each reported no error matching the
pattern they expect, against a `testChangeGround` stub that was never reached
because nothing called it. UT-104, UT-106 and NEG-102 are the "must stay clean"
direction - a declared defect, an empty table, a resolving citation - and started
green by construction; test-plan.md records that per row rather than claiming a
red state they never had.

# Integration Tests

Command:

    npm test

Result:

    183 passed

IT-101 - IT-103 were registered as `todo()` skeletons before the implementation
group and reported as `TODO` in the run summary, then promoted in group 5.

# API E2E Tests

Command:

    # Not Applicable

Result: Not applicable because the kit ships a CLI and a schema payload, with no
HTTP surface to exercise black-box. Recorded in test-cases.md Not Applicable.

# Browser E2E Tests

Command:

    # Not Applicable

Result: Not applicable because this repo has no UI and this change adds none.
Recorded in test-cases.md Not Applicable.

# OKF Validation

Command:

    node bin/okf.mjs check --archive enforce-test-change-discipline

Result:

    okf check: 0 error(s), 1 warning(s)

The single warning is pre-existing and unrelated: `.okf/features/okf-archive-gate.md`
is `verified` but carries no `verified[]` attestation, a leftover of the earlier
migration.

# Test Traceability Review

| Requirement Or Scenario | Covered By | Gap |
| --- | --- | --- |
| The implementation adapts to the tests, not the reverse | IT-101, IT-102 | The check reads the shipped instruction, not what an agent actually did - see Known Gaps |
| Every recorded test change carries a ground that resolves | UT-101 - UT-106, NEG-101, NEG-102 | Reaches recorded rows only; an unrecorded test change is invisible |
| The test-plan template shows both admissible grounds | IT-103 | None |

# OKF Verification

## Rule Evidence

| Rule (BR-n) | Capability | Evidence (file:line or test name) | Verdict | Action Taken |
| --- | --- | --- | --- | --- |
| BR-8 | test-first-gate | `openspec/schemas/okf-gated-feature/templates/tasks.md:50` (implementation group states the direction), `schema.yaml:337-341`; tests `IT-101`, `UT-104` | match | none |
| BR-9 | test-first-gate | `lib/check.mjs:853` (`testChangeGround`), `lib/check.mjs:873-921` (`checkTestChanges`), `templates/test-plan.md:148` (the `Ground` column); tests `UT-101` - `UT-106`, `NEG-101`, `NEG-102`, `IT-103` | match | none |
| BR-10 | test-first-gate | `openspec/schemas/okf-gated-feature/schema.yaml:342` (the order of repair); test `IT-102` | match | none |

BR-1 through BR-7 are untouched by this change and carry their evidence from the
`skeleton-tests-before-implementation` pass, recorded in the entry's Verification
History. BR-2 and BR-3 remain without an evidence row for the reasons stated
there.

## Section Review

| Section | Capability | Checked Against | Result |
| --- | --- | --- | --- |
| Domain Terms | test-first-gate | `templates/test-plan.md` Test Changes comment, `templates/tasks.md` implementation group | Accurate; `Pre-written test`, `Ground for a test change` and `Mechanical defect` added by this change and match the shipped wording |
| Data Entities | test-first-gate | - | Section absent from the entry - this capability has no domain entities |
| Permissions And Access Control | test-first-gate | - | Section absent from the entry - no actor is denied anything by this gate |
| Workflows | test-first-gate | `templates/tasks.md` implementation group, `schema.yaml` tasks instruction | Accurate; the entry's failure workflows now name the contradiction case and the mechanical-defect case, both of which the shipped artifacts describe the same way |

## Entry Outcome

| Capability | OKF File | Resulting Verified | verified_at | code_paths Filled | This Change Removed From pending_changes |
| --- | --- | --- | --- | --- | --- |
| test-first-gate | `.okf/features/test-first-gate.md` | verified | 2026-08-02 | yes | yes |

## Decision Promotion

| Decision | Promoted To | Reason If Not Promoted |
| --- | --- | --- |
| D1: The row answers with a citation or a declared defect, never with silence | `.okf/decisions/2026-08-02-a-test-change-answers-with-a-citation-or-a-named-defect.md` | - |
| D2: These findings are errors, not warnings | - | Change-local: it reads the scope of the standing decision `.okf/decisions/2026-08-01-a-new-invariant-starts-as-a-warning.md` and finds this check outside it. Promoting it would file a second opinion about a rule that already has a home |
| D3: The check reaches the recorded case only, and says so | `.okf/decisions/2026-08-02-the-check-reaches-the-recorded-test-change-only.md` | - |

# Known Gaps And Accepted Risks

| Gap Or Risk | Impact | Owner | Follow-Up |
| --- | --- | --- | --- |
| An unrecorded test change is invisible | A change that bends its assertions and writes no row passes every check | danh | None planned - stated as a boundary in D3, `docs/openspec-okf-workflow.md` §7, and the entry's Risks table |
| The check taxes honesty | Recording a test change costs a citation; hiding one costs nothing | danh | Mitigated only by keeping the cost to one column; reviewed as part of the `.okf` and test diff |
| The agent that wrote this implementation also ran its verification pass | Rule Evidence was gathered by a non-neutral judge | danh | Entry is `criticality: normal`; a reviewer reading the diff is the intended backstop |

One test changed after implementation started, and is recorded in test-plan.md
with its ground: `IT-102` had a mechanical defect in how it asserted - `indexOf`
over the whole `tasks` instruction matched "spec" and "code" in unrelated earlier
prose - and was scoped to the order-of-repair sentence. What the test claims is
unchanged. This is the first row that table has ever carried, and it was written
under the rule this change introduces.

# Archive Readiness

- [x] OpenSpec validation passed for the change
- [x] `openspec validate <capability> --strict` passed for every spec synced into `openspec/specs/`
- [x] Tasks complete, or remaining items explicitly deferred
- [x] Unit test result recorded
- [x] Integration test result recorded
- [x] E2E result recorded, or marked not applicable with a specific reason
- [x] Every `skeleton` / `planned` test row appears in the test-plan Known Gaps with an owner
- [x] Rule Evidence table filled with real `file:line` or test references for every BR-n touched
- [x] Every linked entry: `verified` set, `verified_at` set, `code_paths` filled, this change id removed from `pending_changes`
- [x] `needs-revision` entries (if any) recorded in the `.okf/index.md` Needs Revision Ledger
- [x] Durable decisions promoted to `.okf/decisions/`, or explicitly skipped with a reason (enforced - see Decision Promotion above)
- [x] `okf check --archive <change-id>` exits clean
- [x] Proof boundaries are honest and explicit
