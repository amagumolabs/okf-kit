## ADDED Requirements

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
