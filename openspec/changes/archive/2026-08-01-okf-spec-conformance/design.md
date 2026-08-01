## Context

`.okf/` implements the Open Knowledge Format loosely: `type`, `title`,
`description`, `status`, `sources[{id, resource}]`, and `generated{by, at}` all
match the published spec, but nothing ever checked the result against it. A
field-by-field comparison against OKF v0.2 found the kit's extensions safe -
consumers are required to tolerate unknown keys - and one shared key inverted.

The change is cross-cutting by nature. A frontmatter key appears in `check.mjs`,
`audit.mjs`, and `index-gen.mjs`; the templates and schema instruction describe
it; the addendum in `CLAUDE.md` and `AGENTS.md` tells agents to write it. It also
carries migration complexity that the kit's own architecture makes non-obvious:
`lib/install.mjs` restricts the upgrade payload to the schema, templates, config,
and addendum, so `okf upgrade` cannot reach an entry file even in principle.

Constraints inherited from the kit and not reopened here: zero runtime
dependencies, no network access in any command, `verified_at` stays a date, and
`.okf/features/` and `.okf/decisions/` remain project-owned.

## Goals / Non-Goals

**Goals:**
- Make the bundle conformant with OKF v0.2's three mandatory rules, and stop a
  conformant consumer from reading the kit's distrust states as confirmation.
- Keep every kit gate that makes the knowledge trustworthy, expressed in keys the
  spec does not define.
- Give downstream projects a migration path that never invents provenance and
  never blocks them on a rule they had no chance to satisfy.

**Non-Goals:**
- Proving that a `human:` attestation was written by a person.
- Adopting the spec's optional families the kit has no use for: `tags`,
  `resource`, `stale_after`, `usage_count`, Attested Computation.
- Changing what `okf audit` measures, or how `verified_at` is stored.

## Decisions

### D1. Workflow state moves to `verification_state`, freeing the spec's key

The alternative was to keep `verified` as a string enum and document the
divergence. Rejected: the divergence is not a narrowing the spec tolerates, it is
a defined key holding a value of the wrong type, and the misreading is not
neutral. `verified: unverified` and `verified: needs-revision` - the two values
whose entire purpose is to say *do not trust this* - are read by tier derivation
as machine-confirmed. Documenting an inversion does not stop any tool from acting
on it, and by the time a second agent reads the bundle, nobody consults the
document.

Cost accepted: a breaking rename across 11 call sites in three files, plus every
downstream entry.

### D2. `verified[]` describes the current content; the history table stays

The first attempt read `verified[]` as an append-only chain, one entry per
verification pass. That reproduces the inversion at a later date - an entry that
falls to `needs-revision` still carries the earlier attestation, and reads as
confirmed - and it duplicates the Verification History table one row per element.

The two are answering different questions. The spec's chain records *who all
vouch for this content*, which is why a human review and an agent check can both
appear in it. The kit's table records *how this file got here*, across successive
versions of its content. Treating one as the other is a category error, and both
symptoms fall out of it.

So: a verification pass replaces `verified[]`; a human sign-off within the same
pass appends to it; a `conflict` verdict removes the key entirely. The table is
untouched, keeps its `file:line` evidence column, and stays the medium a reviewer
actually reads in a diff.

This also removes the need for `stale_after` (D5).

### D3. Missing human review is reported; a present one is never vouched for

The invariant `criticality: high ∧ verified ⟹ ∃ human:` looks like it enforces
the kit's existing prose rule that a high-criticality entry needs human sign-off.
It cannot. Under a shared git identity there is no in-repo signal that tells a
person's bytes from an agent's - confirmed empirically in this repository: zero of
the last six commits are signed, the author is identical for human and
agent-assisted commits, and the `Co-Authored-By` trailer is missing from three of
those six.

Worse, making it an **error** is actively harmful. A check satisfiable by typing a
string will be satisfied by typing that string, and the pressure lands on the
highest-stakes entries in the bundle. The result is a forged sign-off, which is
worse than an honest gap.

So the check warns on absence and claims nothing on presence. The real protection
for a high-criticality entry is the Rule Evidence table's `file:line` requirement,
which `okf check --archive` already enforces and which is expensive to fake
because a wrong line number is visible the moment someone opens the file.

Rejected alternatives: GPG/SSH commit signing (unforgeable, but zero commits in
this repo are signed, so it is a prerequisite project rather than a feature);
GitHub PR review via `gh api` (genuinely out-of-band, but breaks zero-dependency,
zero-network, and offline operation, and `gh` is not installed).

### D4. Migration is its own command; upgrade keeps its payload boundary

`okf upgrade` is safe to run precisely because it cannot touch knowledge:
`lib/install.mjs` enumerates its payload, and `.okf/features/` appears only in
`ENSURE_DIRS` as a directory to create. Widening that payload to carry a field
rename would trade a durable safety property for one release's convenience.

`okf migrate` is therefore a separate command, invoked deliberately, whose blast
radius is the frontmatter keys being migrated and nothing else.

It does not synthesize attestations. Nobody knows who performed a verification
recorded before attestations existed, and writing `process:okf-migrate` into
`verified[]` would put fabricated provenance in the one file whose job is to be
trustworthy. Migrated entries therefore read as unverified to an external
consumer until their next verification pass - stated as the intended outcome, not
hidden.

### D5. `stale_after` is not adopted

Under D2 an entry at `needs-revision` has no `verified` key, so tier derivation
already yields unverified. Adding an explicit staleness date on top would be a
second encoding of the same fact, and drift is already measured dynamically by
`okf audit` from commit history, which is more accurate than a date written in
advance. Recorded because it was proposed and deliberately dropped.

### D6. The coupling invariant is a warning at this release and an error at the next

A project that migrates before re-verifying holds entries with
`verification_state: verified` and no attestation - exactly what D4 requires. If
the coupling in D2 were an error immediately, migration would break every
downstream `okf check` until every entry had been re-verified, which no team can
do in one sitting. The existing kit-skew machinery in `checkKitInstall` already
knows the installed version, so the promotion from warning to error is a version
comparison, not a new mechanism.

### D7. Templates are renamed, not moved

The spec makes every non-reserved `.md` file in the bundle a concept document, so
`.okf/templates/feature.template.md` reads as a concept titled
`<capability-name>`. Renaming to `.md.tmpl` removes them from the bundle's file
set while keeping them where people look for them. Moving them under
`openspec/schemas/` would mix knowledge-entry templates with OpenSpec artifact
templates for no gain - both directories are already in the upgrade payload, so
neither option changes `install.mjs`.

### D8. `INDEX.md` becomes `index.md` in two git steps

`index.md` is the reserved name and the only permitted home for `okf_version`.
The rename runs on APFS, which is case-insensitive, so a direct `git mv` is a
no-op or records nothing. It goes through a temporary name, and a test asserts the
committed path is lowercase rather than trusting the filesystem.

## Risks / Trade-offs

- **A breaking change to files the kit promises never to touch** -> the promise is
  kept (D4); the break is opt-in and reported per file.
- **The whole bundle loses its trust tier at once after migration** -> stated as
  intended in the migration report and the profile document; the coupling stays a
  warning for one release (D6).
- **A warning nobody reads is the same as no check** -> the high-criticality
  warning is countable and surfaced in the generated index, not only in check
  output.
- **The profile document drifts from what the code does** -> it is kit-owned and
  replaced on upgrade, so it moves with the code rather than with a project.
- **Tracking a spec that may reach v0.3** -> `okf_version` states the targeted
  version, making the gap visible instead of assumed.

## Migration Plan

1. Ship `okf migrate` and the new checks in the same release. The coupling
   invariant is a warning (D6).
2. A project upgrades the kit as usual; `okf upgrade` rewrites kit-owned files
   only. `okf check` reports the entry-shape skew.
3. The project runs `okf migrate`. Entries move to `verification_state`; no
   attestations are written.
4. Entries regain their attestation the next time each is verified, one change at
   a time. No bulk re-verification is required or expected.
5. The following kit release promotes the coupling invariant to an error.

Rollback: `okf migrate` is a frontmatter rewrite committed to git like any other
change. Reverting the commit restores the previous shape; pinning the previous kit
tag restores the previous checks. No state lives outside the repository.

## Open Questions

- Should `okf migrate` accept `--dry-run` for consistency with `okf init` and
  `okf upgrade`? Leaning yes; it affects the command surface only and can be
  settled during implementation.
- Should `okf check` constrain `type` to a small kit-declared set? A closed set
  catches typos but rejects the extension the spec explicitly permits. Deferred -
  it is a separate decision about the format's openness, not about conformance.
