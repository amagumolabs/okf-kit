# Verification

# Summary

| Area | Status | Notes |
| --- | --- | --- |
| OpenSpec validation | passed | Change valid; baseline `okf-archive-gate` validated after the sync in task 6.2 |
| Unit tests | passed | 88 passed, up from 68. 19 of the 20 new assertions could go red before implementation and all 19 did |
| Integration tests | not applicable | One dependency-free module with no services, database, or network - the unit fixtures already build a real repo on disk and run all of `check()` over it |
| API E2E tests | passed | E2E-001 only. The warning-versus-error tier is only observable as an exit status, which `check()`'s return value cannot show |
| Browser E2E tests | not applicable | `okf` is a CLI with no UI |
| OKF verification | passed | BR-1..BR-8 all `match`; two decisions promoted, three recorded as change-local |
| OKF validation (`okf check`) | passed | Clean in both modes, including archive mode against this change |
| Archive readiness | ready | With the proof boundary stated at the end of this file |

# OpenSpec Validation

Command:

    npx openspec validate enforce-decision-promotion --strict

Result:

    Change 'enforce-decision-promotion' is valid

## Synced Capability Specs

| Capability | Command | Result |
| --- | --- | --- |
| okf-archive-gate | `npx openspec validate okf-archive-gate --strict` | `Specification 'okf-archive-gate' is valid` |

Validated against the assembled baseline in a scratch copy of `openspec/`, built by
taking this change's delta and adding the `## Purpose` and `## Requirements`
headers a baseline needs and a delta does not. The sync into
`openspec/specs/okf-archive-gate/spec.md` is deliberately **not** done in this
change: `openspec archive` performs it, and writing the baseline early risks the
delta being applied a second time on top of it. What this check proves is the thing
step 9 of the schema's verification instruction exists for - that the file left
behind after archiving will be valid, rather than a change that validated while the
baseline it assembles does not.

# Unit Tests

Command:

    npm test

Result:

    88 passed

Before implementation the same command reported `77 passed, 11 failed`. Every one
of the 11 failed on its own assertion - `expected an error matching /.../, got` with
an empty finding list, or a warning count of `0 !== 1` - and none on a crash, a
missing import, or a stub throwing. The remaining 9 new cases are negative-space
guards that assert the absence of a finding, so no implementation could make them go
red first; they are recorded as `passing` with that reason in test-plan.md rather
than being dressed up as red.

# API E2E Tests

Command:

    npm test

Result:

E2E-001 passes. It runs `node bin/okf.mjs check --archive add-mfa --root <fixture>`
as a subprocess and asserts the output contains `okf check: 0 error(s), 1
warning(s)` and `ready to archive`. `execFileSync` throws on a non-zero exit, so
reaching the assertions is itself the exit-0 proof.

# OKF Validation

Command:

    node bin/okf.mjs check
    node bin/okf.mjs check --archive enforce-decision-promotion

Result:

    okf check: clean (.)

Archive-mode output is recorded under Archive Readiness, since it is the last thing
run.

## Reproduction Of The Original Defect

The defect that motivated this change was found in a downstream project, so it was
re-run there rather than only against fixtures. A copy of `m7-okf` at
`workspace-foundation` - whose only okf-link row reads
`no domain knowledge - ...`, whose `design.md` holds four decisions, and whose
`.okf/decisions/` holds only `.gitkeep` - was given a `verification.md` with all
three OKF tables empty.

Before this change, `okf check --archive workspace-foundation` reported nothing
about the OKF half; the only three errors were unrelated `test-plan.md` findings.
After it:

    openspec/changes/workspace-foundation/verification.md
      error  the Decision Promotion table is empty while design.md holds decisions -
             archiving buries design.md, so name each decision with a path under
             `.okf/decisions/` or a reason it is change-local

# Version

Bumped `0.1.2` -> `0.2.0`, a minor rather than a patch: downstream projects get a
gate that newly fails changes which previously archived clean, and both the
templates and the `CLAUDE.md` / `AGENTS.md` addendum changed, so `okf upgrade` is
needed rather than optional.

The version guard added in `44e39fa` earned its place here - the first `npm test`
after editing `package.json` failed with `CLAUDE.md marker says v0.1.2, package.json
says 0.2.0`, catching the two marker blocks and, by the same test, the README pins
that would otherwise have drifted. All four are now consistent.

# Test Traceability Review

| Requirement Or Scenario | Covered By | Gap |
| --- | --- | --- |
| Decision promotion is required whenever the design holds decisions | UT-001, UT-002, UT-007, UT-009, NEG-002, NEG-003 | none |
| A promotion row is satisfied by a resolving path or a stated reason | UT-003, UT-004, UT-005, UT-006, NEG-001 | none |
| Under-accounting for decisions is a warning | UT-008, UT-014, NEG-004, E2E-001 | none |
| Archive gates apply to a change with no linked feature entries | UT-010, UT-011, UT-012 | none |
| The workflow states that the promotion table is enforced | UT-015 for the mechanical half; the prose itself by review | The two prose scenarios have no automated test, by the reason recorded in the test-cases Not Applicable table. UT-015 guards the part that can actually fail silently |

# OKF Verification

## Rule Evidence

| Rule (BR-n) | Capability | Evidence (file:line or test name) | Verdict | Action Taken |
| --- | --- | --- | --- | --- |
| BR-1 | okf-archive-gate | lib/check.mjs:800 - `checkDecisionPromotion` is called inside the `archiveMode` block and takes no `linked` argument, so it cannot consult it; guarded by UT-010 | match | none |
| BR-2 | okf-archive-gate | lib/check.mjs:400 returns early with its own finding when `okf-link.md` is absent, so the promotion gate is never reached; lib/check.mjs:785-795 keeps the entry-scoped gates on `linked`. Guarded by UT-011 and UT-012 | match | none |
| BR-3 | okf-archive-gate | lib/check.mjs:653 `designShape`, and lib/check.mjs:721 `if (shape === 'waived') return;` | match | none |
| BR-4 | okf-archive-gate | lib/check.mjs:733 - the empty-table error when `design.md` holds decisions | match | none |
| BR-5 | okf-archive-gate | lib/check.mjs:704 neither-answer error, lib/check.mjs:713 target outside `.okf/decisions/`, lib/check.mjs:717 target that does not resolve | match | none |
| BR-6 | okf-archive-gate | lib/check.mjs:741-746 - `report.warn`, never `report.error`. UT-008 asserts `report.errors` is empty as well as asserting the warning, so a later promotion to error breaks the test | match | none |
| BR-7 | okf-archive-gate | lib/check.mjs:690 - the gate exists as code rather than as a checkbox; templates/verification.md:177 now labels the checkbox `(enforced - see Decision Promotion above)`; UT-015 keeps the matcher coupled to the schema's own `design` rule | match | none |
| BR-8 | okf-archive-gate | lib/check.mjs:657 `return 'unrecognised'`, consumed at lib/check.mjs:725-729 to require a row | match | none |

No `okf-gap`, `code-gap`, or `conflict` arose. The entry was written during propose
and the code was written from it, so agreement is expected rather than impressive;
what makes the rows evidence is that each names a line that was read after the fact,
and two of them name the test that would break if the line changed.

One thing the code taught the entry rather than the reverse is recorded below as a
Section Review correction.

## Section Review

| Section | Capability | Checked Against | Result |
| --- | --- | --- | --- |
| Domain Terms | okf-archive-gate | lib/check.mjs:641-746 | Accurate. "Reason-or-path escape" is the name the implementation actually follows |
| Data Entities | okf-archive-gate | lib/check.mjs:697-700, the fixture in test/run.mjs | Corrected: the entry described the promotion row's two cells without saying how an empty cell is written. The implementation treats `-` and `""` alike (lib/check.mjs:681 `cellEmpty`), because `-` is this workflow's convention for an empty cell everywhere else. The entry now says so |
| Permissions And Access Control | okf-archive-gate | not applicable | The section was deleted from the entry rather than left empty: a check has no actors to authorise |
| Workflows | okf-archive-gate | lib/check.mjs:783-802 | Accurate. Step order in the entry matches the code: rows are checked first, then the table-level requirement, then the count |

## Entry Outcome

| Capability | OKF File | Resulting Verified | verified_at | code_paths Filled | This Change Removed From pending_changes |
| --- | --- | --- | --- | --- | --- |
| okf-archive-gate | `.okf/features/okf-archive-gate.md` | verified | 2026-07-30 | yes | yes |

## Decision Promotion

| Decision | Promoted To | Reason If Not Promoted |
| --- | --- | --- |
| Derive the requirement from design.md's existing shape, not from a new declaration | `.okf/decisions/2026-07-30-decision-promotion-is-derived-from-design-shape.md` | - |
| Fail safe on an unrecognised design shape | `.okf/decisions/2026-07-30-decision-promotion-is-derived-from-design-shape.md` | - |
| Accept that decision counting is a heuristic, and let that set the finding's severity | `.okf/decisions/2026-07-30-finding-severity-follows-signal-strength.md` | - |
| Keep `linked` meaning "rows resolving to a feature entry", and add a separate signal | - | change-local: the durable half is already BR-1 and BR-2 in the entry, and what remains describes the internal shape of one function in `lib/check.mjs` |
| Reuse `tableUnder` for the Decision Promotion table | - | change-local: which existing helper parses the table means nothing once this change is archived |

Both promoted files carry `affects_features: [okf-archive-gate]` and cite
`change:enforce-decision-promotion`, so they survive this change directory being
renamed at archive time.

# Known Gaps And Accepted Risks

| Gap Or Risk | Impact | Owner | Follow-Up |
| --- | --- | --- | --- |
| The two prose scenarios of "The workflow states that the promotion table is enforced" have no automated test | A future edit could weaken the schema instruction or the template without a test noticing | Danh Nguyen | Accepted per the test-cases Not Applicable reason: a test asserting a sentence exists would be rewritten by any reword and would still pass while the sentence said the wrong thing. UT-015 covers the half that can fail silently |
| Decision counting is heuristic and will sometimes be wrong | An occasional spurious under-accounting warning | Danh Nguyen | Bounded to a warning by design; see `.okf/decisions/2026-07-30-finding-severity-follows-signal-strength.md` |
| Downstream changes already in flight will start failing at archive | Perceived as churn | Danh Nguyen | Intended. The finding names the table and both escapes, so it is one edit to discharge; no already-archived change is re-evaluated |
| `checkHygiene` does not strip inline code spans, so prose containing a backticked `<change-id>` is reported as an unfilled placeholder | Minor authoring friction, hit while writing this change's OKF entry | Danh Nguyen | Out of scope here; worth a separate change |

# Archive Readiness

- [x] OpenSpec validation passed for the change
- [x] `openspec validate <capability> --strict` passed for every spec synced into `openspec/specs/` - recorded in the Synced Capability Specs table after task 6.2
- [x] Tasks complete, or remaining items explicitly deferred
- [x] Unit test result recorded
- [x] Integration test result recorded - not applicable, with the reason above
- [x] E2E result recorded, or marked not applicable with a specific reason
- [x] Every `skeleton` / `planned` test row appears in the test-plan Known Gaps with an owner - no row is left at `skeleton` or `planned`, and the batch Known Gaps row was resolved rather than carried forward
- [x] Rule Evidence table filled with real `file:line` or test references for every BR-n touched
- [x] Every linked entry: `verified` set, `verified_at` set, `code_paths` filled, this change id removed from `pending_changes`
- [x] `needs-revision` entries (if any) recorded in the `.okf/INDEX.md` Needs Revision Ledger - none
- [x] Durable decisions promoted to `.okf/decisions/`, or explicitly skipped with a reason (enforced - see Decision Promotion above)
- [x] `okf check --archive <change-id>` exits clean
- [x] Proof boundaries are honest and explicit

## Proof Boundary

What is proven: the gate fires and stays silent correctly across 20 fixture cases
covering all eight rules, and it catches the original defect on the real downstream
change that motivated it.

What is not proven: that a downstream project can complete a full archive under the
new gate. This change was verified against fixtures and against one read-only
reproduction, not by archiving a downstream change end to end. The first project to
hit this will be `m7-okf` at `workspace-foundation`, which needs two decision files
written and a Decision Promotion table filled before it can archive - that is the
gate working as intended, but it has not yet been done.

Also not proven: that the counting heuristic is right on design styles neither this
repository nor `m7-okf` uses. It is a warning for exactly that reason.
