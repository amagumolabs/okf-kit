## ADDED Requirements

### Requirement: The gate reads the recorded read set structurally
`okf check` SHALL read the Related Knowledge table of a change's `okf-link.md`
and SHALL report a finding when the table is absent, or present with neither a
row nor a stated reason for being empty. Each row that names a path SHALL resolve
to a file on disk, and a row that does not resolve SHALL be an error naming the
row. The gate SHALL report nothing about whether the recorded set is complete or
whether a listed file is genuinely related.

Implements: BR-13

#### Scenario: A row naming a file that does not exist
- **WHEN** a Related Knowledge row names `.okf/decisions/2026-01-01-gone.md` and no such file exists
- **THEN** `okf check` reports an error naming the row and the path

#### Scenario: A row naming a real file
- **WHEN** a Related Knowledge row names a file that exists under `.okf/`
- **THEN** the row produces no finding

#### Scenario: The gate does not judge relevance
- **WHEN** a Related Knowledge row names a file with no derivable connection to any linked capability
- **THEN** `okf check` reports nothing about that row's relevance

### Requirement: The read-set record hardens at the archive boundary
A missing Related Knowledge table, or one that is silent, SHALL be a warning in a
normal run and an error under `okf check --archive`.

Implements: BR-14

#### Scenario: A change still in flight
- **WHEN** `okf check` runs against an active change whose `okf-link.md` has no Related Knowledge section
- **THEN** it reports a warning, and the run is not failed by it

#### Scenario: The same change at the archive boundary
- **WHEN** `okf check --archive` runs against that change
- **THEN** the same condition is reported as an error

#### Scenario: A stated empty set at the boundary
- **WHEN** `okf check --archive` runs against a change whose Related Knowledge table holds only a stated reason for being empty
- **THEN** no finding is reported

### Requirement: A derived candidate is reported, never refused over
Where the gate can derive a candidate that no Related Knowledge row mentions, it
SHALL report a warning naming that file, in a normal run and under `--archive`
alike. It SHALL NOT report an error for an underived or unmentioned candidate,
and SHALL NOT require the recorded set to match its own derivation.

Implements: BR-15

#### Scenario: An unmentioned overlapping entry
- **WHEN** a feature entry shares a `code_paths` value with a linked entry and no Related Knowledge row names it
- **THEN** `okf check` reports a warning naming that entry

#### Scenario: An unmentioned decision
- **WHEN** a decision's `affects_features` names a linked capability and no Related Knowledge row names it
- **THEN** `okf check` reports a warning naming that decision

#### Scenario: The warning does not harden
- **WHEN** `okf check --archive` runs against a change with an unmentioned candidate
- **THEN** the finding is still a warning and does not block the archive

#### Scenario: A recorded set wider than the derivation
- **WHEN** the Related Knowledge table lists files the gate's derivation did not produce
- **THEN** no finding is reported, because the derivation is a floor and not the definition
