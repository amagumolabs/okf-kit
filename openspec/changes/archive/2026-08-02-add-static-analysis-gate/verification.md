# Verification

# Summary

| Area | Status | Notes |
| --- | --- | --- |
| OpenSpec validation | pass | change and the synced `okf-archive-gate` baseline spec, both `--strict` |
| Unit tests | pass | 222 passed, 0 failed - up from 202 before this change |
| Integration tests | pass | IT-101 and IT-102, both green |
| API E2E tests | not applicable | the kit exposes no network interface |
| Browser E2E tests | not applicable | the kit has no UI |
| Static analysis | pass | lint clean; no type checker in this project, discharged with a reason |
| OKF verification | pass | 6 rules evidenced, all `match` after one `okf-gap` was repaired mid-flight |
| OKF validation (`okf check`) | pass | `okf check --archive add-static-analysis-gate` exits clean |
| Archive readiness | ready | |

# OpenSpec Validation

Command:

    openspec validate add-static-analysis-gate --strict

Result:

    Change 'add-static-analysis-gate' is valid

## Synced Capability Specs

| Capability | Command | Result |
| --- | --- | --- |
| okf-archive-gate | `openspec validate okf-archive-gate --strict` | valid |

# Unit Tests

Command:

    npm test

Result:

    222 passed

Before this change the suite reported 202. Of the 20 new assertions, 14 were red
before the implementation existed and 6 were green from the start - each of those
6 recorded in test-plan.md with the reason it was green, because a bare `passing`
in an Initial Status column does not distinguish a regression guard from a test
that asserts nothing.

# Integration Tests

Command:

    npm run check:archive add-static-analysis-gate

Result:

    okf check: 0 error(s), 0 warning(s)

IT-102 (the full pre-existing suite stays green) is covered by the unit run
above: no assertion that passed before this change fails now.

# API E2E Tests

Not applicable: the kit exposes no network interface. `bin/okf.mjs` is its only
entry point, and the fixtures call `check()` directly.

# Browser E2E Tests

Not applicable: the kit is a command-line validator with no UI surface.

# Static Analysis

| Check | Command | Result |
| --- | --- | --- |
| Lint | `npm run lint` | clean - `node --check` over 9 files in `bin/`, `lib/`, `test/`, all parse. A parse check, not a rule-based lint |
| Typecheck | - | Not Applicable because this kit is plain ESM annotated with JSDoc and has adopted no type checker; adding one would introduce its first dependency, which is a decision about the kit's shape rather than a step in this change |

The Lint result deliberately states what `node --check` proves and what it does
not. Reporting it as "lint clean" would overstate a parse check, and this is the
first table written under a rule whose point is that an overstated result is
worse than an honest `Not Applicable`.

# OKF Validation

Command:

    okf check --archive add-static-analysis-gate

Result:

    okf check: 0 error(s), 0 warning(s)

# Test Traceability Review

| Requirement Or Scenario | Covered By | Gap |
| --- | --- | --- |
| A change records its static analysis results before archiving | UT-100, UT-101, UT-102, NEG-104 | none |
| Lint and type checking each hold a required row | UT-103, UT-104, UT-107, UT-111, NEG-105 | none |
| A static analysis row is satisfied by a result or a stated reason | UT-105, UT-106b, UT-107, NEG-101, NEG-102, NEG-103 | none |
| The gate reads reported results and runs nothing | UT-108 | none |
| The static analysis gate applies to a change with no linked entries | UT-109 | none |
| The workflow states that the static analysis table is enforced | UT-110, UT-112, UT-113 | none |
| A project declares its static analysis commands once | UT-114 | The instruction is asserted; whether an agent follows it is not mechanically checkable, and BR-12's boundary is why |

# OKF Verification

## Rule Evidence

| Rule (BR-n) | Capability | Evidence (file:line or test name) | Verdict | Action Taken |
| --- | --- | --- | --- | --- |
| BR-1 | okf-archive-gate | `lib/check.mjs:1364` - the call sits above the `if (archiveMode)` block and is not keyed on `linked`; UT-109 | match | none |
| BR-7 | okf-archive-gate | `openspec/schemas/okf-gated-feature/schema.yaml:519` and `templates/verification.md:85`, both stating the table is enforced; UT-110 | match | none |
| BR-9 | okf-archive-gate | `lib/check.mjs:1279` (`hardensAtArchive`) and `:1284-1288` (the empty-table finding); UT-101, UT-102 | match | none |
| BR-10 | okf-archive-gate | `lib/check.mjs:1255` (`REQUIRED_CHECKS`) and `:1316-1322` (the missing-row loop); UT-103, UT-104, UT-111 | match | none |
| BR-11 | okf-archive-gate | `lib/check.mjs:1301` (empty or non-result) and `:1307-1313` (`notApplicableDeclaration` against `REASON_MIN`); UT-105, NEG-101, NEG-102, NEG-103 | okf-gap | The rule asserted that a placeholder command is caught by the existing hygiene check. It is not: `checkHygiene` is called at `lib/check.mjs:451` and `:489` only, over `.okf/` bundle files, and has never run over `openspec/changes/`. The clause was removed from BR-11 before the spec, the test-plan row, the test and the code were touched - see test-plan.md Test Changes. A risk row now records that change-artifact placeholders are unchecked, and why extending hygiene there needs a fencing convention first |
| BR-12 | okf-archive-gate | test `UT-108 the gate reads reported results and runs nothing` in `test/run.mjs:1598`, asserting over the source of `lib/check.mjs` that it imports no subprocess API | match | none |

## Section Review

| Section | Capability | Checked Against | Result |
| --- | --- | --- | --- |
| Domain Terms | okf-archive-gate | The two terms added by this change (`Static analysis`, `Reported result`) against `lib/check.mjs:1255-1323` | accurate - `Reported result` names exactly the boundary UT-108 pins |
| Data Entities | okf-archive-gate | The Static Analysis table entry against the shipped template at `templates/verification.md:85-114` | accurate - three columns, Lint and Typecheck required, further rows unconstrained |
| Workflows | okf-archive-gate | Step 6 and the two new failure paths against `checkVerification` at `lib/check.mjs:1355-1370` | accurate - the in-flight warning and archive error are the `hardensAtArchive` split |
| Permissions And Access Control | okf-archive-gate | - | section does not exist in this entry and was not added; the capability has no actor-permission dimension |

## Entry Outcome

| Capability | OKF File | Resulting Verified | verified_at | code_paths Filled | This Change Removed From pending_changes |
| --- | --- | --- | --- | --- | --- |
| okf-archive-gate | `.okf/features/okf-archive-gate.md` | verified | 2026-08-02 | yes | yes |

## Decision Promotion

| Decision | Promoted To | Reason If Not Promoted |
| --- | --- | --- |
| The kit reads the reported result and runs nothing | `.okf/decisions/2026-08-02-the-kit-records-reported-evidence-it-does-not-reproduce-it.md` | - |
| A project declares its commands once, in its own AGENTS.md | `.okf/decisions/2026-08-02-a-project-declares-its-commands-in-its-own-agents-file.md` | - |
| The record is a table, not a Command/Result prose block | - | change-local: it describes the shape of one section in one template, and the reason - a gate needs columns - is already stated in the template itself |
| The required rows are named by category, not by tool | - | change-local: it is BR-10 restated as an implementation note, and BR-10 is where it now lives durably |
| Severity follows `hardensAtArchive` rather than the version-gated promotion | - | change-local: it applies two existing decisions (`required-records-harden-at-the-archive-boundary` and `a-new-invariant-starts-as-a-warning`) to this gate, and settles nothing they do not already settle |
| Placeholder detection is not reimplemented | - | change-local, and overtaken: the premise turned out to be false during implementation, and what survives of it is the BR-11 correction and the risk row, both recorded in the entry |

# Known Gaps And Accepted Risks

| Gap Or Risk | Impact | Owner | Follow-Up |
| --- | --- | --- | --- |
| A reported result can be wrong or invented | The gate passes on a claim nobody checked | change author | Accepted deliberately (BR-12), and recorded in the entry's risk table plus the promoted decision. Revisit only on a concrete case of a false result that review missed |
| Unfilled `<placeholder>` text in a change artifact is reported nowhere | A change can archive carrying template text | change author | Needs a fencing convention before `checkHygiene` can extend to `openspec/changes/` - a design doc legitimately quotes placeholders while explaining them. Its own change. Exposure for this gate is nil: an unfilled row has no result, which BR-11 catches |
| `npm run lint` is a parse check, not a rule-based lint | This repo's Lint row proves less than the row name suggests | change author | Stated verbatim in the Static Analysis result and in the `AGENTS.md` declaration. Adopting a real linter is a decision about the kit's dependency-free shape, not a step in this change |

# Archive Readiness

- [x] OpenSpec validation passed for the change
- [x] `openspec validate okf-archive-gate --strict` passed for the spec synced into `openspec/specs/`
- [x] Tasks complete, or remaining items explicitly deferred
- [x] Unit test result recorded
- [x] Integration test result recorded
- [x] E2E result recorded, or marked not applicable with a specific reason
- [x] Static Analysis table filled: a real result per required row, or a stated reason
- [x] Every `skeleton` / `planned` test row appears in the test-plan Known Gaps with an owner
- [x] Rule Evidence table filled with real `file:line` or test references for every BR-n touched
- [x] Every linked entry: `verified` set, `verified_at` set, `code_paths` filled, this change id removed from `pending_changes`
- [x] `needs-revision` entries (if any) recorded in the `.okf/index.md` Needs Revision Ledger - none arose
- [x] Durable decisions promoted to `.okf/decisions/`, or explicitly skipped with a reason
- [x] `okf check --archive add-static-analysis-gate` exits clean
- [x] Proof boundaries are honest and explicit
