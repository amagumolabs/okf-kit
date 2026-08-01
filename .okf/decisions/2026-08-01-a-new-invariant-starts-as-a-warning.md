---
type: Decision
title: An invariant introduced with a migration starts as a warning and becomes an error a release later
description: A project that has migrated but not re-verified must not be blocked by a rule it had no chance to satisfy.
date: 2026-08-01
status: stable
decision_status: accepted
supersedes:
superseded_by:
affects_features:
  - okf-migrate
sources:
  - id: design
    resource: change:okf-spec-conformance
linked_changes:
  - okf-spec-conformance
---

# Decision

The coupling between `verification_state: verified` and a non-empty `verified[]`
ships as a warning in the release that introduces `okf migrate`, and becomes an
error one release later. The severity lives in a single named constant.

# Context

Migration deliberately writes no attestation, so immediately after migrating, a
project holds entries that are verified by the workflow and carry no `verified[]`.
That is the intended state. If the coupling were an error at once, migration would
break every downstream `okf check` until every entry had been re-verified - work
no team does in one sitting, on a schedule nobody chose.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| Error immediately | Blocks a project on a rule it had no opportunity to satisfy, which is how a tool gets removed from CI rather than adopted. |
| Warning forever | The coupling is what keeps state and attestation honest. A warning nobody must ever act on decays into noise. |
| Grace period keyed to a date rather than a release | Dates pass while projects sit on old versions. The kit already tracks version skew in the install manifest. |

# Consequences

- `COUPLING_SEVERITY` in `lib/check.mjs` is the whole promotion: one constant,
  changed once, in the release after migration ships.
- Until then, `okf check` on a migrated bundle exits zero with warnings, which is
  the signal to re-verify at a natural pace - one change at a time.
- The existing kit-skew check already tells a project it is behind, so the
  promotion is visible before it bites.

# Revisit When

The promotion happens. This decision is then spent, and the constant should stop
being configurable if nothing else needs it.
