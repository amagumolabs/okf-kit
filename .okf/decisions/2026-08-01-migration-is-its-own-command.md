---
type: Decision
title: Migration is a separate command, and upgrade keeps its payload boundary
description: okf upgrade stays unable to touch knowledge files, and migration never invents an attestation it cannot know.
date: 2026-08-01
status: stable
decision_status: accepted
supersedes:
superseded_by:
affects_features:
  - okf-migrate
sources:
  - id: design
    resource: change:okf-spec-conformance
linked_changes:
  - okf-spec-conformance
---

# Decision

Entry-shape migrations ship as `okf migrate`, a separately invoked command.
`okf upgrade` continues to write only kit-owned files. Migration never synthesizes
a `verified[]` attestation.

# Context

`okf upgrade` is safe to run precisely because it cannot touch knowledge: its
payload is enumerated in `lib/install.mjs`, and `.okf/features/` appears only as a
directory to create. Shipping a field rename through it would trade a durable
safety property for one release's convenience, and would make every future upgrade
something a team has to read before running.

The refusal to invent attestations matters as much. Nobody knows who performed a
verification recorded before attestations existed. Writing `process:okf-migrate`
into `verified[]` would put fabricated provenance into the one file whose job is
to be trustworthy.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| Widen the upgrade payload to include entries | Destroys the property that makes upgrade safe, permanently, for one release's convenience. |
| Migrate lazily inside `okf check` when an old shape is seen | A validator that rewrites the files it validates is no longer a validator, and the rewrite would happen unattended in CI. |
| Synthesize `process:okf-migrate` as the attesting actor | Fabricated provenance. It would make every migrated entry claim a verification nobody performed. |

# Consequences

- Migrated entries read as unverified to an external consumer until their next
  verification pass. Stated as the intended outcome in the migration report and in
  `.okf/profile.md`, not hidden.
- The coupling between `verification_state: verified` and a non-empty `verified[]`
  must start as a warning, or migration would block every downstream `okf check`.
- Migration is idempotent and rewrites only the frontmatter keys it migrates. The
  narrow blast radius is why a person is willing to run it at all.

# Revisit When

A migration appears that genuinely cannot be expressed as a frontmatter rewrite -
for example one that must move content between files.
