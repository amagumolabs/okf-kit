<!--
Linked OKF entries: see okf-link.md. Business rules are cited by id (BR-n) rather
than restated - the rule text lives in .okf/features/okf-audit.md.
-->

## Why

`okf check` proves an entry is internally consistent and that the workflow was
followed. It cannot see the failure the workflow was built to prevent: code that
moved after an entry was verified, through a hotfix, refactor, or dependency bump
that never opened a change. Today that drift is documented as a known limitation
and nothing detects it. `code_paths` has been collected since v0.1.0 specifically
so it could be.

## What Changes

- New `okf audit` command: for every verified entry, compare `verified_at` against
  the commit history of the paths the entry declares, and report a verdict per
  entry (BR-1, BR-2).
- Entries with no declared paths are reported as unauditable rather than passed
  silently (BR-3).
- Unverified, needs-revision, and deprecated entries are excluded (BR-4, BR-5).
- The command reports only - it never edits an entry or its `verified` field
  (BR-6).
- Exit non-zero when at least one entry is stale, so it can run as a scheduled CI
  job.
- `--json` output, matching `okf check`.

## Capabilities

### New Capabilities
- `okf-audit`: detecting OKF entries whose code changed after they were verified

### Modified Capabilities

## Scope And Non-Goals

**In scope:**

- Detecting staleness from committed git history for entries that declare paths.
- Making the trigger visible: which path, which commit date.

**Non-goals:**

- Deciding whether the drift actually invalidated the knowledge. That needs
  someone to read both the code and the entry; the audit only says "look here".
- Changing any entry's `verified` state (BR-6).
- Detecting drift in entries that declare no paths. The honest output there is
  "cannot tell" (BR-3).
- Watching uncommitted work (BR-7).

## Acceptance Criteria

1. An entry with a commit newer than `verified_at` on a declared path is reported
   `stale`, naming the path and the commit date. (BR-1)
2. An entry whose newest commit predates `verified_at` is reported `current`.
   (BR-1)
3. A commit dated exactly `verified_at` is reported `current`, not `stale`. (BR-2)
4. A verified entry with empty `code_paths` is reported `unauditable`, never
   `stale` and never `current`. (BR-3)
5. Entries that are `unverified` or `needs-revision` are reported `skipped`. (BR-4)
6. An entry with `status: deprecated` is reported `skipped` even when verified.
   (BR-5)
7. Running the audit leaves every `.okf/features/*.md` file byte-identical. (BR-6)
8. Uncommitted changes to a declared path do not make an entry `stale`. (BR-7)
9. The command exits non-zero when any entry is stale, and zero when none is.
10. Outside a git repository the command reports that it could not run and exits
    non-zero, rather than reporting everything as current.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| A broad `code_paths` glob makes an entry permanently stale | The audit becomes noise and gets ignored | Report the specific triggering path and commit so a bad glob is visibly the cause |
| Shallow CI clones truncate history and hide drift | An entry looks current when it is not | Documented as an assumption in the entry; not silently compensated for |
| Teams wire the audit into every commit and then disable it | Drift detection lost entirely | Ship it as a scheduled job in the CI example, not a per-commit gate |

## Impact

- `bin/okf.mjs`: new `audit` subcommand, usage text.
- `lib/audit.mjs`: new.
- `test/run.mjs`: fixtures need a real git repository, which no existing test does.
- `.github/workflows/okf.yml` and `README.md`: document it as scheduled, not a gate.
- `docs/openspec-okf-workflow.md`: the "drift is not detected" limitation changes
  rather than disappears - it becomes "detected for entries that declare paths".
