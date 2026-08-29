## Why

Every downstream artifact reads the bundle through `okf-link.md`, and
`okf-link.md` is built from the capabilities a change modifies. A change's read
set is therefore exactly its write set, which is the wrong shape for a knowledge
base whose whole point is that knowledge outlives the change that recorded it
(BR-1).

Two consequences are already visible in this repository. `.okf/decisions/` is
write-only in the workflow: the schema names it where a decision is promoted and
where the archive gate counts promotions, and nowhere asks anyone to read one. A
change to `okf-next` today will not read the four decisions filed against
`okf-next` unless the agent happens to remember them (BR-10). And `lib/check.mjs`
is a declared `code_path` of five entries, so an edit that reads as local inside
one of them can contradict a rule in another; the only mechanism that catches it
is the `conflict` verdict at verification, which fires after the code is written
and only if the agent independently knows the neighbour exists (BR-9).

## What Changes

- `okf-link.md` gains a second table, **Related Knowledge**: bundle files the
  change must read and must not modify (BR-1). It carries no obligation toward
  what it lists - no `pending_changes`, no verification, no attestation (BR-2).
- The `okf-link` artifact instruction gains the derivation: decisions whose
  `affects_features` names a capability in the write set, and feature entries
  whose `code_paths` intersect one in the write set (BR-3). Both read frontmatter
  that already exists - no entry gains a field.
- A derived candidate is a candidate, not a verdict: one judged irrelevant keeps
  its row with the reason (BR-4), and a file reached by judgement alone is listed
  on the same terms (BR-5). Every row names why it is related and what to read in
  it (BR-6).
- An empty related set is written as a stated reason rather than left blank
  (BR-7), following the reason-or-path escape the kit already uses for
  `no domain knowledge` and `Not Applicable because`.
- The `proposal` instruction's reconcile step re-runs the scan against the
  settled Capabilities section. The scan happens exactly twice and is not
  repeated per artifact (BR-8).
- The `verification` instruction requires re-reading the related entries whenever
  a `BR-n` changes, and raising `conflict` where the edit changes domain meaning
  for one of them (BR-9).
- `okf check` reads the table's structure: that it is not silent and that each
  row resolves (BR-13). Missing or silent is a warning normally and an error
  under `--archive` (BR-14). A candidate the kit can derive that no row mentions
  is a warning, never an error (BR-15).

## Capabilities

### New Capabilities
- `okf-related-knowledge`: which durable knowledge a change reads but does not
  write - how that set is derived, when, what a row must say, and what the
  verification pass owes the entries it did not touch.

### Modified Capabilities
- `okf-archive-gate`: the gate gains one more required record. Its new
  requirements cover the structural check on the Related Knowledge table, the
  warning-to-error hardening at the archive boundary, and the ceiling on what the
  kit may refuse over a derived candidate.

## Scope And Non-Goals

**In scope:**

- The Related Knowledge table in the `okf-link` template and the three schema
  instructions that produce, refresh, and consume it (`okf-link`, `proposal`,
  `verification`).
- Candidate derivation from `affects_features` and `code_paths` intersection,
  extracted into the shared change-state read rather than written twice.
- Structural checks in `lib/check.mjs` with the severity split above.

**Non-goals:**

- Any check on whether a scan was thorough, or whether a listed file is genuinely
  related. That is a judgement about meaning, and this kit has already recorded
  that it does not check those.
- A new `okf related` command. A second lookup surface is not needed to write a
  table, and a command that reports readiness invites being treated as the gate.
- Teaching `okf next` to report an unwritten scan. Deferred and recorded as an
  Open Question on the new entry: the normal-run warning already prints from the
  moment `okf-link.md` exists, so the archive gate is not the first sighting.
- Any new frontmatter field on a feature entry or a decision.

## Acceptance Criteria

1. A change directory whose `okf-link.md` has no Related Knowledge section is
   reported by `okf check` as a warning, and by `okf check --archive` as an error
   (BR-13, BR-14).
2. A Related Knowledge table whose only row states a reason for being empty
   passes both runs (BR-7).
3. A related row whose path does not resolve on disk is an error naming the row
   (BR-13), on the same terms as an unresolved OKF Link row.
4. A feature entry sharing a `code_path` with a linked entry, and named by no
   related row, produces a warning naming that entry - and never an error
   (BR-15).
5. A decision whose `affects_features` names a linked capability, and named by no
   related row, produces the same warning (BR-15).
6. Listing a file in the Related Knowledge table does not place the change id in
   its `pending_changes`, and the archive gate demands no verification of it
   (BR-2).
7. A capability appearing in both tables is reported: an entry with an obligation
   is not also a read-only neighbour (BR-2).
8. A change directory with no `okf-link.md` at all keeps reporting only that,
   with no related-knowledge finding on top of it - "no read set recorded" and
   "no link artifact" stay distinct conditions.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| The table grows past what anyone reads - this change's own scan produced fourteen rows | Downstream artifacts read the related table shallowly, and the OKF Link entries with it | BR-6 makes every row name a rule or section rather than a file, so a row is a pointer into a read rather than a whole read |
| Rows are added to silence the candidate warning | The table fills and the read set does not widen | The candidate finding stays a warning (BR-15); nothing is refused over it, so silencing it buys nothing |
| The derivation misses what matters - three of the four decisions that shaped this change's design were reached by judgement, not by a signal | The table looks complete while the constraint that actually binds is absent | BR-5 makes judgement a first-class source rather than an exception, and the entry records the derivation as a floor |
| The related set is stale by the time it is read, because the write set moved | Artifacts are planned against a neighbour that is no longer adjacent | BR-8 pins the second scan to the reconcile step, where the Capabilities section settles |

## Impact

- `openspec/schemas/okf-gated-feature/schema.yaml` - the `okf-link`, `proposal`,
  and `verification` artifact instructions.
- `openspec/schemas/okf-gated-feature/templates/okf-link.md` - the new section.
- `lib/check.mjs` - the structural checks, and the candidate derivation added to
  the shared change-state read consumed by `checkChange`.
- `test/` - new cases, written before the implementation they cover.
- `.okf/features/okf-related-knowledge.md` (new),
  `.okf/features/okf-archive-gate.md` (BR-13..BR-15).
- No dependency change. No change to the CLI's command surface.
