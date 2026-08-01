---
type: Decision
title: Whether a decision must be promoted is derived from design.md's shape, and an unreadable shape requires a row
description: The archive gate reads design.md rather than accepting a declaration, and treats any shape it cannot recognise as "a row is required" rather than as a waiver.
date: 2026-07-30
status: accepted
supersedes:
superseded_by:
affects_features:
  - okf-archive-gate
sources:
  - id: change
    resource: change:enforce-decision-promotion
linked_changes:
  - enforce-decision-promotion
---

# Decision

The archive gate decides whether a change owes a Decision Promotion row by reading
`design.md`, not by reading a declaration the agent wrote about it. A Decisions
section means rows are owed. The one-line `Not required because <reason>.` form
waives them. Any other shape - empty, truncated, reworded, half-written - also
owes a row.

# Context

Decision promotion was specified in the schema and present in the verification
template, but nothing checked it, so the only thing standing behind it was a
checkbox the same agent ticked. Making it checkable needed a source of truth for
the question "was there anything to promote?".

`design.md` was already the answer, because the schema's `design` rule mandates
that a change with no design worth writing still creates the file holding exactly
one line, `Not required because` followed by a specific reason. That rule exists
so the record shows the
question was considered rather than forgotten. This gate is its first consumer.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| Add a declaration - a `decisions: none` frontmatter field, or a required literal line in verification.md | Creates a third source of truth about one question and puts the agent in a position to declare the answer it prefers. The point of the gate is to constrain that agent |
| Treat the absence of a Decisions section as a waiver | The same bug in another costume. A truncated or reworded design would waive itself, and the failure is invisible because a check that passed looks identical to one that never ran |
| Require the literal waiver phrase and error on everything else, with no Decisions-section detection | Equivalent in effect to the chosen policy but states the rule negatively, so a project reading the finding cannot tell which of the two valid shapes it should move toward |

# Consequences

The gate is coupled to the waiver wording in the schema's own `design` rule. That
coupling is guarded by a test (UT-015) asserting the phrase still appears there, and
it fails in the safe direction: a divergence over-reports, demanding rows nobody
strictly owed, rather than silently waiving the gate for every change.

Makes easy: adding further change-scoped gates that key off `design.md`'s shape.
Makes hard: rewording the design artifact's escape hatch, which now requires
updating the matcher in the same commit.

# Revisit When

The `design` artifact stops mandating a fixed waiver form, or `design.md` gains
real structure - a frontmatter block, or a machine-readable decision list - at
which point inference can be replaced by reading that structure.
