<!--
This file is a pointer table, not a content draft. Never copy feature knowledge
into it - that lives in exactly one place per capability:
`.okf/features/<capability-name>.md`.

One row per capability listed in the proposal's Capabilities section (both New
and Modified) - no more, no fewer. A capability missing here is a hard failure,
not an oversight.

A capability with no domain knowledge to record (pure infrastructure, build
tooling, log formats) still needs a row: write
`no domain knowledge - <specific reason>` in the OKF File column instead of a
path. Do not create an empty entry just to fill the table.
-->

# OKF Link

| Capability | OKF File | Verified | Pending For This Change | New Or Enriched |
| --- | --- | --- | --- | --- |
| <capability-name> | `.okf/features/<capability-name>.md` | <unverified \| verified \| needs-revision> | <yes \| no> | <new \| enriched> |

**Last synced**: <iso-8601-timestamp>

<!--
Column meaning:

- **Verified**: the entry's `verified` value mirrored at the time of writing.
  This table is a mirror; the `.okf` entry is the source of truth.
- **Pending For This Change**: `yes` while this change id sits in the entry's
  `pending_changes`. The verification pass removes the id and flips this to `no`.
- **New Or Enriched**: whether this change created the entry or added to an
  existing one.
-->
