# artifact-hygiene Specification

## Purpose

Keep template residue out of every artifact this workflow produces. Each one
starts as a template full of angle-bracketed placeholders, blank table rows, and
instructional comments, and a file that still holds a slot looks exactly like a
file that holds an answer to anyone reading it later. This capability defines
what counts as residue, which files the rule reaches, when a finding hardens from
a warning into a refusal to archive, and how a document quotes template text in
order to explain it rather than leaving it unfilled.

## Requirements
### Requirement: Hygiene applies to change artifacts
`okf check` SHALL scan the artifacts of every active change under
`openspec/changes/` for template residue, applying the same recognition it
applies to `.okf/` bundle files. Findings SHALL be warnings outside the archive
boundary and errors at it. Archived changes SHALL NOT be scanned.

Implements: BR-1, BR-5

#### Scenario: A placeholder in a change artifact before archive
- **WHEN** a change's `proposal.md` contains an unfilled angle-bracketed placeholder and `okf check` runs without `--archive`
- **THEN** the finding is reported as a warning and the run exits zero

#### Scenario: The same placeholder at the archive boundary
- **WHEN** `okf check --archive` runs for that change
- **THEN** the finding is reported as an error

#### Scenario: A blank table row in a change artifact
- **WHEN** a change artifact carries a table row whose every cell is empty
- **THEN** it is reported on the same escalation as a placeholder

#### Scenario: An archived change is left alone
- **WHEN** a directory under `openspec/changes/archive/` carries template residue
- **THEN** nothing is reported, because the change was archived under the rules of its time

### Requirement: Quoted template text is not residue
The hygiene scan SHALL skip text inside a fenced code block and text inside an
inline code span, in every file it scans. It SHALL NOT exempt any file by name or
path.

Implements: BR-2, BR-3, BR-4

#### Scenario: A placeholder named inside an inline code span
- **WHEN** a design document writes that a template carries a placeholder, naming it inside backticks
- **THEN** nothing is reported, because the document is asserting a fact about the template rather than leaving a slot

#### Scenario: A placeholder shown inside a fenced block
- **WHEN** a document shows an unfilled template inside a fenced code block
- **THEN** nothing is reported

#### Scenario: The same exemption applies to bundle files
- **WHEN** a `.okf/features/` entry names a placeholder inside an inline code span
- **THEN** nothing is reported, because the rule has one implementation rather than one per location

#### Scenario: No file is excused by name
- **WHEN** the implementation is read
- **THEN** it contains no list of file names or paths exempt from the scan

### Requirement: A shipped instruction comment is residue at archive
The hygiene scan SHALL report a template's own instruction comment left in a
finished artifact, as a warning outside the archive boundary and an error at it.

Implements: BR-6

#### Scenario: An instruction comment during the change
- **WHEN** an artifact still carries the comment its template shipped and `okf check` runs without `--archive`
- **THEN** the finding is a warning, because the comment is guidance the author may still be using

#### Scenario: An instruction comment at archive
- **WHEN** `okf check --archive` runs for that change
- **THEN** the finding is an error
