## ADDED Requirements

### Requirement: Migration never fabricates an attestation
The system SHALL move an entry's workflow state from `verified` to
`verification_state` and SHALL NOT write a `verified[]` attestation for it. A
migrated entry retains its workflow state and carries no record of who vouched
for it until its next verification pass.

Implements: BR-1, BR-3

#### Scenario: A previously verified entry
- **WHEN** `okf migrate` processes an entry declaring `verified: verified` and `verified_at: 2026-07-30`
- **THEN** the entry declares `verification_state: verified`, keeps `verified_at`, and carries no `verified` key

#### Scenario: A previously unverified entry
- **WHEN** `okf migrate` processes an entry declaring `verified: unverified`
- **THEN** the entry declares `verification_state: unverified` and carries no `verified` key

#### Scenario: The migrated entry is not a defect
- **WHEN** `okf check` runs over a bundle migrated this way
- **THEN** entries lacking an attestation are not reported as errors

### Requirement: Migration is invoked explicitly and upgrade never writes knowledge
The system SHALL migrate entry files only when `okf migrate` is invoked, and
`okf upgrade` SHALL write to no path under `.okf/features/` or
`.okf/decisions/`.

Implements: BR-2

#### Scenario: Upgrading a project with an older entry shape
- **WHEN** `okf upgrade` runs against a bundle whose entries still use the previous field
- **THEN** every file under `.okf/features/` and `.okf/decisions/` is byte-identical afterwards

#### Scenario: The developer migrates
- **WHEN** `okf migrate` runs against that bundle
- **THEN** the entry files are rewritten and the run reports each file it touched

### Requirement: Migration is idempotent
The system SHALL leave an already-migrated bundle unchanged, and SHALL report
that no file needed rewriting.

Implements: BR-5

#### Scenario: Running migration twice
- **WHEN** `okf migrate` runs a second time against an already-migrated bundle
- **THEN** no file is written and the report says every file is already current

#### Scenario: A partially migrated bundle
- **WHEN** some entries carry the old field and some the new
- **THEN** only the entries carrying the old field are rewritten

### Requirement: Migration has a narrow blast radius
The system SHALL rewrite only the frontmatter keys it migrates, leaving the body
and every unrelated frontmatter key byte-identical.

Implements: BR-6

#### Scenario: An entry with body content and extra keys
- **WHEN** `okf migrate` rewrites an entry carrying `criticality`, `code_paths`, and a Verification History table
- **THEN** those keys and the entire body are byte-identical afterwards

#### Scenario: An entry whose frontmatter cannot be parsed
- **WHEN** `okf migrate` encounters an entry it cannot parse
- **THEN** the file is left untouched and the run reports it

### Requirement: A newly introduced coupling invariant starts as a warning
The system SHALL report the coupling between `verification_state: verified` and a
non-empty `verified[]` as a warning in the release that introduces migration, and
SHALL NOT report it as an error before a later release.

Implements: BR-4

#### Scenario: A migrated entry that has not been re-verified
- **WHEN** `okf check` runs over an entry declaring `verification_state: verified` with no attestation, at the release that introduced migration
- **THEN** the check emits a warning and the run's exit status is unaffected
