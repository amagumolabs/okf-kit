---
type: Decision
title: An inline code span quotes for hygiene and not for reference detection
description: The hygiene scan reads inline code spans as quoted text; the durable-reference scan deliberately does not, and the two checks do not share a quoting rule.
date: 2026-08-02
status: stable
decision_status: accepted
supersedes:
superseded_by:
affects_features:
  - artifact-hygiene
  - okf-durable-references
sources:
  - id: change-add-change-artifact-hygiene
    resource: change:add-change-artifact-hygiene
  - id: decision-fencing
    resource: .okf/decisions/2026-08-02-fencing-is-the-sanctioned-escape-hatch.md
linked_changes:
  - add-change-artifact-hygiene
---

# Decision

`checkHygiene` strips inline code spans as well as fenced blocks before it looks
for template residue. `findChangeReferences`, which detects locators into
`openspec/changes/`, strips fenced blocks only. The two checks share a fencing
rule and deliberately do not share a code-span rule.

# Context

`fencing-is-the-sanctioned-escape-hatch` rejected exempting inline code for the
reference check, on a reason specific to that check: a real locator is usually
written in backticks anyway, so exempting spans would excuse the common case and
catch only the rare one.

Residue inverts that. An unfilled slot is left bare by the agent who failed to
fill it - nobody backticks a slot by accident - while a document explaining why a
template carries a slot has to name the slot in a sentence. Fencing a single
token mid-sentence is not how anyone writes, so a hygiene rule that recognises
only fences forces every document teaching the rule to choose between being
unreadable and being reported.

The two checks therefore want different answers to the same question, and the
answer follows the shape of what each is looking for rather than the file it
happens to be reading.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| One quoting rule for both checks | Would either make hygiene undocumentable or reopen the case `fencing-is-the-sanctioned-escape-hatch` closed for locators. The uniformity is cosmetic; the checks look for different things |
| Code spans for change artifacts only, fences elsewhere | One rule with two meanings depending on which directory a file sits in - the exact accident this change existed to remove |
| No exemption; reword hygiene documentation around its examples | The rule's own entry, spec, and design all have to name a placeholder. A rule that cannot be written down without violating itself gets worked around |

# Consequences

Makes easy: writing about template residue in the bundle and in change artifacts
alike, in ordinary prose.

Makes hard: catching a slot an author backticked to silence the finding. Accepted
on the same terms fencing already carries - the backticks are visible in the
diff, so the evasion is reviewable, which an allowlist in the checker is not.

Locks in: the two scans' quoting rules are now deliberately different, so a
future change that "unifies" them by stripping spans in `findChangeReferences`
reverses a decision rather than tidying an inconsistency. Code-span stripping is
line-scoped, so an unbalanced backtick cannot pair across lines and swallow real
residue with it.

# Revisit When

Backticked slots start appearing in artifacts as a way past the check, which
would show up in review as a code span wrapping nothing but a placeholder.
