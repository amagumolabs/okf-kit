<!--
Rule text lives in .okf/features/okf-archive-gate.md. Requirements cite ids.
-->

## ADDED Requirements

### Requirement: Decision promotion is required whenever the design holds decisions
The archive gate SHALL derive the requirement for decision promotion from
`design.md` rather than from a checklist item. When `design.md` contains a
Decisions section, the gate SHALL report an error if the Decision Promotion table
in `verification.md` has no rows. When `design.md` is the one-line
`Not required because ...` waiver, the gate SHALL require no row. When
`design.md` matches neither shape, the gate SHALL require a row.

Implements: BR-3, BR-4, BR-7, BR-8

#### Scenario: A design with decisions and an empty promotion table
- **WHEN** `design.md` contains a Decisions section and the Decision Promotion table has no rows
- **THEN** the gate reports an error naming the empty table

#### Scenario: A design waived with a reason
- **WHEN** `design.md` consists of the single line `Not required because <specific reason>.`
- **THEN** the gate requires no Decision Promotion row and reports nothing

#### Scenario: A design of unrecognised shape
- **WHEN** `design.md` has neither a Decisions section nor the `Not required because` waiver
- **THEN** the gate requires a Decision Promotion row, because an unknown must not become an assurance

#### Scenario: A design with decisions and an accounted-for table
- **WHEN** `design.md` contains a Decisions section and every Decision Promotion row is satisfied
- **THEN** the gate reports nothing for decision promotion

### Requirement: A promotion row is satisfied by a resolving path or a stated reason
The archive gate SHALL accept a Decision Promotion row that carries either a
promotion target resolving to an existing file under `.okf/decisions/`, or a
non-empty reason for not promoting. It SHALL report an error for a row carrying
neither, and for a row whose promotion target does not resolve.

Implements: BR-5

#### Scenario: A row promoted to a real decision file
- **WHEN** a row's promotion target is a path under `.okf/decisions/` that exists on disk
- **THEN** the row is accepted

#### Scenario: A row promoted to a path that does not exist
- **WHEN** a row's promotion target names a file under `.okf/decisions/` that is not on disk
- **THEN** the gate reports an error naming that path

#### Scenario: A row not promoted, with a reason
- **WHEN** a row has an empty promotion target and a non-empty reason for not promoting
- **THEN** the row is accepted, because the decision was accounted for as change-local

#### Scenario: A row with neither a target nor a reason
- **WHEN** a row has an empty promotion target and an empty reason
- **THEN** the gate reports an error, because silence is not one of the two permitted answers

### Requirement: Under-accounting for decisions is a warning
The archive gate SHALL report a warning, not an error, when the Decision
Promotion table has fewer rows than `design.md` has decisions.

Implements: BR-6

#### Scenario: Fewer rows than decisions
- **WHEN** `design.md` lists four decisions and the Decision Promotion table has two satisfied rows
- **THEN** the gate reports a warning naming both counts, and no error for that finding

#### Scenario: A row per decision
- **WHEN** the Decision Promotion table has at least as many rows as `design.md` has decisions
- **THEN** the gate reports no under-accounting finding

### Requirement: Archive gates apply to a change with no linked feature entries
The archive gate SHALL evaluate every gate that concerns the change as a whole,
including decision promotion, regardless of whether any okf-link row resolves to
a file under `.okf/features/`. A missing `okf-link.md` SHALL remain a distinct
finding from a present `okf-link.md` that declares no domain knowledge.

Implements: BR-1, BR-2

#### Scenario: Every okf-link row declares no domain knowledge
- **WHEN** a change's only okf-link rows read `no domain knowledge - <reason>` and its Decision Promotion table is empty while `design.md` holds decisions
- **THEN** the gate reports the decision promotion error, rather than passing the change

#### Scenario: No okf-link.md at all
- **WHEN** a change being archived has no `okf-link.md`
- **THEN** the gate reports the missing gate artifact, and does not report a decision promotion finding

#### Scenario: Gates that concern linked entries stay scoped to them
- **WHEN** a change's only okf-link rows declare no domain knowledge
- **THEN** the gate reports no missing rule evidence and no missing entry outcome row, because there is no entry those gates could describe

### Requirement: The workflow states that the promotion table is enforced
The schema's `verification` artifact instruction and
`templates/verification.md` SHALL state that the Decision Promotion table is
enforced by the archive gate, so an agent reading either one is not told a
checkbox suffices.

Implements: BR-7

#### Scenario: An agent reads the verification instruction
- **WHEN** the `verification` artifact instruction is read from the schema
- **THEN** it states that the Decision Promotion table is checked at archive time and names the reason-or-path escape

#### Scenario: An agent reads the verification template
- **WHEN** `templates/verification.md` is read
- **THEN** the Decision Promotion section states the same, rather than presenting the table as advisory
