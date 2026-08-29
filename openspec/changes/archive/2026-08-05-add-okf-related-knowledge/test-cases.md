# Test Cases

# Source References

| Source | Path | Notes |
| --- | --- | --- |
| OKF entries | see `okf-link.md` for the path of each capability | Primary durable knowledge source - business rules carry BR-n ids |
| Proposal | proposal.md | Scope, non-goals, risks, acceptance criteria |
| Specs | specs/**/*.md | Normative requirements and scenarios |

# Acceptance Criteria Mapping

| Acceptance Criterion | Rule (BR-n) | Test Case IDs | Notes |
| --- | --- | --- | --- |
| 1. No Related Knowledge section warns in flight, errors at archive | BR-13, BR-14 | UT-601, UT-602 | |
| 2. A stated empty set passes both runs | BR-7 | UT-605 | |
| 3. A row whose path does not resolve is an error naming the row | BR-13 | UT-606 | |
| 4. An unmentioned overlapping entry warns and never errors | BR-15 | UT-610, UT-612 | |
| 5. An unmentioned decision warns on the same terms | BR-15 | UT-611 | |
| 6. Being listed as related adds no pending change and demands no verification | BR-2 | UT-614 | |
| 7. A file in both tables is reported | BR-1, BR-2 | UT-608 | |
| 8. No `okf-link.md` reports only that, with no related finding on top | BR-13 | NEG-601 | The distinction okf-archive-gate BR-2 already draws, extended to the new finding |

# Business Rule Coverage

| Rule (BR-n) | Capability | Test Case IDs | Notes |
| --- | --- | --- | --- |
| BR-1 | okf-related-knowledge | UT-608, UT-609, UT-617 | The separate table, and the rule that nothing sits in both |
| BR-2 | okf-related-knowledge | UT-608, UT-614 | The obligation boundary, asserted from the gate's side |
| BR-3 | okf-related-knowledge | UT-610, UT-611, UT-616, UT-618 | Both signals, and that no entry declares its relations |
| BR-4 | okf-related-knowledge | UT-618 | A dismissal keeps its row - recorded in the shipped instruction, not derivable from a fixture |
| BR-5 | okf-related-knowledge | UT-613, UT-618 | Judgement is a source: a recorded set wider than the derivation is clean |
| BR-6 | okf-related-knowledge | UT-617, UT-619 | The row's shape lives in the template and instruction |
| BR-7 | okf-related-knowledge | UT-604, UT-605, NEG-602, UT-620 | Silent versus stated, at the zero/one boundary |
| BR-8 | okf-related-knowledge | UT-621 | The second scan is pinned to the reconcile step |
| BR-9 | okf-related-knowledge | UT-622 | The cross-entry conflict duty in the verification instruction |
| BR-10 | okf-related-knowledge | UT-609, UT-623 | Decisions become readable: accepted as rows, and named as a source to scan |
| BR-11 | okf-related-knowledge | UT-624 | Added during the verification pass: a change authors the decisions it promotes rather than reading them |
| BR-13 | okf-archive-gate | UT-601, UT-603, UT-606, UT-607, UT-615 | Structure read, relevance not judged |
| BR-14 | okf-archive-gate | UT-601, UT-602, UT-605 | The warning-to-error hardening |
| BR-15 | okf-archive-gate | UT-610, UT-611, UT-612, UT-613 | Reported, never refused over |
| BR-1..BR-12 | okf-archive-gate | - | Untouched by this change; their existing fixtures must keep passing, which IT-602 asserts |

# Spec Scenario Mapping

| Spec Requirement | Spec Scenario | Test Case IDs | Notes |
| --- | --- | --- | --- |
| A change records the knowledge it reads but does not write | The two tables carry different sets | UT-607 | |
| A change records the knowledge it reads but does not write | One file in both tables | UT-608 | |
| A change records the knowledge it reads but does not write | A decision is listed as related | UT-609 | |
| Being read creates no obligation | A related entry keeps its pending list | UT-614 | |
| Being read creates no obligation | A related entry is never attested | UT-614 | Same fixture: the gate demands neither evidence nor attestation |
| Relatedness is derived from what the bundle already records | A decision filed against a linked capability | UT-611 | |
| Relatedness is derived from what the bundle already records | Two entries sharing a code path | UT-610 | |
| Relatedness is derived from what the bundle already records | No relation field is introduced | UT-616 | |
| A change does not read the decisions it wrote | A decision promoted by this change | UT-624 | |
| A change does not read the decisions it wrote | A decision promoted by an earlier change | UT-624 | The precondition half of the same test |
| A candidate is a candidate, and judgement is a source | A dismissed candidate | UT-618 | |
| A candidate is a candidate, and judgement is a source | A file no signal produced | UT-613 | |
| A related row names why it is related and what to read | A row points at a rule | UT-617 | |
| A related row names why it is related and what to read | A bare path | UT-619 | |
| An empty related set is stated, never silent | A stated empty set | UT-605 | |
| An empty related set is stated, never silent | A silent table | UT-604 | |
| The scan runs twice, at defined points | The write set moves at reconcile | UT-621 | |
| The scan runs twice, at defined points | A later artifact does not rescan | UT-621 | Same assertion on the shipped instruction, from the other side |
| A rule edit is checked against the related entries | An edit reaches a neighbour | UT-622 | |
| A rule edit is checked against the related entries | An edit that reaches nothing | UT-622 | |
| The gate reads the recorded read set structurally | A row naming a file that does not exist | UT-606 | |
| The gate reads the recorded read set structurally | A row naming a real file | UT-607 | |
| The gate reads the recorded read set structurally | The gate does not judge relevance | UT-615 | |
| The read-set record hardens at the archive boundary | A change still in flight | UT-601 | |
| The read-set record hardens at the archive boundary | The same change at the archive boundary | UT-602 | |
| The read-set record hardens at the archive boundary | A stated empty set at the boundary | UT-605 | |
| A derived candidate is reported, never refused over | An unmentioned overlapping entry | UT-610 | |
| A derived candidate is reported, never refused over | An unmentioned decision | UT-611 | |
| A derived candidate is reported, never refused over | The warning does not harden | UT-612 | |
| A derived candidate is reported, never refused over | A recorded set wider than the derivation | UT-613 | |

# Unit Test Cases

| ID | Priority | Scenario | Given | When | Then | Source |
| --- | --- | --- | --- | --- | --- | --- |
| UT-601 | must | A missing section warns in flight | A change whose `okf-link.md` has an OKF Link table and no Related Knowledge section | `okf check` runs | a warning names the missing Related Knowledge table, and no error is reported for it | BR-13, BR-14 |
| UT-602 | must | The same condition errors at archive | The same change | `okf check --archive` runs for that change id | the same condition is reported as an error | BR-14 |
| UT-603 | must | A filled table is clean | A change whose Related Knowledge table has one resolving row | `okf check` runs | no finding is reported for the table | BR-13 |
| UT-604 | must | A silent table is reported | A change with a Related Knowledge heading and no rows | `okf check` runs | the table is reported, on the same terms as a missing one | BR-7, BR-13 |
| UT-605 | must | A stated empty set passes | A change whose only related row states a reason for the set being empty | `okf check` and `okf check --archive` run | neither reports a finding for the table | BR-7, BR-14 |
| UT-606 | must | A row that does not resolve | A related row naming a path with no file on disk | `okf check` runs | an error names the row and the path | BR-13 |
| UT-607 | must | A row that resolves | A related row naming an existing bundle file that the OKF Link table does not list | `okf check` runs | no finding, and the change's linked set is unchanged by the row | BR-13 |
| UT-608 | must | A file in both tables | A bundle file listed by an OKF Link row and by a related row | `okf check` runs | an error names the file, because an entry with an obligation is not also a read-only neighbour | BR-1, BR-2 |
| UT-609 | must | A decision as a related row | A related row naming a file under `.okf/decisions/` | `okf check` runs | the row is accepted and resolves | BR-1, BR-10 |
| UT-610 | must | An unmentioned overlapping entry | A feature entry sharing a `code_paths` value with a linked entry, named by no related row | `okf check` runs | a warning names that entry, and no error is reported | BR-3, BR-15 |
| UT-611 | must | An unmentioned decision | A decision whose `affects_features` names a linked capability, named by no related row | `okf check` runs | a warning names that decision, and no error is reported | BR-3, BR-15 |
| UT-612 | must | The candidate warning does not harden | The UT-610 fixture | `okf check --archive` runs | the finding is still a warning | BR-15 |
| UT-613 | must | A set wider than the derivation | A related table listing a bundle file that neither signal produces | `okf check` runs | no finding is reported for that row | BR-5, BR-15 |
| UT-614 | must | Reading creates no obligation | A change listing a verified entry as related, with that entry's `pending_changes` empty and no Rule Evidence row for it | `okf check --archive` runs | no evidence, no cleared pending list, and no attestation is demanded for that entry | BR-2 |
| UT-615 | must | Relevance is not judged | A related row naming a bundle file with no derivable connection to any linked capability | `okf check` runs | nothing is reported about that row's relevance | BR-13 |
| UT-616 | must | No relation field is read | A feature entry carrying an unrecognised `related` key in its frontmatter | `okf check` runs | the derivation ignores it, and candidates come only from `affects_features` and `code_paths` | BR-3 |
| UT-624 | must | A decision this change promoted | A decision whose `linked_changes` names this change and whose `affects_features` names a linked capability | `okf check` runs | it is not a candidate, and no warning names it | BR-11 |
| UT-617 | must | The template ships the section | The `okf-link.md` template as installed | it is read | it carries a Related Knowledge section whose columns name the signal, the reason, and what to read | BR-1, BR-6 |
| UT-618 | must | The instruction states the derivation | The `okf-link` artifact instruction in the schema | it is read | it names both signals, states that a dismissed candidate keeps its row, and states that judgement is a source of its own | BR-3, BR-4, BR-5 |
| UT-619 | must | The instruction rejects a bare path | The `okf-link` artifact instruction | it is read | it requires each row to name why the file is related and which rule or section to read | BR-6 |
| UT-620 | must | The instruction states the empty-set escape | The `okf-link` artifact instruction | it is read | it states the reason form for an empty set rather than allowing a blank table | BR-7 |
| UT-621 | must | The reconcile step re-runs the scan | The `proposal` artifact instruction | it is read | its reconcile step names the related scan, and the schema does not ask any later artifact to re-derive it | BR-8 |
| UT-622 | must | Verification checks a rule edit against neighbours | The `verification` artifact instruction | it is read | it requires re-reading the related entries when a `BR-n` changes, and names `conflict` as the verdict when the edit reaches one | BR-9 |
| UT-623 | must | Decisions are named as a source to read | The `okf-link` artifact instruction | it is read | it names `.okf/decisions/` as a place the scan reads, not only a place decisions are written | BR-10 |

# Integration Test Cases

| ID | Priority | Scenario | Given | When | Then | Source |
| --- | --- | --- | --- | --- | --- | --- |
| IT-601 | must | A complete change archives clean | A fixture change with both tables filled, every related row resolving, and every candidate mentioned | `okf check --archive` runs for that change id | the run reports no error and no candidate warning | BR-13, BR-14, BR-15 |
| IT-602 | must | The existing gates are unchanged | The fixtures covering okf-archive-gate BR-1..BR-12 | the full suite runs | every existing finding still fires on the same fixture, with the same level | BR-1..BR-12 (okf-archive-gate) |

# Negative And Boundary Cases

| Class | ID | Priority | Scenario | Expected Result | Source |
| --- | --- | --- | --- | --- | --- |
| Absence | NEG-601 | must | A change directory with no `okf-link.md` at all | Only the existing "no okf-link.md" error is reported; no related-knowledge finding is added on top of it | BR-13 |
| Numeric edge | NEG-602 | must | The zero/one boundary: a table with no rows, and the same table with exactly one stated-reason row | Zero rows is reported; one stated-reason row is clean. The boundary is where a table stops being silent | BR-7 |
| Duplication | NEG-603 | must | The same path listed twice in the Related Knowledge table | At most one finding for that path - a repeated row is noise, not a second defect | BR-13 |
| Staleness | NEG-604 | must | A linked entry's `code_paths` gains a value after `okf-link.md` was written, creating a candidate nothing mentions | The next run reports the new candidate as a warning; the derivation is computed per run and never read from a cached list | BR-3, BR-15 |
| Scope isolation | NEG-605 | must | A decision whose `affects_features` names a capability linked by a different active change, not by this one | It is not a candidate for this change - the derivation is scoped to this change's linked capabilities | BR-3 |

# Not Applicable

| Area | Reason | Approved By |
| --- | --- | --- |
| Browser E2E | The kit is a command-line validator with no UI surface of any kind, so the four render states have nothing to render | change author |
| API E2E | The kit exposes no network interface; `bin/okf.mjs` is its only entry point, covered by the unit fixtures | change author |
| Authorisation (negative class) | The kit has no actors, no identities, and no permissions - every finding is derived from files a reader already has open. There is no action an actor could attempt without the right to attempt it | change author |

# Open Questions

- Whether a related row that names a path outside `.okf/` - a spec under
  `openspec/specs/`, say - should resolve on the same terms. The specs restrict
  the table to bundle files, and the fixtures follow the specs; widening it later
  needs no change to what is recorded.
