---
type: Decision
title: No checker for judgements about meaning
description: Durability of entry content is judged by an agent reading the filter, never by okf check inventing a finding about it.
date: 2026-08-02
status: stable
decision_status: accepted
supersedes:
superseded_by:
affects_features:
  - okf-bundle-format
sources:
  - id: design
    resource: change:add-okf-entry-scope-filter
linked_changes:
  - add-okf-entry-scope-filter
---

# Decision

`okf check` does not report whether a line in an entry is durable or change-local.
That question is a judgement about meaning. The kit states the filter in the
instructions an agent reads when creating or verifying an entry, and records the
absence of a check as deliberate rather than as a gap for a later release to fill.

# Context

Every prior rule in this kit had a mechanical half. Durability does not. A
checker that guessed at meaning would be wrong often enough to be ignored, and
obeyed in exactly the cases where it was wrong - both worse than guidance alone.
The same grounds already refuse to prove a `human:` attestation genuine: a check
satisfiable by typing a string will be satisfied by typing that string.

# Alternatives Considered

| Alternative | Why Rejected |
| --- | --- |
| Heuristic flags for fast-growing entries via `okf audit` | Growth also means a capability being genuinely learned; a proxy that cannot tell those apart gets muted |
| Keyword denylist (validation, layout, payload) | True domain sentences use the same words; the denylist would punish the rules that state the filter |
| Leave the absence unspoken | A later reader treats silence as an oversight and fills it with a bad heuristic |

# Consequences

- The filter lives in `okf-link`, the feature template, and the verification
  section review - places an agent actually reads when the decision is made.
- `lib/check.mjs` gains no finding for this concern.
- Guidance without a check can decay; that risk is accepted and stated on the
  record rather than papered over.
