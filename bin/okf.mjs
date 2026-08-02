#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { audit } from '../lib/audit.mjs';
import { check } from '../lib/check.mjs';
import { buildIndex, buildLog, writeIndex } from '../lib/index-gen.mjs';
import { install } from '../lib/install.mjs';
import { migrate } from '../lib/migrate.mjs';
import { next } from '../lib/next.mjs';

const KIT_ROOT = path.resolve(import.meta.dirname, '..');
const VERSION = JSON.parse(fs.readFileSync(path.join(KIT_ROOT, 'package.json'), 'utf8')).version;

const USAGE = `okf ${VERSION} - OpenSpec + OKF workflow kit

Usage:
  okf init    [--root <dir>] [--dry-run]
  okf upgrade [--root <dir>] [--dry-run] [--force]
  okf check   [--archive <change-id>] [--root <dir>] [--json]
  okf next    <change-id> [--root <dir>]
  okf audit   [--root <dir>] [--json]
  okf index   [--check] [--root <dir>]
  okf migrate [--root <dir>] [--dry-run]

Commands:
  init      Install the schema, templates, and the CLAUDE.md / AGENTS.md
            addendum block into a project. Refuses if already initialised.

  upgrade   Re-install the kit-owned files. Files your team edited are left
            alone and reported; --force overwrites them anyway. Never touches
            .okf/features/, .okf/decisions/, or index.md - use \`okf migrate\`
            for those.

  check     Validate .okf entries, the index, config.yaml, and every active
            change's okf-link / test-plan / verification artifacts.
            --archive <change-id> adds the pre-archive checks: the verification
            pass recorded, pending_changes cleared, no skeleton test left
            without an owner.

  next      Report what a change still owes under .okf/, with the command that
            discharges each step. Advises only - never writes, never refuses.
            Exit status says whether the question could be answered, not whether
            steps remain. When nothing is owed, names \`okf check --archive\`.

  audit     Report entries whose declared code_paths have commits newer than
            their verified_at, so drift from work that never opened a change
            becomes visible. Reports only; never edits knowledge. Exits non-zero
            when anything is stale. Meant as a scheduled job, not a commit gate.

  index     Regenerate .okf/index.md and .okf/log.md from entry frontmatter.
            --check verifies they are up to date without writing (for CI).

  migrate   Move entry frontmatter to the current kit shape. The only command
            that writes to .okf/features/ and .okf/decisions/, which is why it
            is invoked deliberately rather than as part of upgrade. It never
            invents a \`verified[]\` attestation: nobody knows who performed a
            verification recorded before attestations existed, so a migrated
            entry reads as unverified until its next verification pass.

Exit codes: 0 clean, 1 problems found, 2 bad usage.
`;

function parseArgs(argv) {
  const out = { command: argv[0], root: process.cwd(), flags: {}, changeId: null };
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--archive') out.flags.archive = argv[++i];
    else if (a === '--root') out.root = path.resolve(argv[++i]);
    else if (a === '--json') out.flags.json = true;
    else if (a === '--check') out.flags.check = true;
    else if (a === '--dry-run') out.flags.dryRun = true;
    else if (a === '--force') out.flags.force = true;
    else if (a === '-h' || a === '--help') out.flags.help = true;
    else if (!a.startsWith('-') && out.changeId === null) out.changeId = a;
    else return { error: `unknown argument: ${a}` };
  }
  return out;
}

/** Walk up from cwd to the nearest directory containing .okf/ */
function findRoot(start) {
  let dir = start;
  for (;;) {
    if (fs.existsSync(path.join(dir, '.okf'))) return dir;
    const up = path.dirname(dir);
    if (up === dir) return start;
    dir = up;
  }
}

function runCheck(args) {
  const root = findRoot(args.root);
  const report = check(root, { archiveChange: args.flags.archive ?? null, kitVersion: VERSION });

  if (args.flags.json) {
    process.stdout.write(
      JSON.stringify(
        { root, errors: report.errors.length, warnings: report.warnings.length, findings: report.findings },
        null,
        2
      ) + '\n'
    );
    return report.errors.length ? 1 : 0;
  }

  const byFile = new Map();
  for (const f of report.findings) {
    if (!byFile.has(f.file)) byFile.set(f.file, []);
    byFile.get(f.file).push(f);
  }
  for (const [file, findings] of byFile) {
    console.log(`\n${file}`);
    for (const f of findings) {
      console.log(`  ${f.level === 'error' ? 'error' : ' warn'}  ${f.message}`);
    }
  }

  const { errors, warnings } = report;
  console.log('');
  if (!errors.length && !warnings.length) {
    console.log(`okf check: clean (${path.relative(process.cwd(), root) || '.'})`);
  } else {
    console.log(`okf check: ${errors.length} error(s), ${warnings.length} warning(s)`);
  }
  if (args.flags.archive && !errors.length) {
    console.log(`"${args.flags.archive}" is ready to archive as far as OKF is concerned.`);
  }
  return errors.length ? 1 : 0;
}

function runAudit(args) {
  const root = findRoot(args.root);
  const result = audit(root);

  if (args.flags.json) {
    process.stdout.write(JSON.stringify({ root, ...result }, null, 2) + '\n');
    return result.ok && !result.stale ? 0 : 1;
  }

  if (!result.ok) {
    console.error(`okf audit: ${result.reason}`);
    return 1;
  }

  const order = { stale: 0, unauditable: 1, current: 2, skipped: 3 };
  const rows = [...result.results].sort(
    (a, b) => order[a.verdict] - order[b.verdict] || a.capability.localeCompare(b.capability)
  );

  for (const r of rows) {
    const detail =
      r.verdict === 'stale'
        ? `verified ${r.verifiedAt}, but ${r.triggeredBy} changed ${r.newestCommit}`
        : r.verdict === 'unauditable'
          ? 'verified, but declares no code_paths - drift cannot be detected'
          : r.verdict === 'skipped'
            ? r.note
            : `verified ${r.verifiedAt}, newest commit ${r.newestCommit ?? 'none'}`;
    console.log(`  ${r.verdict.padEnd(11)} ${r.capability.padEnd(24)} ${detail}`);
    for (const p of r.missingPaths) {
      console.log(`              ${' '.repeat(24)} declared path matches nothing: ${p}`);
    }
    for (const p of r.untrackedPaths) {
      console.log(`              ${' '.repeat(24)} declared path not committed yet: ${p}`);
    }
  }

  const counts = rows.reduce((acc, r) => ({ ...acc, [r.verdict]: (acc[r.verdict] ?? 0) + 1 }), {});
  console.log(
    `\nokf audit: ${counts.stale ?? 0} stale, ${counts.unauditable ?? 0} unauditable, ` +
      `${counts.current ?? 0} current, ${counts.skipped ?? 0} skipped`
  );
  if (result.stale) {
    console.log('Stale means the code moved after the knowledge was checked - re-verify inside a change.');
  }
  return result.stale ? 1 : 0;
}

function runIndex(args) {
  const root = findRoot(args.root);

  if (args.flags.check) {
    const stale = [];
    for (const [rel, next] of [
      ['.okf/index.md', buildIndex(root)],
      ['.okf/log.md', buildLog(root)],
    ]) {
      const p = path.join(root, rel);
      const prev = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
      if (prev !== next) stale.push(rel);
    }
    if (!stale.length) {
      console.log('okf index: up to date');
      return 0;
    }
    console.log(`okf index: ${stale.join(' and ')} stale - run \`okf index\``);
    return 1;
  }

  const { changed, indexChanged, logChanged } = writeIndex(root);
  if (!changed) {
    console.log('okf index: already up to date');
    return 0;
  }
  const written = [indexChanged && '.okf/index.md', logChanged && '.okf/log.md'].filter(Boolean);
  console.log(`okf index: ${written.join(' and ')} regenerated`);
  return 0;
}

function runMigrate(args) {
  const root = findRoot(args.root);
  const res = migrate(root, { dryRun: args.flags.dryRun });
  const prefix = args.flags.dryRun ? 'would rewrite' : 'rewrote';

  for (const f of res.rewritten) console.log(`  ${prefix}  ${f}`);
  for (const f of res.unparseable) console.log(`  UNPARSEABLE  ${f}  -> left untouched`);

  console.log(
    `\nokf migrate${args.flags.dryRun ? ' (dry run)' : ''}: ${res.examined.length} examined, ` +
      `${res.rewritten.length} rewritten, ${res.alreadyCurrent.length} already current, ` +
      `${res.unparseable.length} unparseable`
  );
  if (res.rewritten.length && !args.flags.dryRun) {
    console.log(
      'Migrated entries carry no `verified[]` attestation - nobody recorded who performed those\n' +
        'verifications. Each regains one at its next verification pass; `okf check` warns until then.'
    );
  }
  return res.unparseable.length ? 1 : 0;
}

function runNext(args) {
  if (!args.changeId) {
    console.error('okf next: missing <change-id>\n');
    process.stdout.write(USAGE);
    return 2;
  }

  const root = findRoot(args.root);
  const result = next(root, args.changeId);

  if (!result.answered) {
    console.error(`okf next: ${result.error ?? 'could not answer'}`);
    return 2;
  }

  if (result.owed.length) {
    for (const step of result.owed) {
      console.log(`${step.step}`);
      console.log(`  → ${step.command}`);
    }
  } else if (result.statement) {
    console.log(result.statement);
  } else {
    console.log(`Nothing owed under .okf/. Confirm with: okf check --archive ${args.changeId}`);
  }
  return 0;
}

function runInstall(args, mode) {
  const root = mode === 'init' ? args.root : findRoot(args.root);
  if (path.resolve(root) === KIT_ROOT) {
    console.error('okf: refusing to install the kit into itself');
    return 2;
  }

  const result = install(KIT_ROOT, root, VERSION, {
    mode,
    dryRun: args.flags.dryRun,
    force: args.flags.force,
  });

  if (!result.ok) {
    console.error(`okf ${mode}: ${result.reason}`);
    return 1;
  }

  const label = { add: 'add', update: 'update', unchanged: 'unchanged', 'skip-modified': 'MODIFIED LOCALLY' };
  const counts = { add: 0, update: 0, unchanged: 0, 'skip-modified': 0 };

  const prefix = args.flags.dryRun ? 'would ' : '';
  for (const a of result.actions) {
    counts[a.action]++;
    if (a.action === 'unchanged') continue;
    if (a.action === 'skip-modified') {
      const verb = args.flags.force ? `${prefix}overwrite (--force)` : 'skipped';
      console.log(`  ${label[a.action]}  ${a.rel}  -> ${verb}`);
    } else {
      console.log(`  ${prefix}${label[a.action]}  ${a.rel}`);
    }
  }

  const from = result.from ? ` from v${result.from}` : '';
  console.log(
    `\nokf ${mode}${args.flags.dryRun ? ' (dry run)' : ''}: v${VERSION}${from} - ` +
      `${counts.add} added, ${counts.update} updated, ${counts.unchanged} unchanged, ` +
      `${counts['skip-modified']} locally modified`
  );

  if (counts['skip-modified'] && !args.flags.force) {
    console.log(
      'Locally modified files were left alone. Diff them against the kit, fold in what you want,\n' +
        'then re-run with --force - or keep the local version and accept it will drift.'
    );
  }
  if (!args.flags.dryRun && mode === 'init') {
    console.log('Next: `okf index`, then `okf check`.');
  }
  return 0;
}

function main() {
  const argv = process.argv.slice(2);
  if (!argv.length || argv[0] === '-h' || argv[0] === '--help') {
    process.stdout.write(USAGE);
    return argv.length ? 0 : 2;
  }
  if (argv[0] === '-v' || argv[0] === '--version') {
    console.log(VERSION);
    return 0;
  }

  const args = parseArgs(argv);
  if (args.error) {
    console.error(`okf: ${args.error}\n`);
    process.stdout.write(USAGE);
    return 2;
  }
  if (args.flags.help) {
    process.stdout.write(USAGE);
    return 0;
  }

  switch (args.command) {
    case 'init':
      return runInstall(args, 'init');
    case 'upgrade':
      return runInstall(args, 'upgrade');
    case 'check':
      return runCheck(args);
    case 'next':
      return runNext(args);
    case 'audit':
      return runAudit(args);
    case 'index':
      return runIndex(args);
    case 'migrate':
      return runMigrate(args);
    default:
      console.error(`okf: unknown command "${args.command}"\n`);
      process.stdout.write(USAGE);
      return 2;
  }
}

process.exit(main());
