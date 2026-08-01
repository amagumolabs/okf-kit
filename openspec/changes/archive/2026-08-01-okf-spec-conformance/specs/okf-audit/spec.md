## MODIFIED Requirements

### Requirement: Only verified, active entries are audited
The system SHALL audit only entries whose `verification_state` is `verified` and
whose `status` is not `deprecated`, and SHALL report every other entry as
`skipped`.

The system SHALL make that selection from `verification_state` alone, and SHALL
NOT require an entry to carry a `verified[]` attestation in order to be audited.

Implements: BR-4, BR-5, BR-10

#### Scenario: An unverified entry
- **WHEN** an entry's `verification_state` is `unverified` or `needs-revision`
- **THEN** the entry is reported `skipped`, because `okf check` already surfaces it

#### Scenario: A deprecated but verified entry
- **WHEN** a verified entry has `status: deprecated`
- **THEN** the entry is reported `skipped`, because its code is expected to diverge

#### Scenario: A verified entry carrying no attestation
- **WHEN** an entry's `verification_state` is `verified` and it carries no `verified[]`
- **THEN** the entry is audited normally, because a migrated entry is verified by the workflow even though nobody recorded who vouched for it

#### Scenario: A deprecated entry under the new status vocabulary
- **WHEN** a verified entry has `status: deprecated` after the vocabulary moves to `draft | stable | deprecated`
- **THEN** the entry is still reported `skipped`, because `deprecated` is in both vocabularies
