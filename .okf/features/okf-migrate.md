---
type: Feature Knowledge
title: okf-migrate
description: The explicit command that moves an existing bundle to a new frontmatter shape without fabricating provenance it cannot know.
status: stable
verification_state: verified
verified_at: 2026-08-01
verified:
  - by: anthropic/claude-opus-5
    at: 2026-08-01T00:00:00Z
criticality: normal
pending_changes: []
code_paths: [lib/migrate.mjs, bin/okf.mjs, lib/install.mjs]
sources:
  - id: grill-2026-08-01
    resource: 'Grill session 2026-08-01, after reading lib/install.mjs:26-28 and finding that upgrade''s payload cannot reach .okf/features/: "okf upgrade về cấu trúc không migrate được entry"'
  - id: kit-ownership-contract
    resource: README.md
linked_changes:
  - okf-spec-conformance
generated:
  by: anthropic/claude-opus-5
  at: 2026-08-01T00:00:00Z
---

# Summary

The kit's ownership contract says `.okf/features/` and `.okf/decisions/` are
project-owned and never touched by an upgrade, and `okf upgrade` is built that
way: its payload lists only the schema, the templates, the config, and the
addendum. That makes upgrades safe and makes a field rename impossible to ship
through them. `okf migrate` is the deliberate exception - a separate command a
person invokes on purpose, which rewrites entry frontmatter and nothing else. Its
defining constraint is what it refuses to do: it will not invent an attestation
for a verification that happened before anyone recorded who performed it.

# Domain Terms

| Term | Meaning | Source |
| --- | --- | --- |
| Migration | A one-way rewrite of existing entry frontmatter from one kit format version to the next | grill-2026-08-01 |
| Ownership contract | The kit's division between kit-owned files, replaced on upgrade, and project-owned files, never touched | kit-ownership-contract |
| Fabricated provenance | An attestation, source, or date written by a tool that did not witness the event it records | grill-2026-08-01 |
| Grace period | The release window during which a newly introduced invariant reports as a warning rather than an error | grill-2026-08-01 |

# Actors And Roles

| Actor | Role In Feature | Notes |
| --- | --- | --- |
| Developer | Invokes `okf migrate` after upgrading the kit | The invocation is the consent; migration never happens as a side effect |
| `okf upgrade` | Installs the new kit version, and does not migrate | Its payload cannot reach entry files by construction, and that is a property to preserve |
| Verification pass | Restores full trust to a migrated entry the next time it runs | The only actor that can honestly write an attestation |

# Business Rules

| ID | Rule | Source |
| --- | --- | --- |
| BR-1 | `okf migrate` MUST NOT synthesize a `verified[]` attestation for an entry migrated from the old field shape. Nobody knows who performed a historical verification, and an invented actor is fabricated provenance in the one file whose job is to be trustworthy. | grill-2026-08-01 |
| BR-2 | Migration MUST be a separate, explicitly invoked command. `okf upgrade` MUST NOT write to `.okf/features/` or `.okf/decisions/`, because the ownership contract declares them project-owned and an upgrade that quietly edits knowledge breaks the property that makes upgrades safe to run. | kit-ownership-contract |
| BR-3 | A migrated entry reads as `unverified` to a conformant consumer until its next verification pass. That is the honest state and MUST NOT be reported as a defect: the entry's workflow state is preserved in `verification_state`, only the attestation is unknown. | grill-2026-08-01 |
| BR-4 | An invariant introduced together with a migration MUST start as a warning and MUST NOT become an error until a later release. A project that has migrated but not yet re-verified would otherwise be blocked by a rule it had no opportunity to satisfy. | grill-2026-08-01 |
| BR-5 | Migration MUST be idempotent: running it on an already-migrated bundle changes nothing and reports that. A migration that damages a second run cannot be safely retried after a partial failure. | grill-2026-08-01 |
| BR-6 | Migration MUST rewrite only frontmatter keys it is migrating, leaving body content and unrelated keys byte-identical. The command's blast radius is the reason a person is willing to run it on files the kit otherwise never touches. | grill-2026-08-01 |

# Data Entities

| Entity | Description | Important Fields Or States |
| --- | --- | --- |
| Migration report | What one run tells the developer | files examined, files rewritten, files already current, entries left without an attestation pending re-verification |
| Kit format version | The entry-shape version a bundle is on, distinct from the spec version it targets | recorded in `.okf/.okf-kit.json`, compared by the existing kit-skew check |

# Workflows

## Primary Workflow

1. The developer upgrades the kit; `okf upgrade` replaces kit-owned files only (BR-2).
2. `okf check` reports that the bundle is on an older entry shape.
3. The developer runs `okf migrate`.
4. Each entry's `verified` value moves to `verification_state`; no `verified[]` is
   written (BR-1). Body content is untouched (BR-6).
5. Entries formerly `verified` now read as unverified to external consumers until
   their next verification pass restores an attestation (BR-3).

## Alternative Or Failure Workflows

- Run twice: the second run reports every file as already current and writes
  nothing (BR-5).
- An entry with frontmatter the migration cannot parse: report it and leave it
  untouched, rather than rewriting a file whose shape was not understood.

# Risks And Compliance Constraints

| Risk Or Constraint | Impact | Mitigation Or Handling |
| --- | --- | --- |
| A command that edits project-owned knowledge files | The ownership contract loses its meaning if migration becomes routine | Explicit invocation only, narrow blast radius (BR-6), and a report naming every file touched |
| Every migrated entry losing its trust tier at once | A bundle that looked reviewed suddenly looks unreviewed, and people distrust the tool rather than the gap | State it as the intended outcome in the report and in the profile document (BR-3), and keep the coupling invariant a warning during the grace period (BR-4) |

# Assumptions

- Downstream projects run `okf check` often enough to see the skew report that
  prompts migration. A project that never runs it will discover the change when
  its entries stop matching the templates.

# Open Questions

- Should `okf migrate` offer `--dry-run` like `okf init` and `okf upgrade` do?
  Consistency argues yes; it is left to the design because it affects the command
  surface rather than the domain rules.

# Verification History

| Date | Change | Verified Status | Evidence / Notes |
| --- | --- | --- | --- |
| 2026-08-01 | okf-spec-conformance | verified | BR-1 lib/migrate.mjs:28-45 writes no `verified` key; BR-2 lib/install.mjs:26-28 payload excludes features/ and decisions/, asserted by the upgrade integration test; BR-3 lib/check.mjs:327 keeps it a warning; BR-4 lib/check.mjs:40 COUPLING_SEVERITY; BR-5 lib/migrate.mjs:111 alreadyCurrent; BR-6 lib/migrate.mjs:118 rebuilds only the frontmatter region. Run against this repository's own 7 files: 7 rewritten, second run 0. |
