---
type: Documentation
title: OKF profile
description: Where this kit narrows or extends the Open Knowledge Format, and what it deliberately does not claim.
---

# OKF Profile

This bundle targets **Open Knowledge Format v0.2** (Apache-2.0, Google Cloud Data
Cloud team). The version is declared as `okf_version` in `index.md`.

The specification requires consumers to tolerate unknown keys, unknown `type`
values, missing optional families, broken cross-links, and a missing `index.md`.
Everything this kit adds lives inside that tolerance. Nothing below overloads a
key the specification defines.

## Keys this kit adds

| Key | On | Meaning |
| --- | --- | --- |
| `verification_state` | features | The workflow gate: `unverified`, `verified`, `needs-revision`. Deliberately NOT the specification's `verified` key - see below. |
| `verified_at` | features | Date of the last successful verification pass. A date, not a datetime: drift comparisons are date comparisons. |
| `criticality` | features | `normal` or `high`. `high` means auth, permissions, money, or customer data. |
| `pending_changes` | features | Change ids whose content has not been checked against code yet. Non-empty means the entry is not fully trustworthy. |
| `code_paths` | features | Globs where the capability actually lives. Feeds `okf audit`. |
| `linked_changes` | features, decisions | Every change that has touched the entry. |
| `decision_status` | decisions | The decision's own lifecycle: `accepted`, `superseded`, `reversed`. Kept separate so `status` can stay the specification's document lifecycle. |

## Rules this kit narrows

| Rule | Specification | Here |
| --- | --- | --- |
| `status` | optional, defaults to `stable` | required on every entry |
| `type` | any non-empty string | required, and in practice one of `Feature Knowledge`, `Decision`, `Documentation` |
| `generated.by` | optional | required to follow the actor convention when present |
| `index.md` | optional | required, and required to carry `okf_version` |
| `verified[].at` | recommended | required whenever an attestation exists |

## What `verified[]` means here

`verified[]` records who vouches for the entry's **current content**, which is
what the specification's trust tiers describe. A verification pass **replaces**
it; a human sign-off within the same pass appends to it; a `conflict` verdict
removes the key entirely.

It is not a changelog. The entry's own Verification History table is the
changelog, and it holds the `file:line` evidence that `verified[]` has no room
for. Two records, two questions - not two copies of one.

## Optional families this kit does not use

`tags`, `resource`, `stale_after`, `usage_count` / `usage_window`, and Attested
Computation. `stale_after` in particular was considered and dropped: an entry
nobody vouches for has no `verified` key at all, which already yields the
unverified tier, and `okf audit` measures drift from commit history rather than
from a date written in advance.

## What this kit does not claim

**A `human:` attestation is not proven genuine.** Under a shared git identity no
in-repo signal separates a person's bytes from an agent's. `okf check` reports
when a `criticality: high` entry carries no `human:` actor, and it reports that
as a **warning**, never an error - a check that can be satisfied by typing a
string will be satisfied by typing that string, and making it an error would only
manufacture forged sign-offs on the highest-stakes entries in the bundle.

The protection that does hold for those entries is the Rule Evidence table, which
requires a real `file:line` per business rule and is enforced by
`okf check --archive`. A wrong line number is visible the moment someone opens the
file.
