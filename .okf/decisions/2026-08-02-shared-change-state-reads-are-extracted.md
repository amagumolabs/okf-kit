---
type: Decision
title: Shared change-state reads are extracted, not copied
description: checkChange and okf next share one readChangeState derivation so the gate and the advisor cannot silently disagree.
date: 2026-08-02
status: stable
decision_status: accepted
supersedes:
superseded_by:
affects_features:
  - okf-next
  - okf-archive-gate
sources:
  - id: change
    resource: change:add-okf-next-command
linked_changes:
  - add-okf-next-command
---

# Decision

The artifact-presence, okf-link resolution, `pending_changes`, and Rule Evidence
reads live in one function - `readChangeState` - called by both `checkChange` and
`okf next`. Each caller keeps its own verb (findings vs advice); neither
reimplements the derivation.

# Context

`okf next` needs the same facts `okf check --archive` already gathers. Copying
those reads would produce two derivations that agree today and diverge at the
first change to either - and the one that diverges silently is the advisor,
because nothing fails when advice is wrong.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| Copy the reads into `lib/next.mjs` | Two implementations of one derivation; the advisor drifts first and nobody notices |
| Have `next` shell out to `okf check --json` and reinterpret findings | Couples advice to the finding vocabulary, and turns a read into a subprocess |

# Consequences

Makes easy: changing how change state is recognised once, for both callers.

Makes hard: extracting further without pulling finding-generation into the shared
read. Accepted - the shared function returns data, not findings.

# Revisit When

A third caller needs a different slice of the same state, or `readChangeState`
grows finding-shaped fields.
