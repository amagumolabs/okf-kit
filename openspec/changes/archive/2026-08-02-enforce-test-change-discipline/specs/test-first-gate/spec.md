## ADDED Requirements

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
