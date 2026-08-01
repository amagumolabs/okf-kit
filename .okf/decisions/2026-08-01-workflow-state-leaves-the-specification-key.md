---
type: Decision
title: Workflow state lives in verification_state, never in the specification's verified key
description: The kit's three-value gate moves to its own key so the specification's verified key can mean what the specification says.
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

An entry's workflow state lives in `verification_state` (`unverified` |
`verified` | `needs-revision`). The specification's `verified` key is left to
mean what the specification says: a list of attestations.

# Context

`.okf/` was built on the Open Knowledge Format but stored a string enum in
`verified`. A conformant consumer derives its trust tier from that key's
*presence*, so `verified: unverified` and `verified: needs-revision` - the two
values whose entire purpose is to say *do not trust this entry* - were read as
machine-confirmed. The bundle told outside tooling the opposite of what it meant,
on exactly the entries where being wrong costs most.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| Keep the enum in `verified` and document the divergence | The divergence is not a narrowing the specification tolerates; it is a defined key holding the wrong type, and the misreading inverts the signal. Documenting an inversion stops no tool from acting on it, and by the time a second agent reads the bundle nobody consults the document. |
| Rename the bundle out of `.okf/` and stop claiming OKF | Throws away portability - validators, visualizers, and other agents - to avoid an 11-call-site rename. |
| Keep both: enum in `verified`, attestations elsewhere | Two keys claiming the same name space. A consumer reading `verified` still gets the wrong tier. |

# Consequences

- A breaking rename across every downstream entry, which is why `okf migrate`
  exists as its own command.
- The kit's extensions now all live in keys the specification does not define,
  where consumers are required to tolerate them. Extension is free; silent
  divergence on a defined key was not.
- `okf audit` selects on `verification_state`, never on the attestation - see the
  audit's BR-10.

# Revisit When

The specification changes what `verified` means, or introduces a key that covers
the workflow gate directly.
