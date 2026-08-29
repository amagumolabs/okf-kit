---
type: Decision
title: The derivation is a floor, not the definition of relatedness
description: A file reached by judgement is listed on the same terms as a derived candidate, because the signals missed three of the four decisions that shaped the change introducing them.
date: 2026-08-05
status: stable
decision_status: accepted
supersedes:
superseded_by:
affects_features:
  - okf-related-knowledge
sources:
  - id: change
    resource: change:add-okf-related-knowledge
linked_changes:
  - add-okf-related-knowledge
---

# Decision

The two derivation signals produce candidates and nothing more. A file reached by
judgement is listed on the same terms, recording `judgement` as what put it
there, and a candidate judged irrelevant keeps its row with the reason rather
than disappearing.

# Context

The evidence is the change that introduced the derivation. Eleven candidates came
out of the two signals. The decisions that actually shaped its design included
three the signals never produced - `no-checker-for-meaning-judgements`,
`required-records-harden-at-the-archive-boundary`, and
`advice-and-refusal-stay-in-different-commands` - each filed against a capability
outside that change's write set. A rule admitting only derived rows would have
excluded exactly the constraints that decided the design.

The derivation also caught something the author's own reading had missed:
`a-rule-the-checker-cannot-see-stays-with-the-author`, the nearest precedent of
all, was named by the check and not by the person. Neither half is reliable
alone, which is why neither is the definition.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| Only derived rows are admissible | Would have excluded three of the four constraints that decided this change's design |
| Only judgement rows - drop the derivation | The derivation caught a precedent the author had read past; a floor that catches one thing is worth having |
| Extend the decision signal one hop, through related capabilities | Would have derived two of the three judgement rows, but multiplies candidates faster than relevance. Left as an open question until a second change confirms the pattern |

# Consequences

Makes easy: recording a constraint the signals cannot see, without arguing with a
tool about whether it belongs.

Makes hard: reading the table as complete. It never is, and the gate says so by
never refusing over what it derived.

The dismissal rule follows from the same place: an omission is indistinguishable
from not having looked, so a candidate ruled out is ruled out in writing.

# Revisit When

A second change reports that the one-hop decision signal would have helped, or
the judgement rows stop appearing at all - which would mean the derivation has
quietly become the definition in practice.
