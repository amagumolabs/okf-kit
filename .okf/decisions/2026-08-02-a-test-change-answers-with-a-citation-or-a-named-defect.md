---
type: Decision
title: A recorded test change answers with a resolving citation or a named mechanical defect
description: The Test Changes table reuses the kit's reason-or-path escape, so a row is satisfied by a citation that resolves or a defect that names itself, and never by silence.
date: 2026-08-02
status: stable
decision_status: accepted
affects_features:
  - test-first-gate
sources:
  - id: change-enforce-test-change-discipline
    resource: change:enforce-test-change-discipline
linked_changes:
  - enforce-test-change-discipline
---

# Decision

Each row of "Test Changes After Implementation Started" identifies the test it
concerns and answers with exactly one of two things: a citation that resolves - a
`BR-n` carried by an OKF entry the change links, or a path under
`openspec/specs/` that exists - or a mechanical defect declared by the phrase
`mechanical defect:` followed by the specific fault. A row with neither is an
error.

A citation is checked for resolving, not for being apt. That a row cites `BR-3`
is mechanical; that `BR-3` is really why the test moved is a review question.

# Context

The table shipped with the schema from the beginning and nothing ever read it. A
change could rewrite every assertion, record a row saying "it did not pass", and
archive clean - which made the record decorative at exactly the moment it was
load-bearing.

The kit already had the right shape for this in three other places: the Decision
Promotion table (a path that resolves, or a stated reason), the Known Gaps ledger
(a reason and an owner), and the Not Applicable declaration (a phrase that names
what makes it true). Inventing a fourth idiom would have cost a reader more than
the check was worth.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| A free-text reason, checked only for being non-empty | "it did not pass" is non-empty and is precisely the answer the rule exists to reject |
| An enum of reason codes | Forces the two grounds into a vocabulary that has to be maintained, and buys nothing a resolving citation does not already give |
| Require a citation always, with no defect ground | A typo in a fixture has no upstream rule change to cite; demanding one would teach people to invent citations |

# Consequences

The bar on a declared defect is the same one the kit already sets for "not
applicable": naming the defect is the point, and the bare phrase is not a reason.
A mechanical fix that moves an assertion is not mechanical - the check cannot see
that, but a reviewer reading the diff can, and the row tells them where to look.

An empty table stays completely clean. That is deliberate: a check that fired on
an empty table would reward leaving a row out, which is the opposite of what the
record is for.

# Revisit When

A third admissible ground appears - some reason to edit a pre-written test that
is neither an upstream change nor a mechanical defect. Today there is none, and
the burden should be on the case that claims to be one.
