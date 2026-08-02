---
okf_version: "0.2"
---

# OKF Index

<!--
GENERATED FILE - derived from the frontmatter of every file under `features/`
and `decisions/`. Regenerate with `okf index`; do not edit by hand.

`okf_version` declares the specification revision this bundle targets. This file
is the only place in the bundle where index frontmatter is permitted.

The Needs Revision Ledger keeps its "What A Human Must Decide" notes across
regenerations - that column is the only hand-written content in this file.
-->

## Features

| Capability | Verified | Verified At | Pending Changes | Criticality | Status |
| --- | --- | --- | --- | --- | --- |
| [okf-archive-gate](features/okf-archive-gate.md) | verified | 2026-07-30 | - | normal | stable |
| [okf-audit](features/okf-audit.md) | verified | 2026-08-01 | - | normal | stable |
| [okf-bundle-format](features/okf-bundle-format.md) | verified | 2026-08-01 | - | normal | stable |
| [okf-durable-references](features/okf-durable-references.md) | verified | 2026-08-02 | - | normal | stable |
| [okf-migrate](features/okf-migrate.md) | verified | 2026-08-01 | - | normal | stable |

## Decisions

| Decision | Date | Status | Affects |
| --- | --- | --- | --- |
| [Whether a decision must be promoted is derived from design.md's shape, and an unreadable shape requires a row](decisions/2026-07-30-decision-promotion-is-derived-from-design-shape.md) | 2026-07-30 | accepted | okf-archive-gate |
| [A finding's severity follows the strength of the signal behind it](decisions/2026-07-30-finding-severity-follows-signal-strength.md) | 2026-07-30 | accepted | okf-archive-gate |
| [verified_at is a date, and comparisons against it are date comparisons](decisions/2026-07-30-verified-at-is-a-date-not-a-timestamp.md) | 2026-07-30 | accepted | okf-audit |
| [An invariant introduced with a migration starts as a warning and becomes an error a release later](decisions/2026-08-01-a-new-invariant-starts-as-a-warning.md) | 2026-08-01 | accepted | okf-migrate |
| [verified[] describes the current content, and the Verification History table stays](decisions/2026-08-01-attestations-describe-current-content.md) | 2026-08-01 | accepted | okf-bundle-format |
| [Missing human review is reported as a warning; a present attestation is never vouched for](decisions/2026-08-01-human-review-is-reported-never-proven.md) | 2026-08-01 | accepted | okf-bundle-format |
| [Migration is a separate command, and upgrade keeps its payload boundary](decisions/2026-08-01-migration-is-its-own-command.md) | 2026-08-01 | accepted | okf-migrate |
| [stale_after is not adopted; absence of an attestation already encodes distrust](decisions/2026-08-01-stale-after-is-not-adopted.md) | 2026-08-01 | accepted | okf-bundle-format |
| [Workflow state lives in verification_state, never in the specification's verified key](decisions/2026-08-01-workflow-state-leaves-the-specification-key.md) | 2026-08-01 | accepted | okf-bundle-format |
| [A bundle content rule discriminates by shape, never by a list of excused files](decisions/2026-08-02-bundle-content-rules-discriminate-by-shape.md) | 2026-08-02 | accepted | okf-durable-references |
| [A fenced code block is how a document exempts itself from a content rule](decisions/2026-08-02-fencing-is-the-sanctioned-escape-hatch.md) | 2026-08-02 | accepted | okf-durable-references |
| [Exemption from a frontmatter requirement is not exemption from a content rule](decisions/2026-08-02-structural-exemption-is-not-content-exemption.md) | 2026-08-02 | accepted | okf-durable-references, okf-bundle-format |

## Needs Revision Ledger

<!-- The debt list. A row older than 30 days is an error, not a warning: a knowledge base that disagrees with its own code and nobody looks at is worse than none. -->

| Capability | Since | Caused By Change | What A Human Must Decide |
| --- | --- | --- | --- |
