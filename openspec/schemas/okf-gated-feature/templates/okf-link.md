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

# Related Knowledge

<!--
The read set: bundle files this change must READ and must NOT modify. The table
above is what this change writes; this one is what constrains it.

Listing a file here creates no obligation toward it. It gains no
`pending_changes`, needs no Rule Evidence row, and is never attested. A file that
turns out to need editing moves up into the OKF Link table - the move is what
creates the duty, and nothing is ever in both tables.

Derive candidates from what the bundle already records:

- a decision under `.okf/decisions/` whose `affects_features` names a capability
  in the table above
- a feature entry whose `code_paths` intersect those of an entry above

A candidate is a candidate, not a verdict. One you judge irrelevant keeps its row
with the reason - a dismissal in writing is a decision, and an omission is
indistinguishable from not having looked. A file you reached by judgement rather
than by a signal is listed on the same terms, with `judgement` as its signal: the
derivation is a floor, not the definition of relatedness.

Every row names what to read - a `BR-n` or a section - because a row naming only
a path trades one unbounded read for another.

If nothing bears on this change, say so: write `none - <specific reason>` in the
File column. A blank table and "the scan found nothing" are different claims, and
only one of them is an answer.
-->

| File | Signal | Why It Bears On This Change | Read |
| --- | --- | --- | --- |
| `.okf/<path>` | <affects \| code_paths \| judgement> | <what it constrains here> | <BR-n or section> |
