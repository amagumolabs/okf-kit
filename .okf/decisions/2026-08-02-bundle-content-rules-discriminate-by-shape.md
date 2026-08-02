---
type: Decision
title: A bundle content rule discriminates by shape, never by a list of excused files
description: Checks over .okf content decide what is a violation from the text itself, because a file allowlist records that one snapshot is clean rather than that the rule is right.
date: 2026-08-02
status: stable
decision_status: accepted
supersedes:
superseded_by:
affects_features:
  - okf-durable-references
sources:
  - id: change-guard-durable-references
    resource: change:guard-durable-references
linked_changes:
  - guard-durable-references
---

# Decision

A check that scans the content of bundle files decides whether an occurrence is
a violation from the shape of the text itself. It does not carry a list of files
exempted from the rule. When a legitimate occurrence is reported, the fix is to
sharpen the classifier or to mark the occurrence in the document — never to name
the file in the checker.

# Context

The durable-reference rule had to reject paths into `openspec/changes/` while
leaving four existing occurrences in this bundle alone, all of which describe the
archive mechanism rather than pointing at a change. An allowlist of those four
files would have passed CI on the first run.

It would also have been wrong in a way that CI cannot show: the rule ships in a
kit that runs in downstream repositories whose prose nobody here has read, so a
rule tuned to this bundle's file names protects nothing anywhere else, and stops
protecting here the moment a fifth file is added.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| Allowlist the files that legitimately mention the path | Encodes a snapshot, not a rule. Silently stops covering every file added later, and the gap is invisible because the suite stays green |
| Warn instead of error, and let authors judge | A warning on a reference that is broken by construction still lets it reach the archive, which is the exact outcome the rule exists to prevent |
| Scan only frontmatter, where the shape is predictable | Leaves prose unprotected, which is where cross-references are easiest to write and hardest to notice once broken |

# Consequences

Makes easy: shipping the rule to bundles this kit has never seen, and adding
bundle files without revisiting the checker.

Makes hard: rules whose violations genuinely cannot be recognised from the text.
Such a rule now has to be redesigned rather than exempted, which is more work up
front and the reason this decision is worth recording.

Locks in: the classifier is the single definition of a violation, shared by every
call site. Two call sites with two definitions is the failure mode this forbids.

# Revisit When

A content rule appears whose violations are genuinely indistinguishable from
legitimate text by shape alone, and where marking the occurrence in the document
is not available either.
