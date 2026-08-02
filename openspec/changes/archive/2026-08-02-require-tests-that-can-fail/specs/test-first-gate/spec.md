## ADDED Requirements

### Requirement: A green initial status explains itself

A Pre-Implementation Unit Tests row whose `Initial Status` is `passing` SHALL
state why, in the same `status: reason` shape the table already uses for
`failing`. The bare word SHALL be reported as a warning during implementation and
as an error under `okf check --archive`, on the same grounds the plan already
hardens the rest of its record at the archive boundary: a change in flight is not
blocked, and an unexplained green status is not archived.

A reason SHALL be specific enough to distinguish the two cases it stands between —
a rule that already held and is now locked, or a test that asserts nothing the
change introduces.

Implements: BR-11

#### Scenario: A bare green initial status

- **WHEN** a row records `Initial Status: passing` and nothing more
- **THEN** `okf check` emits a warning naming the row
- **AND** `okf check --archive` reports it as an error

#### Scenario: A green initial status with its reason

- **WHEN** a row records `Initial Status: passing: the rule already held, this test locks it against regression`
- **THEN** `okf check` reports nothing for that row

#### Scenario: A reason too short to be one

- **WHEN** a row records `Initial Status: passing: ok`
- **THEN** the row is reported, because a reason under ten characters distinguishes nothing

#### Scenario: A green status in the live column

- **WHEN** a row's `Status` — not its `Initial Status` — is `passing`
- **THEN** nothing is reported, because a test that ends green is the intended outcome

### Requirement: Every pre-implementation unit test names what would falsify it

The Pre-Implementation Unit Tests table in `templates/test-plan.md` SHALL carry a
`Falsified By` column, and each non-blank row SHALL fill it with the production
change that would make that test fail. An empty cell SHALL be a warning during
implementation and an error under `okf check --archive`. A table missing the
column entirely SHALL be reported once for the table, not once per row.

`okf check` SHALL check that the answer is present and SHALL NOT judge whether it
is apt, which is the same division the gate already draws for `BR-n` evidence: the
check answers "is the record there", a reviewer answers "is it true".

Implements: BR-12

#### Scenario: A row with no falsifier

- **WHEN** a Pre-Implementation Unit Tests row leaves `Falsified By` empty
- **THEN** `okf check` emits a warning naming the row
- **AND** `okf check --archive` reports it as an error

#### Scenario: A table with no falsifier column

- **WHEN** the Pre-Implementation Unit Tests table has no `Falsified By` column
- **THEN** exactly one finding is reported for the table

#### Scenario: A falsifier that names a production change

- **WHEN** a row records `Falsified By: removing the header lookup and reading Owner by position`
- **THEN** `okf check` reports nothing for that row

#### Scenario: A falsifier that is wrong but present

- **WHEN** a row's `Falsified By` names something that would not actually break the test
- **THEN** `okf check` still reports nothing, because aptness is a review question and the check does not pretend to answer it

#### Scenario: Only the unit test table is affected

- **WHEN** the Integration Tests or E2E Tests table has no `Falsified By` column
- **THEN** nothing is reported, because the requirement applies to the tests that must reach the red state

### Requirement: The test-plan template names the grounds that are not admissible

The "Test Change Rules" section of `templates/test-plan.md` SHALL name the common
grounds that BR-8 excludes, not only the two it admits. Stating the closed list
without its exclusions leaves the agent to fill the gap with whichever reason
sounds most reasonable at the time, which is exactly the reasoning BR-8 forbids.

Implements: BR-8

#### Scenario: An agent looks for a reason to edit a pre-written test

- **WHEN** an agent reads the Test Change Rules section
- **THEN** it finds the two admissible grounds
- **AND** it finds named among the inadmissible ones: having tested the behaviour manually, intending to add the test afterwards, the time already spent on the implementation, and the case being different this time

## MODIFIED Requirements

### Requirement: The status vocabulary is closed

Every status column in `test-plan.md` SHALL hold one of `planned`, `skeleton`,
`failing`, or `passing`. Any other word SHALL be an error, in either the current
or the initial status column.

A `failing` status SHALL carry the assertion message it failed with. Recorded
without one, it SHALL be a warning during implementation and an error under
`okf check --archive`: BR-3 states the red state as a MUST, and a MUST that is
only ever a warning can be archived unmet.

Implements: BR-1, BR-3

#### Scenario: An unknown word in a status column

- **WHEN** a row records a status of `wip` in either status column
- **THEN** `okf check` reports an error naming the four permitted values

#### Scenario: A red state with its assertion message

- **WHEN** a row records `failing: expected 403, got 200`
- **THEN** the leading word is read as the status and the message is preserved

#### Scenario: A red state with no assertion message

- **WHEN** a row records the bare word `failing`
- **THEN** `okf check` emits a warning naming the row
- **AND** `okf check --archive` reports it as an error

### Requirement: The pending-test list is derived from a table's live status column

When deciding whether a test row is still `skeleton` or `planned` at archive
time, `okf check` SHALL read the table's live `Status` column, and SHALL fall
back to `Initial Status` only when the table has no `Status` column. A status
recorded as historical MUST NOT be treated as the row's current state.

The Known Gaps row that answers for such a test SHALL be located by column name,
not by column position. Every other column lookup in the checker resolves by
header name; one that counts cells silently reads the wrong answer the first time
a template is reordered, and reports nothing when it does.

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

#### Scenario: A Known Gaps table whose columns were reordered

- **WHEN** a Known Gaps table carries an `Owner` column in a position other than the template's
- **AND** a surviving `skeleton` row is listed there with an owner
- **THEN** no error is reported, because the owner is found by header name
