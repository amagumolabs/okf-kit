<!--
Rule text lives in .okf/features/okf-audit.md. Requirements cite ids.
-->

## ADDED Requirements

### Requirement: Staleness is judged from committed history
The system SHALL report an entry as `stale` when any path in its `code_paths` has
a commit strictly newer than the entry's `verified_at` date, and SHALL name the
triggering path and commit date in the report.

Implements: BR-1, BR-2, BR-7

#### Scenario: A declared path has a newer commit
- **WHEN** an entry verified on 2026-07-01 declares a path whose newest commit is 2026-07-20
- **THEN** the entry is reported `stale`, naming that path and 2026-07-20

#### Scenario: All declared paths predate verification
- **WHEN** an entry verified on 2026-07-20 declares paths whose newest commit is 2026-07-01
- **THEN** the entry is reported `current`

#### Scenario: A commit lands on the verification date itself
- **WHEN** an entry verified on 2026-07-20 declares a path whose newest commit is also dated 2026-07-20
- **THEN** the entry is reported `current`, because verification follows the code it verifies

#### Scenario: A declared path has uncommitted edits
- **WHEN** a declared path is modified in the working tree but not committed
- **THEN** the entry is reported `current`, because work in progress is not drift

### Requirement: An impossible comparison is reported as unauditable
The system SHALL report a verified entry as `unauditable`, never as `current` or
`stale`, whenever the comparison cannot be made: no declared `code_paths`, no
`verified_at` to compare against, or no commit history for the declared paths.

Implements: BR-3, BR-8

#### Scenario: A verified entry declares no paths
- **WHEN** a verified entry has an empty `code_paths` list
- **THEN** the entry is reported `unauditable`

#### Scenario: A verified entry has no verification date
- **WHEN** a verified entry has an empty `verified_at`
- **THEN** the entry is reported `unauditable`, because there is nothing to compare a commit date against

#### Scenario: Declared paths have no commit history
- **WHEN** every declared path exists but has no commits
- **THEN** the entry is reported `unauditable`

#### Scenario: A declared path matches nothing in the repository
- **WHEN** an entry declares a path that no longer exists in the repository
- **THEN** the report says so for that path, because a vanished path usually means the code moved

### Requirement: Only verified, active entries are audited
The system SHALL audit only entries whose `verified` is `verified` and whose
`status` is not `deprecated`, and SHALL report every other entry as `skipped`.

Implements: BR-4, BR-5

#### Scenario: An unverified entry
- **WHEN** an entry's `verified` is `unverified` or `needs-revision`
- **THEN** the entry is reported `skipped`, because `okf check` already surfaces it

#### Scenario: A deprecated but verified entry
- **WHEN** a verified entry has `status: deprecated`
- **THEN** the entry is reported `skipped`, because its code is expected to diverge

### Requirement: The audit never modifies knowledge
The system SHALL NOT write to any file under `.okf/` while auditing.

Implements: BR-6

#### Scenario: Auditing a repository with stale entries
- **WHEN** the audit runs and finds stale entries
- **THEN** every file under `.okf/features/` is byte-identical afterwards

### Requirement: Exit status reflects the outcome
The system SHALL exit non-zero when at least one entry is stale, and when the
audit could not run at all.

Implements: BR-1, BR-3

#### Scenario: At least one stale entry
- **WHEN** the audit finds one or more stale entries
- **THEN** the command exits non-zero

#### Scenario: No stale entries
- **WHEN** no entry is stale
- **THEN** the command exits zero, even if some entries are unauditable or skipped

#### Scenario: Not a git repository
- **WHEN** the audit runs outside a git repository, or git is unavailable
- **THEN** the command reports that it could not run and exits non-zero, rather than reporting entries as current
