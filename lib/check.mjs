import fs from 'node:fs';
import path from 'node:path';

import { parseFrontmatter, asList } from './frontmatter.mjs';
import {
  allTableRows,
  isBlankRow,
  sectionUnder,
  splitRow,
  stripComments,
  stripFences,
  tableUnder,
} from './markdown.mjs';

const VERIFIED = ['unverified', 'verified', 'needs-revision'];
const STATUS = ['active', 'deprecated'];
const CRITICALITY = ['normal', 'high'];
const DECISION_STATUS = ['accepted', 'superseded', 'reversed'];
const TEST_STATUS = ['planned', 'skeleton', 'failing', 'passing'];
const VERDICTS = ['match', 'okf-gap', 'code-gap', 'conflict'];
const LEDGER_MAX_DAYS = 30;

export class Report {
  constructor() {
    this.findings = [];
  }
  error(file, message) {
    this.findings.push({ level: 'error', file, message });
  }
  warn(file, message) {
    this.findings.push({ level: 'warn', file, message });
  }
  get errors() {
    return this.findings.filter((f) => f.level === 'error');
  }
  get warnings() {
    return this.findings.filter((f) => f.level === 'warn');
  }
}

const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);

function listMarkdown(dir) {
  if (!exists(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(dir, f));
}

function activeChangeIds(root) {
  const dir = path.join(root, 'openspec', 'changes');
  if (!exists(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== 'archive')
    .map((e) => e.name);
}

function archivedChangeIds(root) {
  const dir = path.join(root, 'openspec', 'changes', 'archive');
  if (!exists(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

/** `2026-07-30-add-user-auth` -> `add-user-auth` */
function changeIdFromArchiveName(name) {
  return name.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

function rel(root, p) {
  return path.relative(root, p) || p;
}

// ---------------------------------------------------------------------------
// 1. config.yaml sanity
// ---------------------------------------------------------------------------

/**
 * A rule line containing an unquoted `: ` is parsed by YAML as a mapping, not a
 * string, and the OpenSpec CLI then silently drops that artifact's entire rules
 * array with a warning most people never read. Catch it here.
 */
function checkConfig(root, report) {
  const file = path.join(root, 'openspec', 'config.yaml');
  if (!exists(file)) {
    report.error('openspec/config.yaml', 'missing - the schema will fall back to spec-driven');
    return;
  }
  const where = rel(root, file);
  const lines = read(file).split('\n');

  if (!lines.some((l) => /^schema:\s*\S/.test(l))) {
    report.error(where, 'no `schema:` key - changes will be created with the default schema');
  }

  const rulesStart = lines.findIndex((l) => /^rules:\s*$/.test(l));
  if (rulesStart === -1) return;

  for (let i = rulesStart + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^\S/.test(line) && line.trim() !== '') break; // left the rules block
    const m = /^(\s*)-\s+(.*)$/.exec(line);
    if (!m) continue;
    const value = m[2].trim();
    const quoted = /^['"]/.test(value);
    if (!quoted && /:\s/.test(value)) {
      report.error(
        `${where}:${i + 1}`,
        'rule contains ": " unquoted, so YAML reads it as a mapping and the CLI drops every rule ' +
          "for this artifact - wrap the whole rule in single quotes"
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Content hygiene shared by every .okf entry
// ---------------------------------------------------------------------------

function checkHygiene(where, text, report) {
  const clean = stripFences(stripComments(text));

  const placeholders = new Set();
  for (const m of clean.matchAll(/<([^<>\n]{1,80})>/g)) {
    const inner = m[1];
    if (/^\//.test(inner) || /^[a-z]+\/?$/.test(inner)) continue; // stray html tag
    if (/^https?:/.test(inner)) continue; // autolink
    placeholders.add(m[0]);
  }
  if (placeholders.size) {
    report.error(
      where,
      `unfilled placeholder(s): ${[...placeholders].slice(0, 5).join(', ')}` +
        (placeholders.size > 5 ? ` (+${placeholders.size - 5} more)` : '')
    );
  }

  const blanks = allTableRows(text).filter(isBlankRow).length;
  if (blanks) {
    report.error(
      where,
      `${blanks} empty table row(s) - delete the row, or delete the whole section if it has no content`
    );
  }

  const bareBullets = clean.split('\n').filter((l) => /^-\s*$/.test(l)).length;
  if (bareBullets) {
    report.error(where, `${bareBullets} empty list item(s) left from the template`);
  }

  if (/HOW TO USE THIS TEMPLATE/.test(text)) {
    report.warn(where, 'still carries the template instruction comment - delete it once the entry has content');
  }
}

// ---------------------------------------------------------------------------
// 3. Feature entries
// ---------------------------------------------------------------------------

function collectRuleIds(text) {
  const ids = [];
  for (const heading of [/Business Rules/i, /Permissions And Access Control/i]) {
    for (const cells of tableUnder(text, heading)) {
      const id = (cells[0] || '').replace(/`/g, '').trim();
      if (/^BR-\d+$/.test(id)) ids.push(id);
    }
  }
  return ids;
}

function checkFeatureEntries(root, report) {
  const dir = path.join(root, '.okf', 'features');
  const active = new Set(activeChangeIds(root));
  const archived = new Set(archivedChangeIds(root).map(changeIdFromArchiveName));
  const entries = [];

  for (const file of listMarkdown(dir)) {
    const where = rel(root, file);
    const text = read(file);
    const { data } = parseFrontmatter(text);
    const base = path.basename(file, '.md');

    if (!data) {
      report.error(where, 'no YAML frontmatter');
      continue;
    }

    for (const key of ['type', 'title', 'description', 'status', 'verified', 'criticality']) {
      if (!data[key] || String(data[key]).trim() === '') {
        report.error(where, `frontmatter is missing \`${key}\``);
      }
    }
    if (data.title && data.title !== base) {
      report.error(
        where,
        `title "${data.title}" does not match the file name "${base}" - an entry is named after its capability`
      );
    }
    for (const [key, allowed] of [
      ['verified', VERIFIED],
      ['status', STATUS],
      ['criticality', CRITICALITY],
    ]) {
      if (data[key] && !allowed.includes(String(data[key]))) {
        report.error(where, `${key}: "${data[key]}" is not one of ${allowed.join(' | ')}`);
      }
    }

    const pending = asList(data.pending_changes);
    const codePaths = asList(data.code_paths);

    if (data.verified === 'verified') {
      if (!data.verified_at || String(data.verified_at).trim() === '') {
        report.error(where, 'verified without verified_at - when was it checked?');
      }
      if (!codePaths.length) {
        report.warn(where, 'verified but code_paths is empty - later drift detection needs it');
      }
    }
    if (data.verified === 'unverified' && data.verified_at) {
      report.warn(where, 'unverified but carries a verified_at date');
    }

    for (const id of pending) {
      if (active.has(id)) continue;
      if (archived.has(id)) {
        report.error(
          where,
          `pending_changes still lists "${id}", which is already archived - the OKF verification pass was skipped`
        );
      } else {
        report.error(where, `pending_changes lists "${id}", which is not an active change`);
      }
    }

    const ids = collectRuleIds(text);
    const seen = new Set();
    for (const id of ids) {
      if (seen.has(id)) report.error(where, `duplicate rule id ${id} - ids are never reused`);
      seen.add(id);
    }

    checkHygiene(where, text, report);
    entries.push({ file, where, base, data, pending, ruleIds: ids });
  }

  return entries;
}

function checkDecisionEntries(root, report) {
  const decisions = [];
  for (const file of listMarkdown(path.join(root, '.okf', 'decisions'))) {
    const where = rel(root, file);
    const text = read(file);
    const { data } = parseFrontmatter(text);
    if (!data) {
      report.error(where, 'no YAML frontmatter');
      continue;
    }
    for (const key of ['type', 'title', 'date', 'status']) {
      if (!data[key] || String(data[key]).trim() === '') {
        report.error(where, `frontmatter is missing \`${key}\``);
      }
    }
    if (data.status && !DECISION_STATUS.includes(String(data.status))) {
      report.error(where, `status: "${data.status}" is not one of ${DECISION_STATUS.join(' | ')}`);
    }
    if (!/^\d{4}-\d{2}-\d{2}-/.test(path.basename(file))) {
      report.warn(where, 'decision file names start with the date: <YYYY-MM-DD>-<slug>.md');
    }
    checkHygiene(where, text, report);
    decisions.push({ where, data });
  }
  return decisions;
}

// ---------------------------------------------------------------------------
// 4. INDEX.md and the needs-revision ledger
// ---------------------------------------------------------------------------

function checkIndex(root, entries, report) {
  const file = path.join(root, '.okf', 'INDEX.md');
  if (!exists(file)) {
    report.error('.okf/INDEX.md', 'missing - run `okf index`');
    return;
  }
  const where = rel(root, file);
  const text = read(file);

  const listed = new Set();
  for (const cells of tableUnder(text, /^#+\s*Features/i)) {
    if (isBlankRow(cells)) continue;
    const name = (cells[0] || '').replace(/[`\[\]]/g, '').split('(')[0].trim();
    if (name) listed.add(name);
  }

  for (const e of entries) {
    if (!listed.has(e.base)) {
      report.error(where, `does not list "${e.base}" - run \`okf index\``);
    }
  }
  for (const name of listed) {
    if (!entries.some((e) => e.base === name)) {
      report.error(where, `lists "${name}", which has no file under .okf/features/ - run \`okf index\``);
    }
  }

  const ledger = tableUnder(text, /Needs Revision Ledger/i).filter((c) => !isBlankRow(c));
  const needing = entries.filter((e) => e.data.verified === 'needs-revision');

  for (const e of needing) {
    if (!ledger.some((cells) => (cells[0] || '').replace(/`/g, '').trim() === e.base)) {
      report.error(where, `"${e.base}" is needs-revision but has no Needs Revision Ledger row`);
    }
  }

  const now = Date.now();
  for (const cells of ledger) {
    const name = (cells[0] || '').replace(/`/g, '').trim();
    const since = Date.parse((cells[1] || '').trim());
    if (Number.isNaN(since)) {
      report.warn(where, `ledger row "${name}" has no parseable Since date`);
      continue;
    }
    const days = Math.floor((now - since) / 86400000);
    if (days > LEDGER_MAX_DAYS) {
      report.error(
        where,
        `"${name}" has been needs-revision for ${days} days (limit ${LEDGER_MAX_DAYS}) - a human needs to settle it`
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 5. Per-change artifacts
// ---------------------------------------------------------------------------

function capabilitiesFromProposal(text) {
  const section = sectionUnder(stripComments(text), /^#+\s*Capabilities/i);
  const names = new Set();
  for (const m of section.matchAll(/^\s*[-*]\s*`([^`]+)`/gm)) {
    const name = m[1].trim();
    if (/^<.*>$/.test(name)) continue; // template placeholder
    names.add(name);
  }
  return names;
}

function okfLinkRows(text) {
  return tableUnder(text, /^#+\s*OKF Link/i).filter((c) => !isBlankRow(c));
}

function checkChange(root, changeId, report, { archiveMode = false } = {}) {
  const dir = path.join(root, 'openspec', 'changes', changeId);
  const at = (name) => path.join(dir, name);
  const linkFile = at('okf-link.md');

  if (!exists(linkFile)) {
    if (archiveMode) report.error(`openspec/changes/${changeId}`, 'no okf-link.md');
    return;
  }

  const where = rel(root, linkFile);
  const linkText = read(linkFile);
  const rows = okfLinkRows(linkText);
  const linked = [];

  if (!rows.length) {
    report.error(where, 'the OKF Link table has no rows');
  }

  for (const cells of rows) {
    const capability = (cells[0] || '').replace(/`/g, '').trim();
    const target = (cells[1] || '').replace(/`/g, '').trim();
    if (/^<.*>$/.test(capability) || capability === '') {
      report.error(where, 'a row still holds the template placeholder instead of a capability');
      continue;
    }

    if (/^no domain knowledge/i.test(target)) {
      const reason = target.replace(/^no domain knowledge\s*[-:]?\s*/i, '').trim();
      if (reason.length < 10) {
        report.error(
          where,
          `"${capability}" is marked as having no domain knowledge without a specific reason`
        );
      }
      continue;
    }

    if (!target) {
      report.error(where, `"${capability}" has no OKF file and no "no domain knowledge" reason`);
      continue;
    }
    const resolved = path.join(root, target);
    if (!exists(resolved)) {
      report.error(where, `"${capability}" points at ${target}, which does not exist on disk`);
      continue;
    }
    linked.push({ capability, target, resolved });
  }

  // okf-link rows must mirror the proposal's Capabilities section.
  const proposalFile = at('proposal.md');
  if (exists(proposalFile)) {
    const declared = capabilitiesFromProposal(read(proposalFile));
    const listed = new Set(
      rows.map((c) => (c[0] || '').replace(/`/g, '').trim()).filter((n) => n && !/^<.*>$/.test(n))
    );
    for (const name of declared) {
      if (!listed.has(name)) {
        report.error(where, `proposal.md declares capability "${name}" with no row here`);
      }
    }
    for (const name of listed) {
      if (!declared.has(name)) {
        report.error(
          rel(root, proposalFile),
          `okf-link.md has a row for "${name}", which the Capabilities section does not declare`
        );
      }
    }
  }

  // test-plan status vocabulary.
  const testPlanFile = at('test-plan.md');
  if (exists(testPlanFile)) {
    checkTestPlan(root, testPlanFile, report, { archiveMode });
  }

  // verification evidence.
  const verificationFile = at('verification.md');
  if (exists(verificationFile)) {
    checkVerification(root, dir, verificationFile, linked, changeId, report, { archiveMode });
  } else if (archiveMode) {
    report.error(`openspec/changes/${changeId}`, 'no verification.md - the OKF pass has not been recorded');
  }

  if (archiveMode) {
    for (const { capability, resolved } of linked) {
      const { data } = parseFrontmatter(read(resolved));
      if (!data) continue;
      if (data.verified === 'unverified') {
        report.error(
          rel(root, resolved),
          `still unverified while archiving "${changeId}" - run the OKF verification pass`
        );
      }
      if (asList(data.pending_changes).includes(changeId)) {
        report.error(
          rel(root, resolved),
          `pending_changes still contains "${changeId}" - the verification pass did not finish`
        );
      }
      void capability;
    }
  }
}

function statusColumnIndexes(headerCells) {
  const out = [];
  headerCells.forEach((c, i) => {
    if (/^(initial\s+)?status$/i.test(c)) out.push(i);
  });
  return out;
}

function checkTestPlan(root, file, report, { archiveMode }) {
  const where = rel(root, file);
  const text = read(file);
  const clean = stripComments(text);

  // "Not applicable" comes in two flavours and they must not be confused:
  // per-level ("Browser E2E: not applicable, no UI here") is normal and the rest
  // of the plan still applies; file-level means the whole change is untestable
  // and nothing below is expected. Both need a reason.
  let wholeFileExempt = false;
  for (const line of sectionUnder(clean, /Test Strategy/i).split('\n')) {
    const m = /not applicable/i.exec(line);
    if (!m) continue;
    const reason = line.slice(m.index + m[0].length).replace(/^[\s:,.\-–—]*(because)?\s*/i, '').trim();
    if (reason.length < 10) {
      report.error(
        where,
        `"${line.trim()}" gives no specific reason - write what makes it not applicable`
      );
      continue;
    }
    const perLevel = /^\s*[-*]\s*(unit|integration|api e2e|browser e2e)\b/i.test(line);
    if (!perLevel) wholeFileExempt = true;
  }
  if (wholeFileExempt) return;

  // Walk every table, find Status columns by header name, validate the vocabulary.
  const lines = clean.split('\n');
  let header = null;
  const pendingRows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim().startsWith('|')) {
      header = null;
      continue;
    }
    const cells = splitRow(line);
    if (/^\|[\s|:-]+\|?\s*$/.test(line.trim()) && line.includes('-')) continue;
    if (!header) {
      header = cells;
      continue;
    }
    if (isBlankRow(cells)) continue;

    for (const idx of statusColumnIndexes(header)) {
      const raw = (cells[idx] || '').trim();
      if (!raw) continue;
      const word = raw.split(/[\s:]/)[0].toLowerCase();
      if (!TEST_STATUS.includes(word)) {
        report.error(where, `unknown test status "${raw}" - use ${TEST_STATUS.join(' | ')}`);
        continue;
      }
      if (word === 'failing' && !/:/.test(raw)) {
        report.warn(
          where,
          `"${raw}" records no assertion message - Initial Status should read like "failing: expected 403, got 200"`
        );
      }
      if (word === 'skeleton' || word === 'planned') {
        pendingRows.push({ id: (cells[0] || '').trim(), word });
      }
    }
  }

  if (archiveMode && pendingRows.length) {
    const gaps = tableUnder(text, /Known Gaps/i).filter((c) => !isBlankRow(c));
    for (const row of pendingRows) {
      const listed = gaps.some((cells) => cells[0] === row.id && (cells[3] || '').trim() !== '');
      if (!listed) {
        report.error(
          where,
          `"${row.id}" is still ${row.word} but has no Known Gaps row with an owner - an untested requirement is about to be archived`
        );
      }
    }
  }
}

function citedRuleIds(changeDir) {
  const ids = new Set();
  const specsDir = path.join(changeDir, 'specs');
  const walk = (dir) => {
    if (!exists(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.md')) {
        for (const m of read(p).matchAll(/\bBR-\d+\b/g)) ids.add(m[0]);
      }
    }
  };
  walk(specsDir);
  return ids;
}

function checkVerification(root, changeDir, file, linked, changeId, report, { archiveMode }) {
  const where = rel(root, file);
  const text = read(file);
  const evidence = tableUnder(text, /Rule Evidence/i).filter((c) => !isBlankRow(c));

  const covered = new Set();
  for (const cells of evidence) {
    const id = (cells[0] || '').replace(/`/g, '').trim();
    const ev = (cells[2] || '').trim();
    const verdict = (cells[3] || '').replace(/`/g, '').trim().toLowerCase();

    if (!/^BR-\d+$/.test(id)) {
      report.error(where, `Rule Evidence row has "${id || '(empty)'}" where a BR-n id belongs`);
      continue;
    }
    covered.add(id);

    if (!ev) {
      report.error(where, `${id} has no evidence - a file:line reference or a test name, not a checkbox`);
    } else if (!/:\d+/.test(ev) && !/test|spec|it\(|describe/i.test(ev)) {
      report.warn(where, `${id} evidence "${ev}" is neither a file:line nor a test name`);
    }
    if (!VERDICTS.includes(verdict)) {
      report.error(where, `${id} has verdict "${verdict || '(empty)'}" - use ${VERDICTS.join(' | ')}`);
    }
  }

  const cited = citedRuleIds(changeDir);
  for (const id of cited) {
    if (!covered.has(id)) {
      report.error(where, `specs cite ${id} but the Rule Evidence table does not cover it`);
    }
  }

  if (archiveMode) {
    if (!evidence.length && linked.length) {
      report.error(where, 'the Rule Evidence table is empty - the OKF verification pass has not been done');
    }
    const outcome = tableUnder(text, /Entry Outcome/i).filter((c) => !isBlankRow(c));
    for (const { capability } of linked) {
      if (!outcome.some((cells) => (cells[0] || '').replace(/`/g, '').trim() === capability)) {
        report.error(where, `no Entry Outcome row for "${capability}"`);
      }
    }
    void changeId;
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function check(root, { archiveChange = null } = {}) {
  const report = new Report();

  if (!exists(path.join(root, '.okf'))) {
    report.error('.okf', 'not found - is this an okf-initialised repo?');
    return report;
  }

  checkConfig(root, report);
  const entries = checkFeatureEntries(root, report);
  checkDecisionEntries(root, report);
  checkIndex(root, entries, report);

  const changes = archiveChange ? [archiveChange] : activeChangeIds(root);
  for (const id of changes) {
    if (!exists(path.join(root, 'openspec', 'changes', id))) {
      report.error(`openspec/changes/${id}`, 'no such change');
      continue;
    }
    checkChange(root, id, report, { archiveMode: id === archiveChange });
  }

  return report;
}
