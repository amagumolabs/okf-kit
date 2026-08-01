## Context

`okf check` is one module, `lib/check.mjs`, run in two modes. Archive mode adds
the stricter gate set. Two of its gates - Rule Evidence and Entry Outcome - are
implemented inside `checkVerification()` and both consume the `linked` array built
by the okf-link row loop in `checkChange()`. That array is only appended to for
rows whose OKF File column resolves to an existing file, so a change declaring
`no domain knowledge` produces an empty `linked` and both gates evaluate to
nothing. A third gate, Decision Promotion, was specified in the schema and put in
the template but never implemented anywhere in `lib/`.

The change therefore has two distinct shapes of work: adding a gate that does not
exist, and correcting the scoping of gates that do. They belong together because
the second is what would otherwise let a downstream project keep skipping the
first - fixing only the new gate would leave it unreachable for exactly the
changes that need it most.

Constraint worth naming: `design.md` is prose written by an agent, not a
structured file. Anything the gate concludes from it is inference. The design
below is mostly about keeping that inference honest.

## Goals / Non-Goals

**Goals:**
- Make decision promotion mechanically checkable without a new declaration file or
  frontmatter field
- Keep the strength of each finding proportional to the strength of the signal it
  rests on
- Keep `linked`'s meaning intact so BR-2's distinction is encoded once rather than
  at every use site
- Stay inside the kit's existing idioms: `tableUnder`, `isBlankRow`, the
  reason-or-path escape, `report.error` / `report.warn`

**Non-Goals:**
- Parsing `design.md` into a structured decision model
- Judging whether a promoted file faithfully represents its source decision
- Any change to non-archive mode, `lib/audit.mjs`, or `lib/index-gen.mjs`

## Decisions

**Derive the requirement from `design.md`'s existing shape, not from a new
declaration.** The alternative was a new field - `decisions: none` in a
frontmatter block, or a required literal line in `verification.md`. Rejected
because it would create a third source of truth about the same question and put
the agent in a position to declare the answer it prefers. `design.md`'s binary
shape already exists for precisely this reason: the schema's `design` rule
mandates the one-line waiver rather than an empty file, so the record shows the
question was considered. This change is the first consumer of that guarantee.

**Fail safe on an unrecognised design shape (BR-8).** Three detection policies
were on the table: treat the absence of a Decisions section as a waiver; require
the literal `Not required because` phrase to waive; or recognise both forms and
require a row for anything else. Chose the third. The first is the same bug this
change is fixing in another costume - a truncated, half-written, or reworded
`design.md` would waive itself silently, and the failure would be invisible
because a passing check looks identical to a check that never ran. Under the
chosen policy an unrecognised shape produces a finding the author can discharge in
one edit, and the worst case is a row someone did not strictly owe.

**Accept that decision counting is a heuristic, and let that set the finding's
severity.** The Decisions section has no fixed syntax. This repository's own
archived design uses `**Bold lead sentence.**` paragraphs; a downstream project
uses `1. **Bold title**` with nested bullets. Counting will therefore recognise a
decision by a bold-lead line, with or without a list marker or number, plus `###`
subheadings, and it will sometimes be wrong. That is the reason BR-6 caps
under-accounting at a warning rather than an error: the enforcement is only as
strong as the inference behind it. The row-level checks (BR-4, BR-5) rest on
structure that is actually fixed - a table's presence and its cells - so those stay
errors. Keeping the two tiers separate is what stops the gate from becoming
ceremony people learn to satisfy mechanically.

**Keep `linked` meaning "rows resolving to a feature entry", and add a separate
signal for "the change has an okf-link.md that parsed".** The alternative was to
push `no domain knowledge` rows into `linked` with a null path. Rejected: every
existing consumer of `linked` would need a null check, and BR-2's distinction
would be re-derived at each use site instead of stated once. Instead the gates
split by what they are about - gates describing an entry keep iterating `linked`,
gates describing the change take the change as their subject and run
unconditionally.

**Reuse `tableUnder` for the Decision Promotion table.** Same parsing path as Rule
Evidence and Entry Outcome already use, including `isBlankRow` to discard the
template's empty row. A promotion target is recognised as a path by stripping
backticks and testing that it resolves under `.okf/decisions/`; anything else in
that cell that is non-empty but does not resolve is an error rather than a silent
pass, so a mistyped filename cannot masquerade as a promotion.

## Risks / Trade-offs

- **The waiver phrase is now load-bearing across two files** -> The schema's
  `design` rule mandates the wording and this gate matches it; BR-8 means a
  divergence over-reports rather than under-reports, so the coupling fails in the
  safe direction.
- **Heuristic counting will produce occasional wrong warnings** -> Accepted
  deliberately, and bounded to a warning. A wrong warning costs one line of
  reading; a wrong pass costs the knowledge.
- **Downstream changes in flight will start failing at archive** -> The finding
  names the table and both escapes, so it is one edit to discharge. No
  already-archived change is re-evaluated.
- **Two shapes of work in one change** -> Kept together because separating them
  would ship a gate that its own worst case cannot reach; the spec keeps them as
  distinct requirements so the tests stay separable.

## Migration Plan

No migration. The gate reads files that already exist in every change directory,
and only runs against a change being archived after this lands. Rollback is
reverting the commit; nothing is written or converted.

## Open Questions

None blocking. The one deferred question - whether a promoted decision file should
have to cite the change that produced it, making the promotion link checkable from
both ends - is recorded in `.okf/features/okf-archive-gate.md` under Open
Questions, because it extends the decision entry contract rather than this gate.
