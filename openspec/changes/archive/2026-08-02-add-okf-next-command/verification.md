# Verification

# Summary

| Area | Status | Notes |
| --- | --- | --- |
| OpenSpec validation | pass | `openspec validate add-okf-next-command --strict` |
| Unit tests | pass | 254 passed, including UT-301..UT-311 and NEG-301..NEG-305 |
| Integration tests | pass | IT-301: `node bin/okf.mjs next add-okf-next-command` exits 0 and prints owed steps; IT-302: prior suite green after `readChangeState` extraction |
| API E2E tests | not applicable | The kit exposes no network interface |
| Browser E2E tests | not applicable | The kit has no UI |
| Static analysis | pass | See Static Analysis table |
| OKF verification | pass | BR-1..BR-6 evidenced below |
| OKF validation (`okf check`) | pass | Recorded after the archive check |
| Archive readiness | ready | Checklist below |

# OpenSpec Validation

Command:

    openspec validate add-okf-next-command --strict

Result:

    Change 'add-okf-next-command' is valid

## Synced Capability Specs

| Capability | Command | Result |
| --- | --- | --- |
| okf-next | `openspec validate okf-next --strict` | Specification 'okf-next' is valid |

# Unit Tests

Command:

    npm test

Result:

    254 passed

Pre-implementation: 12 of the new assertions failed on the contract stub (recorded in test-plan Initial Status). UT-306, UT-308, UT-311, and NEG-305 were green from the stub/CLI already and record why.

# Integration Tests

Command:

    node bin/okf.mjs next add-okf-next-command

Result:

    verification.md is missing - the OKF verification pass has not been recorded
      → okf check --archive add-okf-next-command
    verification pass still owed - pending_changes still lists this change on okf-next
      → okf check --archive add-okf-next-command
    exit:0

IT-302: full prior suite remained green after extracting `readChangeState` from `checkChange`.

# API E2E Tests

Not Applicable because the kit exposes no network interface.

# Browser E2E Tests

Not Applicable because the kit has no UI.

# Static Analysis

| Check | Command | Result |
| --- | --- | --- |
| Lint | `npm run lint` | clean: `node --check: all files parse` |
| Typecheck | - | Not Applicable because this kit is plain ESM with JSDoc and has adopted no type checker - see the declaration in AGENTS.md |

# OKF Validation

Command:

    okf check --archive add-okf-next-command

Result:

    okf check: clean (.)
    "add-okf-next-command" is ready to archive as far as OKF is concerned.

# Test Traceability Review

| Requirement Or Scenario | Covered By | Gap |
| --- | --- | --- |
| Pending entry owes verification | UT-301 | none |
| Missing verification.md | UT-302 | none |
| Empty Rule Evidence | UT-303 | none |
| Nothing owed names the gate | UT-304 | none |
| No okf-link names openspec status | UT-305, UT-306 | none |
| Every step carries a command | UT-307 | none |
| Read-only / no spawn | UT-308 | none |
| Exit zero when owed | UT-309 | none |
| No-domain still owes | UT-310 | none |
| Advisor and gate agree | UT-311 | none |
| Checkbox is not derivation | NEG-301 | none |
| Unknown / archived / no-arg | NEG-302, NEG-303, NEG-305 | none |
| Unresolvable okf-link rows | NEG-304 | none |
| Real command against this repo | IT-301 | none |

# OKF Verification

## Rule Evidence

| Rule (BR-n) | Capability | Evidence (file:line or test name) | Verdict | Action Taken |
| --- | --- | --- | --- | --- |
| BR-1 | okf-next | lib/next.mjs:21-103 (returns data only); bin/okf.mjs:249-259 (prints only); UT-308 | match | none |
| BR-2 | okf-next | lib/next.mjs:45-56 (`openspec status`, no artifact list); UT-305, UT-306 | match | none |
| BR-3 | okf-next | lib/next.mjs:42 (`readChangeState`); :75-93 (verification / evidence / pending_changes); NEG-301 | match | none |
| BR-4 | okf-next | lib/next.mjs:52,71,78,83,91 (every owed step has `command`); UT-307 | match | none |
| BR-5 | okf-next | bin/okf.mjs:259 (`return 0` after reporting owed steps); UT-309 | match | none |
| BR-6 | okf-next | lib/next.mjs:95-100 (`statement` naming the archive gate); UT-304 | match | none |

## Section Review

| Section | Capability | Checked Against | Result |
| --- | --- | --- | --- |
| Domain Terms | okf-next | lib/next.mjs return shape (`owed`, `statement`) | match |
| Data Entities | okf-next | `readChangeState` fields used by `next` | match - dropped Decision Promotion / index mtime from the entity list because this change does not derive steps from them |
| Permissions And Access Control | okf-next | n/a - no permissions section | n/a |
| Workflows | okf-next | Primary workflow vs lib/next.mjs branches | match |

## Entry Outcome

| Capability | OKF File | Resulting Verified | verified_at | code_paths Filled | This Change Removed From pending_changes |
| --- | --- | --- | --- | --- | --- |
| okf-next | `.okf/features/okf-next.md` | verified | 2026-08-02 | yes | yes |

## Decision Promotion

| Decision | Promoted To | Reason If Not Promoted |
| --- | --- | --- |
| The shared reads are extracted, not copied | `.okf/decisions/2026-08-02-shared-change-state-reads-are-extracted.md` | - |
| Advice and refusal stay in different commands | `.okf/decisions/2026-08-02-advice-and-refusal-stay-in-different-commands.md` | - |
| The artifact half is dropped rather than delegated | `.okf/decisions/2026-08-02-the-artifact-half-is-named-never-re-derived.md` | - |
| Every step carries its command | `.okf/decisions/2026-08-02-every-owed-step-carries-its-discharging-command.md` | - |

# Known Gaps And Accepted Risks

| Gap Or Risk | Impact | Owner | Follow-Up |
| --- | --- | --- | --- |
| Whether `okf check` should print the same "nothing owed" line | Deferred on the entry - would change an output contract CI parses | change author | separate change if revisited |

# Archive Readiness

- [x] OpenSpec validation passed for the change
- [x] `openspec validate okf-next --strict` passed for every spec synced into `openspec/specs/`
- [x] Tasks complete, or remaining items explicitly deferred
- [x] Unit test result recorded
- [x] Integration test result recorded
- [x] E2E result recorded, or marked not applicable with a specific reason
- [x] Static Analysis table filled: a real result per required row, or a stated reason (enforced - see Static Analysis above)
- [x] Every `skeleton` / `planned` test row appears in the test-plan Known Gaps with an owner
- [x] Rule Evidence table filled with real `file:line` or test references for every BR-n touched
- [x] Every linked entry: `verified` set, `verified_at` set, `code_paths` filled, this change id removed from `pending_changes`
- [x] `needs-revision` entries (if any) recorded in the `.okf/index.md` Needs Revision Ledger
- [x] Durable decisions promoted to `.okf/decisions/`, or explicitly skipped with a reason (enforced - see Decision Promotion above)
- [x] `okf check --archive <change-id>` exits clean
- [x] Proof boundaries are honest and explicit
