# Verification

# Summary

| Area | Status | Notes |
| --- | --- | --- |
| OpenSpec validation | passed | The change, and both baseline specs after sync |
| Unit tests | passed | 304 passed, 0 failed, 0 todo |
| Integration tests | passed | IT-601, IT-602, both promoted from skeleton in group 5 |
| API E2E tests | not applicable | The kit exposes no network interface |
| Browser E2E tests | not applicable | The kit is a command-line validator with no UI |
| Static analysis | passed | `npm run lint` clean; no type checker in this project, stated below |
| OKF verification | passed | Both entries verified; 13 of 14 rules `match`, one `okf-gap` repaired as BR-11 |
| OKF validation (`okf check`) | passed | clean |
| Archive readiness | ready | `okf check --archive add-okf-related-knowledge` exits clean |

# OpenSpec Validation

Command:

    openspec validate add-okf-related-knowledge --strict

Result:

    Change 'add-okf-related-knowledge' is valid

## Synced Capability Specs

| Capability | Command | Result |
| --- | --- | --- |
| okf-related-knowledge | `openspec validate okf-related-knowledge --strict` | `Specification 'okf-related-knowledge' is valid` - new baseline, written with a real Purpose rather than a TBD |
| okf-archive-gate | `openspec validate okf-archive-gate --strict` | `Specification 'okf-archive-gate' is valid` - 15 requirements after the 3 added here |

# Unit Tests

Command:

    npm test

Result:

    304 passed

Every unit row in test-plan.md records the state observed before any
implementation existed. Nineteen started `failing` on their assertion; ten
started `passing` and each says why in the same shape - they are guards against
the gate over-firing on correct input, and only a green-from-the-start test can
be that. UT-624 was added during this pass, after BR-11 and the spec were
amended, and was red before the code changed.

# Integration Tests

Command:

    npm test

Result:

IT-601 and IT-602 were written as `todo(...)` skeletons before implementation and
promoted in group 5. IT-601 builds a fixture with both signals firing, both
candidates named, and asserts `okf check --archive` reports nothing at all.
IT-602 re-runs four pre-existing archive-gate conditions and asserts each still
fires at its original level.

# API E2E Tests

Not applicable: the kit exposes no network interface. `bin/okf.mjs` is its only
entry point, and the unit fixtures call `check()` directly.

# Browser E2E Tests

Not applicable: the kit is a command-line validator with no user interface of any
kind, so the four render states have nothing to render.

# Static Analysis

| Check | Command | Result |
| --- | --- | --- |
| Lint | `npm run lint` | `node --check: all files parse` - 0 errors |
| Typecheck | `-` | Not Applicable because this project has no type checker, as declared in `AGENTS.md` outside the okf-kit markers. The kit is plain ESM annotated with JSDoc, and adopting one would add its first dependency |

`npm run lint` runs `node --check` over `bin/`, `lib/` and `test/`. That is a
parse check, not a rule-based lint: it catches a syntax error before it reaches a
user and says nothing about style or unused bindings. Reported as what it is.

# OKF Validation

Command:

    okf check --archive add-okf-related-knowledge

Result:

    okf check: clean (.)

# Test Traceability Review

| Requirement Or Scenario | Covered By | Gap |
| --- | --- | --- |
| Every acceptance criterion in proposal.md | UT-601, UT-602, UT-605, UT-606, UT-610, UT-611, UT-612, UT-614, UT-608, NEG-601 | none |
| Every scenario in specs/okf-related-knowledge/spec.md | UT-604..UT-624, NEG-601..NEG-605 | none |
| Every scenario in specs/okf-archive-gate/spec.md | UT-601..UT-603, UT-606, UT-607, UT-610..UT-615 | none |
| The rules that live in prose, not in code | UT-617..UT-623 against the shipped template and schema | The tests assert the instruction says the thing; nothing asserts an agent read it. Stated, not closed |

# OKF Verification

## Rule Evidence

| Rule (BR-n) | Capability | Evidence (file:line or test name) | Verdict | Action Taken |
| --- | --- | --- | --- | --- |
| BR-1 | okf-related-knowledge | `lib/check.mjs:697` (`RELATED_HEADING`), `lib/check.mjs:915-930` (the two tables never merge) | match | none |
| BR-2 | okf-related-knowledge | `lib/check.mjs:1040-1041` - `related` and `candidates` are returned beside `linked` and never merged into it; UT-614 | match | none |
| BR-3 | okf-related-knowledge | `lib/check.mjs:1095-1123` (`relatedCandidates`), reading only `code_paths` and `affects_features`; UT-616 | match | none |
| BR-4 | okf-related-knowledge | `openspec/schemas/okf-gated-feature/schema.yaml:95-99`; UT-618 | match | The rule lives in the instruction; no checker, by `no-checker-for-meaning-judgements` |
| BR-5 | okf-related-knowledge | `lib/check.mjs:932-940` - the loop reports only unmentioned candidates and never a wider set; UT-613 | match | none |
| BR-6 | okf-related-knowledge | `openspec/schemas/okf-gated-feature/templates/okf-link.md:63`; UT-617, UT-619 | match | none |
| BR-7 | okf-related-knowledge | `lib/check.mjs:727-737` (`statedEmpty`), `lib/check.mjs:897-913`; UT-604, UT-605, UT-605b | match | none |
| BR-8 | okf-related-knowledge | `openspec/schemas/okf-gated-feature/schema.yaml:154-159`; UT-621 | match | none |
| BR-9 | okf-related-knowledge | `openspec/schemas/okf-gated-feature/schema.yaml:551-556`; UT-622 | match | none |
| BR-10 | okf-related-knowledge | `lib/check.mjs:1113` reads `.okf/decisions/`; `schema.yaml:88`; UT-609, UT-623 | match | none |
| BR-11 | okf-related-knowledge | `lib/check.mjs:1116`; UT-624 | okf-gap | The rule did not exist. Promoting this change's own four decisions made all four candidates of the change that authored them. BR-11 was written first, then the spec, then the test-plan row, then UT-624, then the code |
| BR-13 | okf-archive-gate | `lib/check.mjs:885-941` (`checkRelatedKnowledge`), called at `lib/check.mjs:826`; UT-606, UT-615 | match | none |
| BR-14 | okf-archive-gate | `lib/check.mjs:886` (`hardensAtArchive`), used at `:890` and `:898`; UT-601, UT-602 | match | none |
| BR-15 | okf-archive-gate | `lib/check.mjs:935` - `report.warn` directly, never `hardens`; UT-612 | match | none |

BR-1..BR-12 of okf-archive-gate are untouched by this change. IT-602 asserts four
of the conditions they govern still fire at their original level.

## Section Review

| Section | Capability | Checked Against | Result |
| --- | --- | --- | --- |
| Domain Terms | okf-related-knowledge | `lib/check.mjs` and the shipped instruction | Read set, write set, related entry, derivation signal, targeted read, cross-entry conflict all used with the meaning recorded |
| Domain Terms | okf-archive-gate | unchanged by this change | no drift |
| Data Entities | okf-related-knowledge | `readRelated` and `relatedCandidates` return shapes | The three entities named - the table, the signal, the dismissed candidate - are what the code produces. `linked_changes` added to what a signal reads (BR-11) |
| Permissions And Access Control | both | - | Neither entry has this section; the kit has no actors or permissions |
| Workflows | okf-related-knowledge | The two-scan sequence in the okf-link and proposal instructions | Matches, including the alternative flow where a related file moves into the OKF Link table |

## Entry Outcome

| Capability | OKF File | Resulting Verified | verified_at | code_paths Filled | This Change Removed From pending_changes |
| --- | --- | --- | --- | --- | --- |
| okf-related-knowledge | `.okf/features/okf-related-knowledge.md` | verified | 2026-08-05 | yes | yes |
| okf-archive-gate | `.okf/features/okf-archive-gate.md` | verified | 2026-08-05 | yes (unchanged) | yes |

## Decision Promotion

| Decision | Promoted To | Reason If Not Promoted |
| --- | --- | --- |
| The read set gets its own table; the OKF Link table is not widened | `.okf/decisions/2026-08-05-the-read-set-gets-its-own-table.md` | - |
| Relatedness is derived from existing frontmatter, never declared in a `related:` field | `.okf/decisions/2026-08-05-relatedness-is-derived-not-declared.md` | - |
| The derivation is a floor, not the definition of relatedness | `.okf/decisions/2026-08-05-the-derivation-is-a-floor-not-a-definition.md` | - |
| The gate reads structure and reports candidates; it never refuses over its own derivation | `.okf/decisions/2026-08-05-the-gate-never-refuses-over-its-own-derivation.md` | - |
| The derivation extends the shared change-state read | - | change-local: it applies `shared-change-state-reads-are-extracted` rather than deciding anything new. That decision already says where a shared read belongs |

# Known Gaps And Accepted Risks

| Gap Or Risk | Impact | Owner | Follow-Up |
| --- | --- | --- | --- |
| UT-617..UT-623 assert the shipped instruction says a thing, never that an agent read it | An instruction can be present and ignored | change author | Accepted and stated. This is the same boundary `no-checker-for-meaning-judgements` already drew |
| The `code_paths` overlap signal conflates "touches the same file" with "constrains the same meaning" | Candidates that cost attention and are dismissed | change author | Accepted by design: BR-4 makes the dismissal cheap, and BR-15 keeps the finding a warning |
| A candidate can be left unmentioned and the change still archives | A real neighbour goes unread | change author | Deliberate - see `2026-08-05-the-gate-never-refuses-over-its-own-derivation.md`. An error there is satisfied by pasting every candidate in |

# Archive Readiness

- [x] OpenSpec validation passed for the change
- [x] `openspec validate <capability> --strict` passed for every spec synced into `openspec/specs/` - both run after the sync step, both valid
- [x] Tasks complete, or remaining items explicitly deferred
- [x] Unit test result recorded
- [x] Integration test result recorded
- [x] E2E result recorded, or marked not applicable with a specific reason
- [x] Static Analysis table filled: a real result per required row, or a stated reason
- [x] Every `skeleton` / `planned` test row appears in the test-plan Known Gaps with an owner - none remain; both integration rows reached `passing`
- [x] Rule Evidence table filled with real `file:line` or test references for every BR-n touched
- [x] Every linked entry: `verified` set, `verified_at` set, `code_paths` filled, this change id removed from `pending_changes`
- [x] `needs-revision` entries (if any) recorded in the `.okf/index.md` Needs Revision Ledger - none
- [x] Durable decisions promoted to `.okf/decisions/`, or explicitly skipped with a reason
- [x] `okf check --archive add-okf-related-knowledge` exits clean
- [x] Proof boundaries are honest and explicit

## Proof Boundaries

Three things this pass does not prove.

The derivation is a heuristic about relevance, and nothing here shows it is a
good one. What it did show, twice in one change: it named
`a-rule-the-checker-cannot-see-stays-with-the-author` after the author had read
past it, and it named this change's own promoted decisions, which was a defect in
the rule rather than a find. One useful catch and one false positive in a single
change is a small sample stated as such.

The prose rules - BR-4, BR-6, BR-8, BR-9 - are protected by tests that read the
shipped instruction text. That proves the instruction says the thing. Whether an
agent then does it is not observable from any file, and no test here pretends
otherwise.

The kit reads what a change reports about lint and never runs it. That boundary
is unchanged by this change and is stated again because the Static Analysis row
above is a claim, not a reproduction.
