---
type: Decision
title: stale_after is not adopted; absence of an attestation already encodes distrust
description: Drift is measured from commit history, and a disputed entry simply has no attestation.
date: 2026-08-01
status: stable
decision_status: accepted
supersedes:
superseded_by:
affects_features:
  - okf-bundle-format
sources:
  - id: design
    resource: change:okf-spec-conformance
linked_changes:
  - okf-spec-conformance
---

# Decision

The specification's optional `stale_after` field is not used by this kit.

# Context

`stale_after` was proposed as the way to make a `needs-revision` entry read as
untrustworthy to a conformant consumer, back when `verified[]` was going to be
append-only and the old attestation would have survived the fall to
`needs-revision`.

Once `verified[]` became a description of the current content, the key is simply
deleted on a `conflict` verdict, and tier derivation already yields *unverified*.
The second encoding became redundant.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| Set `stale_after` on a `conflict` verdict | Encodes the same fact twice, in two places that can disagree. |
| Have `okf audit` write `stale_after` when it finds drift | The audit reports and never edits knowledge - that is one of its own business rules. It would also freeze a dynamic measurement into a static date. |
| Set `stale_after` on every verified entry as an expiry | Turns a measured property into a guess made in advance, and would mark entries stale whose code never moved. |

# Consequences

- Drift stays measured dynamically by `okf audit` from commit history against
  `verified_at`, which is more accurate than a date written in advance.
- A consumer that relies on `stale_after` sees nothing here. Recorded in
  `.okf/profile.md` as a deliberate omission rather than an oversight.

# Revisit When

The kit gains knowledge with a genuine expiry date - a vendor contract, a
compliance window - where staleness is known in advance rather than measured.
