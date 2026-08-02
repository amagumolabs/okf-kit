---
type: Feature Knowledge
title: artifact-hygiene
description: The rule that unfilled template text must not survive in any artifact the workflow produces, and how a document quotes template text without asserting it.
status: stable
verification_state: verified
verified:
  - by: anthropic/claude-opus-5
    at: 2026-08-02T00:00:00Z
verified_at: 2026-08-02
criticality: normal
pending_changes: []
code_paths: [lib/check.mjs]
sources:
  - id: change-add-static-analysis-gate
    resource: change:add-static-analysis-gate
  - id: gap-2026-08-02
    resource: 'Discovered while implementing add-static-analysis-gate: BR-11 of okf-archive-gate asserted that a placeholder command in verification.md is caught by the existing hygiene check. It is not - checkHygiene runs over .okf/ bundle files only and has never run over openspec/changes/. The clause was dropped and the exposure recorded as a risk, deferring the fix to this capability.'
linked_changes:
  - add-change-artifact-hygiene
generated:
  by: anthropic/claude-opus-5
  at: 2026-08-02T00:00:00Z
---

# Summary

Every artifact this workflow produces starts as a template full of angle-bracketed
placeholders, blank table rows, and instructional comments. Hygiene is the rule
that none of them survives into a finished artifact. A file that still says
the capability-name placeholder its template shipped looks like it holds an answer and holds a slot, and the two
are indistinguishable to anyone reading it later - which is the whole failure the
knowledge base exists to prevent, occurring inside the knowledge base's own
paperwork.

The rule has always applied to `.okf/` bundle files. It has never applied to the
change artifacts under `openspec/changes/`, which are produced from templates
that are just as full of placeholders and are read by exactly the same people.

The second half of the capability is the escape hatch. Documentation that teaches
this rule has to be able to show the wrong form, and a design that explains why a
template carries a placeholder has to be able to name the placeholder. A rule
that cannot be written down without violating itself gets worked around rather
than obeyed.

# Domain Terms

| Term | Meaning | Source |
| --- | --- | --- |
| Hygiene | The scan for template residue in a finished artifact: angle-bracketed placeholders, blank table rows, empty list items, leftover instruction comments | gap-2026-08-02 |
| Template residue | Text present because a template put it there and nobody replaced it, as opposed to text an author wrote | gap-2026-08-02 |
| Quoting | Naming template text in order to talk about it, rather than leaving it unfilled. A quoted placeholder is an assertion about the template, not an unanswered slot | gap-2026-08-02 |
| Code span | Inline backticked text. The finest-grained way a Markdown author says "this is a token I am naming, not prose I am asserting" | gap-2026-08-02 |

# Actors And Roles

| Actor | Role In Feature | Notes |
| --- | --- | --- |
| Agent filling a template | Replaces every placeholder, or deletes the section | The actor the rule constrains; also the actor most likely to leave a slot behind under time pressure |
| Author documenting the workflow | Quotes template text while explaining it | The actor the escape hatch exists for. Without it, the kit's own design documents violate the kit's own rule |
| Reviewer | Reads the artifact and cannot tell a slot from an answer without the rule | The reason the rule matters at all |

# Business Rules

| ID | Rule | Source |
| --- | --- | --- |
| BR-1 | Hygiene MUST apply to change artifacts under `openspec/changes/`, not only to `.okf/` bundle files. The two are produced from templates of the same kind and read by the same people; applying the rule to one and not the other is an accident of where the check was first written, not a distinction anyone can defend. | gap-2026-08-02 |
| BR-2 | Quoted template text MUST NOT be reported. A document explaining why a template carries a placeholder has to name the placeholder, and a rule that makes its own documentation illegal is a rule that gets worked around. | gap-2026-08-02 |
| BR-3 | Quoting MUST be recognised from the text itself - a fenced block or an inline code span - and never from a list of excused files. An allowlist records that today's artifacts are clean, not that the rule is right, and it silently stops protecting anything added later. This is the same discrimination-by-shape the durable reference rules already make. | gap-2026-08-02 |
| BR-4 | Inline code spans MUST count as quoting, not only fenced blocks. Fencing a single token to name it in a sentence is not how anyone writes, so a rule that recognises only fences forces authors to choose between an unreadable document and a reported one. | gap-2026-08-02 |
| BR-5 | Hygiene findings on change artifacts MUST harden at the archive boundary rather than erroring immediately. A change under construction legitimately holds an unfilled artifact; a change being archived does not. | gap-2026-08-02 |
| BR-6 | The instructional comments a template ships MUST NOT be reported as residue while the change is in flight, and MUST be reported at archive. They are guidance for the author, so removing them is the last step of finishing an artifact rather than the first step of starting one. A comment is recognised as a template's own by the `HOW TO USE THIS TEMPLATE` marker, which is the inherited heuristic and reaches the `.okf/` templates only; the openspec change templates ship instruction comments carrying no marker, and those are not recognised. | gap-2026-08-02 |

# Data Entities

| Entity | Description | Important Fields Or States |
| --- | --- | --- |
| Template residue | What the scan looks for | An angle-bracketed placeholder whose inner text is not a stray HTML tag or an autolink; a table row whose every cell is empty; a bare `-` list item; a shipped instruction comment |
| Quoting context | The regions of a document the scan skips | A fenced code block; an inline code span. Both are stripped before the scan, so residue inside them is invisible to it |

# Workflows

## Primary Workflow

1. An agent fills an artifact from its template.
2. `okf check` scans the artifact for residue outside quoting contexts.
3. While the change is in flight, findings are warnings (BR-5): the artifact may
   legitimately be half-written.
4. At `okf check --archive`, the same findings are errors. Nothing archives
   carrying a slot that reads as an answer.

## Alternative Or Failure Workflows

- A document that needs to name template text quotes it, in a fence or a code
  span, and the scan does not see it (BR-2, BR-4).
- A section with no real content is deleted rather than left with its
  placeholders in place. An empty heading is not a reservation for later work.

# Risks And Compliance Constraints

| Risk Or Constraint | Impact | Mitigation Or Handling |
| --- | --- | --- |
| Extending the scan to change artifacts fires on documents already written | Retroactive noise on in-flight work | BR-5 makes it a warning until archive, and the remedy per finding is one edit. Already-archived changes are never re-scanned |
| Code spans are a broad exemption - an author can silence any finding with backticks | The rule becomes optional in practice | Accepted, and it is the same standing fencing already has under the durable reference rules: an exemption the author states in the text, visible to review, rather than one hidden in the checker |
| The angle-bracket heuristic has known false negatives and positives | Some residue is missed, some prose is flagged | The existing heuristic already skips stray HTML tags and autolinks. Extending its reach does not change its accuracy, and this capability inherits both its catches and its misses |

# Assumptions

- The existing `checkHygiene` heuristic is good enough to extend as-is. This
  capability changes what it scans, not how it recognises residue.
- Change artifacts are the only other place templates land. The `.okf/`
  templates and the schema templates are the two template sources, and both
  produce files in one of these two locations.

# Open Questions

- Whether the scan should reach `openspec/specs/` as well. Deferred: baseline
  specs are assembled from delta specs that this rule will already have covered,
  so the exposure is second-hand and worth measuring before acting on.
- How to recognise an instruction comment a change template shipped, given that
  those comments carry no marker and an author's own comment is legitimate.
  Found during the verification pass of `add-change-artifact-hygiene`: BR-6's
  escalation is implemented, but its reach on change artifacts is limited to the
  marker the `.okf/` templates ship. Adding the marker to the schema's own
  templates would close it in one edit and is the obvious first candidate;
  matching comment text against the shipped templates is the general answer and
  is more machinery than the exposure has so far justified.

# Verification History

| Date | Change | Verified Status | Evidence / Notes |
| --- | --- | --- | --- |
| 2026-08-02 | add-change-artifact-hygiene | verified | BR-1 `lib/check.mjs:703-718` and the call at `:727`, tests UT-201/206/209 and NEG-201; BR-2 and BR-4 `lib/check.mjs:237-239,252,288`, tests UT-203/204/205/210 and NEG-204/205; BR-3 no filename list exists in the scan or the walk, test UT-208; BR-5 `lib/check.mjs:253-254` via `hardensAtArchive`, tests UT-201 and UT-202; BR-6 `lib/check.mjs:255,288-290`, tests UT-207 and UT-210. 238 unit tests pass, up from 222; 8 of the 15 pre-implementation assertions were red and the 7 green ones each record why in the test-plan. One `okf-gap`: BR-6 did not state how a template's own comment is recognised, and the inherited `HOW TO USE THIS TEMPLATE` marker does not reach the schema's change templates - the rule now says so and an open question records the remedy. One `code-gap`, found by the new check reporting the change's own verification.md: the comment finding tested raw text and so ignored quoting, which BR-2 requires everywhere. UT-210 was written red and the code fixed; the entry was not edited down to match. The widened scan produced zero findings on this repository's active changes, and caught one real omission in the suite - a fixture that filled a plan from the shipped template and left its Commands section unfilled |
