## Why

`checkHygiene` reports unfilled placeholders, blank table rows and leftover
template comments. It is called at `lib/check.mjs:451` and `:489` only - over
`.okf/features/` and `.okf/decisions/`. It has never run over
`openspec/changes/`, whose artifacts come from templates just as full of
placeholders and are read by the same people.

The gap was found the hard way. `add-static-analysis-gate` shipped a rule
asserting that a placeholder command in `verification.md` is caught by this
check; it is not, and the rule had to be repaired mid-flight. That change left
the exposure recorded as a risk and deferred the fix here.

## What Changes

- `checkHygiene` runs over the artifacts of every active change, reporting
  through `hardensAtArchive`: warnings in flight, errors at the archive boundary
  (BR-1, BR-5).
- Quoting is recognised from **inline code spans** as well as fenced blocks, so a
  document can name template text while explaining it (BR-2, BR-4). This is a
  change to `stripFences`'s companion, and it applies to bundle files too - the
  rule gets one implementation, not two.
- The leftover-instruction-comment finding stays a warning in flight and becomes
  an error at archive (BR-6).
- The risk row in `.okf/features/okf-archive-gate.md` recording this exposure is
  discharged, and its Known Gaps follow-up closed.

Not breaking for archived changes: the scan only reaches changes under
`openspec/changes/`, and already-archived directories are never re-scanned.

## Capabilities

### New Capabilities

- `artifact-hygiene`: what counts as template residue, where the rule applies,
  and how a document quotes template text without asserting it.

### Modified Capabilities

None. `okf-archive-gate` has a risk row discharged by this change, which is a
factual correction to an existing entry rather than a requirement change, and it
happens in the verification pass.

## Scope And Non-Goals

**In scope:**

- Wiring `checkHygiene` into the change-artifact walk in `lib/check.mjs`.
- Adding inline code spans to the quoting exemption, for every caller.
- Fixtures covering both, including the false positives this change would
  otherwise create on this repository's own archived changes.

**Non-goals:**

- Changing how residue is recognised. The angle-bracket heuristic, its stray-tag
  skip and its autolink skip are inherited unchanged, catches and misses alike.
- Scanning `openspec/specs/`. Recorded as an open question on the entry:
  baseline specs are assembled from delta specs this change already covers.
- An allowlist of excused files. BR-3 forbids it, and the durable reference
  rules already settled why.

## Acceptance Criteria

1. A change artifact carrying `<placeholder>` outside a code span is reported -
   warning without `--archive`, error with it. Governs: BR-1, BR-5.
2. The same placeholder inside an inline code span is not reported, in a change
   artifact and in a bundle file alike. Governs: BR-2, BR-3, BR-4.
3. A blank table row and a bare `-` list item in a change artifact are reported
   on the same escalation. Governs: BR-1, BR-5.
4. A shipped instruction comment left in a change artifact warns in flight and
   errors at archive. Governs: BR-6.
5. No excused-file list appears anywhere in the implementation. Governs: BR-3.
6. This repository's own change artifacts pass `okf check` after the change, and
   every finding it does produce is a real one. Governs: BR-1.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| The scan fires on documents already written | Noise on in-flight work | `hardensAtArchive`; one edit per finding; archived changes are never re-scanned |
| Code spans silence any finding | The rule becomes optional in practice | Accepted, and identical to fencing's existing standing: an exemption stated in the text and visible to review, not hidden in a checker |
| Adding code-span stripping changes bundle-file results too | A previously reported bundle file goes quiet | Intended - the rule gets one implementation. A fixture pins the bundle-file behaviour so the change to it is deliberate rather than incidental |

## Impact

- `lib/check.mjs` - the change-artifact walk gains a `checkHygiene` call; the
  comment/fence stripper gains code spans.
- `test/run.mjs` - fixtures for each branch.
- `.okf/features/artifact-hygiene.md` - new entry (already created).
- `.okf/features/okf-archive-gate.md` - risk row discharged during verification.
- No template or schema change: this rule is about what an artifact must not
  contain, and every template already says so in prose.
