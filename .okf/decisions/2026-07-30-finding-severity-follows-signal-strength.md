---
type: Decision
title: A finding's severity follows the strength of the signal behind it
description: In okf check, an error must rest on fixed structure; a finding that rests on inference over free prose may only warn.
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

`okf check` reports an error only where the thing it checked has a fixed shape:
a table's presence, a cell's emptiness, a path resolving, a value drawn from a
closed vocabulary. Where a finding rests on inference over prose an agent wrote
freely, it reports a warning, however confident the inference feels.

The decision promotion gate is the worked example. Whether the Decision Promotion
table is empty, and whether each row answers with a resolving path or a stated
reason, are errors - they read structure. How many decisions `design.md` contains
is a warning, because the Decisions section has no fixed syntax: this repository's
designs use `**Bold lead sentence.**` paragraphs, downstream projects use
`1. **Bold title**` items, and the counting heuristic will sometimes be wrong.

# Context

The gate had to be strong enough to stop a change archiving with its decisions
unrecorded, without becoming the kind of check people satisfy mechanically. Those
two failure modes pull in opposite directions, and severity is the dial between
them.

A wrong error trains the reader to argue with the tool, then to ignore it, then to
add rows purely to silence it - at which point the table is full and the knowledge
base has learned nothing. A wrong warning costs one line of reading.

# Consequences

Cheap to be generous with heuristic checks, because the cost of being wrong is
bounded. Any future gate must state which half it is in, and a heuristic must not
be promoted to an error later without first being given fixed structure to read.

The asymmetry is deliberate and not a sign of an unfinished check: the row-level
errors and the count-level warning in the same gate are correct as they are.

# Revisit When

A heuristic acquires structure to read instead - for instance if the Decisions
section gains a mandated per-decision format - at which point that particular
finding may be promoted from warning to error.
