# Verification

# Summary

| Area | Status | Notes |
| --- | --- | --- |
| OpenSpec validation | passed | Change valid; baseline spec assembled and validated separately |
| Unit tests | passed | 158 passed, 0 failed |
| Integration tests | not applicable | No services, database, or network - reason in test-cases.md |
| API E2E tests | not applicable | No HTTP surface |
| Browser E2E tests | not applicable | CLI, no UI |
| OKF verification | passed | BR-1 to BR-7 evidenced against the code, all `match` |
| OKF validation (`okf check`) | passed | 0 errors, 1 pre-existing unrelated warning |
| Archive readiness | ready | One proof boundary recorded below, not blocking |

# OpenSpec Validation

Command:

    openspec validate guard-durable-references --strict

Result:

    Change 'guard-durable-references' is valid

## Synced Capability Specs

| Capability | Command | Result |
| --- | --- | --- |
| okf-durable-references | `openspec validate okf-durable-references --strict` | `Specification 'okf-durable-references' is valid` |

Validated against the assembled baseline in a scratch copy of `openspec/`, built
by taking this change's delta and adding the `## Purpose` and `## Requirements`
headers a baseline needs and a delta does not. Run in-repo, the same command
fails with `Unknown item 'okf-durable-references'`, which is expected: the sync
into `openspec/specs/okf-durable-references/spec.md` is deliberately **not** done
here, because `openspec archive` performs it and writing the baseline early risks
the delta being applied twice. This follows the method recorded in
`change:enforce-decision-promotion`, and proves the file left behind after
archiving will be valid.

# Unit Tests

Command:

    npm test

Result:

    158 passed

Red state before implementation was **148 passed, 10 failed** — every failure an
assertion, one per case asserting a locator IS caught. Recorded per row in
test-plan.md.

Two implementation defects were caught by those pre-written tests and fixed in
code, not by adjusting the tests:

1. A locator in `sources` was reported twice, once by `checkProvenance` and once
   by the new body scan, because the body scan was reading the whole file
   including frontmatter. Caught by UT-006 (`one locator must produce one
   finding, got 2`). Fixed at `lib/check.mjs:560` by scanning
   `parseFrontmatter(...).body`.
2. Trailing punctuation was absorbed into the matched path, so a provenance quote
   ending `openspec/changes/archive/:` produced the suggestion
   `` use `change::` ``. Caught by UT-018, the `projectTest` against this
   repository's own bundle. Fixed at `lib/check.mjs:185-187`.

# Integration Tests

Not applicable. The kit is one dependency-free module with no services,
database, or network; each `test()` case builds a real repo on disk and runs
`check()` across the whole file walk, which crosses every boundary this change
touches. The harness classifies those as unit tests. Same call as
`change:enforce-decision-promotion`.

# API E2E Tests

Not applicable. The kit has no HTTP surface; every command is a local CLI over
the filesystem.

# Browser E2E Tests

Not applicable. `okf` is a CLI with no UI.

# OKF Validation

Command:

    okf check --archive guard-durable-references

Result: see the run recorded after the tables below — it is the last step of this
pass, and its output is pasted there rather than here so the tables it enforces
come first.

# Test Traceability Review

| Requirement Or Scenario | Covered By | Gap |
| --- | --- | --- |
| A change is cited by identity (3 scenarios) | test/run.mjs:384, 393, 412 | None |
| The prohibition covers body text (3 scenarios) | test/run.mjs:419, 424, 429 | None |
| Reserved files are scanned (2 scenarios) | test/run.mjs:476, 481 | None |
| Told apart by shape (4 scenarios) | test/run.mjs:438, 443, 448, 453 | None |
| A path into an archived change (2 scenarios) | test/run.mjs:517, 524 | None |
| Fenced blocks excluded (3 scenarios) | test/run.mjs:458, 463, 471 | None |
| No file excused by name (2 scenarios) | test/run.mjs:499, 1911 | Behavioural half only; the absolute claim is review, see Known Gaps |
| Correctness beyond shape not claimed (2 scenarios) | test/run.mjs:490, 508 | None |

# OKF Verification

## Rule Evidence

| Rule (BR-n) | Capability | Evidence (file:line or test name) | Verdict | Action Taken |
| --- | --- | --- | --- | --- |
| BR-1 | okf-durable-references | `lib/check.mjs:209` (frontmatter path), `lib/check.mjs:566-569` (body message); tests `a sources path under openspec/changes is caught` (test/run.mjs:384), `a locator error names the durable change: form` (412) | match | None |
| BR-2 | okf-durable-references | `lib/check.mjs:545-574`; tests at test/run.mjs:419 (prose), 424 (table cell), 476 (`log.md`), 499 (new file) | match | None. Coverage stops at body + `sources` - see Known Gaps |
| BR-3 | okf-durable-references | `lib/check.mjs:156-163`; tests at test/run.mjs:438, 443, 448, 453 | match | None |
| BR-4 | okf-durable-references | `lib/check.mjs:185` calls `stripFences`, the same helper `checkHygiene` uses at `lib/check.mjs:224`; tests at test/run.mjs:458, 463, 471 | match | None |
| BR-5 | okf-durable-references | Read `checkDurableReferences` (`lib/check.mjs:545-574`) line by line: the only name-based filter is `e.name.endsWith('.md')` at :556, a file-type filter, not an exemption. `RESERVED_BUNDLE_FILES` is not referenced in this function. Tests at test/run.mjs:499, projectTest at 1911 | match | None |
| BR-6 | okf-durable-references | Absence is the evidence: no code path in `checkDurableReferences` or `classifyChangeReference` reads the change tree, and `grep` for `change:` resolution finds no lookup. Test `an unresolvable change id is not reported` (test/run.mjs:490) asserts both no error and no warning | match | None |
| BR-7 | okf-durable-references | `lib/check.mjs:566-568` (distinct message) and `changeIdFromLocator` at `lib/check.mjs:169-174` (strips the `<date>-` prefix); tests at test/run.mjs:517, 524 | match | None |

## Section Review

| Section | Capability | Checked Against | Result |
| --- | --- | --- | --- |
| Domain Terms | okf-durable-references | The seven terms against the implemented classifier | Accurate. "Quoted example" was added during propose when D2 settled, and matches `stripFences` behaviour |
| Data Entities | okf-durable-references | `checkDurableReferences` file walk | Accurate. "Bundle file - any `.md` under `.okf/`, reserved or not" is exactly what :549-556 walks |
| Permissions And Access Control | okf-durable-references | Section absent from the entry | Correct to be absent: no actor is allowed or denied anything here; the rule is about text, not authority |
| Workflows | okf-durable-references | Primary workflow steps 1-4 against `check()` call order at `lib/check.mjs:1150` | Accurate, with one correction made during this pass: the Open Questions section now records that frontmatter keys other than `sources` are unscanned |

## Entry Outcome

| Capability | OKF File | Resulting Verified | verified_at | code_paths Filled | This Change Removed From pending_changes |
| --- | --- | --- | --- | --- | --- |
| okf-durable-references | `.okf/features/okf-durable-references.md` | verified | 2026-08-02 | `[lib/check.mjs]` | yes |

Attestation written as `anthropic/claude-opus-5`. No `human:` actor was written:
only the person named can make that attestation true. `criticality` is `normal`,
so no human sign-off is required for the entry to reach `verified`.

## Decision Promotion

| Decision | Promoted To | Reason If Not Promoted |
| --- | --- | --- |
| D1 - Discriminate by path shape, not by an excused-file list | `.okf/decisions/2026-08-02-bundle-content-rules-discriminate-by-shape.md` | - |
| D2 - Fenced code blocks are the sanctioned escape hatch | `.okf/decisions/2026-08-02-fencing-is-the-sanctioned-escape-hatch.md` | - |
| D3 - Reserved files are scanned, and the existing exemption is narrowed in meaning | `.okf/decisions/2026-08-02-structural-exemption-is-not-content-exemption.md` | - |
| D4 - The scan lives in its own function, called from the bundle walk | - | Change-local. It records where a function was placed in one file to avoid a circular call arrangement; after archive it governs nothing, and the next refactor of `lib/check.mjs` may move it freely |

`okf check --archive` warns that this table has 4 rows for "17 decisions" in
design.md. Nothing is left out — design.md holds exactly four decisions, D1 to
D4, and all four are accounted for above. The gap is in the heuristic:
`countDecisions` (`lib/check.mjs`) counts both `###` subheadings and every line
opening with `**Bold`, so each decision here contributes its `### D-n` heading
plus its `**Choice:**`, `**Why:**`, `**Survives this change:**`, and
`**Alternative rejected:**` fields. Four headings and thirteen sub-fields make
seventeen.

The warning is capped at warning severity for exactly this reason, and the design
of the gate says it is "a prompt to name what you left out, not a quota". Naming
it is the discharge. Reformatting design.md into the `**Bold lead sentence.**`
paragraph style that counts cleanly would satisfy the counter while making the
document less traceable — the `**Survives this change:**` line per decision is
what carries a decision to this table in the first place.

# Known Gaps And Accepted Risks

| Gap Or Risk | Impact | Owner | Follow-Up |
| --- | --- | --- | --- |
| Frontmatter keys other than `sources` are scanned by nothing. The body scan skips the frontmatter block to avoid double reporting, and `checkProvenance` reads only `sources[].resource`, so a locator in `code_paths` passes silently | Low. Those keys hold globs and ids, not documentation. Pre-existing, not introduced here - but BR-2's guarantee stops short of it | Danh Nguyen | Recorded as an Open Question in `.okf/features/okf-durable-references.md`. Closing it needs a decision about which frontmatter keys are reference-bearing, which is a change of its own |
| Acceptance criterion 10's absolute half - "no file excused by name **anywhere** in the implementation" - is verified by reading the diff, not by a test | Low. A future contributor could add an exemption list and no test would fail | Danh Nguyen | The Rule Evidence row for BR-5 records the read. A test asserting the absence of an allowlist would have to assert on source shape and would break on any refactor while the allowlist survived |
| `okf check` reports 1 warning on `.okf/features/okf-archive-gate.md` | None for this change. Pre-existing: a migrated entry that is `verified` but carries no attestation, which regains one at its next verification pass | Danh Nguyen | Unrelated to this change; will clear when `okf-archive-gate` is next verified |

## Proof Boundaries

What this pass establishes: the seven rules are implemented and each is protected
by at least one test that fails when the behaviour is removed — demonstrated, not
assumed, because ten of them were red before the implementation existed and the
two defects found were found by those tests rather than by inspection.

What it does not establish: that no locator form exists which the shape
classifier misreads. The permitted shapes were derived from the four occurrences
in this bundle plus the cases reasoned through while writing the spec; a bundle
in another repository may contain a fifth shape. `stripFences` behaviour on
nested or malformed fences is inherited from `checkHygiene` and was not
independently tested here — matching that helper exactly was the deliberate
choice (design D2), so the two cannot disagree, but neither was probed.

# Archive Readiness

- [x] OpenSpec validation passed for the change
- [x] `openspec validate okf-durable-references --strict` passed for the assembled baseline spec
- [x] Tasks complete, or remaining items explicitly deferred
- [x] Unit test result recorded
- [x] Integration test result recorded (not applicable, with reason)
- [x] E2E result recorded, or marked not applicable with a specific reason
- [x] Every `skeleton` / `planned` test row appears in the test-plan Known Gaps with an owner
- [x] Rule Evidence table filled with real `file:line` or test references for every BR-n touched
- [x] Every linked entry: `verified` set, `verified_at` set, `code_paths` filled, this change id removed from `pending_changes`
- [x] `needs-revision` entries (if any) recorded in the `.okf/index.md` Needs Revision Ledger — none reached that state
- [x] Durable decisions promoted to `.okf/decisions/`, or explicitly skipped with a reason
- [x] `okf check --archive guard-durable-references` exits clean
- [x] Proof boundaries are honest and explicit
