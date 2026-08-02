---
type: Decision
title: The artifact half is named, never re-derived
description: When okf-link.md is missing, okf next names openspec status and stops rather than enumerating OpenSpec artifacts.
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

`okf next` does not reimplement OpenSpec artifact ordering. When `okf-link.md`
is missing, it names `openspec status` as the command that answers that question
and stops. The implementation holds no ordered list of artifact ids.

# Context

An earlier sketch routed between workflow phases by inspecting the change
directory. `openspec status` already returns `nextSteps` naming the next
artifact, so reimplementing that half would put an ordering in two places, and
the copy in this kit would be the one that goes stale - OpenSpec owns the schema
that defines the order.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| Enumerate missing artifacts inside `okf next` | Two answers to one question; the kit's copy drifts first |
| Shell out to `openspec status` and merge the outputs | Couples the kit to OpenSpec's CLI shape, and mixes two questions in one report |

# Consequences

Makes easy: a stable boundary - `.okf/` for this command, OpenSpec artifacts for
the other.

Makes hard: a single "what now" answer that covers both halves. Accepted; the
two questions have different owners.

# Revisit When

OpenSpec exposes a stable programmatic API for next-artifact that the kit could
call without parsing CLI output, and a product reason appears to merge the answers.
