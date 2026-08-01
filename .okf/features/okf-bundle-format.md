---
type: Feature Knowledge
title: okf-bundle-format
description: The contract for what a conformant OKF bundle looks like in this kit - entry frontmatter, verification state, and the bundle-level reserved files.
status: stable
verification_state: verified
verified_at: 2026-08-01
verified:
  - by: anthropic/claude-opus-5
    at: 2026-08-01T00:00:00Z
criticality: normal
pending_changes: []
code_paths: [lib/check.mjs, lib/index-gen.mjs, lib/frontmatter.mjs, .okf/profile.md]
sources:
  - id: spec-okf-v0.2
    resource: https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md
  - id: grill-2026-08-01
    resource: 'Grill session 2026-08-01 deciding the verified/verification_state split, its semantics, and the limits of human sign-off: "Hãy đề xuất, mình muốn làm đơn giản trước. Quan trọng nhất vẫn là chất lượng của OKF và openspec"'
linked_changes:
  - okf-spec-conformance
generated:
  by: anthropic/claude-opus-5
  at: 2026-08-01T00:00:00Z
---

# Summary

`.okf/` was built on the Open Knowledge Format but drifted from it, and the drift
is not symmetrical: the kit's extra fields are explicitly tolerated by the spec,
while one shared key - `verified` - carries kit semantics that a conformant
consumer reads backwards. This capability is the format contract itself: which
frontmatter fields an entry carries, what each verification state means, which
files in the bundle are concept documents, and which of those rules `okf check`
can honestly enforce. It exists so the bundle stays readable by tooling outside
this kit without the kit giving up the gates that make its knowledge trustworthy.

# Domain Terms

| Term | Meaning | Source |
| --- | --- | --- |
| Bundle | The `.okf/` directory as a whole, as the spec's unit of distribution | spec-okf-v0.2 |
| Concept document | Any `.md` file in the bundle that is not a reserved filename; the spec requires it to carry frontmatter with a non-empty `type` | spec-okf-v0.2 |
| Reserved filename | `index.md` and `log.md`, which carry structural meaning rather than concept content | spec-okf-v0.2 |
| Verification state | The kit's workflow gate for an entry: `unverified`, `verified`, or `needs-revision` | grill-2026-08-01 |
| Attestation | One `{by, at}` entry in `verified[]`, recording that an actor vouches for the entry's current content | spec-okf-v0.2 |
| Trust tier | What a conformant consumer derives from `verified[]`: unverified when absent, machine-confirmed when present, human-reviewed when any actor carries the `human:` prefix | spec-okf-v0.2 |
| Profile | A deliberate narrowing or extension of the spec that the kit documents rather than hides | grill-2026-08-01 |

# Actors And Roles

| Actor | Role In Feature | Notes |
| --- | --- | --- |
| Verification pass | Writes `verification_state`, `verified[]`, and `verified_at` for an entry | The only writer of these fields; propose and explore never touch them |
| `okf check` | Enforces the mechanically checkable half of this contract | Reports absence; never claims a present attestation is genuine |
| External OKF consumer | Any tool reading the bundle without knowing this kit - a validator, a visualizer, another agent | Cannot be told about kit conventions, so shared keys must mean what the spec says |
| Developer | Adds a `human:` attestation to a high-criticality entry they reviewed | The only actor who can make that attestation true |

# Business Rules

| ID | Rule | Source |
| --- | --- | --- |
| BR-1 | An entry's workflow state MUST live in `verification_state` (`unverified` \| `verified` \| `needs-revision`), never in the spec-defined `verified` key. Overloading a spec key with kit semantics makes conformant consumers read the kit's two distrust states as confirmation, which inverts the exact signal the field exists to carry. | grill-2026-08-01 |
| BR-2 | `verified[]` records who vouches for the entry's **current content**, not the entry's history. The verification pass replaces its contents; entries are not appended across successive changes. The spec's review chain and the kit's Verification History answer different questions, and conflating them is what reintroduces BR-1's inversion at a later date. | grill-2026-08-01 |
| BR-3 | `verification_state: verified` MUST hold if and only if `verified[]` is non-empty and `verified_at` equals the date part of the newest `at` in it. | grill-2026-08-01 |
| BR-4 | `verification_state: unverified` and `verification_state: needs-revision` MUST hold if and only if the entry carries no `verified` key at all. An entry nobody currently vouches for has to read as unverified to any consumer, and the spec derives exactly that from the key's absence. | grill-2026-08-01 |
| BR-5 | A `criticality: high` entry that reaches `verified` with no `human:` actor in `verified[]` MUST be reported as a warning, never an error. A check that can be satisfied by typing a string will be satisfied by typing that string, so making it an error manufactures forged sign-offs on precisely the highest-stakes entries. | grill-2026-08-01 |
| BR-6 | The kit MUST NOT claim that a present `human:` attestation is genuine. Under a shared git identity no in-repo signal distinguishes a person's bytes from an agent's, and a check that overstates what it proves is worse than one that reports only absence. | grill-2026-08-01 |
| BR-7 | Every `.md` file inside the bundle that is not a reserved filename MUST carry frontmatter with a non-empty `type`. A file that holds no knowledge - a readme, a template - either carries a type or lives outside the bundle; it MUST NOT sit inside it without frontmatter. | spec-okf-v0.2 |
| BR-8 | The bundle root MUST declare the spec version it targets as `okf_version` in `index.md` frontmatter. That file is the only place in the bundle where index frontmatter is permitted. | spec-okf-v0.2 |
| BR-9 | Actor identity MUST follow the spec convention: `<producer>/<version>` for agents and tools, `human:<id>` for people, `process:<id>` for automated processes. Trust tier derivation keys off the `human:` prefix, so an actor written outside the convention silently loses its tier. | spec-okf-v0.2 |
| BR-10 | `status` MUST use the spec vocabulary (`draft` \| `stable` \| `deprecated`). A decision entry's ADR-style state belongs in its own field, because overloading `status` gives one key two meanings that consumers cannot tell apart. | spec-okf-v0.2 |
| BR-11 | Where the kit extends the spec, it MUST do so with keys the spec does not define, and MUST record the extension in the profile document. Consumers are required to tolerate unknown keys, so extension is free; silent divergence on a defined key is not. | grill-2026-08-01 |

# Permissions And Access Control

| ID | Action | Allowed Actor | Denied Actor | Rule |
| --- | --- | --- | --- | --- |
| BR-12 | Write a `human:<id>` attestation into `verified[]` | The person being named | Any agent, including on that person's behalf | An agent that writes the line makes the attestation false at the moment it is written. The agent MUST stop and ask the person to add it. |
| BR-13 | Write `verification_state`, `verified[]`, `verified_at` | The verification pass | propose, explore, `okf index`, `okf audit` | These fields are the workflow's judgement, and a step that has not judged must not record one. |

# Data Entities

| Entity | Description | Important Fields Or States |
| --- | --- | --- |
| Feature entry | A concept document under `.okf/features/` | `type`, `title`, `description`, `status`, `verification_state`, `verified_at`, `verified[]`, `criticality`, `pending_changes`, `code_paths`, `sources`, `linked_changes`, `generated` |
| Attestation | One element of `verified[]` | `by` (actor, per BR-9), `at` (ISO 8601 datetime) |
| Bundle root index | `.okf/index.md`, generated by `okf index` | `okf_version` frontmatter; Features, Decisions, and Needs Revision Ledger sections |
| Kit extension | A frontmatter key this kit defines that the spec does not | `verification_state`, `verified_at`, `criticality`, `pending_changes`, `code_paths`, `linked_changes` |

# Workflows

## Primary Workflow

1. propose creates an entry with no `verified` key and `verification_state: unverified` (BR-4).
2. Implementation proceeds; the entry carries the change id in `pending_changes`.
3. The verification pass judges each rule against the code. On success it sets
   `verification_state: verified`, replaces `verified[]` with the attestations
   for this pass, and sets `verified_at` from the newest `at` (BR-2, BR-3).
4. A reviewer may add a second attestation with a `human:` actor, raising the
   entry to the human-reviewed tier (BR-9, BR-12).
5. `okf check` enforces BR-3 and BR-4 as errors, and BR-5 as a warning.

## Alternative Or Failure Workflows

- The pass reaches a `conflict` verdict: `verification_state` becomes
  `needs-revision` and the `verified` key is removed, because nobody vouches for
  the current content any more (BR-4). No separate staleness marker is needed -
  absence already says it.
- A high-criticality entry is verified with no human attestation: the entry is
  valid and the check warns. It is a true statement about review coverage, not a
  gate to be satisfied (BR-5, BR-6).

# External Dependencies

| Dependency | Purpose | Reliability Or Ownership Notes |
| --- | --- | --- |
| OKF specification v0.2 | Defines the shared keys, the actor convention, the trust tiers, and the conformance rules this contract targets | Apache-2.0, authored by Google Cloud's Data Cloud team; versioned `<major>.<minor>` with minor bumps guaranteed backward-compatible |

# Risks And Compliance Constraints

| Risk Or Constraint | Impact | Mitigation Or Handling |
| --- | --- | --- |
| Renaming a field every existing entry carries | Downstream projects break on upgrade | The rename ships with an explicit migration command rather than inside `okf upgrade`, and the coupling invariant starts as a warning - see `okf-migrate` |
| A warning nobody reads is the same as no check | High-criticality entries accumulate without review, and the warning becomes noise | Keep the warning specific and countable, and surface it in the index rather than only in check output |
| Tracking a spec that may reach v0.3 | The profile silently falls behind | `okf_version` declares the targeted version explicitly (BR-8), so the gap is visible rather than assumed |

# Assumptions

- Consumers of this bundle follow the spec's tolerance rules - unknown keys,
  unknown `type` values, and missing optional families do not cause rejection. The
  kit's extensions depend on that being honoured in practice, not just in the text.
- `verified_at` remains a date rather than becoming derived from `verified[-1].at`.
  Deriving it would touch `okf audit`'s comparison, and the existing decision that
  `verified_at` is a date is not being reopened by this change.

# Open Questions

- Should `okf check` also verify that `type` values stay within a small
  kit-declared set, or keep the spec's position that types are unregistered?
  Unresolved: a closed set catches typos, but it also rejects the extension the
  spec explicitly permits.

# Verification History

| Date | Change | Verified Status | Evidence / Notes |
| --- | --- | --- | --- |
| 2026-08-01 | okf-spec-conformance | verified | BR-1 lib/check.mjs:16,270,310; BR-2 enforced by the schema instruction, not by code - see Not Applicable in test-cases.md; BR-3 lib/check.mjs:327,343; BR-4 lib/check.mjs:363; BR-5 lib/check.mjs:354 (warn only); BR-6 .okf/profile.md "What this kit does not claim"; BR-7 lib/check.mjs:458; BR-8 lib/index-gen.mjs:8,11 and lib/check.mjs:498; BR-9 lib/check.mjs:25,233,378; BR-10 lib/check.mjs:17,428,435; BR-11 .okf/profile.md. BR-12 and BR-13 are unenforceable by construction and recorded as such. |
