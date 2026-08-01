## Why

`.okf/` was built on the Open Knowledge Format but never checked against the
published specification. Comparing them found the extensions harmless - the spec
requires consumers to tolerate unknown keys, so `criticality`, `pending_changes`,
`code_paths`, and `linked_changes` cost nothing - and one shared key actively
wrong.

`verified` is a spec-defined key whose value is a list of attestations. This kit
stores a string enum in it. A conformant consumer derives its trust tier from the
key's *presence*, so `verified: unverified` and `verified: needs-revision` - the
two values that exist to say *do not trust this entry* - are read as
machine-confirmed. The bundle tells outside tooling the opposite of what it means,
on exactly the entries where it matters (BR-1 of `okf-bundle-format`).

Two further conformance rules fail outright: `.okf/README.md` and `.okf/INDEX.md`
are concept documents by the spec's definition and carry no frontmatter at all,
and `INDEX.md` is not the reserved name `index.md`, so the bundle has nowhere to
declare which spec version it targets.

Now, because the kit is at v0.2.0 with two downstream-visible entry files and
three decision files. Every month of delay adds entries a migration has to move.

## What Changes

- **BREAKING** Rename the entry frontmatter key `verified` to
  `verification_state`, freeing the spec's key (BR-1 of `okf-bundle-format`).
- Add a spec-shaped `verified[]` written by the verification pass, holding
  attestations for the entry's **current content** rather than its history
  (BR-2). The Verification History table in the entry body is unchanged - it
  answers a different question.
- Add two coupling invariants to `okf check` (BR-3, BR-4) and one warning for
  high-criticality entries with no human attestation (BR-5).
- **BREAKING** Add `okf migrate`, the only command permitted to write to
  project-owned entry files, which moves the field without fabricating
  attestations it cannot know (BR-1, BR-2 of `okf-migrate`).
- Rename `.okf/INDEX.md` to `.okf/index.md` and give it `okf_version` frontmatter
  (BR-8 of `okf-bundle-format`).
- Give `.okf/README.md` frontmatter, and rename the entry templates so their
  placeholder frontmatter stops reading as a concept document (BR-7).
- **BREAKING** Move `status` to the spec vocabulary (`draft | stable |
  deprecated`) and give decision entries their own `decision_status` (BR-10).
- Bring `generated.by` onto the spec's actor convention (BR-9).
- Generate `.okf/log.md` from the entries' Verification History rows.
- Add a profile document recording every place the kit extends the spec (BR-11).
- Update `okf audit` to select entries by `verification_state`, never by the
  presence of an attestation (BR-10 of `okf-audit`).

## Capabilities

### New Capabilities
- `okf-bundle-format`: the contract for what a conformant bundle looks like here -
  entry frontmatter fields and vocabularies, the verification state split and its
  invariants, which files are concept documents, and the limits of what the kit
  can honestly claim about a human sign-off.
- `okf-migrate`: the explicitly invoked command that moves an existing bundle to a
  new entry shape without fabricating provenance, and the grace period that keeps
  a migrated-but-not-yet-reverified project unblocked.

### Modified Capabilities
- `okf-audit`: the requirement "Only verified, active entries are audited" names
  the `verified` field directly, and must now name `verification_state`. A new
  rule is added for the case the split creates - an entry verified by the workflow
  that carries no attestation (BR-10).

## Scope And Non-Goals

**In scope:**

- Entry and decision frontmatter, bundle-level reserved files, and the checks over
  them.
- A migration command and the release policy that makes it safe to adopt.
- A profile document naming every divergence from the spec.

**Non-goals:**

- Commit signing, PR-review verification, or any other mechanism claiming to prove
  a `human:` attestation is genuine. No in-repo signal distinguishes a person's
  bytes from an agent's under a shared git identity (BR-6 of
  `okf-bundle-format`), so the kit reports absence and claims nothing more.
- Deriving `verified_at` from `verified[-1].at`. It would touch `okf audit`'s
  comparison for no gain in this change, and the existing decision that
  `verified_at` is a date stays closed.
- Vendoring or depending on any third-party OKF tooling. `package.json` stays
  empty.
- Attested Computation, `tags`, `resource`, `stale_after`, and `usage_count`. They
  are optional families the kit has no use for yet.

## Acceptance Criteria

1. No file in `.okf/` carries a `verified` key holding a string. (BR-1 of
   `okf-bundle-format`)
2. `okf check` errors when `verification_state: verified` and `verified[]` is
   empty, or when `verified_at` disagrees with the newest `at`. (BR-3)
3. `okf check` errors when `verification_state` is `unverified` or
   `needs-revision` and a `verified` key is present. (BR-4)
4. `okf check` warns - and does not error - when a `criticality: high` entry is
   verified with no `human:` actor. (BR-5)
5. A verification pass replaces `verified[]` rather than appending to it: an entry
   verified by two successive changes holds attestations from the second only.
   (BR-2)
6. Moving an entry to `needs-revision` removes its `verified` key. (BR-4)
7. Every `.md` file under `.okf/` parses as frontmatter with a non-empty `type`,
   except the reserved `index.md` and `log.md`. (BR-7)
8. `.okf/index.md` carries `okf_version: "0.2"`. (BR-8)
9. `okf migrate` moves `verified` to `verification_state` and writes no
   `verified[]`. (BR-1 of `okf-migrate`)
10. `okf migrate` run twice reports the second run as a no-op and writes nothing.
    (BR-5 of `okf-migrate`)
11. `okf migrate` leaves body content and unrelated frontmatter keys
    byte-identical. (BR-6 of `okf-migrate`)
12. `okf upgrade` writes to no file under `.okf/features/` or `.okf/decisions/`.
    (BR-2 of `okf-migrate`)
13. The coupling invariant from criterion 2 reports as a warning at this kit
    version, not an error. (BR-4 of `okf-migrate`)
14. `okf audit` audits an entry whose `verification_state` is `verified` and which
    carries no `verified[]`. (BR-10 of `okf-audit`)
15. Decision entries use `decision_status` for `accepted | superseded | reversed`,
    and `status` for the spec vocabulary. (BR-10 of `okf-bundle-format`)
16. `.okf/log.md` is generated by `okf index` and lists dated entries newest
    first.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| A breaking rename to files the kit contractually never touches | Downstream projects break on upgrade, or lose trust in `okf upgrade` | Ship the rename behind an explicitly invoked `okf migrate` (BR-2 of `okf-migrate`); `okf upgrade` keeps its payload boundary, and criterion 12 tests it |
| Every migrated entry loses its trust tier at once | A bundle that looked reviewed suddenly looks unreviewed; people distrust the tool rather than the gap | State it as the intended outcome (BR-3 of `okf-migrate`), keep the coupling invariant a warning for one release (BR-4) |
| Renaming `INDEX.md` to `index.md` on a case-insensitive filesystem | The rename silently does nothing, or git records a phantom change; the developer is on darwin/APFS | Two-step `git mv` through a temporary name, with a test asserting the committed path is lowercase |
| The `criticality: high` warning becomes noise nobody reads | High-stakes entries accumulate without review | Keep it countable and surface it in the index, not only in check output |
| `status` vocabulary change breaks the audit's deprecated-entry skip | Deprecated entries get audited and report as stale | `deprecated` is in both the old and new vocabulary, so the skip is unaffected; covered by a regression case |

## Impact

- **Code**: `lib/check.mjs` (frontmatter validation, the new invariants, the
  warning), `lib/index-gen.mjs` (field name, `okf_version`, `log.md`),
  `lib/audit.mjs` (field name, BR-10), `lib/install.mjs` (payload set if templates
  move), `bin/okf.mjs` (the `migrate` command), plus a new `lib/migrate.mjs`.
- **Kit payload**: `.okf/templates/*` (frontmatter shape, new location),
  `.okf/README.md` (frontmatter), `openspec/schemas/okf-gated-feature/schema.yaml`
  (verification instruction), `openspec/config.yaml` (rules), the addendum block in
  `CLAUDE.md` and `AGENTS.md`.
- **Project files this repo owns**: all three `.okf/features/*.md` and all three
  `.okf/decisions/*.md`, migrated by the new command rather than by hand.
- **Docs**: `README.md` command table and ownership table, `.okf/README.md`, and a
  new profile document.
- **Dependencies**: none added. `package.json` stays without `dependencies` or
  `devDependencies`.
- **CI**: `.github/workflows/okf.yml` unchanged; the new checks run inside
  `okf check`.
