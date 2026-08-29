---
type: Decision
title: Relatedness is derived from frontmatter the bundle already carries, never declared in a field
description: Candidates come from a decision's affects_features and from code_paths overlap, because a hand-maintained relation list is wrong exactly when it matters.
date: 2026-08-05
status: stable
decision_status: accepted
supersedes:
superseded_by:
affects_features:
  - okf-related-knowledge
sources:
  - id: change
    resource: change:add-okf-related-knowledge
linked_changes:
  - add-okf-related-knowledge
---

# Decision

The related set is derived from two facts the bundle already records: a decision
whose `affects_features` names a capability the change modifies, and a feature
entry whose `code_paths` intersect those of one. No entry gains a field
declaring what it relates to.

# Context

The natural design is a `related:` list in entry frontmatter. It is also the
design that fails silently: nothing breaks when it goes stale, so it is wrong
precisely when the bundle has changed most - which is when someone would be
reading it.

`affects_features` and `code_paths` are already written for other reasons and
already kept honest by other gates. `okf check` resolves `affects_features` to
real capabilities; `okf audit` reads `code_paths` against git history. Deriving
from them adds no field to the bundle format and nothing new to keep true.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| A `related:` list on each entry | An edge list maintained by hand, which nothing falsifies and everything outdates |
| Full-text similarity between entries | A guess about meaning presented as a fact, and unreadable when it is wrong |
| Deriving from which specs cite which `BR-n` | No entry in this bundle cites another's rules, so the signal has no evidence behind it yet |

# Consequences

Makes easy: adding a capability without also remembering to wire it into a graph.

Makes hard: expressing a relationship the two signals cannot see. That is what
judgement rows are for, and why the derivation is only a floor.

Accepted cost: `code_paths` is empty until an entry's first verification pass, so
a brand-new entry produces no overlap candidates. A new capability has no code to
overlap with yet.

# Revisit When

An entry's `code_paths` stop being a reliable proxy for where a capability lives -
for instance if the bundle starts tracking modules rather than paths.
