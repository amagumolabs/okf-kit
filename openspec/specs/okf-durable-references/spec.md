# okf-durable-references Specification

## Purpose

Keep every reference pointing out of the `.okf` bundle resolvable for the life of
the repository. A change directory is renamed when it is archived, so a reference
that names one by location breaks at exactly the moment the knowledge it supports
becomes historical. This capability defines which reference forms are durable,
how a real reference is told apart from prose that merely names a path, and what
the kit refuses to claim about a reference it cannot resolve.

## Requirements
### Requirement: A change is cited by identity, never by location

A bundle file SHALL reference an OpenSpec change by its id in the form
`change:<id>`. `okf check` SHALL report an error for any reference that names a
concrete change directory under `openspec/changes/`, and the error SHALL name
the `change:<id>` form as the correction.

Implements: BR-1

#### Scenario: A locator in provenance frontmatter

- **WHEN** a bundle entry's `sources[].resource` is a path naming a concrete change directory
- **THEN** `okf check` reports an error for that file
- **AND** the message names `change:<change-id>` as the form to use instead

#### Scenario: A durable citation passes

- **WHEN** a bundle entry's `sources[].resource` is `change:some-change-id`
- **THEN** `okf check` reports nothing for that reference

#### Scenario: The correction is stated, not just the violation

- **WHEN** any locator is reported
- **THEN** the message states both why the path breaks and the durable form that replaces it

### Requirement: The prohibition covers body text, not only frontmatter

`okf check` SHALL scan the body of every `.md` file under `.okf/` for locators,
in addition to the `sources` frontmatter it already validates. A locator in prose
SHALL be reported with the same severity as one in frontmatter.

Implements: BR-2

#### Scenario: A locator in a sentence

- **WHEN** a bundle entry's body contains a sentence naming a concrete change directory
- **THEN** `okf check` reports an error for that file

#### Scenario: A locator in a table cell

- **WHEN** a locator appears inside a markdown table row rather than a paragraph
- **THEN** `okf check` reports an error for that file

#### Scenario: Frontmatter behaviour is unchanged

- **WHEN** the body scan is added
- **THEN** an existing bundle whose only locators were in `sources` produces the same report as before

### Requirement: Reserved files are scanned for locators

`okf check` SHALL scan `index.md` and `log.md` for locators. Their exemption from
the concept-document rule concerns required `type` frontmatter and SHALL NOT be
read as an exemption from reference durability.

Implements: BR-2

#### Scenario: A locator reaches a generated file

- **WHEN** `log.md` contains a locator carried in from a Verification History note
- **THEN** `okf check` reports an error for `log.md`

#### Scenario: The type exemption still holds

- **WHEN** `index.md` carries no `type` in its frontmatter
- **THEN** `okf check` reports no concept-document error for it

### Requirement: A locator is told apart from mechanism prose by shape

`okf check` SHALL classify an `openspec/changes/` occurrence by the shape of the
path alone. A path naming a concrete change directory SHALL be an error. The bare
`openspec/changes/` form, the `openspec/changes/archive/` form, and a path whose
change segment is a placeholder in angle brackets SHALL NOT be reported.

Implements: BR-3

#### Scenario: The bare form is prose

- **WHEN** a bundle file says a reference must never be a path under `openspec/changes/`
- **THEN** `okf check` reports nothing for that sentence

#### Scenario: The bare archive form is prose

- **WHEN** a bundle file says archiving moves a change under `openspec/changes/archive/`, naming no particular one
- **THEN** `okf check` reports nothing for that sentence

#### Scenario: A placeholder segment is prose

- **WHEN** a bundle file writes the path shape with its change segment in angle brackets
- **THEN** `okf check` reports nothing for that sentence

#### Scenario: A concrete segment is a locator

- **WHEN** the segment after `openspec/changes/` is a literal change id rather than `archive` or a placeholder
- **THEN** `okf check` reports an error

### Requirement: A path into an archived change is a locator too

`okf check` SHALL report a path naming a concrete directory under
`openspec/changes/archive/`, even though such a path resolves at the time it is
written. The durable citation SHALL be derived from the change id already present
in the archived directory's name.

Implements: BR-7

#### Scenario: A path into an archived change directory

- **WHEN** a bundle file references a concrete directory under `openspec/changes/archive/`
- **THEN** `okf check` reports an error
- **AND** the message names the `change:<change-id>` form, using the id carried in the directory name

#### Scenario: Resolving today is not sufficient

- **WHEN** the referenced archived directory exists on disk
- **THEN** `okf check` still reports it, because the rule is about citing by identity rather than about whether a path currently resolves

### Requirement: Fenced code blocks are excluded from the scan

`okf check` SHALL exclude fenced code blocks when scanning a bundle file's body,
so that documentation can demonstrate the prohibited form. This exclusion SHALL
match the fence handling the bundle's existing hygiene checks already apply.

Implements: BR-4

#### Scenario: A demonstrated violation

- **WHEN** a locator appears inside a fenced code block that teaches the rule
- **THEN** `okf check` reports nothing for it

#### Scenario: Fencing does not launder frontmatter

- **WHEN** a `sources[].resource` value is a locator
- **THEN** it is reported regardless of any fenced content elsewhere in the file

#### Scenario: Prose after a fence is still scanned

- **WHEN** a fenced block is followed by a sentence containing a locator
- **THEN** `okf check` reports an error for that sentence

### Requirement: No file is excused by name

The implementation SHALL NOT carry a list of files exempted from this rule. A
false positive SHALL be resolved by correcting the shape classifier or by
fencing the example, never by naming the file in the checker.

Implements: BR-5

#### Scenario: This repository's own bundle passes on merit

- **WHEN** `okf check` runs on a bundle whose files describe the archive mechanism in prose
- **THEN** it exits clean because each occurrence matches a permitted shape, not because any file was skipped

#### Scenario: A new file gets the same protection

- **WHEN** a bundle file is added after the rule ships
- **THEN** it is scanned under identical terms as every existing file

### Requirement: Reference correctness beyond shape is not claimed

`okf check` SHALL verify only that a change citation is well-formed. It SHALL NOT
report a `change:<id>` reference as valid or invalid based on whether that change
exists, and its output SHALL NOT imply that a passing reference resolves.

Implements: BR-6

#### Scenario: A misspelled change id

- **WHEN** a bundle entry cites `change:` followed by an id that matches no active or archived change
- **THEN** `okf check` reports nothing, because shape is the only property it establishes

#### Scenario: No overstated success message

- **WHEN** `okf check` completes with no reference errors
- **THEN** it makes no claim that the bundle's references resolve

