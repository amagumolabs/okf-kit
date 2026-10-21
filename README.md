# okf-kit

The team's OpenSpec + OKF workflow: a set of plain files that keeps three layers
of every feature in sync - the OKF knowledge entry, the OpenSpec spec, and the
code with its tests. There is nothing to install beyond OpenSpec; one
dependency-free script warns about drift and never blocks.

- **OKF** (`.okf/`) holds durable domain knowledge: terms, actors, permissions,
  entities, workflows, and business rules with stable ids such as `BR-max-items`.
- **OpenSpec** (`openspec/`) holds requirements and scenarios, and the change
  workflow that edits them.
- **`AGENTS.md`** tells the agent which route a request takes - Direct, Quick
  fix, Rule tweak, or the full OpenSpec workflow - so a small change stays
  small and only a change to the knowledge goes through a proposal.

Read `docs/workflow-at-a-glance.md` for the picture, and `.okf/README.md` for
what belongs in a knowledge entry.

## Use it in a project

```bash
# 1. OpenSpec, at the version the generated skills are made for
npm i -g @fission-ai/openspec@1.14.3
openspec init --tools claude,codex,cursor

# 2. Copy the workflow files from this repository
cp -R <okf-kit>/AGENTS.md <okf-kit>/CLAUDE.md <okf-kit>/.okf <project>/
cp -R <okf-kit>/openspec/schemas <project>/openspec/
cp <okf-kit>/openspec/config.yaml <project>/openspec/config.yaml
cp <okf-kit>/.claude/settings.json <project>/.claude/settings.json
```

Then fill in **Project commands** at the end of `AGENTS.md` (test, lint,
typecheck) and commit everything, including the files `openspec init`
generated. Teammates need only OpenSpec at the same version; nothing else is
installed.

If the project already has an `AGENTS.md`, `CLAUDE.md` or
`.claude/settings.json`, merge rather than overwrite. `CLAUDE.md` only needs the
line `@AGENTS.md`; `settings.json` only needs the `PostToolUse` hook, which runs
`.okf/check.mjs` after Claude Code edits a file under `.okf/` or `openspec/`.
The script needs Node 18 or later, which OpenSpec needs anyway.

## What is in it

```text
AGENTS.md                                  # routes, naming, verification, self-check
CLAUDE.md                                  # @AGENTS.md
.claude/settings.json                      # hook: run the knowledge check after edits
openspec/config.yaml                       # project context for every OpenSpec workflow
openspec/schemas/okf-gated-feature/        # the full-route schema and its templates
.okf/README.md                             # what belongs in an entry, what the states mean
.okf/templates/                            # feature and decision templates
.okf/check.mjs                             # warns about drift, never blocks
.okf/index.md                              # one row per entry, added with the file
```

## Upgrading OpenSpec

`openspec update` regenerates the skill files under `.claude/`, `.agents/` and
`.cursor/`; it never touches `AGENTS.md`, `config.yaml` or the schema. Bump the
version in this README and in `AGENTS.md` together, so everyone moves at once.
Before upgrading, run `openspec schema validate okf-gated-feature` with the new
version.

Set `DO_NOT_TRACK=1` to turn off OpenSpec's anonymous telemetry.
