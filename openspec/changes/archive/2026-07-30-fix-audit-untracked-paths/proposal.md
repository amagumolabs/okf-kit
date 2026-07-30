<!--
Linked OKF entries: see okf-link.md. Rules are cited by id, not restated.
-->

## Why

`okf audit` reports `declared path matches nothing` for a path that exists in the
working tree but has not been committed yet. Verification always happens before
the commit that introduces a feature's files, so **every new capability passes
through this state** - the first audit after any new feature accuses it of having
vanished. A report that cries wolf on the normal case is a report people learn to
skip, which costs more than having no drift detection at all.

Observed on this repository: right after `add-okf-audit` was verified,
`okf audit` said `declared path matches nothing: lib/audit.mjs` while the file sat
in the working tree.

## What Changes

- Distinguish three states for a declared path instead of two: tracked with
  history, present but not yet committed, and matching nothing at all (BR-9).
- Report not-yet-committed paths separately from vanished ones, so only a genuine
  disappearance reads as a signal.
- **No verdict changes.** An entry whose paths are all uncommitted still has no
  commit history, so it stays `unauditable` under BR-8. This change is about what
  the report says, not about what counts as drift.

## Capabilities

### New Capabilities

### Modified Capabilities
- `okf-audit`: the requirement covering unauditable entries gains a scenario for
  a path that exists but is not yet committed, and its reporting is split

## Scope And Non-Goals

**In scope:**

- Telling "not committed yet" apart from "gone" in the audit report.

**Non-goals:**

- Changing any verdict. A path with no commits gives the audit nothing to compare
  regardless of why (BR-8).
- Reading the working tree to judge drift. Committed history remains the only
  source of staleness (BR-7).
- Guessing whether an uncommitted path is a new file or a mistyped glob. Both are
  reported the same way; the developer can tell them apart at a glance.

## Acceptance Criteria

1. A declared path with tracked files and commits behaves exactly as before.
   (BR-1)
2. A declared path that exists in the working tree but has no tracked files is
   reported as not-yet-committed, and does **not** appear as matching nothing.
   (BR-9)
3. A declared path matching nothing on disk and nothing tracked is still reported
   as matching nothing. (BR-3)
4. An ignored file does not count as present: a path matching only ignored files
   is reported as matching nothing, because git will never track it. (BR-9)
5. Verdicts are unchanged in every case above. (BR-8)

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| The two states look similar in output and get conflated anyway | The fix buys nothing | Use different wording and keep them in separate fields, so a JSON consumer can also tell them apart |
| Treating ignored files as "present" | A path matching only build output would look fine forever | `--exclude-standard` is required so ignored files are not counted as present (criterion 4) |

## Impact

- `lib/audit.mjs`: a second git query per path, and a new result field.
- `bin/okf.mjs`: report the new state.
- `test/run.mjs`: three cases, including an ignored-file fixture.
- `openspec/specs/okf-audit/spec.md`: one MODIFIED requirement.
