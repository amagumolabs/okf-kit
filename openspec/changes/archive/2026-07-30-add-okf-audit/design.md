## Context

`code_paths` has been collected on every verified entry since v0.1.0 but nothing
reads it. The audit is the first consumer, so this change fixes the meaning of
that field: it is a git pathspec list, not documentation.

The kit has no dependencies and must keep none, so the only available source of
commit dates is the `git` binary. Everything below was verified against git in
this repository rather than assumed.

## Goals / Non-Goals

**Goals:**

- Name the specific path and commit that made an entry stale, so a bad
  `code_paths` glob is visible as the cause rather than looking like real drift.
- Distinguish "no drift" from "cannot tell" in the output.

**Non-Goals:**

- Implementing glob matching. git already does it.
- Judging whether the drift invalidated the knowledge.

## Decisions

**Query git once per declared path, not once per entry.** A single query for all
of an entry's paths would return the newest commit across them and lose which
path triggered it, which acceptance criterion 1 requires. Paths per entry are few,
so the cost is irrelevant.

**Use `:(glob)` pathspec magic.** Verified: `git log -1 --format=%cd --date=short
-- ':(glob)lib/**'` resolves, and `**` matches nested directories. Without the
magic prefix, git's default wildmatch treats the pattern differently and `**`
loses its meaning across directory boundaries. This keeps glob semantics in git
and out of the kit.

**Compare dates, not timestamps.** `--date=short` gives `YYYY-MM-DD`, which is
also the precision `verified_at` carries. BR-2 then falls out naturally as a
string comparison: stale when `commitDate > verified_at`. Comparing timestamps
would demand a verification time nobody records, and would make an entry verified
in the morning look stale from an afternoon commit that the verifier had actually
already read.

**Detect a vanished path with `git ls-files`, not with exit codes.** Verified:
`git log` on a pathspec matching nothing prints nothing and still exits 0, so a
missing path is indistinguishable from an old one by exit status alone. An empty
`git ls-files` for the same pathspec is the signal.

**Detect a non-repository with `git rev-parse --git-dir`.** Verified: exit 128
outside a repository, 0 inside. This is checked once up front so the failure is
reported as "the audit could not run", never as a repository full of current
entries.

**Read committed history only.** `git log` naturally ignores the working tree,
so BR-7 needs no extra work - worth stating because the opposite would have
required effort, and someone may later be tempted to add it.

## Risks / Trade-offs

- Shallow clones truncate history, so a stale entry can look current → documented
  as an assumption on the entry rather than silently compensated for; a fix would
  require the audit to know the clone depth's cutoff date, which it cannot get
  reliably.
- Spawning one git process per path → acceptable at the scale of a knowledge base
  (tens of entries); revisit only if a repository reaches hundreds.

## Open Questions

None. The behavioral questions were settled as business rules on the entry.
