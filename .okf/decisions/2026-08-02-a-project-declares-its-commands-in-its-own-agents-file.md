---
type: Decision
title: A project declares its own commands in AGENTS.md, not in kit-owned config
description: Per-project conventions the kit needs an agent to know live outside the okf-kit markers in AGENTS.md, as prose the kit never parses.
date: 2026-08-02
status: stable
decision_status: accepted
supersedes:
superseded_by:
affects_features:
  - okf-archive-gate
sources:
  - id: design
    resource: change:add-static-analysis-gate
linked_changes:
  - add-static-analysis-gate
---

# Decision

When the workflow needs an agent to know something specific to one project - the
lint command, the type check command - that fact is declared in the project's own
`AGENTS.md`, outside the `<!-- okf-kit:start -->` / `<!-- okf-kit:end -->`
markers. The kit names the location in its instructions and never parses what is
written there.

# Context

The static analysis gate needs a project's lint and type check commands. Nothing
in the kit could hold them: `openspec/config.yaml` and `.okf/profile.md` are both
in `PAYLOAD_FILES` and are replaced wholesale by `okf upgrade`.

The obvious fix was a new kit-owned config file that upgrade leaves alone. But
the space already existed. `lib/install.mjs` writes "Add your project's own
conventions above or below the okf-kit block" when it first creates the marker
file; that region survives upgrade by construction, and every agent already reads
`AGENTS.md` at the start of a session.

The alternative to declaring anything was letting each change derive the commands
afresh. That was rejected on a specific failure: an agent that cannot find a
linter quickly writes "Not Applicable", and nothing then distinguishes that from
a project which genuinely has none. A declaration written once is visible to
review; a judgement re-made silently per change is not.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| A new `.okf/project.yaml` the kit parses | Costs a parser, an `okf init` step, a monorepo story, and a second place project conventions live - to hold two strings the kit only ever hands back to an agent. |
| `openspec/config.yaml` or `.okf/profile.md` | Both are payload files, replaced on every `okf upgrade`. A declaration there is lost at the next upgrade, silently. |
| Derive the commands per change, declare nothing | Makes "no linter here" indistinguishable from "did not look", which is the distinction every reason-or-path escape in this kit exists to preserve. |

# Consequences

- The kit gains no code for this: one step in the `test-plan` instruction, and
  nothing else.
- The declaration can rot, because nothing validates it. Accepted - it is read by
  agents, and a stale command produces a failed run, not a silent pass.
- The same mechanism is available for the next per-project fact the workflow
  needs, without a config format being invented for each one.
- A project that never writes the declaration still works; the instruction falls
  back to deriving, confirming, and then recording.

# Revisit When

Evidence appears that reported commands and declared commands diverge in
practice - a change reporting a command the project no longer runs. That would
be the argument for making the declaration machine-readable, and it is the
question deferred in this change's `design.md`.
