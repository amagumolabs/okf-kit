# OKF Index

<!--
GENERATED FILE - derived from the frontmatter of every file under `features/`
and `decisions/`. Regenerate with `okf index`; do not edit by hand.

The Needs Revision Ledger keeps its "What A Human Must Decide" notes across
regenerations - that column is the only hand-written content in this file.
-->

## Features

| Capability | Verified | Verified At | Pending Changes | Criticality | Status |
| --- | --- | --- | --- | --- | --- |
| [okf-archive-gate](features/okf-archive-gate.md) | verified | 2026-07-30 | - | normal | active |
| [okf-audit](features/okf-audit.md) | verified | 2026-07-30 | - | normal | active |

## Decisions

| Decision | Date | Status | Affects |
| --- | --- | --- | --- |
| [Whether a decision must be promoted is derived from design.md's shape, and an unreadable shape requires a row](decisions/2026-07-30-decision-promotion-is-derived-from-design-shape.md) | 2026-07-30 | accepted | okf-archive-gate |
| [A finding's severity follows the strength of the signal behind it](decisions/2026-07-30-finding-severity-follows-signal-strength.md) | 2026-07-30 | accepted | okf-archive-gate |
| [verified_at is a date, and comparisons against it are date comparisons](decisions/2026-07-30-verified-at-is-a-date-not-a-timestamp.md) | 2026-07-30 | accepted | okf-audit |

## Needs Revision Ledger

<!-- The debt list. A row older than 30 days is an error, not a warning: a knowledge base that disagrees with its own code and nobody looks at is worse than none. -->

| Capability | Since | Caused By Change | What A Human Must Decide |
| --- | --- | --- | --- |
