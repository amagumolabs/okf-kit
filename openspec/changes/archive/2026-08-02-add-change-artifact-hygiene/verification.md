# Verification

# Summary

| Area | Status | Notes |
| --- | --- | --- |
| OpenSpec validation | pass | `Change 'add-change-artifact-hygiene' is valid` |
| Unit tests | pass | 238 passed, 0 failed - up from 222 before this change |
| Integration tests | pass | IT-201 and IT-202 both green; see Integration Tests |
| API E2E tests | not applicable | The kit exposes no network interface; `bin/okf.mjs` is its only entry point |
| Browser E2E tests | not applicable | The kit is a command-line validator with no UI surface |
| Static analysis | pass | Lint clean; no type checker exists, and the row says why |
| OKF verification | done | BR-1..BR-6 evidenced below; one `okf-gap` on BR-6, one `code-gap` on BR-2 fixed in code |
| OKF validation (`okf check`) | pass | `okf check --archive` clean; the unnarrowed run has 28 warnings, none from this change |
| Archive readiness | ready | See the checklist at the end |

# OpenSpec Validation

Command:

    openspec validate add-change-artifact-hygiene --strict

Result:

    Change 'add-change-artifact-hygiene' is valid

## Synced Capability Specs

| Capability | Command | Result |
| --- | --- | --- |
| artifact-hygiene | `openspec validate artifact-hygiene --strict` | `Specification 'artifact-hygiene' is valid` |

Validated against the assembled baseline in a scratch copy of `openspec/`, built
by taking this change's delta and adding the `## Purpose` and `## Requirements`
headers a baseline needs and a delta does not. Run in-repo the same command fails
with an unknown-item error, which is expected: the sync into
`openspec/specs/artifact-hygiene/spec.md` is deliberately not done here, because
`openspec archive` performs it and writing the baseline early risks the delta
being applied twice. This follows the method recorded in
`change:guard-durable-references`, and proves the file left behind after
archiving will be valid.

# Unit Tests

Command:

    npm test

Result:

    238 passed

Up from 222. Sixteen assertions were added for this capability, at
`test/run.mjs:1749-1944`. Of the fifteen written before implementation, eight
were red on their assertion and seven were green from the start; the test-plan's
Initial Status column records the actual message for each, including which of
the green ones were green only vacuously while `checkChangeHygiene` was still a
stub. The sixteenth, UT-210, was written during the verification pass against a
defect the new check found in itself, and the test-plan says so rather than
filing it among the pre-implementation rows.

# Integration Tests

Command:

    node bin/okf.mjs check

Result:

    okf check: 0 error(s), 28 warning(s)

IT-201. All 28 warnings are `"failing" records no assertion message` on the
test-plans of three other in-flight changes, produced by `checkTestPlan`, a code
path this change does not touch. The same 28 are reported by the pre-change
checker run against the same working tree from a temporary worktree of `HEAD`,
so the widened hygiene scan added exactly zero findings on this repository.

Silence from a scan that never ran looks identical to silence from a clean tree,
so it was probed: a file carrying `<a slot nobody filled>` written to
`openspec/changes/add-change-artifact-hygiene/specs/artifact-hygiene/probe.md`
was reported as `warn unfilled placeholder(s)`, confirming the walk reaches
nested change artifacts. The probe was deleted.

IT-202 is the same `npm test` run: every assertion that passed before this change
still passes. One pre-existing test needed a fixture repair rather than an
assertion change, recorded in the test-plan's Test Changes table.

# API E2E Tests

Not applicable because the kit exposes no network interface. `bin/okf.mjs` is its
only entry point and it is a command-line program; there is no server to drive.

# Browser E2E Tests

Not applicable because the kit has no UI surface of any kind.

# Static Analysis

| Check | Command | Result |
| --- | --- | --- |
| Lint | `npm run lint` | clean - `node --check: all files parse` over `bin/`, `lib/` and `test/` |
| Typecheck | Not Applicable | Not Applicable because this kit has adopted no type checker: it is plain ESM annotated with JSDoc, and adopting one would add its first dependency. Declared in `AGENTS.md` outside the okf-kit markers |

`npm run lint` is a parse check, not a rule-based linter. It catches a syntax
error before it reaches a user and says nothing about style or unused bindings.
Reported here as what it is.

# OKF Validation

Command:

    okf check --archive add-change-artifact-hygiene

Result:

    okf check: clean (.)
    "add-change-artifact-hygiene" is ready to archive as far as OKF is concerned.

Clean rather than 28 warnings because `--archive <change-id>` narrows the change
walk to that one change; the 28 belong to the three other in-flight changes and
are shown by the unnarrowed `okf check` under Integration Tests.

It was not clean first time. Two real findings came out of this run and both were
fixed rather than explained away: the comment finding ignored quoting and
reported this file for naming the marker it had to explain (BR-2, `code-gap`,
fixed in `lib/check.mjs:288` behind UT-210), and a Rule Evidence row cited BR-11
of `okf-archive-gate` with a prose reference instead of a `file:line` - that row
is gone, and the risk-row discharge it was carrying now sits in BR-1's action
column, where task 7.5 asked for it.

# Test Traceability Review

| Requirement Or Scenario | Covered By | Gap |
| --- | --- | --- |
| Hygiene applies to change artifacts: placeholder before archive | UT-201 | none |
| Hygiene applies to change artifacts: the same placeholder at archive | UT-202 | none |
| Hygiene applies to change artifacts: a blank table row | UT-206 | none |
| Hygiene applies to change artifacts: an archived change is left alone | UT-209 | none - green from the start, because `activeChangeIds` never yields `archive` and the walk declines it again |
| Quoted template text is not residue: named inside an inline code span | UT-203 | none |
| Quoted template text is not residue: shown inside a fenced block | UT-204 | none |
| Quoted template text is not residue: the same exemption for bundle files | UT-205 | none |
| Quoted template text is not residue: no file excused by name | UT-208 | none - structural, over `lib/check.mjs` with its comments stripped |
| Quoted template text is not residue: the exemption reaches every finding the scan makes | UT-210 | none - added during verification, after the comment finding was found to read raw text |
| A shipped instruction comment is residue at archive: during the change | UT-207 | none for the marked form; the unmarked form is the open question recorded below |
| A shipped instruction comment is residue at archive: at archive | UT-207 | as above |
| Boundary: bare list item, autolink, stray tag, fence and span ordering | NEG-201..NEG-205 | none |

# OKF Verification

## Rule Evidence

| Rule (BR-n) | Capability | Evidence (file:line or test name) | Verdict | Action Taken |
| --- | --- | --- | --- | --- |
| BR-1 | artifact-hygiene | `lib/check.mjs:703-718` (the walk) and `lib/check.mjs:727` (the call, placed before the okf-link early return); tests UT-201, UT-206, UT-209, NEG-201 | match | none. The scan now reaches every `.md` under an active change, including nested `specs/`, confirmed by the deleted probe file described under Integration Tests. This is also what discharges the risk row in `.okf/features/okf-archive-gate.md` that recorded the exposure: its Mitigation column now names this change and the quoting convention it needed first. BR-11 there is untouched - its subject is a static analysis result, and it never depended on the placeholder scan |
| BR-2 | artifact-hygiene | `lib/check.mjs:252` - `stripCodeSpans(stripFences(stripComments(text)))` - and `:288` for the comment finding; tests UT-203, UT-204, UT-210 | code-gap | Fixed in code, as the verdict requires. The comment finding tested raw text and so ignored quoting, which the spec requires in every file the scan reads. Caught by `okf check` reporting this change's own verification.md for naming the marker it had to explain. UT-210 was written red, then `lib/check.mjs:288` was changed to test `stripCodeSpans(stripFences(text))` - comments deliberately left in, since `stripComments` would delete the thing being looked for. The entry was not edited to match the defect |
| BR-3 | artifact-hygiene | No filename or path list exists in either region: `lib/check.mjs:237-291` and `703-718` hold only the `.md` extension filter at `:712`. Test UT-208 reads both regions with comments stripped and fails on any named `.md` literal or allowlist-shaped identifier | match | none. The one path-shaped skip is `archive/` at `lib/check.mjs:710`, which excludes a directory of finished changes rather than excusing a file from the rule |
| BR-4 | artifact-hygiene | `lib/check.mjs:237-239` - line-scoped, so an unbalanced backtick cannot pair across lines; applied for every caller at `:252` and `:288`; tests UT-205, UT-210, NEG-204, NEG-205 | match | none. UT-205 is the assertion that keeps one rule from becoming two: the bundle-file path gets the same exemption |
| BR-5 | artifact-hygiene | `lib/check.mjs:253-254` - `residue` routes through `hardensAtArchive` for a change artifact and stays an outright error for a bundle file, which has no in-flight state; tests UT-201 and UT-202 | match | none |
| BR-6 | artifact-hygiene | `lib/check.mjs:255` (`shipped`) and `:288-290` (the finding); tests UT-207 and UT-210 | okf-gap | The escalation is implemented and evidenced. The entry did not state how a template's own comment is recognised, and the inherited `HOW TO USE THIS TEMPLATE` marker ships only in `.okf/templates/`, so the schema's change templates go unrecognised. BR-6 now says so, and an Open Question on the entry records the remedy. Recognition itself was not widened: it is an explicit non-goal of this proposal, and doing it here would ship logic no spec in this change describes |

## Section Review

| Section | Capability | Checked Against | Result |
| --- | --- | --- | --- |
| Domain Terms | artifact-hygiene | `lib/check.mjs:237-288` | Accurate. "Code span" and "Quoting" describe what `stripCodeSpans` and `stripFences` actually do, in that order |
| Data Entities | artifact-hygiene | `lib/check.mjs:257-283` | Accurate. Template residue is the angle-bracketed placeholder with its stray-tag and autolink skips, the all-empty table row, the bare `-` item, and the marked instruction comment; Quoting context is the fenced block and the inline code span, both stripped before the scan |
| Permissions And Access Control | artifact-hygiene | The entry has no such section | Not applicable. A file-content check has no actors to authorise |
| Workflows | artifact-hygiene | `lib/check.mjs:253-254`, `:724` | Accurate. The primary workflow's four steps match the call order and the two severities |

## Entry Outcome

| Capability | OKF File | Resulting Verified | verified_at | code_paths Filled | This Change Removed From pending_changes |
| --- | --- | --- | --- | --- | --- |
| artifact-hygiene | `.okf/features/artifact-hygiene.md` | verified | 2026-08-02 | yes - `[lib/check.mjs]` | yes |

## Decision Promotion

| Decision | Promoted To | Reason If Not Promoted |
| --- | --- | --- |
| Code spans join fences as a quoting context, for every caller | `.okf/decisions/2026-08-02-a-code-span-quotes-for-hygiene-and-not-for-reference-detection.md` | - |
| Severity follows `hardensAtArchive`, not a version-gated grace period | - | Change-local: it applies the existing decision `.okf/decisions/2026-08-02-required-records-harden-at-the-archive-boundary.md` to one more check rather than deciding anything new, and BR-5 carries the rule itself |
| Archived changes are not scanned | - | Change-local: the archive gate already treated archived changes this way, and the entry's risk table states the rule. A second decision file would record agreement, not a decision |
| The instruction-comment finding keeps the escalation rather than staying a warning forever | - | Change-local: the durable form of it is BR-6, which is where a reader will look. Promoting it would put the same sentence in two places that can drift |

# Known Gaps And Accepted Risks

| Gap Or Risk | Impact | Owner | Follow-Up |
| --- | --- | --- | --- |
| BR-6 reaches only comments carrying the `HOW TO USE THIS TEMPLATE` marker, which the openspec change templates do not ship | An artifact archived with its shipped instruction comment intact is not reported, so BR-6 protects `.okf/` entries and, in practice, not change artifacts | change author | Open Question on `.okf/features/artifact-hygiene.md`. Adding the marker to the schema's own templates closes it in one edit; matching comment text against the shipped templates is the general answer and is more machinery than the exposure has justified so far |
| A code span silences any finding it wraps | The rule is optional in practice for an author willing to write backticks | accepted | Accepted deliberately, on the same terms fencing already carries: the backticks are visible in the diff, so the evasion is reviewable. Recorded on the entry's risk table and in the promoted decision's Revisit When |
| The angle-bracket heuristic's own false positives and negatives are inherited unchanged | Some residue is missed and some prose is flagged, now over a larger surface | accepted | Stated as a non-goal in the proposal and as a risk on the entry. Widening the scan does not change the heuristic's accuracy, only its reach |
| The scan does not reach `openspec/specs/` | A baseline spec could carry residue a delta never had | change author | Open Question on the entry. Deferred: baseline specs are assembled from delta specs this rule already covers, so the exposure is second-hand and worth measuring before acting on |

# Archive Readiness

- [x] OpenSpec validation passed for the change
- [x] `openspec validate artifact-hygiene --strict` passed for the assembled baseline; the sync itself is left to `openspec archive`
- [x] Tasks complete, or remaining items explicitly deferred
- [x] Unit test result recorded
- [x] Integration test result recorded
- [x] E2E result recorded, or marked not applicable with a specific reason
- [x] Static Analysis table filled: a real result per required row, or a stated reason
- [x] Every `skeleton` / `planned` test row appears in the test-plan Known Gaps with an owner - none remain; IT-201 was promoted to `passing`
- [x] Rule Evidence table filled with real `file:line` or test references for every BR-n touched
- [x] Every linked entry: `verified` set, `verified_at` set, `code_paths` filled, this change id removed from `pending_changes`
- [x] `needs-revision` entries (if any) recorded in the `.okf/index.md` Needs Revision Ledger - none ended at `needs-revision`
- [x] Durable decisions promoted to `.okf/decisions/`, or explicitly skipped with a reason
- [x] `okf check --archive add-change-artifact-hygiene` exits clean
- [x] Proof boundaries are honest and explicit
