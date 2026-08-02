---
type: Decision
title: A fenced code block is how a document exempts itself from a content rule
description: Content checks strip fences, so documentation can demonstrate the form it forbids; the exemption lives in the text where a reviewer sees it, not in the checker.
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

Content checks over the bundle strip fenced code blocks before scanning. A
fenced block is read as quoted, not asserted, which is what lets a document
demonstrate the exact form a rule forbids.

# Context

Writing the entry for `okf-durable-references` surfaced the problem immediately:
the entry cannot define what a locator is without writing one down, and the first
draft was rejected by its own rule. A rule that cannot be stated in the bundle it
governs does not get obeyed — it gets disabled.

Fencing was already the bundle's marker for "quoted, not asserted": `checkHygiene`
strips fences before looking for placeholders, so the concept needed no
introduction and the two checks could not disagree about what a fence means.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| Exempt inline code (single backticks) | Too broad. Real locators are usually written in backticks anyway, so this exempts the common case and catches the rare one — backwards |
| Exempt documentation files by name | An exemption hidden in the checker rather than declared in the text. Rejected for the same reason the allowlist was |
| No escape hatch; reword around the example | Forces documentation to describe a violation it may not show, which is how a rule ends up understood by nobody who has to follow it |

# Consequences

Makes easy: documenting a content rule inside the bundle the rule governs, and
adding future content rules on the same footing without inventing a new
mechanism.

Makes hard: catching a genuine reference that an author fenced to silence the
check. This is accepted deliberately — the fence is visible in the diff, so the
evasion is reviewable, which an allowlist entry in the checker is not.

Locks in: fence handling must match `checkHygiene`'s exactly. Two fence readings
in one file would be a worse failure than either reading alone.

# Revisit When

Fenced blocks start being used to hide real references rather than to show
examples, which would appear as fenced locators in diffs during review.
