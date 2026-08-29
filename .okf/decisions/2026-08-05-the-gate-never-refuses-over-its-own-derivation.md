---
type: Decision
title: The gate reads structure and reports candidates, and never refuses over its own derivation
description: Table presence and row resolution are errors; an unmentioned candidate is a warning forever, because an error there is satisfied by pasting every candidate in.
date: 2026-08-05
status: stable
decision_status: accepted
supersedes:
superseded_by:
affects_features:
  - okf-archive-gate
  - okf-related-knowledge
sources:
  - id: change
    resource: change:add-okf-related-knowledge
linked_changes:
  - add-okf-related-knowledge
---

# Decision

`okf check` reports three things about a change's read set: that the Related
Knowledge table exists, that it is not silent, and that each row resolves. Those
read fixed shape, so they warn in a normal run and error under `--archive`. A
candidate the kit can derive that no row mentions is a warning in both runs, and
never becomes an error.

# Context

The severity rule already existed: a finding over fixed shape is an error, a
finding resting on inference is a warning. Overlap and `affects_features` say two
files might bear on each other; whether one does is an inference.

Beyond severity there is a shape problem. An error over an unmentioned candidate
has exactly one cheap remedy - paste every candidate into the table. The result
is a full table, an unchanged read set, and one fewer signal for a reviewer, which
is the failure `no-checker-for-meaning-judgements` and
`a-rule-the-checker-cannot-see-stays-with-the-author` both already named in this
kit. Refusing on the difference between the kit's derivation and the change's
judgement would also make the kit the author of the read set, which it is not
equipped to be.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| Error on an unmentioned candidate at `--archive` | Satisfied by listing everything; fills the table and widens nothing |
| Report nothing about candidates at all | Loses the one half the kit can honestly compute, and the derivation caught a precedent this change's author had missed |
| Check that a listed file is genuinely related | A judgement about meaning, and the kit has already recorded that it does not make those |

# Consequences

Severity keeps meaning what it meant: an error marks something wrong today, a
warning marks either something owed by archive or something worth a second look.
The candidate warning is the second kind, and it is the first finding in this kit
that stays a warning at the archive boundary on purpose.

A change can archive with a candidate unmentioned. That is deliberate: the row it
would have added would have been written to silence a tool.

# Revisit When

The candidate warning is observed being ignored wholesale across changes, which
would mean the signal is too noisy to be worth computing rather than too weak to
enforce.
