## 1. Contract Stubs

- [x] 1.1 Declare `designShape(text)` in `lib/check.mjs` returning `'waived' | 'has-decisions' | 'unrecognised'`, body `throw new Error('not implemented')`
- [x] 1.2 Declare `countDecisions(text)` in `lib/check.mjs` returning a number, body `throw new Error('not implemented')`
- [x] 1.3 Declare `checkDecisionPromotion(root, changeDir, verificationText, where, report)` in `lib/check.mjs` - empty body, NOT throwing, because a throwing stub at this call site crashes `check()` and makes all 88 tests fail on the crash instead of their own assertions. Reason recorded in the test-plan Contract Stubs table
- [x] 1.4 Call `checkDecisionPromotion` from `checkVerification` in archive mode only, so the stub is reached by the tests in group 2

## 2. Pre-Implementation Unit Tests

<!--
2.1 comes first on purpose: without a design.md in the fixture, every archive-mode
test would fail on an unrecognised shape rather than on its own assertion, and the
red state would prove nothing.
-->

- [x] 2.1 Extend `scaffold()` in `test/run.mjs`: add a `DESIGN` fixture constant with two decisions, write it to the fixture change, and add a satisfied Decision Promotion table plus a real `.okf/decisions/` file to the fixture
- [x] 2.2 Confirm the existing suite still passes after 2.1, so later red is caused by the new tests and not by the fixture change
- [x] 2.3 Write UT-013 (clean fixture stays archivable) and UT-012 (entry-scoped gates stay silent with no resolving row) - the two guards against over-correction
- [x] 2.4 Write UT-001, UT-009, NEG-002 for BR-4 (empty table with decisions, a row per decision, template blank row counts as empty)
- [x] 2.5 Write UT-002 for BR-3 (waived design needs no row)
- [x] 2.6 Write UT-007, NEG-003 for BR-8 (unrecognised and empty design shapes require a row)
- [x] 2.7 Write UT-003, UT-004, UT-005, UT-006, NEG-001 for BR-5 (the four row shapes, plus a target outside `.okf/decisions/`)
- [x] 2.8 Write UT-008, UT-014, NEG-004 for BR-6 (warning not error, both decision syntaxes count alike, unrecognisable section counts zero)
- [x] 2.9 Write UT-010 for BR-1 and UT-011 for BR-2 (all-`no domain knowledge` change still gated; missing `okf-link.md` stays a distinct finding)
- [x] 2.10 Write UT-015 for BR-7 (the waiver phrase the gate matches occurs in the schema's own `design` rule)
- [x] 2.11 Write E2E-001: run `node bin/okf.mjs check --archive` as a subprocess and assert exit 0 when the only finding is the under-accounting warning
- [x] 2.12 Run `npm test` and record each test's actual assertion failure in the test-plan Initial Status column, replacing `planned` with `failing: <message>`

## 3. Implementation

- [x] 3.1 Implement `designShape`: recognise the schema-mandated `Not required because` waiver, recognise a Decisions section, return `unrecognised` otherwise (BR-3, BR-8)
- [x] 3.2 Implement `countDecisions`: count bold-lead lines with or without a list marker or number, plus `###` subheadings, inside the Decisions section (BR-6)
- [x] 3.3 Implement `checkDecisionPromotion` row checks: read the table with `tableUnder` and drop blank rows with `isBlankRow`; error when a row has neither a resolving target under `.okf/decisions/` nor a reason, and when a stated target does not resolve (BR-5)
- [x] 3.4 Implement the table-level requirement: error on an empty table when `designShape` is not `waived` (BR-4, BR-8)
- [x] 3.5 Implement the under-accounting warning against `countDecisions`, as `report.warn` and never `report.error` (BR-6)
- [x] 3.6 Split the archive gates in `checkChange` / `checkVerification`: keep `linked` meaning "rows resolving to a feature entry" for the entry-scoped gates, and add a separate signal so change-scoped gates run whether or not any row resolved (BR-1)
- [x] 3.7 Confirm a missing `okf-link.md` still returns early with its own finding and produces no promotion finding (BR-2)
- [x] 3.8 Run `npm test` until every group 2 test is green with no test rewritten to match the code

## 4. Workflow Documentation

<!--
Not an implementation group: the schema and template are what tell an agent the
table is enforced. Kept after group 3 so the wording describes behaviour that
exists.
-->

- [x] 4.1 Update the `verification` artifact instruction in `openspec/schemas/okf-gated-feature/schema.yaml`: state that the Decision Promotion table is checked at archive time, and name the reason-or-path escape
- [x] 4.2 Update the Decision Promotion section in `openspec/schemas/okf-gated-feature/templates/verification.md` to say the same, and make the two escapes explicit in the column guidance
- [x] 4.3 Confirm UT-015 still passes after any wording change, since it is the coupling guard between the schema's `design` rule and the gate's matcher
- [x] 4.4 Check whether the OKF addendum in `CLAUDE.md` / `AGENTS.md` needs the same statement, and keep the two marker blocks byte-identical if it does

## 5. Verification And OKF Pass

- [x] 5.1 Run `npm test`, `npx openspec validate enforce-decision-promotion --strict`, and `npx openspec validate okf-archive-gate --strict`; record the exact commands and real results in verification.md
- [x] 5.2 Confirm no test row is left at `planned` or `skeleton`, and that the test-plan Known Gaps row for the planned batch is resolved rather than carried forward
- [x] 5.3 For each of BR-1 through BR-8, read the code and fill the Rule Evidence table with a real `file:line` in `lib/check.mjs` or the name of the test that protects it
- [x] 5.4 Apply the verdicts: `okf-gap` updates `.okf/features/okf-archive-gate.md`, `code-gap` is a defect to fix in `lib/check.mjs`, `conflict` goes to the user
- [x] 5.5 Review the entry's Domain Terms, Data Entities, and Workflows sections against what was actually built, and correct staleness in the entry itself
- [x] 5.6 Set `verified` and `verified_at` on `.okf/features/okf-archive-gate.md`, fill `code_paths` from the evidence gathered, remove `enforce-decision-promotion` from `pending_changes`, and append a Verification History row
- [x] 5.7 Promote the durable decisions from design.md to `.okf/decisions/` - at minimum the fail-safe policy for an unrecognised design shape and the severity-follows-signal-strength split between BR-5 and BR-6 - and fill the Decision Promotion table with what was promoted and what was change-local
- [x] 5.8 Run `node bin/okf.mjs index` to regenerate `.okf/INDEX.md`

## 6. Archive Readiness

- [x] 6.1 Run `node bin/okf.mjs check --archive enforce-decision-promotion` and fix everything it reports - this change must pass the gate it introduces, including its own Decision Promotion table
- [x] 6.2 Validate the assembled baseline, not only the change - done in a scratch copy: the delta plus `## Purpose` and `## Requirements` gives `Specification 'okf-archive-gate' is valid`. The sync itself is deliberately NOT done here; `openspec archive` performs it, and writing the baseline early risks a conflicting second application at archive time
- [x] 6.3 Bump the kit version and confirm the version guard still holds, since downstream projects will see a newly failing gate
- [x] 6.4 Complete the Archive Readiness checklist in verification.md, and state the proof boundary honestly: the gate is proven against fixtures, not yet against a real downstream archive run
