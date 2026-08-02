---
type: Decision
title: Every owed step carries its discharging command
description: Each step okf next reports includes a runnable command string, not prose alone.
date: 2026-08-02
status: stable
decision_status: accepted
supersedes:
superseded_by:
affects_features:
  - okf-next
sources:
  - id: change
    resource: change:add-okf-next-command
linked_changes:
  - add-okf-next-command
---

# Decision

Every owed step `okf next` reports includes the concrete command that discharges
it. A description without a command is not a complete answer.

# Context

A step reported as prose makes the next actor translate it, and translation is
where a workflow loses steps. The same reason the schema's escape hatches demand
a stated reason rather than a flag applies here: silence and paraphrase both drop
information.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| Prose-only steps ("run the verification pass") | Forces every consumer to reconstruct the command; that reconstruction is where steps disappear |
| Link to documentation instead of a command | A link is not runnable; the next actor still has to invent the invocation |

# Consequences

Makes easy: an agent or developer copying the next line and running it.

Makes hard: reporting obligations that have no single discharging command.
Accepted - those obligations are phrased against `okf check --archive`, which is
what settles them.

# Revisit When

A step appears whose discharge is not a command (a human judgment with no tool),
and the output shape needs a non-command slot.
