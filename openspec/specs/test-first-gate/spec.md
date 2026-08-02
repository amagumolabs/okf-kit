# test-first-gate

## Purpose

Decide when each level of test must exist relative to the implementation it
guards, so that a test can still refute the code rather than only describe it.
The gate cannot observe when a file was written, so its second job is to make the
ordering recorded and its absence visible.

The domain rules behind these requirements live in
`.okf/features/test-first-gate.md`. The `Implements: BR-n` lines cite them rather
than restating them, so the rule text has exactly one home.

## Requirements

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

### Requirement: The implementation adapts to the tests, not the reverse

The `tasks` template's implementation group SHALL state that when the code and a
pre-written test disagree, the code changes. The `tasks` artifact instruction
SHALL state the order of repair for the case where the rule itself turns out to
be wrong: the OKF entry, then the spec, then the record, then the test, then the
code.

Implements: BR-8, BR-10

#### Scenario: An agent reads the implementation group

- **WHEN** an agent reaches the implementation group of `templates/tasks.md`
- **THEN** it reads that the tests are fixed and the code moves
- **AND** it reads what to do instead when the rule, not the code, is wrong

#### Scenario: An agent finds the code contradicting a test

- **WHEN** the implementation cannot satisfy a pre-written test
- **THEN** the instruction directs it to fix the code by default
- **AND** to repair upstream first — entry, spec, record, test, code — when the rule is the thing that was wrong

### Requirement: Every recorded test change carries a ground that resolves

Each row of the "Test Changes After Implementation Started" table in
`test-plan.md` SHALL identify the test it concerns, and SHALL answer with exactly
one of two things: a citation that resolves — a `BR-n` present in an OKF entry
linked by the change, or a path under `openspec/specs/` that exists — or a
declared mechanical defect naming what was mechanically wrong. A row with neither
SHALL be an error.

Implements: BR-9

#### Scenario: A row naming no test

- **WHEN** a row's Test cell is empty
- **THEN** `okf check` reports an error, because a record that does not say which test it concerns records nothing

#### Scenario: A row citing a rule that does not exist

- **WHEN** a row cites `BR-9` and no OKF entry linked by the change carries that id
- **THEN** `okf check` reports an error naming the id

#### Scenario: A row citing a spec that does not resolve

- **WHEN** a row cites a path under `openspec/specs/` that does not exist
- **THEN** `okf check` reports an error naming the path

#### Scenario: A row standing on a mechanical defect

- **WHEN** a row has no citation and its Ground declares a mechanical defect with a specific reason
- **THEN** `okf check` reports nothing for that row

#### Scenario: A row standing on nothing

- **WHEN** a row has no citation and declares no mechanical defect
- **THEN** `okf check` reports an error, because a test change with no stated ground is indistinguishable from a test fitted to the code

#### Scenario: No test was changed

- **WHEN** the Test Changes table has no rows
- **THEN** `okf check` reports nothing — the table is a record, not a quota

### Requirement: The test-plan template shows both admissible grounds

The "Test Changes After Implementation Started" table in
`templates/test-plan.md` SHALL carry a `Ground` column alongside the citation
column, so that the two answers a row may give are visible in the template rather
than inferred from surrounding prose.

Implements: BR-9

#### Scenario: An agent fills the test-plan template

- **WHEN** an agent records a test change
- **THEN** the table's columns show it that a row answers with either a citation or a mechanical defect
