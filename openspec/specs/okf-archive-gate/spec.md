# okf-archive-gate

## Purpose

Refuse to archive a change whose OKF pass is incomplete, so that the one
irreversible step in the workflow cannot bury knowledge nobody wrote down. The
gate answers for completeness of the pass, not for correctness of the code, and
it must not be silenceable by a change declaring itself uninteresting.

The domain rules behind these requirements live in
`.okf/features/okf-archive-gate.md`. The `Implements: BR-n` lines cite them
rather than restating them, so the rule text has exactly one home.

## Requirements

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

### Requirement: A change records its static analysis results before archiving
The archive gate SHALL require `verification.md` to carry a Static Analysis
table, and SHALL report an error at the archive boundary when that table is
absent or has no rows. Outside the archive boundary the same finding SHALL be
reported as a warning, because a result is not knowable before the code that
produces it is written.

Implements: BR-9

#### Scenario: Archiving with no Static Analysis table
- **WHEN** `okf check --archive` runs for a change whose `verification.md` has no Static Analysis table
- **THEN** the gate reports an error naming the missing table

#### Scenario: The same change before the archive boundary
- **WHEN** `okf check` runs without `--archive` for that same change
- **THEN** the gate reports a warning rather than an error, and the run exits zero

#### Scenario: A filled table
- **WHEN** the Static Analysis table carries the required rows and each is satisfied
- **THEN** the gate reports nothing for static analysis

### Requirement: Lint and type checking each hold a required row
The archive gate SHALL require a row for lint and a row for type checking, and
SHALL report an error naming any required row that is absent. Rows for further
checks SHALL be permitted and SHALL NOT be constrained.

Implements: BR-10

#### Scenario: A table with no Typecheck row
- **WHEN** the Static Analysis table carries a Lint row and no Typecheck row
- **THEN** the gate reports an error naming the missing Typecheck row

#### Scenario: A project with no type checker
- **WHEN** the Typecheck row is present and its result reads `Not Applicable because <reason>` with a specific reason
- **THEN** the row is accepted, because the absence was stated rather than left indistinguishable from an oversight

#### Scenario: An extra row
- **WHEN** the table carries a Build row in addition to the two required rows
- **THEN** the gate accepts it and applies no additional requirement to it

### Requirement: A static analysis row is satisfied by a result or a stated reason
The archive gate SHALL accept a Static Analysis row carrying a reported result,
or a result declaring `Not Applicable because <reason>` whose reason meets the
kit's minimum reason length. It SHALL report an error for a row whose result is
empty, `-`, or a non-result such as `not run`, and for a bare `Not Applicable`
carrying no reason. The gate SHALL NOT gate the command column.

Implements: BR-11

#### Scenario: A row with a command and a result
- **WHEN** a row carries `npm run typecheck` and a reported result
- **THEN** the row is accepted

#### Scenario: A row whose result was never filled
- **WHEN** a row's result cell is empty, `-`, or reads `not run`
- **THEN** the gate reports an error naming that row

#### Scenario: A row discharged with a reason
- **WHEN** a row's result reads `Not Applicable because this kit ships plain ESM with no build step`
- **THEN** the row is accepted

#### Scenario: A row discharged without a reason
- **WHEN** a row's result reads `Not Applicable` with no reason following it
- **THEN** the gate reports an error, because a reason that names nothing is not a reason

#### Scenario: A row still carrying the template placeholder
- **WHEN** a row's command is still the angle-bracketed template placeholder
- **THEN** the gate reports nothing about the command, and reports the row through its empty result, because a row nobody filled in has no result either

### Requirement: The gate reads reported results and runs nothing
The archive gate SHALL evaluate the Static Analysis table by reading what the
change reported, and SHALL NOT execute the project's lint, type check, or build
commands.

Implements: BR-12

#### Scenario: Evaluating the table
- **WHEN** the gate evaluates a Static Analysis table naming commands that would fail if run
- **THEN** the gate reports findings only about the table's contents, and spawns no child process

### Requirement: The static analysis gate applies to a change with no linked entries
The archive gate SHALL evaluate the Static Analysis table regardless of whether
any okf-link row resolves to a file under `.okf/features/`, on the same footing
as decision promotion.

Implements: BR-1, BR-9

#### Scenario: A change declaring no domain knowledge
- **WHEN** a change's only okf-link rows read `no domain knowledge - <reason>` and its Static Analysis table is absent
- **THEN** the gate reports the static analysis error, rather than passing the change

### Requirement: The workflow states that the static analysis table is enforced
The schema's `verification` artifact instruction and
`templates/verification.md` SHALL state that the Static Analysis table is
enforced by the archive gate and name its reason-or-result escape. The
`test-plan` template SHALL carry the lint and type check commands, so the
commands the verification reports are chosen while the plan is written.

Implements: BR-7, BR-9

#### Scenario: An agent reads the verification instruction
- **WHEN** the `verification` artifact instruction is read from the schema
- **THEN** it states that the Static Analysis table is checked at archive time and names the required rows and the escape

#### Scenario: An agent reads the verification template
- **WHEN** `templates/verification.md` is read
- **THEN** the Static Analysis section states the same, rather than presenting the table as advisory

#### Scenario: An agent reads the test-plan template
- **WHEN** `templates/test-plan.md` is read
- **THEN** its Commands section carries a lint command and a type check command alongside the test commands

#### Scenario: The shipped templates name no ecosystem
- **WHEN** the shipped `test-plan` and `verification` templates are read
- **THEN** their lint and type check commands are angle-bracketed placeholders, and no template carries a command specific to any language or package manager

### Requirement: A project declares its static analysis commands once
The `test-plan` artifact instruction SHALL direct an agent to take the project's
lint and type check commands from the project's own `AGENTS.md`, outside the
okf-kit markers. When the project has not declared them, the instruction SHALL
direct the agent to derive them from the repository's own manifest, confirm them
with the user, and record them there so subsequent changes inherit them. The kit
SHALL NOT parse that declaration.

Implements: BR-7, BR-12

#### Scenario: A project that has declared its commands
- **WHEN** an agent writes a test-plan for a project whose `AGENTS.md` declares its lint and type check commands outside the okf-kit markers
- **THEN** the instruction directs it to use the declared commands rather than deriving new ones

#### Scenario: A project that has not declared its commands
- **WHEN** an agent writes a test-plan for a project whose `AGENTS.md` declares nothing
- **THEN** the instruction directs it to derive the commands from the repository's manifest, confirm them with the user, and record them in `AGENTS.md` outside the markers

#### Scenario: The declaration is never parsed
- **WHEN** the gate evaluates a Static Analysis table
- **THEN** it reads no file outside the change directory to validate the reported command, because the declaration is prose for agents and not configuration for the kit

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
