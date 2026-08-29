---
type: Feature Knowledge
title: okf-related-knowledge
description: The rule that a change reads more of the bundle than it writes, and how the entries it must read but not modify are derived, recorded, and re-checked.
status: stable
verification_state: verified
verified_at: 2026-08-05
verified:
  - by: anthropic/claude-opus-5
    at: 2026-08-05T00:00:00Z
criticality: normal
pending_changes: []
code_paths:
  - lib/check.mjs
  - openspec/schemas/okf-gated-feature/schema.yaml
  - openspec/schemas/okf-gated-feature/templates/okf-link.md
  - test/run.mjs
sources:
  - id: grill-2026-08-04
    resource: 'Review conversation 2026-08-04 on whether okf-link.md narrows what a change may know: "Changes currently have an okf-link.md file. But does that limit the knowledge we get from OKF? Should we let the agent re-scan index.md in OKF to find more related documents ... because what if updating one area impacts another?"'
  - id: analysis-2026-08-04
    resource: 'Reading of openspec/schemas/okf-gated-feature/schema.yaml on 2026-08-04: every downstream artifact reads the bundle through okf-link.md alone, and `.okf/decisions/` is named only where a decision is promoted or gated - no artifact instruction asks anyone to read one.'
  - id: verification-2026-08-05
    resource: 'Verification pass of change:add-okf-related-knowledge. Promoting its own four decisions made all four candidates of the change that authored them, which is the derivation asking a change to cite itself.'
linked_changes:
  - add-okf-related-knowledge
generated:
  by: anthropic/claude-opus-5
  at: 2026-08-05T00:00:00Z
---

# Summary

`okf-link.md` is built from the capabilities a change modifies, and every
downstream artifact reads the bundle through it. That makes a change's read set
equal to its write set, which is the wrong shape: knowledge that constrains a
change is not confined to the entries the change happens to edit. A decision
recorded under one capability binds the next change to a neighbour, and two
entries whose `code_paths` overlap can be made to contradict each other by an
edit that looks local from inside either one.

This capability is the second surface: the entries and decisions a change must
read and must not modify. It defines how that set is derived from what the
bundle already records, when it is derived, what a row must say to be worth
reading, and what the verification pass owes the entries it did not touch.

# Domain Terms

| Term | Meaning | Source |
| --- | --- | --- |
| Write set | The capabilities a change modifies - the rows of the OKF Link table, each carrying `pending_changes` and a verification obligation | analysis-2026-08-04 |
| Read set | The knowledge a change must read before planning. A superset of the write set | grill-2026-08-04 |
| Related entry | A bundle file in the read set but not the write set: read, cited, never edited by this change | grill-2026-08-04 |
| Derivation signal | A fact already in bundle frontmatter from which relatedness is computed, as opposed to a relationship someone maintains by hand | analysis-2026-08-04 |
| Targeted read | Naming the `BR-n` or section that makes an entry related, so the reader opens a rule rather than a whole file | analysis-2026-08-04 |
| Cross-entry conflict | An edit that is correct inside the entry it lands in and changes domain meaning for an entry it does not name | grill-2026-08-04 |

# Actors And Roles

| Actor | Role In Feature | Notes |
| --- | --- | --- |
| Planning agent | Derives the related set before the proposal exists, when its read of the request is at its vaguest | The actor with the most to gain and the least context; it does not yet know what it does not know |
| Verification pass | Re-reads the related entries when it changes a rule, and raises `conflict` where the change reaches one | The last actor able to notice before the change is archived |
| Reader of an archived change | Learns which knowledge the change was decided against, not only which it edited | The related table is the only record that a neighbour was considered and cleared |

# Business Rules

| ID | Rule | Source |
| --- | --- | --- |
| BR-1 | A change's read set MUST be recorded separately from its write set. `okf-link.md` carries both: the OKF Link table for capabilities this change modifies, and a Related Knowledge table for bundle files it must read and must not modify. One table cannot serve both, because the OKF Link table's rows are required to mirror the proposal's Capabilities section exactly. | grill-2026-08-04 |
| BR-2 | Listing a file as related MUST create no obligation toward it. The change id is not added to its `pending_changes` or `linked_changes`, its `verification_state` is not touched, and the verification pass owes it no attestation. Relatedness is a reading relationship, and a reading relationship that quietly became a writing one would reintroduce the coupling this table exists to avoid. | grill-2026-08-04 |
| BR-3 | The related set MUST be derived from what the bundle already records, never from a relationship field maintained by hand. The two signals are: a decision whose `affects_features` names a capability in the write set, and a feature entry whose `code_paths` intersect those of an entry in the write set. A hand-maintained `related:` list decays silently, because nothing fails when it is stale. | analysis-2026-08-04 |
| BR-4 | A derivation signal MUST be treated as a candidate, not as a verdict. Overlap and `affects_features` say two files might bear on each other; whether one actually does is a judgement, and a signal the agent dismisses is dismissed in writing rather than by omission. | analysis-2026-08-04 |
| BR-5 | The signals are a floor, not a ceiling. A file the agent reached by judgement MUST be listed on the same terms as a derived candidate, recording judgement as what put it there. A derivation that could only ever produce what it computed would teach the agent to stop looking past it. | analysis-2026-08-04 |
| BR-6 | Every related row MUST name why the file is related and which `BR-n` or section to read. A row that names only a path trades one unbounded read for another, and the reason a change reads a neighbour is exactly the thing a later reader cannot reconstruct. | analysis-2026-08-04 |
| BR-7 | An empty related set MUST be stated, never left blank. `none - <reason>` and an absent table are different claims: the first says the scan ran and found nothing, the second says nothing at all. This is the reason-or-path escape the kit already applies to `no domain knowledge`, `Not required because`, and `Not Applicable because`. | analysis-2026-08-04 |
| BR-8 | The scan MUST happen when `okf-link.md` is first written and again at the proposal's reconcile step, and MUST NOT be repeated per artifact. The first scan is against a guess at the capabilities; the second is against the settled Capabilities section, which is the point where the write set - and therefore everything derived from it - can have moved. | grill-2026-08-04 |
| BR-9 | Where the verification pass changes a `BR-n`, it MUST re-read the related entries and raise `conflict` where the change alters domain meaning for one of them. `conflict` already covers "a fix that would change domain meaning for other features"; without a recorded related set, that clause depends on the agent independently remembering that the other feature exists. | grill-2026-08-04 |
| BR-10 | `.okf/decisions/` MUST be readable from the workflow, not only writable by it. A decision is promoted so that it binds later changes, and a decision no later change is directed to read binds nobody. | analysis-2026-08-04 |
| BR-11 | A decision this change itself promoted MUST NOT be derived as a candidate for it. A change authors such a decision rather than reading it, so it cannot be prior knowledge the change was planned against, and asking for it back is asking the change to cite itself. The authorship is already recorded: the decision's `linked_changes` names the change that promoted it. | verification-2026-08-05 |

# Data Entities

| Entity | Description | Important Fields Or States |
| --- | --- | --- |
| Related Knowledge table | The read-set surface, a second table in `okf-link.md` | One row per related file: path, why it is related (which signal, or judgement), and the `BR-n` or section to read. Or a single `none - <reason>` row |
| Derivation signal | What produces a candidate row | `affects_features` on a decision; `code_paths` intersection between two feature entries |
| Dismissed candidate | A signal fired, the agent judged it irrelevant | Recorded as a row with the reason, not dropped (BR-4) |

# Workflows

## Primary Workflow

1. The planning agent settles its best read of the capabilities this change
   touches and writes the OKF Link table.
2. For those capabilities it computes the candidates: decisions whose
   `affects_features` names one of them, and feature entries whose `code_paths`
   intersect theirs (BR-3).
3. It reads each candidate far enough to say why it is related and what to read
   in it, and writes the Related Knowledge table (BR-6). A candidate it judges
   irrelevant gets a row saying so (BR-4), and a file it reached by judgement
   rather than by a signal gets a row on the same terms (BR-5).
4. Downstream artifacts read both tables. The OKF Link entries are the primary
   knowledge source; the related files are constraints the change is planned
   against.
5. At the proposal's reconcile step the write set is settled, so the scan is run
   again against the final Capabilities section (BR-8).
6. The verification pass, on changing any `BR-n`, re-reads the related entries
   and raises `conflict` where the edit reaches one (BR-9).

## Alternative Or Failure Workflows

- No candidate fires: the table carries `none - <reason>` (BR-7), which is a
  result and not an omission.
- A related entry turns out to need editing after all: it moves into the OKF Link
  table, gains `pending_changes`, and stops being related. An entry is never in
  both tables - the write set is where an obligation lives.
- A candidate resolves to a file that no longer exists: a stale `affects_features`
  or `code_paths` entry, which is a defect in the entry that declares it and is
  fixed there.

# Risks And Compliance Constraints

| Risk Or Constraint | Impact | Mitigation Or Handling |
| --- | --- | --- |
| The related table grows until reading it costs more than the change | Downstream artifacts read less carefully, including the OKF Link entries that actually matter | BR-6 forces a targeted read: a row names a rule, not a file. A row nobody can write a reason for is a row that should not exist |
| Rows are added to satisfy a check rather than to be read | The table fills and the read set does not widen | The kit checks that rows resolve and that the table is not silent, and checks nothing about whether the scan was thorough - a judgement about meaning has no honest checker |
| Relatedness is inferred from overlap, which is not the same as relevance | Candidates that waste attention | BR-4 makes the dismissal explicit and cheap, so a wrong candidate costs one row rather than one bad decision |

# Assumptions

- Two entries whose `code_paths` intersect are more likely than average to
  constrain each other. This is a heuristic about this kit's own bundle, where
  `lib/check.mjs` appears in four entries, and it is stated as an assumption
  because relevance is not what the field records.
- The proposal's reconcile step is the last point at which the write set moves.
  If a later artifact changes the Capabilities section, the second scan is no
  longer the last word.

# Open Questions

- Whether `okf next` should report an unwritten related scan as an owed step.
  Deferred: `next` reports what the archive gate enforces, and the gate's warning
  already prints from the moment `okf-link.md` exists.
- Whether relatedness should also be derived from one entry's `BR-n` being cited
  in another entry's prose. Left out for now: no entry in this bundle does it, so
  the signal has no evidence behind it yet.

# Verification History

| Date | Change | Verified Status | Evidence / Notes |
| --- | --- | --- | --- |
| 2026-08-05 | add-okf-related-knowledge | verified | BR-1..BR-10 `match` against `lib/check.mjs` and the shipped schema, with line references in the change's verification.md. BR-11 was an `okf-gap` found by the gate running on its own author: promoting the change's four decisions made all four candidates of the change that wrote them. Repaired in order - rule, spec, test-plan row, UT-624 red, then code. 304 tests pass; 20 of the new assertions were red before implementation and 10 green by design as over-fire guards. |
