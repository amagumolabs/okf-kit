## ADDED Requirements

### Requirement: A test-case matrix answers for named boundary classes
The `test-cases` template SHALL enumerate the boundary classes a matrix must
answer for - absence, numeric edge, duplication, staleness, authorisation, and
scope isolation - as seeded rows carrying a Class column, and its instruction
SHALL state that a class a change does not touch is discharged with a stated
reason rather than by deleting its row.

Implements: BR-13, BR-14

#### Scenario: An agent reads the test-cases template
- **WHEN** `templates/test-cases.md` is read
- **THEN** its Negative And Boundary Cases table carries a Class column and one seeded row per named class

#### Scenario: An agent reads the test-cases instruction
- **WHEN** the `test-cases` artifact instruction is read from the schema
- **THEN** it states that an untouched class is discharged with a stated reason, not by deleting the row

#### Scenario: An empty boundary table
- **WHEN** a change's Negative And Boundary Cases table has no rows while its specs contain scenarios
- **THEN** the check reports a warning, and never an error

#### Scenario: A filled boundary table
- **WHEN** the table carries rows
- **THEN** nothing is reported about it

### Requirement: A change with an interface answers for its render states
The `test-cases` template SHALL name the four render states - loading, error,
empty, populated - and the question of whether the interface reports failure
without a console error, conditionally on the change having a user interface.

Implements: BR-15

#### Scenario: An agent reads the browser section
- **WHEN** the Browser E2E section of `templates/test-cases.md` is read
- **THEN** it names all four render states and the console-error question

#### Scenario: A change with no interface
- **WHEN** a change has no user interface
- **THEN** the section is discharged through the existing Not Applicable table with a stated reason, as any other inapplicable level is

### Requirement: An inspectable artefact has a stated home
The `test-plan` and `verification` templates SHALL carry an Artifacts column on
their browser rows, so a test producing something a human can inspect records
where it lands. No shipped template SHALL name a specific browser-automation
tool.

Implements: BR-16

#### Scenario: An agent reads the test-plan template
- **WHEN** the E2E table in `templates/test-plan.md` is read
- **THEN** it carries an Artifacts column

#### Scenario: An agent reads the verification template
- **WHEN** the browser section of `templates/verification.md` is read
- **THEN** it carries an Artifacts column

#### Scenario: No tool is prescribed
- **WHEN** the shipped templates are read
- **THEN** none of them names a specific browser-automation tool, because the rule asks where the artefact lands and not what produced it
