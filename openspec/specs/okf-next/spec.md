# okf-next

## Purpose

Answer what a change still owes under `.okf/` - the half of the workflow
OpenSpec's own status cannot see - by reading file state and naming the command
that discharges each step. Advises; never acts; never refuses.

The domain rules behind these requirements live in `.okf/features/okf-next.md`.
The `Implements: BR-n` lines cite them rather than restating them, so the rule
text has exactly one home.

## Requirements

### Requirement: The command reports what a change owes the bundle
`okf next <change-id>` SHALL report the first step the change still owes under
`.okf/`, derived from the state of files rather than from any checkbox or
recorded intent. Each reported step SHALL include the command that discharges it.

Implements: BR-3, BR-4

#### Scenario: An entry still lists the change as pending
- **WHEN** an entry resolved by `okf-link.md` still holds this change id in `pending_changes`
- **THEN** the command reports the verification pass as owed, and names the command that discharges it

#### Scenario: No verification artifact yet
- **WHEN** the change directory has no `verification.md`
- **THEN** the command reports it as owed

#### Scenario: A verification with no rule evidence
- **WHEN** `verification.md` exists, `okf-link.md` resolves to an entry, and the Rule Evidence table has no rows
- **THEN** the command reports the missing evidence as owed

#### Scenario: A checkbox is not an answer
- **WHEN** a change's Archive Readiness checklist is fully ticked while its entries still hold the change in `pending_changes`
- **THEN** the command still reports the verification pass as owed

### Requirement: The command reports and never acts
`okf next` SHALL NOT create or modify any file, and SHALL NOT execute any
command. Its exit status SHALL indicate whether the question could be answered,
never whether steps remain.

Implements: BR-1, BR-5

#### Scenario: Running the command changes nothing
- **WHEN** `okf next` runs against a change owing several steps
- **THEN** no file under the repository is created or modified

#### Scenario: Owed steps still exit zero
- **WHEN** `okf next` reports steps still owed
- **THEN** the process exits zero, because this command advises and `okf check --archive` refuses

#### Scenario: An unknown change id
- **WHEN** `okf next` is given a change id that does not exist
- **THEN** it reports an error about the argument rather than an empty list of owed steps

### Requirement: The artifact half is named, never re-derived
`okf next` SHALL NOT enumerate missing OpenSpec artifacts. When `okf-link.md`
does not exist, it SHALL name `openspec status` as the command that answers that
question and stop.

Implements: BR-2

#### Scenario: A change with no okf-link
- **WHEN** the change directory has no `okf-link.md`
- **THEN** the output names `openspec status` and contains no list of missing artifacts

#### Scenario: The implementation holds no artifact ordering
- **WHEN** the implementation is read
- **THEN** it contains no ordered list of OpenSpec artifact ids

### Requirement: Owing nothing is stated, not implied
When a change owes nothing under `.okf/`, `okf next` SHALL say so explicitly and
SHALL name `okf check --archive <change-id>` as the gate that decides whether it
can be archived.

Implements: BR-6

#### Scenario: A finished change
- **WHEN** every entry has been verified and this change removed from `pending_changes`
- **THEN** the output states that nothing is owed and names the archive gate

#### Scenario: A change declaring no domain knowledge
- **WHEN** every okf-link row reads `no domain knowledge - <reason>` and no verification pass has been done
- **THEN** the verification pass is still reported as owed, because such a change still has decisions to account for
