---
type: Feature Knowledge
title: okf-archive-gate
description: The pre-archive completeness gate that decides whether a change's OKF pass is finished, and that must not be silenced by any escape hatch.
status: active
verified: verified
verified_at: 2026-07-30
criticality: normal
pending_changes: []
code_paths: [lib/check.mjs]
sources:
  - id: review-2026-07-30
    resource: 'Review conversation 2026-07-30, reproduced against a copy of a downstream project: a change whose okf-link rows were all "no domain knowledge" archived clean with every OKF table in verification.md left blank - "tại sao okf-kit của chúng ta không bắt buộc cập nhật decisions trong trường hợp này? Đó có phải là lỗ hổng hay không"'
  - id: change-enforce-decision-promotion
    resource: change:enforce-decision-promotion
linked_changes:
  - enforce-decision-promotion
generated:
  by: claude-opus-5
  at: 2026-07-30T00:00:00Z
---

# Summary

Archiving is the only irreversible step in the workflow: it moves a change
directory under `openspec/changes/archive/` where nobody reads it again. The
archive gate is therefore the last moment at which the workflow can refuse to
bury knowledge that was never written down. `okf check --archive` for that change id
is that gate.

Its subject is completeness of the OKF pass, not correctness of the code. Two
properties make it trustworthy: it must apply to every change rather than only
to changes that happen to carry domain rules, and it must never accept a
self-ticked checkbox as the sole proof of a step. A gate that can be silenced by
declaring a change uninteresting is not a gate.

# Domain Terms

| Term | Meaning | Source |
| --- | --- | --- |
| Archive gate | The stricter check set run as `okf check --archive` for that change id, which decides whether a change's OKF pass is complete enough to archive | review-2026-07-30 |
| Linked entry | An okf-link row that resolves to a real file under `.okf/features/`, as opposed to a `no domain knowledge` row | review-2026-07-30 |
| Decision promotion | Copying a decision out of a change's `design.md` into `.okf/decisions/` so it survives archiving | review-2026-07-30 |
| Durable decision | A decision whose consequences outlive the change that made it, and which later capabilities will be bound by | review-2026-07-30 |
| Change-local decision | A decision that only governs how this one change was carried out, and carries no meaning once it is archived | review-2026-07-30 |
| Reason-or-path escape | The kit's standard escape hatch shape: a row is satisfied either by a pointer that resolves, or by a stated specific reason - never by silence | review-2026-07-30 |

# Actors And Roles

| Actor | Role In Feature | Notes |
| --- | --- | --- |
| Agent completing a change | Runs the gate and fixes what it reports before claiming archive readiness | Wrote the implementation, so is not a neutral judge of its own completeness - the gate exists to constrain exactly this actor |
| Developer | Decides whether a decision is durable or change-local when the gate asks | The only actor who can settle that judgement; the gate can force the question but not answer it |
| CI | Runs the gate so an incomplete pass cannot be merged | Findings must be actionable, not routine noise |

# Business Rules

| ID | Rule | Source |
| --- | --- | --- |
| BR-1 | Every archive gate MUST apply to a change whose okf-link rows are all `no domain knowledge`. Such a change still has design decisions and an OKF pass to account for, so keying a gate on the presence of linked entries lets one escape hatch silence gates it was never meant to reach. | review-2026-07-30 |
| BR-2 | "This change has no linked feature entries" and "this change has no okf-link.md at all" MUST remain distinct conditions. The first is a legitimate state for an infrastructure change; the second means a mandatory gate artifact was skipped, and stays an error. | review-2026-07-30 |
| BR-3 | Whether decision promotion is required MUST be derived from `design.md`. When `design.md` is the one-line `Not required because <reason>.` form, no decision exists to promote and no Decision Promotion row is required. | review-2026-07-30 |
| BR-4 | When `design.md` contains a Decisions section, the Decision Promotion table MUST have at least one row. An empty table there asserts that nothing was considered, which is different from asserting that nothing was durable. | review-2026-07-30 |
| BR-5 | Each Decision Promotion row MUST carry either a promotion target that resolves to a real file under `.okf/decisions/`, or a stated reason for not promoting. This is the same reason-or-path escape the kit already applies to `no domain knowledge`, `Not required because`, and `Not Applicable because`. | review-2026-07-30 |
| BR-6 | A Decision Promotion table with fewer rows than `design.md` has decisions MUST be reported as a warning, not an error. A design legitimately contains change-local decisions, and demanding one row per decision converts the gate into ceremony that gets filled in mechanically. | review-2026-07-30 |
| BR-7 | A self-ticked checkbox MUST NOT be the only thing guarding an archive gate. Wherever the schema states an archive requirement as a checklist item, the mechanically checkable half of it belongs in `okf check`. | review-2026-07-30 |
| BR-8 | When the shape of `design.md` cannot be recognised, the gate MUST fail safe and require a Decision Promotion row. An unrecognised shape is an unknown, and this kit never converts an unknown into an assurance. | review-2026-07-30 |

# Data Entities

| Entity | Description | Important Fields Or States |
| --- | --- | --- |
| Decision Promotion table | The record in `verification.md` accounting for each decision in `design.md` at archive time | Decision; Promoted To (a path under `.okf/decisions/`); Reason If Not Promoted. A row satisfies BR-5 through exactly one of the latter two, and writes `-` in the other - `-` and an empty cell both read as absent, which is this workflow's convention in every other table |
| design.md shape | The deliberately binary form the `design` artifact takes, which is what makes BR-3 checkable | Either the single line `Not required because <reason>.`, or a full design containing a Decisions section |

# Workflows

## Primary Workflow

1. The change's OKF pass is recorded in `verification.md`.
2. `okf check --archive` for that change id reads `okf-link.md` and separates rows into
   linked entries and `no domain knowledge` rows.
3. Gates that concern linked entries (rule evidence, entry outcome, cleared
   `pending_changes`) run over the linked entries.
4. Gates that concern the change as a whole run regardless of whether any linked
   entry exists (BR-1), including decision promotion.
5. Decision promotion is evaluated by reading `design.md` to decide whether a row
   is required at all (BR-3, BR-8), then checking each row's reason-or-path
   (BR-5), then comparing row count against decision count as a warning (BR-6).
6. The change is archive-ready when the gate exits clean.

## Alternative Or Failure Workflows

- A change with only `no domain knowledge` rows still reaches step 4 and must
  answer for its decisions. This is the case the gate previously skipped
  entirely.
- A decision the developer judges change-local is discharged by stating that
  judgement as the row's reason, not by deleting the row.

# Risks And Compliance Constraints

| Risk Or Constraint | Impact | Mitigation Or Handling |
| --- | --- | --- |
| Detecting the `Not required because` form couples the gate to that exact wording | A later reword of the design artifact's escape hatch silently disables the requirement | Match the wording the schema's own design rule mandates, and fail safe per BR-8 so an unrecognised shape demands a row rather than waiving one |
| Enforcing a table can produce rows written to satisfy the checker | The gate passes while no decision was actually considered | Keep BR-6 a warning so the pressure stays on accounting for decisions rather than on row count, and leave the durable-or-local judgement with the developer |
| Newly enforced gates fail changes archived under the old rules | Retroactive noise on work already finished | The gate only runs against a change being archived now; already-archived changes are not re-evaluated |

# Assumptions

- `design.md` is the only change artifact holding decisions worth promoting.
  Decisions that surface only in `proposal.md` or in a spec are out of this
  gate's scope.
- A promoted decision is adequately identified by a resolvable path under
  `.okf/decisions/`; the gate does not attempt to judge whether the promoted
  file faithfully represents the decision it came from.

# Open Questions

- Should a promoted decision file be required to cite the change that produced it
  in its `sources`, so the promotion link is checkable from both ends? Deferred:
  it would extend the decision entry contract rather than the archive gate, and
  provenance checking for decision files already exists separately.

# Verification History

| Date | Change | Verified Status | Evidence / Notes |
| --- | --- | --- | --- |
| 2026-07-30 | enforce-decision-promotion | verified | BR-1..BR-8 all `match` against `lib/check.mjs:641-802`, each row naming a line read after implementation. 88 unit tests pass, up from 68; 19 of the 20 new assertions were red before implementation. The original defect was reproduced on a real downstream change (`m7-okf` at `workspace-foundation`) and is now caught. Data Entities corrected during the pass: a `-` cell reads as absent, which the entry had not stated |
