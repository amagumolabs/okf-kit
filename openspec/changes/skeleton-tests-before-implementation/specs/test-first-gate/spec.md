## ADDED Requirements

### Requirement: The schema creates every test file before the implementation it guards

The `tasks` template SHALL contain a task group that creates integration and E2E
test files as skeletons, and that group SHALL be positioned before the
implementation group. No group at or after implementation may be the first place
a test file comes into existence.

Implements: BR-4

#### Scenario: An agent reads the tasks template

- **WHEN** an agent fills `templates/tasks.md` for a change with integration or E2E coverage
- **THEN** it finds a group before the implementation group whose tasks create those test files as skeletons
- **AND** the groups after implementation ask only for promotion of files that already exist

#### Scenario: A level does not apply to the change

- **WHEN** a change has no integration or E2E coverage
- **THEN** the skeleton group is dropped whole, with the reason stated under Test Strategy in `test-plan.md`
- **AND** no empty group is left behind

### Requirement: No artifact instructs promotion of a skeleton nothing creates

Every schema instruction or template that asks an agent to promote a skeleton
SHALL be preceded by an instruction or template group that creates it. The group
order stated in the `tasks` artifact instruction SHALL list the same groups, in
the same order, as `templates/tasks.md`.

Implements: BR-7

#### Scenario: An agent reads the tasks instruction

- **WHEN** an agent reads the group order sentence in the `tasks` artifact instruction
- **THEN** the sequence it names matches the group headings in `templates/tasks.md` one for one, in order

#### Scenario: The instruction and the template disagree

- **WHEN** the group order sentence names a sequence the template does not contain
- **THEN** this is a defect in the schema, because the agent executes the template and the reviewer reads the sentence

### Requirement: A test-plan records the status each test held before implementation

The Integration Tests and E2E Tests tables in `templates/test-plan.md` SHALL each
carry an `Initial Status` column alongside the current `Status` column, and the
`test-plan` artifact instruction SHALL require it to be filled. A row that leaves
`Initial Status` empty SHALL produce a warning.

Implements: BR-6

#### Scenario: A row records both statuses

- **WHEN** an integration row reads `Initial Status: skeleton` and `Status: passing`
- **THEN** `okf check` reports nothing for that row

#### Scenario: A row leaves the initial status blank

- **WHEN** an integration or E2E row has a non-empty `Status` and an empty `Initial Status`
- **THEN** `okf check` emits a warning naming the row
- **AND** does not emit an error, so a change already in flight is not blocked

#### Scenario: A whole test level is declared not applicable

- **WHEN** `test-plan.md` declares a level not applicable with a specific reason under Test Strategy
- **THEN** no warning is emitted for that level's missing rows

### Requirement: The pending-test list is derived from a table's live status column

When deciding whether a test row is still `skeleton` or `planned` at archive
time, `okf check` SHALL read the table's live `Status` column, and SHALL fall
back to `Initial Status` only when the table has no `Status` column. A status
recorded as historical MUST NOT be treated as the row's current state.

Implements: BR-5

#### Scenario: A skeleton that was promoted before archive

- **WHEN** a row's `Initial Status` is `skeleton` and its `Status` is `passing`
- **AND** `okf check --archive` runs for that change
- **THEN** no Known Gaps row is required for it

#### Scenario: A skeleton that survived to archive

- **WHEN** a row's `Status` is `skeleton` and no Known Gaps row names it with an owner
- **AND** `okf check --archive` runs for that change
- **THEN** an error is reported for that row

#### Scenario: A table with only an initial status

- **WHEN** the Pre-Implementation Unit Tests table carries `Initial Status` and no `Status` column
- **THEN** `Initial Status` is read as that table's live status

### Requirement: The status vocabulary is closed

Every status column in `test-plan.md` SHALL hold one of `planned`, `skeleton`,
`failing`, or `passing`. Any other word SHALL be an error, in either the current
or the initial status column.

Implements: BR-1

#### Scenario: An unknown word in a status column

- **WHEN** a row records a status of `wip` in either status column
- **THEN** `okf check` reports an error naming the four permitted values

#### Scenario: A red state with its assertion message

- **WHEN** a row records `failing: expected 403, got 200`
- **THEN** the leading word is read as the status and the message is preserved
