#!/usr/bin/env node
// Knowledge check for the OpenSpec + OKF workflow.
//
// It prints warnings and always exits 0: it points at drift, it never blocks.
// A warning that is wrong for the case at hand is ignored, not suppressed.
//
//   node .okf/check.mjs           warnings, or "ok"
//   node .okf/check.mjs --status  one line per entry: state, pending changes, criticality
//   node .okf/check.mjs --hook    Claude Code PostToolUse hook: reads the tool call on
//                                 stdin, runs only after an edit under .okf/ or openspec/,
//                                 and hands the warnings back to the agent as context
//
// Rule ids are compared with the base branch - OKF_BASE, else main, else origin/main -
// so an id that is renamed or deleted instead of deprecated is reported. Without git or
// a base branch that comparison is skipped.
//
// No dependencies; Node 18+.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OKF = path.join(ROOT, '.okf');
const FEATURES = path.join(OKF, 'features');
const DECISIONS = path.join(OKF, 'decisions');
const SPECS = path.join(ROOT, 'openspec', 'specs');
const CHANGES = path.join(ROOT, 'openspec', 'changes');
const ARCHIVE = path.join(CHANGES, 'archive');

const REQUIRED = ['type', 'title', 'description', 'status', 'verification_state', 'criticality'];
const STATES = ['unverified', 'verified', 'needs-revision'];
const SLUG = '[a-z0-9]+(?:-[a-z0-9]+)*';
const RULE_REF = new RegExp(`\\b(?:([a-z0-9][a-z0-9-]*)/)?BR-(${SLUG})\\b`, 'g');

const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '');
const rel = (p) => path.relative(ROOT, p);
const dirs = (p) =>
  fs.existsSync(p) ? fs.readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];
const mdFiles = (p) => (fs.existsSync(p) ? fs.readdirSync(p).filter((f) => f.endsWith('.md')) : []);
const stripComments = (s) => s.replace(/<!--[\s\S]*?-->/g, '');

// Enough YAML for entry frontmatter: scalars, `[]`, and lists of scalars.
function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  const data = {};
  if (!m) return null;
  let key = null;
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-z_]+):\s*(.*)$/);
    if (kv) {
      key = kv[1];
      const v = kv[2].trim().replace(/^["']|["']$/g, '');
      data[key] = v === '[]' ? [] : v === '' ? [] : v;
      continue;
    }
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && key && Array.isArray(data[key]) && !item[1].includes(': ')) data[key].push(item[1].trim());
  }
  return data;
}

const list = (v) => (Array.isArray(v) ? v : v ? [v] : []);

// Rows of the Business Rules and Permissions tables share one id space.
function rules(body) {
  const ids = new Map();
  const dupes = [];
  const malformed = [];
  for (const line of stripComments(body).split('\n')) {
    const m = line.match(/^\|\s*BR-(\S*)\s*\|/);
    if (!m) continue;
    if (!new RegExp(`^${SLUG}$`).test(m[1])) {
      malformed.push(`BR-${m[1]}`);
      continue;
    }
    if (ids.has(m[1])) dupes.push(`BR-${m[1]}`);
    ids.set(m[1], { deprecated: /\(deprecated in /.test(line) });
  }
  return { ids, dupes, malformed };
}

const git = (...args) => {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
};

let base;
function baseRef() {
  if (base === undefined)
    base = [process.env.OKF_BASE, 'main', 'origin/main'].find((r) => r && git('rev-parse', '--verify', '--quiet', `${r}^{commit}`) !== null) ?? null;
  return base;
}

// Rule ids of an entry as the base branch has it, or null when there is nothing to compare.
function baseIds(name) {
  const ref = baseRef();
  const text = ref && git('show', `${ref}:.okf/features/${name}.md`);
  return text ? rules(text.replace(/^---\n[\s\S]*?\n---/, '')).ids : null;
}

let files;
function repoFiles() {
  if (files) return files;
  files = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (['.git', 'node_modules'].includes(e.name)) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else files.push(rel(p).split(path.sep).join('/'));
    }
  };
  walk(ROOT);
  return files;
}

function globMatches(glob) {
  const re = new RegExp(
    '^' +
      glob
        .replace(/^\.\//, '')
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*\*\/?/g, '\u0000')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '[^/]')
        .replace(/\u0000/g, '(?:.*/)?') +
      '$',
  );
  return repoFiles().some((f) => re.test(f) || f.startsWith(glob.replace(/\/$/, '') + '/'));
}

function loadEntries(warn) {
  const entries = new Map();
  for (const file of mdFiles(FEATURES)) {
    const p = path.join(FEATURES, file);
    const name = file.replace(/\.md$/, '');
    const text = read(p);
    const fm = frontmatter(text);
    if (!fm) {
      warn(`${rel(p)}: no frontmatter`);
      continue;
    }
    const body = text.replace(/^---\n[\s\S]*?\n---/, '');
    const { ids, dupes, malformed } = rules(body);
    entries.set(name, { path: p, fm, body, ids });

    for (const k of REQUIRED) if (!fm[k] || (Array.isArray(fm[k]) && !fm[k].length)) warn(`${rel(p)}: frontmatter has no \`${k}\``);
    if (fm.title && fm.title !== name) warn(`${rel(p)}: title \`${fm.title}\` differs from the file name`);
    if (fm.verification_state && !STATES.includes(fm.verification_state))
      warn(`${rel(p)}: verification_state \`${fm.verification_state}\` is not one of ${STATES.join(', ')}`);
    if (fm.verification_state === 'verified') {
      if (!list(fm.verified_at).length) warn(`${rel(p)}: verified but has no verified_at`);
      const globs = list(fm.code_paths);
      if (!globs.length) warn(`${rel(p)}: verified but code_paths is empty`);
      for (const g of globs) if (!globMatches(g)) warn(`${rel(p)}: code_paths \`${g}\` matches no file`);
    }
    for (const d of dupes) warn(`${rel(p)}: ${d} appears twice - one subject, one rule`);
    for (const d of malformed) warn(`${rel(p)}: \`${d}\` is not a kebab-case slug such as BR-max-items`);
    const before = baseIds(name);
    for (const id of before?.keys() ?? [])
      if (!ids.has(id)) warn(`${rel(p)}: BR-${id} is on ${baseRef()} but gone here - deprecate a rule, never rename or delete it`);
    for (const id of ids.keys())
      if (/^\d+$/.test(id) && !before?.has(id)) warn(`${rel(p)}: BR-${id} is a number - name the rule's subject, e.g. BR-max-items`);

    const archived = dirs(ARCHIVE);
    for (const id of list(fm.pending_changes)) {
      if (fs.existsSync(path.join(CHANGES, id))) continue;
      if (archived.some((a) => a.endsWith(`-${id}`))) warn(`${rel(p)}: pending_changes still names \`${id}\`, which is archived`);
      else warn(`${rel(p)}: pending_changes names \`${id}\`, which is not an active change`);
    }

    const clean = stripComments(body);
    if (/<[a-z][a-z0-9 _|.:-]*>/.test(clean)) warn(`${rel(p)}: a \`<placeholder>\` is left in the body`);
    if (/^\|(\s*\|)+\s*$/m.test(clean)) warn(`${rel(p)}: an empty table row is left in the body`);
    if (/^\s*-\s*$/m.test(clean)) warn(`${rel(p)}: a bare \`-\` bullet is left in the body`);
  }
  const ref = baseRef();
  for (const file of (ref && git('ls-tree', '--name-only', `${ref}:.okf/features/`))?.split('\n') ?? [])
    if (file.endsWith('.md') && !entries.has(file.replace(/\.md$/, '')))
      warn(`.okf/features/${file} is on ${ref} but gone here - check nothing still cites its rules`);
  return entries;
}

// Resolve every rule reference in a file. A bare BR-<slug> belongs to `home`, when the
// file has one capability; elsewhere it is ambiguous.
function checkRefs(file, text, home, entries, warn) {
  for (const m of stripComments(text).matchAll(RULE_REF)) {
    const cap = m[1] || home;
    const ref = `${m[1] ? m[1] + '/' : ''}BR-${m[2]}`;
    if (!cap) {
      warn(`${rel(file)}: \`${ref}\` does not say which capability - write \`<capability>/BR-${m[2]}\``);
      continue;
    }
    const entry = entries.get(cap);
    if (!entry) warn(`${rel(file)}: \`${ref}\` - no entry .okf/features/${cap}.md`);
    else if (!entry.ids.has(m[2])) warn(`${rel(file)}: \`${ref}\` - ${cap} has no BR-${m[2]}`);
    else if (entry.ids.get(m[2]).deprecated && file.startsWith(CHANGES)) warn(`${rel(file)}: \`${ref}\` is deprecated in ${cap}`);
  }
}

function checkSpecs(entries, warn) {
  for (const cap of dirs(SPECS)) {
    const p = path.join(SPECS, cap, 'spec.md');
    const cited = read(p).split('\n').filter((l) => /^Implements:/.test(l)).join('\n');
    checkRefs(p, cited, cap, entries, warn);
  }
}

function checkChanges(entries, warn) {
  for (const id of dirs(CHANGES).filter((d) => d !== 'archive')) {
    const dir = path.join(CHANGES, id);
    const link = path.join(dir, 'okf-link.md');
    if (!fs.existsSync(link)) {
      if (/schema:\s*okf-gated-feature/.test(read(path.join(dir, '.openspec.yaml'))) && fs.readdirSync(dir).length > 1)
        warn(`${rel(dir)}: no okf-link.md yet`);
      continue;
    }

    const linked = [];
    const table = stripComments(read(link)).split(/^# Related Knowledge/m)[0];
    for (const line of table.split('\n')) {
      if (!line.startsWith('|') || /^\|\s*(Capability|---)/.test(line)) continue;
      const cells = line.split('|').slice(1, -1).map((c) => c.trim());
      if (/<[a-z-]+>/.test(line)) {
        warn(`${rel(link)}: a template row is left in the table`);
        continue;
      }
      const target = cells[1] || '';
      if (/^no domain knowledge - \S/.test(target)) continue;
      const p = target.replace(/`/g, '');
      const cap = path.basename(p, '.md');
      linked.push(cap);
      if (!fs.existsSync(path.join(ROOT, p))) {
        warn(`${rel(link)}: \`${p}\` does not exist`);
        continue;
      }
      const entry = entries.get(cap);
      if (entry && !list(entry.fm.linked_changes).includes(id)) warn(`${rel(entry.path)}: linked_changes does not name \`${id}\``);
    }
    if (!linked.length && !/no domain knowledge - \S/.test(table)) warn(`${rel(link)}: links no entry`);

    for (const cap of dirs(path.join(dir, 'specs'))) {
      const p = path.join(dir, 'specs', cap, 'spec.md');
      const cited = read(p).split('\n').filter((l) => /^Implements:/.test(l)).join('\n');
      checkRefs(p, cited, cap, entries, warn);
    }
    const home = linked.length === 1 ? linked[0] : null;
    for (const f of ['test-cases.md', 'test-plan.md', 'verification.md', 'tasks.md']) {
      const p = path.join(dir, f);
      if (fs.existsSync(p)) checkRefs(p, read(p), home, entries, warn);
    }
  }
}

function checkIndex(entries, warn) {
  const index = path.join(OKF, 'index.md');
  const named = new Set();
  for (const line of stripComments(read(index)).split('\n')) {
    const m = line.match(/^\|\s*\[?`?([a-z0-9][a-z0-9.-]*?)`?\]?(?:\([^)]*\))?\s*\|/);
    if (m) named.add(m[1]);
  }
  for (const name of entries.keys()) if (!named.has(name)) warn(`.okf/index.md: no row for \`${name}\``);
  for (const file of mdFiles(DECISIONS)) {
    const name = file.replace(/\.md$/, '');
    if (!named.has(name)) warn(`.okf/index.md: no row for decision \`${name}\``);
  }
  const known = new Set([...entries.keys(), ...mdFiles(DECISIONS).map((f) => f.replace(/\.md$/, ''))]);
  for (const name of named) if (!known.has(name)) warn(`.okf/index.md: row \`${name}\` has no file`);
}

function run() {
  const warnings = [];
  const warn = (w) => warnings.push(w);
  const entries = loadEntries(warn);
  checkSpecs(entries, warn);
  checkChanges(entries, warn);
  checkIndex(entries, warn);
  return { warnings, entries };
}

function status(entries) {
  if (!entries.size) return 'no entries';
  return [...entries]
    .map(([name, { fm }]) => {
      const pending = list(fm.pending_changes);
      const at = list(fm.verified_at).length ? ` ${fm.verified_at}` : '';
      return `${name}: ${fm.verification_state}${at}, criticality ${fm.criticality}` + (pending.length ? `, pending ${pending.join(' ')}` : '');
    })
    .join('\n');
}

const mode = process.argv[2];
try {
  if (mode === '--hook') {
    let input = '';
    for await (const chunk of process.stdin) input += chunk;
    const target = JSON.parse(input || '{}').tool_input?.file_path || '';
    const r = path.relative(ROOT, path.resolve(ROOT, target)).split(path.sep).join('/');
    if (/^(\.okf|openspec)\//.test(r)) {
      const { warnings } = run();
      if (warnings.length) {
        const additionalContext =
          `Knowledge check after editing ${r} (warnings, not a gate - fix what is real, mention what you leave):\n- ` +
          warnings.join('\n- ');
        process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext } }));
      }
    }
  } else if (mode === '--status') {
    console.log(status(run().entries));
  } else {
    const { warnings } = run();
    console.log(warnings.length ? warnings.map((w) => `warn: ${w}`).join('\n') : 'ok');
  }
} catch (err) {
  if (mode !== '--hook') console.error(`check could not finish: ${err.message}`);
}
process.exit(0);
