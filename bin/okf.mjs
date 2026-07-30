#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { check } from '../lib/check.mjs';
import { buildIndex, writeIndex } from '../lib/index-gen.mjs';

const USAGE = `okf - OpenSpec + OKF workflow validator

Usage:
  okf check [--archive <change-id>] [--root <dir>] [--json]
  okf index [--check] [--root <dir>]

Commands:
  check    Validate .okf entries, the index, config.yaml, and every active
           change's okf-link / test-plan / verification artifacts.
           --archive <change-id> adds the stricter pre-archive checks: the
           verification pass must be recorded, pending_changes cleared, and no
           skeleton test left without an owner.

  index    Regenerate .okf/INDEX.md from entry frontmatter.
           --check verifies it is up to date without writing (for CI).

Exit codes: 0 clean, 1 errors found, 2 bad usage.
`;

function parseArgs(argv) {
  const out = { command: argv[0], root: process.cwd(), flags: {} };
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--archive') out.flags.archive = argv[++i];
    else if (a === '--root') out.root = path.resolve(argv[++i]);
    else if (a === '--json') out.flags.json = true;
    else if (a === '--check') out.flags.check = true;
    else if (a === '-h' || a === '--help') out.flags.help = true;
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
  const report = check(root, { archiveChange: args.flags.archive ?? null });

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

function runIndex(args) {
  const root = findRoot(args.root);
  const indexPath = path.join(root, '.okf', 'INDEX.md');

  if (args.flags.check) {
    const next = buildIndex(root);
    const prev = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : null;
    if (prev === next) {
      console.log('okf index: up to date');
      return 0;
    }
    console.log('okf index: .okf/INDEX.md is stale - run `okf index`');
    return 1;
  }

  const { changed } = writeIndex(root);
  console.log(changed ? 'okf index: .okf/INDEX.md regenerated' : 'okf index: already up to date');
  return 0;
}

function main() {
  const argv = process.argv.slice(2);
  if (!argv.length || argv[0] === '-h' || argv[0] === '--help') {
    process.stdout.write(USAGE);
    return argv.length ? 0 : 2;
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
    case 'check':
      return runCheck(args);
    case 'index':
      return runIndex(args);
    default:
      console.error(`okf: unknown command "${args.command}"\n`);
      process.stdout.write(USAGE);
      return 2;
  }
}

process.exit(main());
