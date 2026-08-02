## ADDED Requirements

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

### Requirement: This change adds no check
No new finding SHALL be reported by `okf check` as a result of this change.

Implements: BR-14

#### Scenario: The checker is untouched
- **WHEN** the full suite runs after this change
- **THEN** no assertion about a new finding exists, because whether a line is durable is a judgement about meaning that a checker would either be ignored for or obeyed wrongly
