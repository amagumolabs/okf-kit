# okf-related-knowledge Specification

## Purpose

Make what a change reads wider than what it writes. `okf-link.md` is built from
the capabilities a change modifies and every downstream artifact reads the bundle
through it, so a change's read set was exactly its write set - which is the wrong
shape for a knowledge base whose point is that knowledge outlives the change that
recorded it. A decision filed under one capability binds the next change to a
neighbour, and two entries whose code paths overlap can be made to contradict
each other by an edit that looks local from inside either one.

This capability defines the second surface: which bundle files a change must read
and must not modify, how that set is derived from frontmatter the bundle already
carries, when it is derived, what a row must say to be worth reading, and what
the verification pass owes the entries it did not touch.

The domain rules behind these requirements live in
`.okf/features/okf-related-knowledge.md`. The `Implements: BR-n` lines cite them
rather than restating them, so the rule text has exactly one home.

## Requirements
### Requirement: A change records the knowledge it reads but does not write
`okf-link.md` SHALL carry a Related Knowledge table listing the bundle files this
change must read and must not modify, separate from the OKF Link table that
lists the capabilities it modifies. A file SHALL NOT appear in both tables.

Implements: BR-1

#### Scenario: The two tables carry different sets
- **WHEN** `okf-link.md` lists a capability in the OKF Link table and a different bundle file in the Related Knowledge table
- **THEN** the change state resolves the first as a linked entry and the second as related, and the two sets do not overlap

#### Scenario: One file in both tables
- **WHEN** a bundle file named by an OKF Link row also appears as a Related Knowledge row
- **THEN** `okf check` reports an error naming the file, because an entry the change writes is not also a read-only neighbour

#### Scenario: A decision is listed as related
- **WHEN** a Related Knowledge row names a file under `.okf/decisions/`
- **THEN** the row is accepted, because the read set is not restricted to feature entries

### Requirement: Being read creates no obligation
Listing a file in the Related Knowledge table SHALL NOT add this change id to its
`pending_changes` or `linked_changes`, SHALL NOT alter its `verification_state`,
and SHALL NOT create any evidence or attestation requirement for it.

Implements: BR-2

#### Scenario: A related entry keeps its pending list
- **WHEN** a change lists a feature entry as related and archives
- **THEN** the archive gate demands no Rule Evidence row and no cleared `pending_changes` for that entry

#### Scenario: A related entry is never attested
- **WHEN** the verification pass runs for a change with related rows
- **THEN** no `verified` key is written to any file listed only as related

### Requirement: Relatedness is derived from what the bundle already records
The related set SHALL be derived from frontmatter the bundle already carries: a
decision whose `affects_features` names a capability in the OKF Link table, and a
feature entry whose `code_paths` intersect those of an entry in the OKF Link
table. No entry SHALL gain a field declaring its relations.

Implements: BR-3, BR-10

#### Scenario: A decision filed against a linked capability
- **WHEN** a decision's `affects_features` names a capability the change modifies
- **THEN** that decision is a candidate for the related set

#### Scenario: Two entries sharing a code path
- **WHEN** a feature entry declares a `code_paths` value that a linked entry also declares
- **THEN** that entry is a candidate for the related set

#### Scenario: No relation field is introduced
- **WHEN** the derivation runs against the bundle
- **THEN** it reads only `affects_features` and `code_paths`, and no entry declares its related files directly

### Requirement: A change does not read the decisions it wrote
A decision whose `linked_changes` names this change SHALL NOT be derived as a
candidate for it. A change authors such a decision rather than reading it.

Implements: BR-11

#### Scenario: A decision promoted by this change
- **WHEN** the verification pass promotes a decision from `design.md` and lists this change in its `linked_changes`
- **THEN** the decision is not a candidate for this change, however its `affects_features` reads

#### Scenario: A decision promoted by an earlier change
- **WHEN** a decision affecting a linked capability names some other change in `linked_changes`
- **THEN** it is a candidate as usual, because it is knowledge this change was planned against

### Requirement: A candidate is a candidate, and judgement is a source
A derived candidate SHALL NOT be treated as a verdict: a candidate judged
irrelevant SHALL keep a row stating that judgement rather than being omitted. A
file reached by judgement rather than by a signal SHALL be listed on the same
terms, recording judgement as the signal that produced it.

Implements: BR-4, BR-5

#### Scenario: A dismissed candidate
- **WHEN** a derived candidate is judged to have no bearing on the change
- **THEN** it keeps a Related Knowledge row recording the dismissal and its reason

#### Scenario: A file no signal produced
- **WHEN** the agent reads a decision filed against a capability outside the change's write set and finds it binding
- **THEN** it is listed with judgement recorded as the signal, on the same terms as a derived row

### Requirement: A related row names why it is related and what to read
Each Related Knowledge row SHALL name the signal that produced it, why the file
bears on this change, and the `BR-n` or section to read. A row naming only a path
SHALL be treated as incomplete.

Implements: BR-6

#### Scenario: A row points at a rule
- **WHEN** a related row cites the entry's `BR-2` as what to read
- **THEN** the row is complete, and a reader opens a rule rather than a file

#### Scenario: A bare path
- **WHEN** a related row carries a path and no reason or reading target
- **THEN** the row does not satisfy this requirement

### Requirement: An empty related set is stated, never silent
A change whose related set is empty SHALL say so with a stated reason. An absent
or empty Related Knowledge table SHALL NOT be read as an empty set.

Implements: BR-7

#### Scenario: A stated empty set
- **WHEN** the Related Knowledge table's only row states that the scan found nothing, with a reason
- **THEN** the table satisfies the requirement

#### Scenario: A silent table
- **WHEN** the Related Knowledge section exists with no rows and no stated reason
- **THEN** it is reported, because "the scan ran and found nothing" and "nothing was recorded" are different claims

### Requirement: The scan runs twice, at defined points
The related set SHALL be derived when `okf-link.md` is first written and again at
the proposal's reconcile step, and SHALL NOT be re-derived per artifact.

Implements: BR-8

#### Scenario: The write set moves at reconcile
- **WHEN** the proposal's Capabilities section settles on a capability the first scan did not consider
- **THEN** the second scan derives candidates for it and the Related Knowledge table is refreshed

#### Scenario: A later artifact does not rescan
- **WHEN** an artifact after the proposal is written
- **THEN** it reads the recorded related set rather than deriving it again

### Requirement: A rule edit is checked against the related entries
Where the verification pass changes a `BR-n`, it SHALL re-read the entries listed
as related and SHALL raise a `conflict` verdict where the edit changes domain
meaning for one of them.

Implements: BR-9

#### Scenario: An edit reaches a neighbour
- **WHEN** an `okf-gap` correction to a linked entry's rule contradicts a rule in a related entry
- **THEN** the verdict is `conflict` and goes to the user, rather than being applied as a local correction

#### Scenario: An edit that reaches nothing
- **WHEN** a rule edit is checked against the related entries and none of them is affected
- **THEN** the verdict stands as recorded and the related entries are left untouched
