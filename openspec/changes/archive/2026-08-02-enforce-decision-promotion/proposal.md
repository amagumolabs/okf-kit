## Why

`okf check --archive` currently lets a change archive with its entire OKF
verification section blank, provided the change declared no domain knowledge.
Reproduced against a copy of a downstream project: a change whose only okf-link
row read `no domain knowledge - ...`, given a `verification.md` with an empty
Rule Evidence table, an empty Entry Outcome table, and an empty Decision
Promotion table, produced zero OKF findings.

Two separate defects combine to produce that. Decision promotion is never
checked at all, for any change - the only thing guarding it is a checkbox the
agent ticks itself, in a workflow whose own rules state that a checkbox is not
evidence. And the `no domain knowledge` escape hatch, meant to waive one feature
entry, instead disables every archive gate for the change, because those gates
are keyed on the presence of linked entries.

The combination is backwards. An infrastructure change is close to the
definition of "no domain rules, maximum durable architectural decisions", so the
hatch switches off checking exactly where the remaining OKF value is
concentrated. The observed cost is already real: a downstream `workspace-foundation`
change carries four decisions in `design.md`, two of which that file itself calls
durable, against an empty `.okf/decisions/`.

## What Changes

- Add decision promotion enforcement to the archive gate, derived from
  `design.md` rather than from a checkbox (BR-3, BR-4, BR-5, BR-8).
- Decouple the archive gates from the presence of linked feature entries, so a
  change with only `no domain knowledge` rows still answers for its decisions
  (BR-1), while a change missing `okf-link.md` altogether stays a distinct error
  (BR-2).
- Report a Decision Promotion table with fewer rows than `design.md` has
  decisions as a warning rather than an error (BR-6).
- Update the schema's `verification` instruction and `templates/verification.md`
  so the agent is told the Decision Promotion table is enforced, not advisory.

Not **BREAKING** for the kit's API, but it does newly fail changes that would
have archived clean before. That is the point of the change, and it applies only
to changes archived after it lands.

## Capabilities

### New Capabilities
- `okf-archive-gate`: the pre-archive completeness gate - which conditions must
  hold before a change's OKF pass may be buried by archiving, and the principle
  that no escape hatch may silence a gate it was not meant to reach.

### Modified Capabilities

None. `okf-audit` is untouched: it judges drift in already-verified entries from
commit history, while this change concerns completeness of a change's pass before
archive.

## Scope And Non-Goals

**In scope:**
- Archive-mode enforcement of the Decision Promotion table in `verification.md`
- Deriving the requirement from `design.md`'s shape, failing safe when that shape
  is unrecognised
- Separating "no linked entries" from "no `okf-link.md`" in the archive gates
- The schema instruction and template wording that tell the agent this is enforced

**Non-goals:**
- Judging whether a promoted decision file faithfully represents the decision it
  came from. The gate checks that a pointer resolves, not that prose is faithful.
- Deciding for the developer whether a decision is durable or change-local. The
  gate forces the question; only a human answers it.
- Promoting decisions automatically. Writing `.okf/decisions/` from `design.md`
  without anyone reading either is the same failure `okf audit` refuses to commit.
- Re-evaluating already-archived changes.
- Extending the decision entry contract, for instance requiring a promoted file to
  cite the change that produced it. Recorded as an Open Question in the entry.
- Enforcing decisions that appear only in `proposal.md` or in a spec.

## Acceptance Criteria

1. A change whose `design.md` has a Decisions section and whose Decision
   Promotion table is empty fails `okf check --archive` (BR-4).
2. A change whose `design.md` is the one-line `Not required because ...` form
   passes with no Decision Promotion row (BR-3).
3. A Decision Promotion row whose promotion target resolves to a real file under
   `.okf/decisions/` passes; one pointing at a path that does not exist fails
   (BR-5).
4. A Decision Promotion row with no promotion target but a stated reason passes;
   a row with neither fails (BR-5).
5. A change whose okf-link rows are all `no domain knowledge` is still subject to
   decision promotion enforcement (BR-1).
6. A change with no `okf-link.md` at all still fails with that distinct finding,
   not with a decision promotion finding (BR-2).
7. A `design.md` whose shape matches neither recognised form requires a Decision
   Promotion row (BR-8).
8. Fewer rows than decisions produces a warning and a zero exit for that finding
   alone, not an error (BR-6).
9. `templates/verification.md` and the schema's `verification` instruction state
   that the Decision Promotion table is enforced at archive time.
10. This change's own archive run passes the gate it introduces, including
    promoting its own durable decisions.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Detecting `design.md`'s waiver form by wording couples the gate to that wording | A later reword silently waives the requirement for every change | Match the wording the schema's `design` rule already mandates, and fail safe per BR-8 so an unrecognised shape demands a row |
| Enforcing a table invites rows written to satisfy the checker | The gate passes while no decision was genuinely considered | Keep BR-6 a warning so pressure stays on accounting rather than row count; leave the durable-or-local call to the developer |
| Downstream projects mid-change suddenly fail archive | Perceived as churn rather than a fix | The finding names the missing row and the reason-or-path escape, so it is discharged in one edit; no already-archived change is re-evaluated |
| The new gate lands with the same weakness it fixes - untested | The kit would ship a gate it cannot prove works | Acceptance criteria 1-8 are the negative and boundary cases, each one a test reaching `failing` before implementation |

## Impact

- Affected code: `lib/check.mjs` - `checkVerification()` and the okf-link row loop
  in `checkChange()` that populates `linked`
- Affected schema and templates:
  `openspec/schemas/okf-gated-feature/schema.yaml` (`verification` artifact
  instruction), `openspec/schemas/okf-gated-feature/templates/verification.md`
- Affected knowledge: `.okf/features/okf-archive-gate.md` (new, BR-1..BR-8)
- Dependencies: none added
- Downstream impact: every project running `okf check --archive`. Changes that
  would previously have archived with a blank Decision Promotion table now fail
  until the table accounts for `design.md`.
- Not affected: `lib/audit.mjs`, `lib/index-gen.mjs`, `lib/install.mjs`, and the
  non-archive mode of `okf check`
