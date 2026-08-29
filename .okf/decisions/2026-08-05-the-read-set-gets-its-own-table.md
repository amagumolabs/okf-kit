---
type: Decision
title: The read set gets its own table, and the OKF Link table is not widened
description: A change records what it reads but does not write in a second table, because the first one's rows carry an obligation and must mirror the proposal exactly.
date: 2026-08-05
status: stable
decision_status: accepted
supersedes:
superseded_by:
affects_features:
  - okf-related-knowledge
  - okf-archive-gate
sources:
  - id: change
    resource: change:add-okf-related-knowledge
linked_changes:
  - add-okf-related-knowledge
---

# Decision

`okf-link.md` carries two tables. The OKF Link table lists the capabilities a
change modifies; the Related Knowledge table lists the bundle files it must read
and must not modify. A file is never in both, and moving between them is what
creates or discharges an obligation.

# Context

Every downstream artifact reads the bundle through `okf-link.md`, and its rows
are built from the capabilities a change writes. That made a change's read set
equal to its write set. Two leaks were already visible in this repository:
`lib/check.mjs` is a declared `code_path` of five entries, so an edit that looks
local inside one can contradict a rule in another; and `.okf/decisions/` was
write-only in the workflow, named where a decision is promoted and nowhere as
something to read.

The obvious fix - one table with a "modified?" column - breaks the thing that
makes the gate work. `checkChange` errors in both directions against the
proposal's Capabilities section, so a related row reports as an undeclared
capability and the proposal reports as missing a row it should never have. Worse,
`readChangeState` feeds `linked` to the archive gate, which would then demand a
Rule Evidence row, a cleared `pending_changes`, and an attestation for an entry
the change never opened for writing.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| One table with a "modified?" column | Breaks the mirror-the-proposal invariant, and gives read-only entries the write set's obligations |
| A separate artifact file for the read set | A second file to create, order, and gate, for a table that is read at exactly the moments `okf-link.md` already is |
| No record at all - just instruct the agent to read more | Leaves nothing for a later reader to see, and nothing for the gate to notice was skipped |

# Consequences

Makes easy: widening what a change reads without widening what it owes, and
seeing afterwards which neighbours were considered and cleared.

Makes hard: treating relatedness as a soft form of modification. An entry that
turns out to need editing has to move tables, and the move is the point - it is
where the duty attaches.

# Revisit When

A third relationship appears that is neither "writes" nor "reads" - a change that
supersedes an entry, say, or one that splits a capability in two.
