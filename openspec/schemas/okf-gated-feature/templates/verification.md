# Verification

<!--
Fill this before archive. Record actual evidence, not intended commands. If a
check was not run, say so and explain the risk.
-->

# Summary

| Area | Status | Notes |
| --- | --- | --- |
| OpenSpec validation | not run |  |
| Unit tests | not run |  |
| Integration tests | not run |  |
| API E2E tests | not run |  |
| Browser E2E tests | not run |  |
| OKF verification | not run |  |
| OKF validation (`okf check`) | not run |  |
| Archive readiness | not ready |  |

# OpenSpec Validation

Command:

    openspec validate <change-id> --strict

Result:

<!-- Paste or summarize the actual result. -->

## Synced Capability Specs

<!--
A change can be valid while the baseline spec assembled from it is not: a delta
spec needs neither `## Purpose` nor `## Requirements`, and a baseline spec is
rejected without them. Validate every capability this change touches, or the
broken file stays behind after the change directory is archived.
-->

| Capability | Command | Result |
| --- | --- | --- |
| <capability-name> | `openspec validate <capability-name> --strict` |  |

# Unit Tests

Command:

    <unit-test-command>

Result:

<!-- Paste or summarize the actual result. -->

# Integration Tests

Command:

    <integration-test-command>

Result:

<!-- Paste or summarize the actual result. -->

# API E2E Tests

Command:

    <api-e2e-test-command>

Result:

<!-- Paste or summarize the actual result, or explain why API E2E is not applicable. -->

# Browser E2E Tests

Command:

    <browser-e2e-test-command>

Result:

<!-- Paste or summarize the actual result, or explain why browser E2E is not applicable. -->

# OKF Validation

Command:

    okf check --archive <change-id>

Result:

<!-- Paste the actual output. Fix what it reports; do not explain it away. -->

# Test Traceability Review

| Requirement Or Scenario | Covered By | Gap |
| --- | --- | --- |

# OKF Verification

<!--
The mandatory OKF pass before archive. The entries already exist (see
okf-link.md) and were enriched during propose; this step re-checks them against
the code that was actually written, and sets their final state in the `.okf`
files themselves - never in a copy, never in this change directory.

A checkbox is not evidence. Fill the table below with real references: a
`path/to/file.ts:120`, or the name of the test that protects the rule. The agent
that wrote the implementation is not a neutral judge of it, so the requirement
here is to go and look at the code, not to recall what was intended.
-->

## Rule Evidence

<!--
One row per BR-n in every linked entry that this change touches. Verdict values:

- `match`    - code does what the rule says
- `okf-gap`  - OKF was missing or stale, code is right and its intent is clear
               -> the OKF entry was updated (say what changed)
- `code-gap` - OKF is right, code is wrong or incomplete -> a defect. Do NOT
               "fix" this by editing OKF; record it under Known Gaps and fix the
               code
- `conflict` - genuine semantic disagreement, or a fix that would change domain
               meaning for other features -> a human decides. Only this verdict
               may end in `needs-revision`
-->

| Rule (BR-n) | Capability | Evidence (file:line or test name) | Verdict | Action Taken |
| --- | --- | --- | --- | --- |

## Section Review

| Section | Capability | Checked Against | Result |
| --- | --- | --- | --- |
| Domain Terms |  |  |  |
| Data Entities |  |  |  |
| Permissions And Access Control |  |  |  |
| Workflows |  |  |  |

## Entry Outcome

<!-- One row per capability in okf-link.md. `pending_changes` must no longer contain this change id. -->

| Capability | OKF File | Resulting Verified | verified_at | code_paths Filled | This Change Removed From pending_changes |
| --- | --- | --- | --- | --- | --- |

## Decision Promotion

<!--
If design.md holds a decision that outlives this change, copy it to
`.okf/decisions/<YYYY-MM-DD>-<slug>.md` now - archiving buries design.md under
`openspec/changes/archive/` where nobody will find it.

This table is enforced by `okf check --archive`. Each row answers with exactly one
of two things:

- **Promoted To**: a path under `.okf/decisions/` that resolves on disk. A path
  anywhere else, or one that does not exist, is an error - a decision filed
  somewhere else is buried just the same.
- **Reason If Not Promoted**: why the decision is change-local, i.e. it only
  governed how this change was carried out and means nothing after archive.

Write `-` in the column you are not using. A row with neither is an error, and so
is an empty table while design.md has a Decisions section. Only design.md's
one-line `Not required because <reason>.` form waives this table.

Fewer rows than design.md has decisions is a warning, because counting them is a
heuristic. It is a prompt to name what you left out, not a quota - do not invent
rows to silence it.
-->

| Decision | Promoted To | Reason If Not Promoted |
| --- | --- | --- |

# Known Gaps And Accepted Risks

| Gap Or Risk | Impact | Owner | Follow-Up |
| --- | --- | --- | --- |

# Archive Readiness

- [ ] OpenSpec validation passed for the change
- [ ] `openspec validate <capability> --strict` passed for every spec synced into `openspec/specs/`
- [ ] Tasks complete, or remaining items explicitly deferred
- [ ] Unit test result recorded
- [ ] Integration test result recorded
- [ ] E2E result recorded, or marked not applicable with a specific reason
- [ ] Every `skeleton` / `planned` test row appears in the test-plan Known Gaps with an owner
- [ ] Rule Evidence table filled with real `file:line` or test references for every BR-n touched
- [ ] Every linked entry: `verified` set, `verified_at` set, `code_paths` filled, this change id removed from `pending_changes`
- [ ] `needs-revision` entries (if any) recorded in the `.okf/INDEX.md` Needs Revision Ledger
- [ ] Durable decisions promoted to `.okf/decisions/`, or explicitly skipped with a reason (enforced - see Decision Promotion above)
- [ ] `okf check --archive <change-id>` exits clean
- [ ] Proof boundaries are honest and explicit
