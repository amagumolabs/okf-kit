<!--
Full requirement content is reproduced below, as MODIFIED requires - a partial
block loses the untouched scenarios at archive time.
-->

## MODIFIED Requirements

### Requirement: An impossible comparison is reported as unauditable
The system SHALL report a verified entry as `unauditable`, never as `current` or
`stale`, whenever the comparison cannot be made: no declared `code_paths`, no
`verified_at` to compare against, or no commit history for the declared paths.

When reporting why, the system SHALL distinguish a declared path that exists in
the working tree but is not yet committed from one that matches nothing at all.

Implements: BR-3, BR-8, BR-9

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
- **WHEN** an entry declares a path that matches no file, tracked or untracked
- **THEN** the report says that path matches nothing, because a vanished path usually means the code moved

#### Scenario: A declared path exists but is not committed yet
- **WHEN** an entry declares a path whose files exist in the working tree but are not tracked by git
- **THEN** the report says that path is not committed yet, and does not say it matches nothing, because verification precedes the commit that introduces a feature's files

#### Scenario: A declared path matches only ignored files
- **WHEN** an entry declares a path matching only files git is configured to ignore
- **THEN** the report says that path matches nothing, because git will never track those files
