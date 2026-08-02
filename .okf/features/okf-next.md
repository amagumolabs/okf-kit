---
type: Feature Knowledge
title: okf-next
description: The command that answers what a change still owes the knowledge base, covering the half of the workflow OpenSpec's own status cannot see.
status: stable
verification_state: verified
verified_at: 2026-08-02
verified:
  - by: cursor/composer
    at: 2026-08-02T16:00:00Z
criticality: normal
pending_changes: []
code_paths:
  - lib/next.mjs
  - lib/check.mjs
  - bin/okf.mjs
sources:
  - id: review-2026-08-02
    resource: 'Comparison of okf-kit against a hand-written agent rulebook, 2026-08-02. That rulebook carried an autopilot command routing between workflow phases by inspecting the change directory, and a mandatory "NEXT STEP" line at the end of every response - both attempts to answer "what now" that depend on the agent choosing to answer honestly.'
  - id: scoping-2026-08-02
    resource: '`openspec status` in its JSON form already returns nextSteps naming the next artifact, so the artifact half of that question is answered and must not be reimplemented. What it cannot answer is anything under .okf/, which it does not read.'
linked_changes:
  - add-okf-next-command
generated:
  by: anthropic/claude-opus-5
  at: 2026-08-02T00:00:00Z
---

# Summary

A change owes two different things at once: artifacts to OpenSpec, and knowledge
to the bundle. OpenSpec answers for the first - `openspec status` names the next
artifact and tracks task completion. Nothing answers for the second, so "have I
finished the OKF pass?" is a question an agent answers from memory, at the moment
it is most motivated to answer yes.

`okf next` answers it from the files. It reports what a change still owes and
names the command that discharges it. It never acts, and it never re-derives what
OpenSpec already reports.

# Domain Terms

| Term | Meaning | Source |
| --- | --- | --- |
| Owed step | Something this change must still do before archiving, derived from the state of files rather than from a record of intent | review-2026-08-02 |
| OKF half | The part of a change's obligations that lives under `.okf/` - entries created, `pending_changes` cleared, decisions promoted, index regenerated | scoping-2026-08-02 |
| Artifact half | The part OpenSpec owns - which artifact comes next, which tasks are unchecked. Answered by `openspec status`, and deliberately not answered here | scoping-2026-08-02 |
| Reporting | Naming the next step and its command. Distinguished from acting: the command is printed, never run | review-2026-08-02 |

# Actors And Roles

| Actor | Role In Feature | Notes |
| --- | --- | --- |
| Agent mid-change | Asks what remains, instead of deciding from memory | The actor the command exists for; also the one whose memory is least trustworthy about its own completeness |
| Developer resuming work | Asks where a change was left | Cares about the same answer for a different reason |
| CI | Does not use it - `okf check --archive` is the gate | The distinction matters: `next` advises, `check` refuses |

# Business Rules

| ID | Rule | Source |
| --- | --- | --- |
| BR-1 | `okf next` MUST report and MUST NOT act. It creates no file, runs no command, and modifies nothing. A command that both advises and acts cannot be run to find out where you are. | review-2026-08-02 |
| BR-2 | `okf next` MUST NOT reimplement the artifact half. When artifacts are missing it names `openspec status` rather than listing them, because two implementations of one ordering drift and the second one is always the one nobody updates. | scoping-2026-08-02 |
| BR-3 | Every step reported MUST be derived from the state of files, never from a checkbox or any other record of intent. A checkbox records that someone said a thing was done. | review-2026-08-02 |
| BR-4 | The output MUST name the concrete command that discharges the step. "Run the verification pass" is a description; `okf check --archive` with the change id is an instruction, and the difference decides whether the next actor has to work out what was meant. | review-2026-08-02 |
| BR-5 | `okf next` MUST NOT be a gate. Its exit status reports whether it could answer, never whether the answer was satisfactory - `okf check --archive` is the only thing that refuses. Two commands that both refuse teach a team to run whichever refuses less. | review-2026-08-02 |
| BR-6 | When a change owes nothing under `.okf/`, that MUST be stated as a result rather than as silence. "Nothing owed" and "could not tell" are different answers, and an empty output means the second to anyone who has ever seen a tool fail quietly. | review-2026-08-02 |

# Data Entities

| Entity | Description | Important Fields Or States |
| --- | --- | --- |
| Owed step | One line of output | The condition that produced it, a one-line description, and the command that discharges it |
| Change state | What the command reads to decide | Whether `okf-link.md` exists and which entries it resolves to; whether each entry still lists this change in `pending_changes`; whether `verification.md` exists and its Rule Evidence table has rows |

# Workflows

## Primary Workflow

1. `okf next`, given a change id, reads the change directory and the entries its
   `okf-link.md` resolves to.
2. It reports the first owed step under `.okf/`, with its command (BR-4).
3. If the change owes nothing there, it says so (BR-6) and names
   the archive gate for that change id as what decides.
4. If `okf-link.md` does not exist yet, it names `openspec status` and stops -
   the artifact half is not its question (BR-2).

## Alternative Or Failure Workflows

- An unknown change id is an error about the argument, not a report of zero owed
  steps.
- A change whose okf-link rows all declare no domain knowledge still has a
  verification pass and decisions to account for, so it is not treated as
  finished.

# Risks And Compliance Constraints

| Risk Or Constraint | Impact | Mitigation Or Handling |
| --- | --- | --- |
| A second command that reports readiness invites treating it as the gate | A team archives on `next` saying nothing is owed, skipping `check --archive` | BR-5 keeps its exit status meaningless as a verdict, and every "nothing owed" output names the real gate |
| Overlap with `openspec status` grows as either tool changes | Two answers to one question, drifting | BR-2 makes the boundary a rule rather than a convention: the artifact half is named, never re-derived |
| Deriving state from files is slower and more fragile than reading a checkbox | The command is wrong when a heuristic misfires | Accepted. BR-3 is the whole point - a checkbox is what this exists to stop trusting - and every derivation it makes is one `okf check` already makes |

# Assumptions

- The steps worth reporting are the ones `okf check --archive` already enforces.
  This command tells you what that gate will say before you run it against a
  change you have not finished.

# Open Questions

- Whether `okf check` should print the same line when it finds nothing, making
  the separate command unnecessary. Deferred: it would change `check`'s output
  contract, which CI parses, and that is worth its own change.

# Verification History

| Date | Change | Verified Status | Evidence / Notes |
| --- | --- | --- | --- |
| 2026-08-02 | add-okf-next-command | verified | BR-1..BR-6 all `match` against `lib/next.mjs` and `bin/okf.mjs` with line references in the change's verification.md. 254 tests pass; 12 of the new assertions were red before implementation. `readChangeState` extracted from `checkChange` so advisor and gate share one derivation. |
