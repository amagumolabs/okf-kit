# Test Cases

# Source References

| Source | Path | Notes |
| --- | --- | --- |
| OKF entries | see `okf-link.md` for the path of each capability | Primary durable knowledge source - business rules carry BR-n ids |
| Proposal | proposal.md | Scope, non-goals, risks, acceptance criteria |
| Specs | specs/**/*.md | Normative requirements and scenarios |
| Specification | OKF v0.2, `GoogleCloudPlatform/knowledge-catalog/okf/SPEC.md` | The conformance rules and trust tier derivation being targeted |

# Acceptance Criteria Mapping

| Acceptance Criterion | Rule (BR-n) | Test Case IDs | Notes |
| --- | --- | --- | --- |
| 1. No `.okf` file carries a scalar `verified` | bundle-format BR-1 | UT-003, IT-002 | |
| 2. Error on `verified` state with empty or disagreeing attestation | bundle-format BR-3 | UT-005, NEG-001, NEG-004 | The empty case is a warning at this release, see criterion 13 |
| 3. Error on distrust state carrying a `verified` key | bundle-format BR-4 | UT-006, UT-007 | |
| 4. Warning, not error, on high criticality without a human actor | bundle-format BR-5 | UT-008, UT-009, UT-010 | |
| 5. A pass replaces `verified[]` rather than appending | bundle-format BR-2 | - | Not Applicable, see that table |
| 6. Moving to needs-revision removes the `verified` key | bundle-format BR-4 | UT-006 | |
| 7. Every non-reserved bundle `.md` has a non-empty `type` | bundle-format BR-7 | UT-011, UT-012, IT-004 | |
| 8. `.okf/index.md` carries `okf_version` | bundle-format BR-8 | UT-020, NEG-005 | |
| 9. Migration writes no attestation | migrate BR-1 | UT-027, UT-028 | |
| 10. Migration run twice is a no-op | migrate BR-5 | UT-029, UT-030 | |
| 11. Migration leaves body and unrelated keys byte-identical | migrate BR-6 | UT-031, UT-032 | |
| 12. `okf upgrade` writes nothing under features or decisions | migrate BR-2 | IT-001 | |
| 13. The coupling invariant is a warning at this version | migrate BR-4 | UT-004 | |
| 14. A verified entry with no attestation is still audited | audit BR-10 | UT-024 | |
| 15. Decision entries separate `status` from `decision_status` | bundle-format BR-10 | UT-017, UT-018 | |
| 16. `.okf/log.md` is generated, newest date first | bundle-format BR-7 | UT-021, UT-022 | |

# Business Rule Coverage

| Rule (BR-n) | Capability | Test Case IDs | Notes |
| --- | --- | --- | --- |
| BR-1 | okf-bundle-format | UT-001, UT-002, UT-003 | |
| BR-2 | okf-bundle-format | - | Not Applicable - procedural, see that table |
| BR-3 | okf-bundle-format | UT-004, UT-005, NEG-001, NEG-004 | |
| BR-4 | okf-bundle-format | UT-006, UT-007 | |
| BR-5 | okf-bundle-format | UT-008, UT-009, UT-010 | |
| BR-6 | okf-bundle-format | IT-005 | The claim the kit refuses to make is asserted through the profile document's text |
| BR-7 | okf-bundle-format | UT-011, UT-012, UT-021, UT-022, IT-004 | |
| BR-8 | okf-bundle-format | UT-019, UT-020, NEG-005 | |
| BR-9 | okf-bundle-format | UT-013, UT-014, UT-015, NEG-002, NEG-003 | |
| BR-10 | okf-bundle-format | UT-016, UT-017, UT-018 | |
| BR-11 | okf-bundle-format | IT-005 | |
| BR-12 | okf-bundle-format | - | Not Applicable - procedural, see that table |
| BR-13 | okf-bundle-format | - | Not Applicable - procedural, see that table |
| BR-1 | okf-migrate | UT-027, UT-028 | |
| BR-2 | okf-migrate | IT-001, IT-003 | |
| BR-3 | okf-migrate | UT-004, IT-002 | |
| BR-4 | okf-migrate | UT-004 | |
| BR-5 | okf-migrate | UT-029, UT-030, NEG-006 | |
| BR-6 | okf-migrate | UT-031, UT-032 | |
| BR-4 | okf-audit | UT-024, UT-025 | Touched by this change: the field it names is renamed |
| BR-6 | okf-audit | UT-026 | Touched by this change: the field it names is renamed |
| BR-10 | okf-audit | UT-024 | Added by this change |

# Spec Scenario Mapping

| Spec Requirement | Spec Scenario | Test Case IDs | Notes |
| --- | --- | --- | --- |
| Workflow state lives outside the specification's key | An entry carries the workflow state in its own key | UT-001 | |
| Workflow state lives outside the specification's key | An entry uses the specification's key for workflow state | UT-003 | |
| Workflow state lives outside the specification's key | An unknown workflow state | UT-002 | |
| Attestations describe the current content | A second change verifies the same entry | - | Not Applicable - procedural |
| Attestations describe the current content | A human reviews within the same pass | UT-015 | |
| State and attestation stay coupled | Verified with no attestation | UT-004 | Warning at this release |
| State and attestation stay coupled | Verification date disagrees with the newest attestation | UT-005, NEG-004 | |
| State and attestation stay coupled | Needs-revision still carrying an attestation | UT-006 | |
| State and attestation stay coupled | Moving to needs-revision | UT-006 | |
| Missing human review is reported without being enforced | A high-criticality entry with only machine attestation | UT-008 | |
| Missing human review is reported without being enforced | A high-criticality entry with a human attestation | UT-009 | |
| Missing human review is reported without being enforced | A normal-criticality entry with only machine attestation | UT-010 | |
| Every non-reserved bundle file is a concept document | A bundle file with no frontmatter | UT-011 | |
| Every non-reserved bundle file is a concept document | A reserved filename | UT-012 | |
| Every non-reserved bundle file is a concept document | Templates outside the bundle | IT-004 | Implemented as a rename to `.md.tmpl`, see design D7 |
| The bundle declares the specification version it targets | Regenerating the index | UT-020 | |
| The bundle declares the specification version it targets | The bundle root index is missing | UT-019 | |
| Actor identity follows the specification's convention | A bare model name | UT-013 | |
| Actor identity follows the specification's convention | A conventional agent actor | UT-014 | |
| Actor identity follows the specification's convention | A human actor | UT-015 | |
| Lifecycle status uses the specification vocabulary | A feature entry in the previous vocabulary | UT-016 | |
| Lifecycle status uses the specification vocabulary | A decision entry's lifecycle | UT-017 | |
| Divergence from the specification is documented | A reader checks what the kit changed | IT-005 | |
| The change history is published as a log | Regenerating the index | UT-021 | |
| The change history is published as a log | A bundle with no verification history yet | UT-022 | |
| Migration never fabricates an attestation | A previously verified entry | UT-027 | |
| Migration never fabricates an attestation | A previously unverified entry | UT-028 | |
| Migration never fabricates an attestation | The migrated entry is not a defect | IT-002 | |
| Migration is invoked explicitly and upgrade never writes knowledge | Upgrading a project with an older entry shape | IT-001 | |
| Migration is invoked explicitly and upgrade never writes knowledge | The developer migrates | IT-003 | |
| Migration is idempotent | Running migration twice | UT-029 | |
| Migration is idempotent | A partially migrated bundle | UT-030 | |
| Migration has a narrow blast radius | An entry with body content and extra keys | UT-031 | |
| Migration has a narrow blast radius | An entry whose frontmatter cannot be parsed | UT-032 | |
| A newly introduced coupling invariant starts as a warning | A migrated entry that has not been re-verified | UT-004 | |
| Only verified, active entries are audited | An unverified entry | UT-025 | |
| Only verified, active entries are audited | A deprecated but verified entry | UT-026 | |
| Only verified, active entries are audited | A verified entry carrying no attestation | UT-024 | |
| Only verified, active entries are audited | A deprecated entry under the new status vocabulary | UT-026 | |

# Unit Test Cases

| ID | Priority | Scenario | Given | When | Then | Source |
| --- | --- | --- | --- | --- | --- | --- |
| UT-001 | must | Valid workflow state accepted | An entry with `verification_state: verified` and a matching attestation | `check` runs | No finding for that field | BR-1 |
| UT-002 | must | Unknown workflow state rejected | An entry with `verification_state: reviewed` | `check` runs | Error listing `unverified \| verified \| needs-revision` | BR-1 |
| UT-003 | must | Scalar in the specification's key rejected | An entry with `verified: unverified` | `check` runs | Error naming `verification_state` as the field for workflow state | BR-1 |
| UT-004 | must | Verified without attestation warns at this release | An entry with `verification_state: verified` and no `verified` key | `check` runs | A warning is emitted and the exit status is unaffected | BR-3, migrate BR-4 |
| UT-005 | must | Verification date must match the newest attestation | `verified_at: 2026-07-30`, newest `at: 2026-08-01T00:00:00Z` | `check` runs | Error naming both dates | BR-3 |
| UT-006 | must | Needs-revision must drop the attestation | `verification_state: needs-revision` with a `verified` key present | `check` runs | Error stating a consumer would read the entry as confirmed | BR-4 |
| UT-007 | must | Unverified must drop the attestation | `verification_state: unverified` with a `verified` key present | `check` runs | Error | BR-4 |
| UT-008 | must | High criticality without a human actor warns | `criticality: high`, verified, all actors are agents | `check` runs | Warning emitted, exit status unaffected | BR-5 |
| UT-009 | must | High criticality with a human actor is silent | `criticality: high`, an actor prefixed `human:` | `check` runs | No finding | BR-5 |
| UT-010 | must | Normal criticality without a human actor is silent | `criticality: normal`, agent actors only | `check` runs | No finding | BR-5 |
| UT-011 | must | Bundle file without frontmatter rejected | `.okf/notes.md` with no frontmatter block | `check` runs | Error naming it as a concept document missing `type` | BR-7 |
| UT-012 | must | Reserved filenames exempt | `.okf/log.md` and `.okf/index.md` without concept frontmatter | `check` runs | No concept-document finding for either | BR-7 |
| UT-013 | must | Bare actor name rejected | `generated.by: claude-opus-5` | `check` runs | Error naming the actor convention | BR-9 |
| UT-014 | must | Producer-qualified actor accepted | `generated.by: anthropic/claude-opus-5` | `check` runs | No finding | BR-9 |
| UT-015 | must | Human actor accepted | An attestation with `by: human:danh` | `check` runs | No finding, and the entry counts as human-reviewed | BR-9 |
| UT-016 | must | Previous status vocabulary rejected | An entry with `status: active` | `check` runs | Error listing `draft \| stable \| deprecated` | BR-10 |
| UT-017 | must | Decision lifecycle in its own field | A decision with `status: stable` and `decision_status: superseded` | `check` runs | Both accepted | BR-10 |
| UT-018 | must | Unknown decision lifecycle rejected | A decision with `decision_status: retired` | `check` runs | Error listing `accepted \| superseded \| reversed` | BR-10 |
| UT-019 | must | Missing bundle root index reported | A bundle with no `.okf/index.md` | `check` runs | Error naming `okf index` as the fix | BR-8 |
| UT-020 | must | Index carries the targeted spec version | A bundle with entries | `index` runs | `.okf/index.md` has `okf_version` in its frontmatter | BR-8 |
| UT-021 | must | Log generated newest first | Entries with verification history on 2026-07-30 and 2026-08-01 | `index` runs | `.okf/log.md` lists 2026-08-01 before 2026-07-30 | BR-7 |
| UT-022 | should | Log with no history is still written | A bundle whose entries have no verification history | `index` runs | `.okf/log.md` exists with no dated groups | BR-7 |
| UT-023 | must | Index reflects the renamed field | Entries in the new shape | `index` runs | The Features table reads `verification_state` values, not `verified` | BR-1 |
| UT-024 | must | Verified without attestation is still audited | An entry `verification_state: verified`, `verified_at` set, `code_paths` set, no `verified[]` | `audit` runs | The entry is audited, not skipped | audit BR-10 |
| UT-025 | must | Distrust states are skipped | An entry `verification_state: needs-revision` | `audit` runs | Reported `skipped` | audit BR-4 |
| UT-026 | must | Deprecated entries stay skipped | A verified entry with `status: deprecated` under the new vocabulary | `audit` runs | Reported `skipped` | audit BR-5, BR-6 |
| UT-027 | must | Verified entry migrates without an attestation | `verified: verified`, `verified_at: 2026-07-30` | `migrate` runs | `verification_state: verified`, `verified_at` unchanged, no `verified` key | migrate BR-1 |
| UT-028 | must | Unverified entry migrates | `verified: unverified` | `migrate` runs | `verification_state: unverified`, no `verified` key | migrate BR-1 |
| UT-029 | must | Second run is a no-op | An already-migrated bundle | `migrate` runs again | No file written, report says every file is current | migrate BR-5 |
| UT-030 | must | Partial bundle migrates only what is old | One old-shape entry, one new-shape entry | `migrate` runs | Only the old-shape entry is rewritten | migrate BR-5 |
| UT-031 | must | Blast radius is frontmatter only | An entry with `criticality`, `code_paths`, and a Verification History table | `migrate` runs | Those keys and the whole body are byte-identical | migrate BR-6 |
| UT-032 | must | Unparseable entry left alone | An entry whose frontmatter is malformed | `migrate` runs | File untouched and reported | migrate BR-6 |

# Integration Test Cases

| ID | Priority | Scenario | Given | When | Then | Source |
| --- | --- | --- | --- | --- | --- | --- |
| IT-001 | must | Upgrade never writes knowledge | A fixture project on the old entry shape | `okf upgrade` runs | Every file under `.okf/features/` and `.okf/decisions/` is byte-identical | migrate BR-2 |
| IT-002 | must | Migrate then check is clean | The same fixture project | `okf migrate` then `okf check` | Exit status 0; entries lacking an attestation produce warnings, not errors | migrate BR-3 |
| IT-003 | must | Migration reports what it touched | A fixture project with three old-shape entries | `okf migrate` runs | The report names all three files | migrate BR-2 |
| IT-004 | must | Templates are not concept documents | A bundle whose templates are named `.md.tmpl` | `okf check` runs | No concept-document finding for any template | BR-7 |
| IT-005 | must | Profile document names every divergence | The installed kit | The profile document is read | It names each kit-defined key, each narrowed rule, the targeted spec version, and states that a `human:` attestation is not proven genuine | BR-6, BR-11 |
| IT-006 | must | The index rename lands lowercase | A repository on a case-insensitive filesystem | The rename is committed | `git ls-files` reports `.okf/index.md` and no `.okf/INDEX.md` | BR-8 |

# Negative And Boundary Cases

| ID | Priority | Scenario | Expected Result | Source |
| --- | --- | --- | --- | --- |
| NEG-001 | must | `verification_state: verified` with `verified: []` | Treated as no attestation: warning at this release, not an error | BR-3 |
| NEG-002 | must | An attestation missing `by` | Error - the specification makes `by` required whenever the family is present | BR-9 |
| NEG-003 | must | An attestation whose `at` is not a valid ISO 8601 datetime | Error naming the field | BR-9 |
| NEG-004 | must | Two attestations, `verified_at` equal to the older one | Error - the coupling compares against the newest `at` | BR-3 |
| NEG-005 | must | `.okf/index.md` present but with no `okf_version` | Error naming the missing key | BR-8 |
| NEG-006 | should | `okf migrate` on a bundle with no `.okf/features/` directory | Reports that there is nothing to migrate and exits 0 | migrate BR-5 |
| NEG-007 | should | A bare `verified` mapping rather than a list | Accepted and treated as a one-element list, per the specification's consumer rule | BR-3 |

# Not Applicable

| Area | Reason | Approved By |
| --- | --- | --- |
| BR-2 of okf-bundle-format (replace rather than append) | The rule governs what the verification pass writes, and the pass is an agent following the schema instruction. No artifact distinguishes a replaced list from an appended one after the fact: both end with a newest `at` that satisfies BR-3. Its checkable consequences are covered by UT-004, UT-005, and UT-006; the rule itself is carried by the schema instruction and the addendum. | Developer |
| BR-12 of okf-bundle-format (only the named person may write their own attestation) | Unenforceable by construction, and deliberately so - design D3 records why no in-repo signal separates a person's bytes from an agent's. The kit's position is asserted in the profile document, covered by IT-005. | Developer |
| BR-13 of okf-bundle-format (only the verification pass writes the state fields) | Governs which workflow step writes a field, which no static check over a finished file can observe. Carried by the schema instruction and the addendum. | Developer |
| API E2E | The kit has no HTTP surface; every command is a local CLI over the filesystem and git. | Developer |
| Browser E2E | The kit has no UI. | Developer |

# Open Questions

- `okf migrate --dry-run` is unresolved in design D-open. If it ships, it needs a
  case asserting it writes nothing; the row is deliberately not written until the
  command surface is settled.
