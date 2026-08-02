---
type: Decision
title: Advice and refusal stay in different commands
description: okf next advises and always exits zero when it can answer; okf check --archive remains the only command that refuses.
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

`okf next` advises. `okf check --archive` refuses. They are separate commands,
not one command with an `--advisory` flag. `next`'s exit status reports whether
the question could be answered, never whether the answer was satisfactory.

# Context

A second readiness surface invites treating it as the gate. A flag that turns a
gate into advice is a flag that gets added to the CI invocation on the first red
build, and two commands that both refuse teach a team to run whichever refuses
less.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| `okf check --advisory` | A flag that softens a gate becomes the CI default under pressure |
| Make `next` exit non-zero when steps remain | Turns advice into a second gate; teams archive on whichever is greener |

# Consequences

Makes easy: asking "what remains?" mid-change without being told you failed.

Makes hard: treating a clean `next` as permission to archive. Mitigated by every
"nothing owed" line naming `okf check --archive`.

# Revisit When

CI starts parsing `next` output as a pass/fail signal, or someone proposes merging
the two commands again.
