---
type: Decision
title: Exemption from a frontmatter requirement is not exemption from a content rule
description: index.md and log.md are exempt from the concept-document type requirement because of what they are structurally, which says nothing about the content inside them.
date: 2026-08-02
status: stable
decision_status: accepted
supersedes:
superseded_by:
affects_features:
  - okf-durable-references
  - okf-bundle-format
sources:
  - id: change-guard-durable-references
    resource: change:guard-durable-references
linked_changes:
  - guard-durable-references
---

# Decision

The reserved bundle files `index.md` and `log.md` are exempt from the
concept-document requirement to carry a non-empty `type`. That exemption is
scoped to the frontmatter requirement it was written for. Content rules scan
reserved files on the same terms as every other file in the bundle.

# Context

`RESERVED_BUNDLE_FILES` already existed, used by one check. Reusing it in the new
reference scan would have been the path of least resistance and would have looked
consistent.

It would also have created a real hole. `log.md` is generated from Verification
History evidence, which is free text an author wrote in a feature entry. A
reference can therefore reach `log.md` without anyone editing `log.md`, and a
generated file nobody edits is exactly the kind of file whose broken references
survive longest.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| Reuse `RESERVED_BUNDLE_FILES` in every bundle check | Treats one constant as if it meant "out of scope generally", when it was written to mean "carries no `type`" |
| Scan `log.md` but not `index.md` | Both are generated from entry content; splitting them would need a reason neither file provides |
| Fix the generator instead, so it cannot emit a bad reference | Addresses one producer. The check has to hold for the file regardless of what wrote it |

# Consequences

Makes easy: reasoning about scope per rule instead of per file. Each check states
which files it covers and why.

Makes hard: nothing measurable. The reserved files are two, and scanning them
costs one file read each.

Locks in: any future bundle-wide constant must declare which rule it scopes.
A constant named after a file category, used by rules with different concerns, is
the shape of mistake this decision exists to prevent.

# Revisit When

A reserved file is introduced that genuinely holds no author-written content —
a lockfile or a checksum manifest — where scanning it could only produce noise.
