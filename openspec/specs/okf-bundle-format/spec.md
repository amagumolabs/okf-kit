# okf-bundle-format Specification

## Purpose
TBD - created by archiving change okf-spec-conformance. Update Purpose after archive.
## Requirements
### Requirement: Workflow state lives outside the specification's key
The system SHALL store an entry's workflow state in `verification_state`, taking
exactly one of `unverified`, `verified`, or `needs-revision`, and SHALL reject an
entry whose `verified` key holds a scalar.

Implements: BR-1

#### Scenario: An entry carries the workflow state in its own key
- **WHEN** an entry declares `verification_state: verified`
- **THEN** the check accepts the field and validates it against the three-value vocabulary

#### Scenario: An entry uses the specification's key for workflow state
- **WHEN** an entry declares `verified: unverified`
- **THEN** the check reports an error naming `verification_state` as the field that holds workflow state

#### Scenario: An unknown workflow state
- **WHEN** an entry declares `verification_state: reviewed`
- **THEN** the check reports an error listing the three permitted values

### Requirement: Attestations describe the current content
The system SHALL treat `verified[]` as the set of actors vouching for the entry's
content as it stands. A verification pass SHALL replace the list rather than
append to it, and SHALL NOT carry attestations forward from an earlier change.

Implements: BR-2

#### Scenario: A second change verifies the same entry
- **WHEN** an entry verified by change A is verified again by change B
- **THEN** `verified[]` holds only the attestations produced by change B

#### Scenario: A human reviews within the same pass
- **WHEN** a reviewer signs off on an entry the same pass already attested to
- **THEN** `verified[]` holds both attestations, because both vouch for the same content

### Requirement: State and attestation stay coupled
The system SHALL report a mismatch between `verification_state` and `verified[]`.
A `verified` entry SHALL carry a non-empty `verified[]` whose newest `at` agrees
with `verified_at` by date, and an `unverified` or `needs-revision` entry SHALL
carry no `verified` key at all.

Implements: BR-3, BR-4

#### Scenario: Verified with no attestation
- **WHEN** an entry declares `verification_state: verified` and no `verified` key
- **THEN** the check reports the entry, because nothing records who vouched for it

#### Scenario: Verification date disagrees with the newest attestation
- **WHEN** an entry declares `verified_at: 2026-07-30` and its newest attestation is dated 2026-08-01
- **THEN** the check reports an error naming both dates

#### Scenario: Needs-revision still carrying an attestation
- **WHEN** an entry declares `verification_state: needs-revision` and retains a `verified` key
- **THEN** the check reports an error, because a conformant consumer would read the entry as confirmed

#### Scenario: Moving to needs-revision
- **WHEN** a verification pass reaches a `conflict` verdict on an entry
- **THEN** the entry ends with `verification_state: needs-revision` and no `verified` key

### Requirement: Missing human review is reported without being enforced
The system SHALL report a `criticality: high` entry that reaches `verified` with
no `human:` actor in `verified[]` as a warning, and SHALL NOT report it as an
error. The system SHALL NOT assert that a present `human:` attestation is
genuine.

Implements: BR-5, BR-6

#### Scenario: A high-criticality entry with only machine attestation
- **WHEN** a `criticality: high` entry is verified and every actor in `verified[]` is an agent
- **THEN** the check emits a warning and the run's exit status is unaffected

#### Scenario: A high-criticality entry with a human attestation
- **WHEN** a `criticality: high` entry carries an actor prefixed `human:`
- **THEN** the check emits nothing, and makes no claim about who wrote the line

#### Scenario: A normal-criticality entry with only machine attestation
- **WHEN** a `criticality: normal` entry is verified with no human actor
- **THEN** the check emits nothing

### Requirement: Every non-reserved bundle file is a concept document
The system SHALL require every `.md` file under `.okf/`, other than the reserved
`index.md` and `log.md`, to carry parseable frontmatter with a non-empty `type`.
Files holding no knowledge SHALL either carry a type or live outside the bundle.

Implements: BR-7

#### Scenario: A bundle file with no frontmatter
- **WHEN** `.okf/` contains a `.md` file with no frontmatter block
- **THEN** the check reports it as a concept document missing `type`

#### Scenario: A reserved filename
- **WHEN** `.okf/log.md` exists with no frontmatter
- **THEN** the check accepts it, because reserved filenames are not concept documents

#### Scenario: Templates outside the bundle
- **WHEN** the entry templates are stored outside `.okf/`
- **THEN** their placeholder frontmatter is not evaluated as a concept document

### Requirement: The bundle declares the specification version it targets
The system SHALL write `okf_version` into the frontmatter of `.okf/index.md`, and
SHALL NOT write frontmatter into any other index file.

Implements: BR-8

#### Scenario: Regenerating the index
- **WHEN** `okf index` runs
- **THEN** `.okf/index.md` is written with `okf_version` in its frontmatter

#### Scenario: The bundle root index is missing
- **WHEN** `.okf/index.md` does not exist
- **THEN** the check reports it and names `okf index` as the fix

### Requirement: Actor identity follows the specification's convention
The system SHALL require every actor in `generated.by` and in `verified[].by` to
match one of `<producer>/<version>`, `human:<id>`, or `process:<id>`.

Implements: BR-9

#### Scenario: A bare model name
- **WHEN** an entry declares `generated.by: claude-opus-5`
- **THEN** the check reports an error, because the actor carries no producer and would lose its tier

#### Scenario: A conventional agent actor
- **WHEN** an entry declares `generated.by: anthropic/claude-opus-5`
- **THEN** the check accepts it

#### Scenario: A human actor
- **WHEN** an attestation declares `by: human:danh`
- **THEN** the check accepts it and the entry reaches the human-reviewed tier

### Requirement: Lifecycle status uses the specification vocabulary
The system SHALL accept `draft`, `stable`, or `deprecated` for `status` on every
entry, and SHALL hold a decision entry's own lifecycle in `decision_status`.

Implements: BR-10

#### Scenario: A feature entry in the previous vocabulary
- **WHEN** an entry declares `status: active`
- **THEN** the check reports an error listing the three permitted values

#### Scenario: A decision entry's lifecycle
- **WHEN** a decision entry declares `status: stable` and `decision_status: superseded`
- **THEN** the check accepts both, and validates `decision_status` against `accepted | superseded | reversed`

### Requirement: Divergence from the specification is documented
The system SHALL carry a profile document naming every frontmatter key the kit
adds beyond the specification and every rule it narrows, and this document SHALL
be kit-owned so an upgrade keeps it current.

Implements: BR-11

#### Scenario: A reader checks what the kit changed
- **WHEN** someone reads the profile document
- **THEN** it names each kit-defined key, each narrowed rule, and the specification version targeted

### Requirement: The change history is published as a log
The system SHALL generate `.okf/log.md` from the Verification History rows of
every entry, grouped by date with the newest date first.

Implements: BR-7

#### Scenario: Regenerating the index
- **WHEN** `okf index` runs over a bundle whose entries have verification history
- **THEN** `.okf/log.md` is written with one dated group per distinct date, newest first

#### Scenario: A bundle with no verification history yet
- **WHEN** no entry has been verified
- **THEN** `.okf/log.md` is written with no dated groups rather than omitted

### Requirement: The workflow states what does not belong in an entry
The `okf-link` artifact instruction and `.okf/templates/feature.md.tmpl` SHALL
state which content belongs in an entry and which belongs in the change's spec or
design instead, and SHALL give the durability test in the form "would a second
change to this capability still need it" rather than a test of truth.

Implements: BR-14, BR-15

#### Scenario: An agent reads the okf-link instruction
- **WHEN** the `okf-link` artifact instruction is read from the schema
- **THEN** it names content that does not belong in an entry and names where it belongs instead

#### Scenario: The durability test is stated as durability
- **WHEN** that instruction is read
- **THEN** the test it gives distinguishes durable from change-local, rather than correct from incorrect

#### Scenario: An agent reads the feature template
- **WHEN** `.okf/templates/feature.md.tmpl` is read
- **THEN** its header comment carries the same filter

### Requirement: The verification pass removes leaked change-local detail
The `verification` artifact instruction SHALL direct the section review to remove
change-local detail that has entered an entry, on the same pass that corrects
staleness.

Implements: BR-14

#### Scenario: An agent reads the verification instruction
- **WHEN** the section-review step of the `verification` instruction is read
- **THEN** it directs the agent to remove change-local detail as well as to correct staleness

### Requirement: A step that has read an entry does not re-ask what it answers
The `proposal` artifact instruction and the explore addendum SHALL state that a
question the linked entry already answers is answered by citing the rule id
rather than by asking the user, and that the entry's Assumptions and Open
Questions are what a question should come from. The addendum SHALL be identical
in every marker file.

Implements: BR-16, BR-17

#### Scenario: An agent reads the proposal instruction
- **WHEN** the `proposal` artifact instruction is read
- **THEN** it states that a question the entry answers is not put to the user

#### Scenario: The other half is stated with it
- **WHEN** that instruction is read
- **THEN** it also states that Assumptions and Open Questions are what generate a question

#### Scenario: The addendum agrees with itself
- **WHEN** the okf-kit block is read from both marker files
- **THEN** the two are byte-identical and both carry the rule

### Requirement: Durability is not mechanically checked
`okf check` SHALL NOT report a finding about whether a line in an entry is
durable or change-local. Whether a line is durable is a judgement about meaning
that a checker would either be ignored for or obeyed wrongly.

Implements: BR-14

#### Scenario: The checker stays silent on durability
- **WHEN** the full suite runs
- **THEN** no assertion about a durability finding exists, because the kit ships no check for it

