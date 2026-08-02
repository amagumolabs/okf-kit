## Context

`checkHygiene(where, text, report)` at `lib/check.mjs:224` is called from
`checkFeatureEntries` and `checkDecisionEntries` only. The change walk -
`checkChange` - reads the same artifacts for other purposes and never calls it.

Two conventions in the file carry this design: `hardensAtArchive` for the
severity split, and `stripFences(stripComments(text))` for what the scan sees.

## Goals / Non-Goals

**Goals:**

- One hygiene implementation, reaching everywhere templates land.
- A quoting exemption an author can actually use in a sentence.
- No behaviour change to how residue itself is recognised.

**Non-Goals:**

- Improving the angle-bracket heuristic.
- Reaching `openspec/specs/`.

## Decisions

**Code spans join fences as a quoting context, for every caller.** The
alternative was to strip code spans only for change artifacts, leaving bundle
files stricter. That would give one rule two meanings depending on which
directory the file is in, which is precisely the accident this change exists to
remove. Pinning the bundle-file behaviour in a fixture makes the widening
deliberate rather than a side effect nobody noticed.

**Severity follows `hardensAtArchive`, not a version-gated grace period.** A
change in flight legitimately holds a half-written artifact, so an immediate
error would fire at a change doing exactly what the workflow asked. At archive
the same tolerance is exactly wrong. The precedent
`a-new-invariant-starts-as-a-warning` is for invariants a project cannot satisfy
without unplanned work; here the remedy per finding is one edit.

**Archived changes are not scanned.** They were archived under the rules of their
time, and re-reporting them produces a backlog nobody chose against a directory
nobody will edit. This matches how the archive gate already treats them.

**The instruction-comment finding keeps the escalation rather than staying a
warning forever.** Today it is a warning on bundle files with no archive
counterpart. A warning nobody must ever act on decays into noise, and the archive
boundary is the moment the comment stops being guidance and starts being residue.

## Risks / Trade-offs

| Risk | Mitigation |
| --- | --- |
| Stripping code spans hides real residue that happens to be backticked | Accepted. It is the same trade fencing already carries, and an author who backticks a slot to silence a finding has written the exemption where review can see it |
| A regex for code spans mishandles nested or unbalanced backticks | Strip fenced blocks first, then spans, and pin the ordering with a fixture that contains both |
| This repository's own archived changes contain residue | Not scanned, by decision above. A fixture asserts the archive directory is skipped |

## Migration Plan

None. No bundle content changes shape, so `okf migrate` has nothing to do, and
no template changes.

## Open Questions

None blocking. Whether the scan should reach `openspec/specs/` is recorded on the
entry, and deferred until the exposure is measured rather than assumed.
