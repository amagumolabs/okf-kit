---
type: Feature Knowledge
title: okf-audit
description: Detects OKF entries whose code changed after they were last verified, so drift from work outside OpenSpec becomes visible.
status: stable
verification_state: verified
verified_at: 2026-08-01
verified:
  - by: anthropic/claude-opus-5
    at: 2026-08-01T00:00:00Z
criticality: normal
pending_changes: []
code_paths: [lib/audit.mjs, bin/okf.mjs]
sources:
  - id: design-2026-07-30
    resource: 'Design conversation 2026-07-30, deferred phase 2: "code_paths da co du lieu, okf-audit chi la script ~20 dong: git log -1 --format=%cd tren code_paths so voi verified_at, cai nao code moi hon thi danh stale"'
  - id: change-okf-spec-conformance
    resource: change:okf-spec-conformance
linked_changes:
  - add-okf-audit
  - fix-audit-untracked-paths
  - okf-spec-conformance
generated:
  by: anthropic/claude-opus-5
  at: 2026-07-30T00:00:00Z
---

# Summary

`okf check` verifies that a knowledge entry is internally consistent and that the
workflow was followed. It cannot see the one failure it most needs to: code that
moved after an entry was verified, through a hotfix, a refactor, or a dependency
bump that never opened an OpenSpec change. `okf audit` closes that blind spot by
comparing each verified entry's `verified_at` against the commit history of the
paths that entry claims to describe. It reports; it never edits knowledge.

# Domain Terms

| Term | Meaning | Source |
| --- | --- | --- |
| Drift | Divergence between what an OKF entry says and what the code does, arising without anyone noticing | design-2026-07-30 |
| Stale entry | A verified entry whose declared code has commits newer than its last verification | design-2026-07-30 |
| Unauditable entry | A verified entry the audit cannot draw a conclusion about: no declared paths, no `verified_at`, or no commit history for the paths it declares | design-2026-07-30, widened by add-okf-audit |
| Audit verdict | The per-entry outcome of one audit run: current, stale, unauditable, or skipped | design-2026-07-30 |

# Actors And Roles

| Actor | Role In Feature | Notes |
| --- | --- | --- |
| Developer | Runs the audit to see which knowledge has gone stale | Acts on the result by re-verifying, usually inside a change |
| CI | Runs the audit on a schedule to surface accumulated drift | Failure must be actionable, not routine noise |

# Business Rules

| ID | Rule | Source |
| --- | --- | --- |
| BR-1 | An entry is stale when any path it declares in `code_paths` has a commit strictly newer than the entry's `verified_at` date. | design-2026-07-30 |
| BR-2 | A commit dated the same day as `verified_at` MUST NOT count as drift, because verification happens after the code it verifies and both carry only date precision. | design-2026-07-30 |
| BR-3 | An entry with no `code_paths` MUST be reported as unauditable rather than current, and MUST NOT be reported as stale. Silence about an unknown is a false assurance. | design-2026-07-30 |
| BR-4 | Only entries whose `verification_state` is `verified` are audited. `unverified` and `needs-revision` are already surfaced by `okf check`, and re-reporting them here would bury the drift signal. (Field renamed from `verified` in okf-spec-conformance; the rule itself is unchanged.) | design-2026-07-30 |
| BR-5 | An entry whose `status` is `deprecated` MUST be skipped. Its code is expected to diverge. | design-2026-07-30 |
| BR-6 | The audit MUST NOT modify any entry, including its `verification_state` field. Downgrading status from commit history alone would let the tool decide knowledge is wrong without anyone reading either the knowledge or the code. (Field renamed from `verified` in okf-spec-conformance; the rule itself is unchanged.) | design-2026-07-30 |
| BR-7 | Staleness MUST be judged from committed history only. Uncommitted working-tree changes are not drift; they are work in progress. | design-2026-07-30 |
| BR-8 | Whenever a comparison cannot be made at all - no declared paths, no `verified_at` to compare against, or no commit history for the declared paths - the entry MUST be reported as unauditable rather than current. Generalises BR-3: the audit never converts an unknown into an assurance. | add-okf-audit verification pass |
| BR-9 | A declared path that exists in the working tree but is not yet committed MUST be reported as not-yet-committed, not as matching nothing. Verification precedes the commit that introduces a feature's files, so every new capability passes through this state, and calling it a vanished path trains people to ignore the report. | change:fix-audit-untracked-paths |
| BR-10 | The audit MUST select entries by `verification_state`, never by the presence of a `verified[]` attestation. After a migration an entry can be verified by the workflow while carrying no attestation at all, and keying on the attestation would silently stop auditing exactly those entries - drift detection would go quiet on the whole bundle at the moment it is most needed. | change:okf-spec-conformance |

# Data Entities

| Entity | Description | Important Fields Or States |
| --- | --- | --- |
| Audit result | One row per examined entry | capability, verified_at, newest commit date, verdict, the path that triggered it, paths matching nothing, paths not committed yet |
| Audit verdict | Outcome of one entry | `current`, `stale`, `unauditable`, `skipped` |

# Workflows

## Primary Workflow

1. Collect every entry under `.okf/features/`.
2. Skip entries that are deprecated, or whose `verification_state` is not
   `verified` (BR-4, BR-5, BR-10).
3. Record `unauditable` whenever no comparison is possible: no `code_paths`, no
   `verified_at`, or no commit history for the declared paths (BR-3, BR-8).
4. Otherwise ask git for the most recent commit date touching those paths, and
   compare it against `verified_at` (BR-1, BR-2, BR-7).
5. Print one row per entry, and exit non-zero when at least one entry is stale.

## Alternative Or Failure Workflows

- Not a git repository, or git unavailable: report that the audit could not run
  and exit non-zero. Reporting everything as current would be a silent lie.
- A declared path matches nothing in the repository: report it, because a path
  that no longer exists usually means the code moved, which is drift itself.

# External Dependencies

| Dependency | Purpose | Reliability Or Ownership Notes |
| --- | --- | --- |
| git | Sole source of commit dates for declared paths | Assumed present wherever the kit runs; shallow clones can hide history, see Assumptions |

# Risks And Compliance Constraints

| Risk Or Constraint | Impact | Mitigation Or Handling |
| --- | --- | --- |
| False positives from noisy paths (a whole directory declared as `code_paths`) | People learn to ignore the audit, which is worse than not having it | Report the specific path and commit that triggered staleness, so a bad `code_paths` glob is visible as the cause |
| Treating drift as a build failure on every run | The audit gets disabled | Exit non-zero on stale, but keep it a scheduled job rather than a gate on every commit |

# Assumptions

- Repositories run the audit with enough history for `git log` to be meaningful.
  A shallow CI clone can make an entry look current when it is not; this is a
  known limit rather than something the audit can detect reliably.
- `verified_at` is trustworthy because the verification pass sets it. If someone
  edits it by hand, the audit inherits that lie.

# Open Questions

- Should a stale entry automatically become `needs-revision`? Deliberately no for
  now (BR-6), but if drift accumulates faster than anyone re-verifies, the debt
  ledger may need to absorb it.

# Verification History

| Date | Change | Verified Status | Evidence / Notes |
| --- | --- | --- | --- |
| 2026-07-30 | fix-audit-untracked-paths | verified | BR-9 traced to lib/audit.mjs:162-163 and :78; BR-3 and BR-8 re-checked because this change edited the requirement citing them. Data Entities corrected to list the new result fields. |
| 2026-07-30 | add-okf-audit | verified | All 8 rules traced to `lib/audit.mjs` with line references, see the change's verification.md. BR-8 was added during this pass after finding the audit reported `current` for comparisons it never made. |
| 2026-08-01 | okf-spec-conformance | verified | BR-4 and BR-6 re-checked after the field rename: lib/audit.mjs:142-143 now selects on `verification_state`. BR-10 traced to the same lines - the selection never reads `verified[]`, so a migrated entry is still audited. BR-1, BR-2, BR-3, BR-5, BR-7, BR-8, BR-9 untouched by this change and not re-traced. |
