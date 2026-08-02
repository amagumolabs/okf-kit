## Context

Every rule in this kit so far has had a mechanical half. This one does not, and
that is the design question rather than an omission.

`okf check` can see shape: a table has rows, a pointer resolves, a status is one
of four words. It cannot see whether "the export button is disabled while the
request is in flight" is durable domain knowledge or the detail of one change.
Both are true sentences in a Markdown table.

## Goals / Non-Goals

**Goals:**

- Give the filter a home an agent actually reads, at the moment it is creating or
  enriching an entry.
- State the durability test in a form that produces a different answer from the
  truth test, since that is the whole point.

**Non-Goals:**

- A checker.
- Retroactively trimming existing entries.

## Decisions

**This change ships no check, and says so in the spec.** A checker for this would
have to judge meaning. The kit has refused that before on the same grounds - it
reports that a `criticality: high` entry carries no human attestation and never
claims the attestation is genuine, because a check satisfiable by typing a string
will be satisfied by typing that string. A heuristic for durability would be
worse: it would be wrong often enough to be ignored, and obeyed in exactly the
cases where it was wrong. Recording the absence as a requirement is what stops a
later reader treating it as an oversight.

**The filter names destinations, not deletions.** "This does not belong here" with
nowhere to put it produces an agent that either ignores the rule or loses the
content. Each category the filter excludes is paired with the artifact that owns
it: requirement wording to the spec, structural choices to the design, one
change's payload shape to neither, because it was never knowledge.

**The durability test is phrased as a question about a second change.** "Is this
durable" is answered yes by anyone who just wrote it. "Would the next change to
this capability still need this" is answerable by imagining one, and it produces
no for exactly the content the filter is about.

**BR-16 and BR-17 are always stated together.** A rule that says "do not ask the
user" read alone produces an agent that assumes instead, which is worse than the
re-asking it was meant to fix. Every place BR-16 appears, the sentence naming
Assumptions and Open Questions appears with it.

## Risks / Trade-offs

| Risk | Mitigation |
| --- | --- |
| Unchecked guidance decays | Accepted and recorded as a requirement, so the absence is a decision on the record rather than a gap someone later fills with a bad heuristic |
| The filter is applied to strip real knowledge | Every excluded category names its destination; nothing is dropped without a home |
| Instruction text grows, and long instructions are skimmed | The filter goes where the decision is made - `okf-link` and the feature template - rather than being repeated in every artifact that mentions entries |

## Migration Plan

Schema `version` bumps. No bundle content changes shape, so `okf migrate` has
nothing to do. Existing entries are untouched.

## Open Questions

- Whether `okf audit` could flag entries growing fastest, as a weak proxy for
  accumulation. Deferred: growth also means a capability genuinely being learned,
  and a proxy that cannot tell those apart is a proxy that gets muted.
