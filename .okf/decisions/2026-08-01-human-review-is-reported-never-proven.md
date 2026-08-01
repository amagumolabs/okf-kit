---
type: Decision
title: Missing human review is reported as a warning; a present attestation is never vouched for
description: No in-repo signal separates a person from an agent, so the check reports absence and claims nothing about presence.
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

`okf check` warns when a `criticality: high` entry reaches `verified` with no
`human:` actor. It never errors on that, and it never asserts that a present
`human:` attestation was written by a person.

# Context

The invariant `criticality: high` and verified implies a `human:` actor looks
like it enforces the kit's existing prose rule that a high-criticality entry
needs human sign-off. It cannot. Measured in this repository at the time of the
decision: zero of the last six commits were signed, the git author was identical
for human and agent-assisted commits, and the `Co-Authored-By` trailer was
missing from three of those six. Under a shared identity, a person's bytes and an
agent's are the same bytes.

Making it an **error** is worse than leaving it out. A check that can be satisfied
by typing a string will be satisfied by typing that string, and the pressure lands
on the highest-stakes entries in the bundle. The result is a forged sign-off,
which is worse than an honest gap.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| GPG/SSH commit signing, verified with `git log --format=%G?` | Genuinely unforgeable and needs no network. But no commit in this repository is signed, making it a prerequisite project rather than a feature. Left available as a later layer. |
| GitHub PR approval via `gh api` | Truly out-of-band, but breaks zero-dependency, zero-network, and offline operation, and `gh` is not installed. |
| Require the sign-off in its own commit touching only frontmatter | Makes forgery visible rather than impossible, at the cost of a workflow rule for every reviewer. Deferred; the warning already surfaces the gap. |
| Drop the check entirely | Loses a true and useful statement about review coverage. |

# Consequences

- The protection that actually holds for a high-criticality entry is the Rule
  Evidence table's `file:line` requirement, which `okf check --archive` enforces
  and which is expensive to fake, because a wrong line number is visible the
  moment someone opens the file.
- `.okf/profile.md` states this limit explicitly, so no reader mistakes the tier
  for proof.
- An agent must never write a `human:` actor on someone's behalf; it stops and
  asks. This is a rule for agents, not something the checker can observe.

# Revisit When

The team adopts commit signing, at which point the signature becomes a real
signal and the check can be promoted without manufacturing anything.
