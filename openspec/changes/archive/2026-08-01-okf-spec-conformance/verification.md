# Verification

# Summary

| Area | Status | Notes |
| --- | --- | --- |
| OpenSpec validation | passed | Change valid; all three assembled baselines valid - see Synced Capability Specs |
| Unit tests | passed | 133 fixture tests, up from 88 |
| Integration tests | passed | 6 new CLI-level cases, counted inside the 133 |
| API E2E tests | not applicable | The kit has no HTTP surface - every command is a local CLI over the filesystem and git |
| Browser E2E tests | not applicable | The kit has no UI |
| OKF verification | passed | 3 linked entries verified with `file:line` evidence; 6 decisions promoted |
| OKF validation (`okf check`) | passed | 0 errors, 3 warnings, all expected - see Known Gaps |
| Archive readiness | ready | With the proof boundaries below stated honestly |

# OpenSpec Validation

Command:

    npx openspec validate okf-spec-conformance --strict

Result:

    Change 'okf-spec-conformance' is valid

## Synced Capability Specs

`okf-bundle-format` and `okf-migrate` are new capabilities, so no baseline exists
under `openspec/specs/` until the change is archived. Validating them in place
returns `Unknown item`, which proves nothing about the file archive will produce.

The assembly was therefore rehearsed on a throwaway copy of the repository
(`tar` copy, `openspec archive`, then validate), so the trap this step exists to
catch - a valid delta that assembles into a baseline missing `## Purpose` or
`## Requirements` - was actually tested rather than assumed. The real repository
was not archived.

| Capability | Command | Result |
| --- | --- | --- |
| okf-audit | `openspec validate okf-audit --strict` | valid, in place (baseline already existed) |
| okf-bundle-format | `openspec validate okf-bundle-format --strict` | valid, on the rehearsed archive copy |
| okf-migrate | `openspec validate okf-migrate --strict` | valid, on the rehearsed archive copy |

Archive output on the copy: `Totals: + 15, ~ 1, - 0, → 0`.

# Unit Tests

Command:

    node test/run.mjs

Result:

    133 passed

Baseline before this change was 88. The 45 new cases cover every business rule in
the two new capabilities plus the audit's BR-10; the three rules that no static
check can observe are listed in test-cases.md under Not Applicable with reasons.

All 36 rule-driven cases were confirmed `failing` on their own assertion before
any implementation existed, and each actual failure message is recorded in
test-plan.md under Initial Status. Three cases are marked `passing (guard)` there:
they assert the absence of an over-reaching rule, so they could not be made red
honestly.

# Integration Tests

Command:

    node test/run.mjs

Result: included in the 133 above. Six CLI-level cases:

- `upgrade writes nothing under features or decisions` - hashes every entry before
  and after `install(..., { mode: 'upgrade', force: true })`
- `migrate then check exits clean` - asserts exit 0 with the attestation warning present
- `migrate reports every file it touched`
- `templates named .md.tmpl are not concept documents`
- `the profile document names the kit's divergences`
- `the bundle index is committed at a lowercase path` - real git repository via `gitRepo()`

# API E2E Tests

Not applicable: the kit exposes no HTTP surface. Every command is a local CLI
reading the filesystem and shelling out to git.

# Browser E2E Tests

Not applicable: the kit has no UI.

# OKF Validation

Command:

    node bin/okf.mjs check --archive okf-spec-conformance

Result: **0 errors, 3 warnings**, and the gate reports the change ready.

All three warnings are true statements left standing on purpose:

1. `okf-archive-gate` carries no attestation - a migrated entry not linked to this
   change, which regains one at its next verification pass.
2. BR-12 evidence is not a `file:line`.
3. BR-13 evidence is not a `file:line`.

The last two are the gate working. Those rules genuinely have no mechanical
evidence, and citing a loosely related test to turn the warning green would be
exactly the "explain it away" move this kit exists to prevent. Both are owned in
Known Gaps below.

# Test Traceability Review

| Requirement Or Scenario | Covered By | Gap |
| --- | --- | --- |
| Every requirement in `specs/okf-bundle-format/spec.md` (10) | UT-001..UT-023, NEG-001..NEG-005, NEG-007, IT-004, IT-005 | Attestations describe the current content / A second change verifies the same entry - procedural, see Not Applicable |
| Every requirement in `specs/okf-migrate/spec.md` (5) | UT-027..UT-032, NEG-006, IT-001..IT-003 | none |
| The modified requirement in `specs/okf-audit/spec.md` | UT-024, UT-025, UT-026 | none |
| Acceptance criteria 1-16 in proposal.md | See the Acceptance Criteria Mapping in test-cases.md | criterion 5 is procedural, mapped to the Not Applicable table |

# OKF Verification

## Rule Evidence

| Rule (BR-n) | Capability | Evidence (file:line or test name) | Verdict | Action Taken |
| --- | --- | --- | --- | --- |
| BR-1 | okf-bundle-format | `lib/check.mjs:16` vocabulary, `:270` required key, `:310` scalar rejected | match | - |
| BR-2 | okf-bundle-format | No code evidence exists. Carried by `openspec/schemas/okf-gated-feature/schema.yaml` verification step 5 and the addendum | match | Recorded in test-cases.md Not Applicable: no artifact distinguishes a replaced list from an appended one after the fact |
| BR-3 | okf-bundle-format | `lib/check.mjs:327` empty-attestation coupling, `:343` verified_at vs newest `at` | match | - |
| BR-4 | okf-bundle-format | `lib/check.mjs:363` distrust state carrying a `verified` key | match | - |
| BR-5 | okf-bundle-format | `lib/check.mjs:354`, emitted through `report.warn` | match | - |
| BR-6 | okf-bundle-format | `.okf/profile.md`, "What this kit does not claim"; asserted by the `profile document names the kit's divergences` test | match | - |
| BR-7 | okf-bundle-format | `lib/check.mjs:458` `checkBundleFiles`, reserved set at `:27` | match | - |
| BR-8 | okf-bundle-format | `lib/index-gen.mjs:8,11` emits `okf_version`; `lib/check.mjs:498` rejects its absence | match | - |
| BR-9 | okf-bundle-format | `lib/check.mjs:25` ACTOR, `:233` attestation actors, `:378` `generated.by` | match | - |
| BR-10 | okf-bundle-format | `lib/check.mjs:17` STATUS, `:428` decision `status`, `:435` `decision_status` | match | - |
| BR-11 | okf-bundle-format | `.okf/profile.md` "Keys this kit adds" and "Rules this kit narrows"; `lib/install.mjs:26` makes it kit-owned | match | - |
| BR-12 | okf-bundle-format | Unenforceable by construction - see design D3 and `.okf/decisions/2026-08-01-human-review-is-reported-never-proven.md` | match | Stated in `.okf/profile.md`; the agent-side rule lives in the schema and addendum |
| BR-13 | okf-bundle-format | Same class as BR-12: no static check over a finished file can observe which workflow step wrote a field | match | Carried by the schema instruction and the addendum |
| BR-1 | okf-migrate | `lib/migrate.mjs:28-45` - `migrateFeature` renames the key and never emits `verified:` | match | - |
| BR-2 | okf-migrate | `lib/install.mjs:26-28` payload excludes both directories; `upgrade writes nothing under features or decisions` hashes them before and after | match | - |
| BR-3 | okf-migrate | `lib/check.mjs:327` reports it at `COUPLING_SEVERITY`; `migrate then check exits clean` asserts exit 0 | match | - |
| BR-4 | okf-migrate | `lib/check.mjs:40` `COUPLING_SEVERITY = 'warn'` with the promotion rule in its comment | match | - |
| BR-5 | okf-migrate | `lib/migrate.mjs:111` `alreadyCurrent`; run twice against this repository: 7 rewritten, then 13 examined / 0 rewritten | match | - |
| BR-6 | okf-migrate | `lib/migrate.mjs:118` rebuilds only the frontmatter region and re-joins the original body | match | - |
| BR-4 | okf-audit | `lib/audit.mjs:142` now reads `verification_state` | match | Rule text updated during propose; re-checked here against the code |
| BR-6 | okf-audit | `lib/audit.mjs:142-143`; the audit still writes nothing under `.okf/` | match | - |
| BR-10 | okf-audit | `lib/audit.mjs:142-143` - the selection never reads `verified[]`, so a migrated entry is still audited (`a verified entry with no attestation is still audited`) | match | - |

Rules BR-1, BR-2, BR-3, BR-5, BR-7, BR-8, BR-9 of `okf-audit` were not touched by
this change and were not re-traced. Their evidence stands from the
`fix-audit-untracked-paths` pass.

## Section Review

| Section | Capability | Checked Against | Result |
| --- | --- | --- | --- |
| Domain Terms | okf-bundle-format | OKF v0.2 SPEC.md and the implemented checks | accurate; "Reserved filename" matches `RESERVED_BUNDLE_FILES` at `lib/check.mjs:27` |
| Domain Terms | okf-migrate | `lib/migrate.mjs` and `lib/install.mjs` | accurate; "Grace period" matches `COUPLING_SEVERITY` |
| Data Entities | okf-bundle-format | The frontmatter actually written by the verification pass in this repository | accurate; Feature entry field list matches all three migrated entries |
| Data Entities | okf-migrate | The `migrate()` return shape at `lib/migrate.mjs:77` | accurate: examined, rewritten, alreadyCurrent, unparseable |
| Permissions And Access Control | okf-bundle-format | design D3 | accurate, and explicitly unenforceable - BR-12 and BR-13 say so in the rule text |
| Workflows | okf-bundle-format | The propose / verify path exercised by this change itself | accurate; step 5 matches what `okf check` enforces |
| Workflows | okf-migrate | The actual run against this repository's 7 files | accurate |
| Workflows | okf-audit | `lib/audit.mjs:130-155` | corrected during propose to name `verification_state`; re-read here and correct |

## Entry Outcome

| Capability | OKF File | Resulting Verified | verified_at | code_paths Filled | This Change Removed From pending_changes |
| --- | --- | --- | --- | --- | --- |
| okf-bundle-format | `.okf/features/okf-bundle-format.md` | verified | 2026-08-01 | yes - lib/check.mjs, lib/index-gen.mjs, lib/frontmatter.mjs, .okf/profile.md | yes |
| okf-migrate | `.okf/features/okf-migrate.md` | verified | 2026-08-01 | yes - lib/migrate.mjs, bin/okf.mjs, lib/install.mjs | yes |
| okf-audit | `.okf/features/okf-audit.md` | verified | 2026-08-01 | yes - lib/audit.mjs, bin/okf.mjs | yes |

## Decision Promotion

| Decision | Promoted To | Reason If Not Promoted |
| --- | --- | --- |
| D1. Workflow state moves to `verification_state`, freeing the specification's key | `.okf/decisions/2026-08-01-workflow-state-leaves-the-specification-key.md` | - |
| D2. `verified[]` describes the current content; the history table stays | `.okf/decisions/2026-08-01-attestations-describe-current-content.md` | - |
| D3. Missing human review is reported; a present one is never vouched for | `.okf/decisions/2026-08-01-human-review-is-reported-never-proven.md` | - |
| D4. Migration is its own command; upgrade keeps its payload boundary | `.okf/decisions/2026-08-01-migration-is-its-own-command.md` | - |
| D5. `stale_after` is not adopted | `.okf/decisions/2026-08-01-stale-after-is-not-adopted.md` | - |
| D6. The coupling invariant is a warning at this release and an error at the next | `.okf/decisions/2026-08-01-a-new-invariant-starts-as-a-warning.md` | - |
| D7. Templates are renamed, not moved | - | Change-local: a file-naming choice with no domain consequence. The durable rule is BR-7 of okf-bundle-format, which says every non-reserved bundle `.md` needs a `type`; whether a template satisfies that by carrying one or by leaving the bundle is an implementation detail a later change may revisit freely. |
| D8. `INDEX.md` becomes `index.md` in two git steps | - | Change-local: a one-time workaround for a case-insensitive filesystem during this rename. The durable rule is BR-8, that the bundle root index is `index.md` and carries `okf_version`. Nothing after this change performs the rename again. |

# Known Gaps And Accepted Risks

| Gap Or Risk | Impact | Owner | Follow-Up |
| --- | --- | --- | --- |
| `okf-archive-gate` carries no `verified[]` attestation | `okf check` warns; the entry reads as unverified to an external consumer despite being verified by the workflow | Developer | Exactly the grace-period state D6 designs for. It regains an attestation the next time a change touches that capability. Not linked to this change, so verifying it here would be a claim nobody made. |
| BR-2, BR-12, BR-13 of okf-bundle-format have no code evidence | Three rules are enforced only by instructions to agents, and `okf check --archive` warns about two of them every run | Developer | Recorded in test-cases.md Not Applicable with reasons. BR-12 is unenforceable by design (D3); BR-2 and BR-13 describe which workflow step writes a field, which no check over a finished file can observe. The warnings are left standing rather than silenced with an unrelated citation. |
| The coupling invariant is a warning, not an error | A project could sit indefinitely with verified entries and no attestations | Developer | Promote `COUPLING_SEVERITY` to `'error'` in the release after this one, per D6. One constant at `lib/check.mjs:40`. |
| `generated.by` on the four existing entries was corrected by hand | Migration did not do it | Developer | Deliberate: migration cannot know a historical producer, and guessing one would be the same fabrication BR-1 of okf-migrate forbids. Four lines, in this change's diff. |
| The new baselines were validated on a rehearsed copy, not in place | The real `openspec/specs/` still lacks both new capabilities until archive | Developer | Archive performs the real sync. If it diverges from the rehearsal, `openspec validate` at that point will say so. |

# Archive Readiness

- [x] OpenSpec validation passed for the change
- [x] `openspec validate <capability> --strict` passed for every spec synced into `openspec/specs/` - okf-audit in place, the two new ones on a rehearsed archive copy, with the boundary stated above
- [x] Tasks complete, or remaining items explicitly deferred
- [x] Unit test result recorded
- [x] Integration test result recorded
- [x] E2E result recorded, or marked not applicable with a specific reason
- [x] Every `skeleton` / `planned` test row appears in the test-plan Known Gaps with an owner - none exist; every row reached `failing` then `passing`
- [x] Rule Evidence table filled with real `file:line` or test references for every BR-n touched
- [x] Every linked entry: `verified` set, `verified_at` set, `code_paths` filled, this change id removed from `pending_changes`
- [x] `needs-revision` entries (if any) recorded in the Needs Revision Ledger - none
- [x] Durable decisions promoted to `.okf/decisions/`, or explicitly skipped with a reason
- [x] `okf check --archive <change-id>` exits clean
- [x] Proof boundaries are honest and explicit
