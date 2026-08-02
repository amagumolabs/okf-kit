# Verification

# Summary

| Area | Status | Notes |
| --- | --- | --- |
| OpenSpec validation | pass | change and the `test-first-gate` baseline both `--strict` clean |
| Unit tests | pass | 202 passed, 0 failed, 0 todo |
| Integration tests | pass | IT-201 – IT-204 promoted from skeleton and green |
| API E2E tests | not applicable | the kit ships a CLI and a schema payload; no HTTP surface |
| Browser E2E tests | not applicable | no UI in this repo, and this change adds none |
| OKF verification | pass | BR-3, BR-5, BR-8, BR-11, BR-12 re-checked against the code as written |
| OKF validation (`okf check`) | pass | 0 errors; one pre-existing warning on an unrelated entry |
| Archive readiness | ready | see the checklist below |

# OpenSpec Validation

Command:

    openspec validate require-tests-that-can-fail --strict

Result:

    Change 'require-tests-that-can-fail' is valid

## Synced Capability Specs

| Capability | Command | Result |
| --- | --- | --- |
| test-first-gate | `openspec validate test-first-gate --strict` | `Specification 'test-first-gate' is valid` — run against the current baseline before the delta is synced |

# Unit Tests

Command:

    npm test

Result:

    202 passed

Before implementation the same command reported `190 passed, 8 failed, 4 todo`.
The eight failures are the rows recorded as `failing: …` in test-plan.md, and the
four todos are the integration skeletons.

# Integration Tests

Command:

    npm test

Result: IT-201 – IT-204 were declared with the harness's `todo()` in task group 3,
appeared as `4 todo` in the run above, and were promoted in group 5. All four
assert against the shipped payload rather than a fixture copy of it.

# API E2E Tests

Not applicable. The capability is a static checker plus markdown templates; there
is no HTTP surface to drive black-box. Declared under Test Strategy in
test-plan.md with the same reason.

# Browser E2E Tests

Not applicable. This repo has no UI and this change adds none.

# OKF Validation

Command:

    node bin/okf.mjs check --archive require-tests-that-can-fail

Result:

    okf check: 0 error(s), 1 warning(s)

The warning is on `.okf/features/okf-archive-gate.md` — `verified but carries no
attestation` — which predates this change and belongs to a different capability.

This change's own test-plan passes the three checks it introduces, including under
`--archive`: every unit row names a falsifier, and each of the eight rows that
started green says why.

# Test Traceability Review

| Requirement Or Scenario | Covered By | Gap |
| --- | --- | --- |
| A green initial status explains itself | UT-201, UT-202, UT-203, UT-204, NEG-201 | none |
| Every pre-implementation unit test names what would falsify it | UT-205, UT-206, UT-207, UT-208, NEG-202, NEG-204 | none |
| The test-plan template names the grounds that are not admissible | IT-201 | none |
| The status vocabulary is closed (assertion message) | UT-209, NEG-203 | none |
| The pending-test list is derived from a table's live status column (owner by name) | UT-210, UT-211 | none |
| Template and instruction ask for the same thing | IT-202, IT-203, IT-204 | none |
| Acceptance criterion 8 (`okf check` clean on this repository) | the command above | Not a fixture test — declared Not Applicable in test-cases.md with the reason |

# OKF Verification

## Rule Evidence

| Rule (BR-n) | Capability | Evidence (file:line or test name) | Verdict | Action Taken |
| --- | --- | --- | --- | --- |
| BR-1 | test-first-gate | `lib/check.mjs:1058-1061` — the closed vocabulary, unchanged by this change but cited by the MODIFIED requirement that reproduces its block; test `unknown test status is caught` (`test/run.mjs:368`) | match | none |
| BR-3 | test-first-gate | `lib/check.mjs:1063-1068` — the assertion-message finding now goes through `hardensAtArchive`; tests `UT-209`, `NEG-203` | match | none |
| BR-5 | test-first-gate | `lib/check.mjs:1104-1111` — `idCol` and `ownerCol` resolved by header name; tests `UT-210`, `UT-211` | match | none |
| BR-8 | test-first-gate | `openspec/schemas/okf-gated-feature/templates/test-plan.md:141-150`; test `IT-201` | match | none |
| BR-11 | test-first-gate | `lib/check.mjs:877-882` (`explainedStatus`), `lib/check.mjs:1071-1079`; `templates/test-plan.md:64-68`; `schema.yaml:293-299`; tests `UT-201` – `UT-204`, `NEG-201`, `IT-203` | match | none |
| BR-12 | test-first-gate | `lib/check.mjs:891-893` (`falsifierColumn`), `lib/check.mjs:1033-1053`; `templates/test-plan.md:69-78`; `schema.yaml:254-259`, `schema.yaml:300-307`; tests `UT-205` – `UT-208`, `NEG-202`, `NEG-204`, `IT-202` – `IT-204` | match | none |

BR-2, BR-4, BR-6, BR-7, BR-9 and BR-10 were not touched by this change and carry
the evidence recorded at their previous verification passes.

Two findings from the first `--archive` run were fixed rather than argued with.
`okf check` reported that the specs cite BR-1 and BR-4 with no Rule Evidence row.
BR-1 was a real citation — the MODIFIED requirement reproduces the vocabulary
block, `Implements:` line included — and now has the row above. BR-4 was not a
citation at all: a scenario used `passing: BR-4 already held` as example prose, and
the id was rewritten to generic wording, because an example that reads as a
citation is one a later reader has to disprove.

The run also warned that the Decision Promotion table had five rows for eight
decisions. `countDecisions` counts `###` headings plus lines that open in bold, and
design.md had four such lines that were not decisions — three promotion
annotations and one wrapped sentence whose second line began `**error**`. All four
were reworded or rewrapped as plain prose. The design still holds exactly five
decisions, all five appear in the table below, and nothing was removed to quiet the
counter. The heuristic is doing its job; it was reading markup, not finding a
decision anyone had left out.

## Section Review

| Section | Capability | Checked Against | Result |
| --- | --- | --- | --- |
| Domain Terms | test-first-gate | `Falsifier` and `Tautological test` against `lib/check.mjs` and the template wording | both terms are used in the code's messages and in the shipped template with the same meaning |
| Workflows | test-first-gate | the Primary Workflow's new step 2 against task group 2 as executed | matches: the falsifier was named per row before the tests were written, and UT-210 was redesigned rather than filled in when it turned out not to falsify anything |
| Risks And Compliance Constraints | test-first-gate | the new row against what the checks actually catch | accurate, including its limit — presence is enforced, aptness is not |

Data Entities and Permissions And Access Control do not appear in this entry;
the capability has neither.

## Entry Outcome

| Capability | OKF File | Resulting Verified | verified_at | code_paths Filled | This Change Removed From pending_changes |
| --- | --- | --- | --- | --- | --- |
| test-first-gate | `.okf/features/test-first-gate.md` | verified | 2026-08-02 | yes | yes |

## Decision Promotion

| Decision | Promoted To | Reason If Not Promoted |
| --- | --- | --- |
| Records the test-plan requires harden at the archive boundary | `.okf/decisions/2026-08-02-required-records-harden-at-the-archive-boundary.md` | - |
| The falsifier lives in the test-plan, not in test-cases | `.okf/decisions/2026-08-02-the-falsifier-is-recorded-in-the-test-plan.md` | - |
| Only the unit test table carries a falsifier | - | change-local: it is the scope of BR-12 as written, and the entry states it. A change that widens the scope amends the rule, not a separate decision record |
| Presence is checked, aptness is not | - | change-local restatement: the kit already carries this limit as a decision (`the kit records test ordering; it does not verify it`), and duplicating it would create two records to keep in step |
| Column resolution moves to one helper | - | change-local: a defect fix in one function, with no consequence for anything built later |

# Known Gaps And Accepted Risks

| Gap Or Risk | Impact | Owner | Follow-Up |
| --- | --- | --- | --- |
| `Falsified By` is checked for presence, never for aptness | A row can be filled with a restatement of the test and the gate will not notice. The rule is a prompt to a reviewer, not a proof | reviewer of each change | None planned. Judging aptness needs a signal the kit does not have, and the decision on ordering already sets that boundary |
| Downstream plans written against the previous template have no `Falsified By` column | Their next `okf check` run warns once per unit table until the column is added | whoever next edits that plan | The warning names the fix, and archived plans are not re-checked |

# Archive Readiness

- [x] OpenSpec validation passed for the change
- [x] `openspec validate test-first-gate --strict` passed
- [x] Tasks complete, or remaining items explicitly deferred
- [x] Unit test result recorded
- [x] Integration test result recorded
- [x] E2E result recorded, or marked not applicable with a specific reason
- [x] Every `skeleton` / `planned` test row appears in the test-plan Known Gaps with an owner — none remain; all four skeletons were promoted
- [x] Rule Evidence table filled with real `file:line` or test references for every BR-n touched
- [x] Every linked entry: `verified` set, `verified_at` set, `code_paths` filled, this change id removed from `pending_changes`
- [x] `needs-revision` entries (if any) recorded in the `.okf/index.md` Needs Revision Ledger — none
- [x] Durable decisions promoted to `.okf/decisions/`, or explicitly skipped with a reason
- [x] `okf check --archive require-tests-that-can-fail` exits clean
- [x] Proof boundaries are honest and explicit — the two new checks confirm a record exists and is shaped correctly; whether the reason or the falsifier is true stays a review question, stated as such in the entry, the spec, and the shipped template
