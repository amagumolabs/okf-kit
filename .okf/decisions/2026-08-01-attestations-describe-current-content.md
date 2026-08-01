---
type: Decision
title: verified[] describes the current content, and the Verification History table stays
description: The specification review chain and the kit changelog answer different questions, so neither replaces the other.
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

`verified[]` records who vouches for the entry's **current content**. A
verification pass replaces it; a human sign-off within the same pass appends to
it; a `conflict` verdict deletes the key. The entry's Verification History table
is untouched and remains the changelog.

# Context

The first design read `verified[]` as an append-only chain, one element per
verification pass. Two problems fell out of that, and both have the same root.

An entry that later drops to `needs-revision` still carries the earlier
attestation, so a consumer reads it as confirmed - the inversion this change
exists to remove, returning later and harder to see. And the chain duplicates the
Verification History table one element per row, which is the "two copies of one
sentence drift" failure the kit warns about in its own config.

The two are answering different questions. The specification's chain records *who
all vouch for this content*, which is why an agent check and a human review can
both appear in it. The table records *how this file got here*, across successive
versions of its content. Treating one as the other is a category error.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| Append-only chain, accept the tier being wrong at `needs-revision` | Reintroduces the exact defect this change exists to fix, on the entries a reader is most likely to be misled by. |
| Append-only chain plus `stale_after` to mark the disputed entry | Works, but encodes distrust twice and leaves the tier saying "confirmed". Deleting the key says it once, in the specification's own vocabulary. |
| Chain swallows the table, carrying `change` and `evidence` as unknown keys | Legal - consumers must tolerate unknown keys - but it moves `file:line` evidence into YAML, where it reads far worse in a diff than a markdown table. |

# Consequences

- No `stale_after` is needed: an entry nobody vouches for has no `verified` key,
  and absence already yields the unverified tier.
- `verified[]` stays short - usually one element, two when a human signs off - so
  the frontmatter stays readable.
- The kit must never append across changes. This is enforced by the schema
  instruction, not by code: no static check can tell a replaced list from an
  appended one after the fact.

# Revisit When

A real need appears for several independent reviewers of one content version,
beyond the agent-plus-human pair the human-review tier already covers.
