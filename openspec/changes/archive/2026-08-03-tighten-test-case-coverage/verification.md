# Verification

# Summary

| Area | Status | Notes |
| --- | --- | --- |
| OpenSpec validation | pass | `openspec validate tighten-test-case-coverage --strict` -> valid |
| Unit tests | pass | 272 passed, 0 failed |
| Integration tests | pass | IT-401 and IT-402, both green |
| API E2E tests | not applicable | the kit exposes no network interface |
| Browser E2E tests | not applicable | the kit has no user interface, which is also why BR-15 is discharged rather than dogfooded here |
| Static analysis | pass | `npm run lint` clean; no type checker in this repository |
| OKF verification | done | BR-13..BR-16 evidenced below |
| OKF validation (`okf check`) | pass | clean |
| Archive readiness | ready | checklist below |

# OpenSpec Validation

Command:

    openspec validate tighten-test-case-coverage --strict

Result:

    Change 'tighten-test-case-coverage' is valid

## Synced Capability Specs

| Capability | Command | Result |
| --- | --- | --- |
| test-first-gate | `openspec validate test-first-gate --strict` | `Specification 'test-first-gate' is valid` - run twice, before and after the sync |

The first run validated the baseline before this change's deltas reached it, and
proved nothing about the assembled file. The three ADDED requirements were then
synced into `openspec/specs/test-first-gate/spec.md` during the archive step,
taking it from 11 requirements to 14, and the command was re-run against that
assembled file - which is the run that matters, because a change can be valid
while the baseline assembled from it is not.

# Unit Tests

Command:

    npm test

Result:

    272 passed

All ten pre-implementation rows reached their recorded initial status before the
implementation group started: UT-401, UT-402, UT-403, UT-404, UT-405 and NEG-401
failed on their assertions, and UT-406, UT-407, UT-408 and NEG-402 started green
for the reasons their rows state. No test was edited to make the implementation
pass - the Test Changes After Implementation Started table is empty, which is the
honest record.

UT-402 did report a disagreement after the implementation landed: the instruction
read "rather than by deleting its row" against an assertion expecting "rather
than deleting". The instruction changed, not the test. That is the code moving to
meet the test, so it is not a test change and has no row in that table.

# Integration Tests

Command:

    node bin/okf.mjs check --archive tighten-test-case-coverage

Result:

    okf check: 0 error(s), 0 warning(s)
    ready to archive

IT-401 (this change dogfoods its own rule) and IT-402 (nothing pre-existing
regressed) both pass. IT-402's evidence is the unit run above: the suite grew
from 254 to 272 with no prior assertion lost.

# API E2E Tests

Command:

    Not Applicable

Result:

Not applicable because the kit exposes no network interface. Stated in
test-plan.md and discharged in the test-cases Not Applicable table.

# Browser E2E Tests

Result:

Not applicable because the kit is a command-line validator with no user interface
of any kind. This is the same discharge BR-14 asks a downstream author for, used
here on the very change that introduces it - the mechanism working rather than an
exception to it. No table follows, because there is no render state to record and
no artefact to locate.

# Static Analysis

| Check | Command | Result |
| --- | --- | --- |
| Lint | `npm run lint` | `node --check: all files parse` - clean. This is a parse check over `bin/`, `lib/` and `test/`, not a rule-based lint; it catches a syntax error and says nothing about style or unused bindings |
| Typecheck | Not Applicable | This kit is plain ESM annotated with JSDoc and has adopted no type checker. Adding one would be its first dependency, which is a decision about the kit's shape rather than a step in this change. Declared in `AGENTS.md` outside the okf-kit markers |

# OKF Validation

Command:

    okf check --archive tighten-test-case-coverage

Result:

    okf check: 0 error(s), 0 warning(s)
    ready to archive

# Test Traceability Review

| Requirement Or Scenario | Covered By | Gap |
| --- | --- | --- |
| A matrix answers for named boundary classes / An agent reads the template | UT-401 | none |
| A matrix answers for named boundary classes / An agent reads the instruction | UT-402 | none |
| A matrix answers for named boundary classes / An empty boundary table | UT-405, NEG-401 | none |
| A matrix answers for named boundary classes / A filled boundary table | UT-406, NEG-402 | none |
| A change with an interface answers for its render states / An agent reads the browser section | UT-403 | none |
| A change with an interface answers for its render states / A change with no interface | UT-408 | Whether the four states improve a real UI change cannot be shown here; the kit has none. Stated, not closed |
| An inspectable artefact has a stated home / test-plan template | UT-404 | none |
| An inspectable artefact has a stated home / verification template | UT-404 | none |
| An inspectable artefact has a stated home / No tool is prescribed | UT-407 | none |

# OKF Verification

## Rule Evidence

| Rule (BR-n) | Capability | Evidence (file:line or test name) | Verdict | Action Taken |
| --- | --- | --- | --- | --- |
| BR-13 | test-first-gate | `openspec/schemas/okf-gated-feature/templates/test-cases.md:108-115` (Class column and six seeded rows); `lib/check.mjs:1284-1299` (`checkBoundaryCoverage`, warning only); `lib/check.mjs:791` (call site); tests UT-401, UT-405, UT-406, NEG-401, NEG-402 | match | none |
| BR-14 | test-first-gate | `openspec/schemas/okf-gated-feature/schema.yaml:273-278` (discharge with a stated reason, rather than deleting the row); `openspec/schemas/okf-gated-feature/templates/test-cases.md:102-106`; test UT-402 | match | none |
| BR-15 | test-first-gate | `openspec/schemas/okf-gated-feature/templates/test-cases.md:76-93` (four render states seeded, plus the console-error row); `openspec/schemas/okf-gated-feature/schema.yaml:285-291`; tests UT-403, UT-408 | match | none |
| BR-16 | test-first-gate | `openspec/schemas/okf-gated-feature/templates/test-plan.md:107` (Artifacts column); `openspec/schemas/okf-gated-feature/templates/verification.md:96` (Artifacts column); `openspec/schemas/okf-gated-feature/schema.yaml:292-295` (name the destination, never the tool); tests UT-404, UT-407 | match | none |

BR-1..BR-12 are untouched by this change and carried forward from the previous
passes, which is why they carry no row here: the specs of this change cite
BR-13..BR-16 and nothing else.

## Section Review

| Section | Capability | Checked Against | Result |
| --- | --- | --- | --- |
| Domain Terms | test-first-gate | the shipped templates and `lib/check.mjs` | unchanged - this change adds no term. "Boundary class" is named in BR-13 itself rather than lifted into the glossary, because it means nothing apart from the six |
| Data Entities | test-first-gate | - | the entry has no such section; the gate governs artifacts, not stored data |
| Permissions And Access Control | test-first-gate | - | the entry has no such section; the kit has no actors and no permissions |
| Workflows | test-first-gate | `templates/tasks.md` group order | unchanged - this change adds no step to the primary workflow. The boundary classes are answered while test-cases.md is written, which is already step 0 of the gate |

## Entry Outcome

| Capability | OKF File | Resulting Verified | verified_at | code_paths Filled | This Change Removed From pending_changes |
| --- | --- | --- | --- | --- | --- |
| test-first-gate | `.okf/features/test-first-gate.md` | verified | 2026-08-03 | yes | yes |

## Decision Promotion

| Decision | Promoted To | Reason If Not Promoted |
| --- | --- | --- |
| The check warns on an empty table and says nothing else | `.okf/decisions/2026-08-03-a-rule-the-checker-cannot-see-stays-with-the-author.md` | - |
| The UI states ship in the template even though this kit has no UI | `.okf/decisions/2026-08-03-a-rule-ships-where-it-is-needed-not-where-it-can-be-dogfooded.md` | - |
| The classes are seeded rows, not a comment | - | change-local: it restates a convention the kit already follows for `UT-001`, and the decision now lives where it acts - the seeded rows in the shipped template, locked by UT-401. A decisions file would duplicate a settled house style rather than record a choice |
| Six classes, and the sixth is scope isolation rather than "multi-tenancy" | - | change-local: the choice is recorded in BR-13, which names the six and is the thing a future change would have to amend. A decisions file would fork the list into two places that can disagree |

# Known Gaps And Accepted Risks

| Gap Or Risk | Impact | Owner | Follow-Up |
| --- | --- | --- | --- |
| Six named classes can be answered with six rows written to satisfy the template | The matrix looks considered and is not | change author | Unfixable by tooling and deliberately not attempted - see the promoted decision. The cost falls on review, where a human can see it |
| BR-15 is not dogfooded anywhere in this repository | The four render states ship untested against a real interface | change author | Evidence arrives downstream as review feedback. UT-403 asserts the shipped text, which is all this repository can assert |

# Archive Readiness

- [x] OpenSpec validation passed for the change
- [x] `openspec validate test-first-gate --strict` passed for the assembled baseline, after the three ADDED requirements were synced into `openspec/specs/` (see Synced Capability Specs)
- [x] Tasks complete, or remaining items explicitly deferred
- [x] Unit test result recorded
- [x] Integration test result recorded
- [x] E2E result recorded, or marked not applicable with a specific reason
- [x] Static Analysis table filled: a real result per required row, or a stated reason
- [x] Every `skeleton` / `planned` test row appears in the test-plan Known Gaps with an owner
- [x] Rule Evidence table filled with real `file:line` or test references for every BR-n touched
- [x] Every linked entry: `verified` set, `verified_at` set, `code_paths` filled, this change id removed from `pending_changes`
- [x] `needs-revision` entries (if any) recorded in the `.okf/index.md` Needs Revision Ledger
- [x] Durable decisions promoted to `.okf/decisions/`, or explicitly skipped with a reason
- [x] `okf check --archive tighten-test-case-coverage` exits clean
- [x] Proof boundaries are honest and explicit
