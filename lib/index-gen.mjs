import fs from 'node:fs';
import path from 'node:path';

import { parseFrontmatter, asList } from './frontmatter.mjs';
import { tableUnder, isBlankRow } from './markdown.mjs';

/** The OKF specification revision this bundle targets. */
export const OKF_VERSION = '0.2';

const HEADER = `---
okf_version: "${OKF_VERSION}"
---

# OKF Index

<!--
GENERATED FILE - derived from the frontmatter of every file under \`features/\`
and \`decisions/\`. Regenerate with \`okf index\`; do not edit by hand.

\`okf_version\` declares the specification revision this bundle targets. This file
is the only place in the bundle where index frontmatter is permitted.

The Needs Revision Ledger keeps its "What A Human Must Decide" notes across
regenerations - that column is the only hand-written content in this file.
-->
`;

const LOG_HEADER = `# OKF Log

<!--
GENERATED FILE - derived from the Verification History table of every entry under
\`features/\`. Regenerate with \`okf index\`; do not edit by hand.

Newest date first, as the specification's log format requires.
-->
`;

function listMarkdown(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => path.join(dir, f));
}

function cell(value) {
  const s = Array.isArray(value) ? value.join(', ') : String(value ?? '').trim();
  return s === '' ? '-' : s.replace(/\|/g, '\\|');
}

/** Keep the human-written notes and the Since date from the existing ledger. */
function existingLedger(indexPath) {
  const kept = new Map();
  if (!fs.existsSync(indexPath)) return kept;
  const text = fs.readFileSync(indexPath, 'utf8');
  for (const cells of tableUnder(text, /Needs Revision Ledger/i)) {
    if (isBlankRow(cells)) continue;
    const name = (cells[0] || '').replace(/`/g, '').trim();
    if (!name) continue;
    kept.set(name, { since: (cells[1] || '').trim(), note: (cells[3] || '').trim() });
  }
  return kept;
}

function readFeatures(root) {
  const features = [];
  for (const file of listMarkdown(path.join(root, '.okf', 'features'))) {
    const text = fs.readFileSync(file, 'utf8');
    const { data } = parseFrontmatter(text);
    if (!data) continue;
    features.push({ name: path.basename(file, '.md'), data, text });
  }
  return features;
}

export function buildIndex(root, { today = new Date().toISOString().slice(0, 10) } = {}) {
  const indexPath = path.join(root, '.okf', 'index.md');
  const kept = existingLedger(indexPath);

  const features = readFeatures(root);

  const decisions = [];
  for (const file of listMarkdown(path.join(root, '.okf', 'decisions'))) {
    const { data } = parseFrontmatter(fs.readFileSync(file, 'utf8'));
    if (!data) continue;
    decisions.push({ file: path.basename(file), data });
  }

  const out = [HEADER];

  out.push('## Features\n');
  out.push('| Capability | Verified | Verified At | Pending Changes | Criticality | Status |');
  out.push('| --- | --- | --- | --- | --- | --- |');
  for (const f of features) {
    out.push(
      `| [${f.name}](features/${f.name}.md) | ${cell(f.data.verification_state)} | ${cell(f.data.verified_at)} | ` +
        `${cell(asList(f.data.pending_changes))} | ${cell(f.data.criticality)} | ${cell(f.data.status)} |`
    );
  }

  out.push('\n## Decisions\n');
  out.push('| Decision | Date | Status | Affects |');
  out.push('| --- | --- | --- | --- |');
  for (const d of decisions) {
    out.push(
      `| [${d.data.title || d.file}](decisions/${d.file}) | ${cell(d.data.date)} | ` +
        `${cell(d.data.decision_status || d.data.status)} | ${cell(asList(d.data.affects_features))} |`
    );
  }

  out.push('\n## Needs Revision Ledger\n');
  out.push(
    '<!-- The debt list. A row older than 30 days is an error, not a warning: a knowledge base ' +
      'that disagrees with its own code and nobody looks at is worse than none. -->\n'
  );
  out.push('| Capability | Since | Caused By Change | What A Human Must Decide |');
  out.push('| --- | --- | --- | --- |');
  for (const f of features.filter((x) => x.data.verification_state === 'needs-revision')) {
    const prev = kept.get(f.name);
    const since = prev?.since || f.data.verified_at || today;
    const cause = asList(f.data.linked_changes).slice(-1)[0] || '-';
    out.push(`| ${f.name} | ${cell(since)} | ${cell(cause)} | ${cell(prev?.note)} |`);
  }

  return out.join('\n') + '\n';
}

/**
 * The bundle's change history, as the specification's `log.md`: dated groups,
 * newest first. Derived from each entry's Verification History table, which stays
 * the authored record - this file is a projection of it, never a second copy to
 * keep in sync by hand.
 */
export function buildLog(root) {
  const byDate = new Map();

  for (const f of readFeatures(root)) {
    for (const cells of tableUnder(f.text, /Verification History/i)) {
      if (isBlankRow(cells)) continue;
      const date = (cells[0] || '').trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      const change = (cells[1] || '').trim();
      const status = (cells[2] || '').trim();
      const evidence = (cells[3] || '').trim();
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date).push({ capability: f.name, change, status, evidence });
    }
  }

  const out = [LOG_HEADER];
  for (const date of [...byDate.keys()].sort().reverse()) {
    out.push(`\n## ${date}\n`);
    const rows = byDate.get(date).sort((a, b) => a.capability.localeCompare(b.capability));
    for (const r of rows) {
      const change = r.change && r.change !== '-' ? ` in \`${r.change}\`` : '';
      const evidence = r.evidence && r.evidence !== '-' ? ` - ${r.evidence}` : '';
      out.push(`**Update** \`${r.capability}\` ${r.status || 'checked'}${change}${evidence}`);
    }
  }

  return out.join('\n') + '\n';
}

function writeIfChanged(file, next) {
  const prev = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (prev === next) return false;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, next);
  return true;
}

export function writeIndex(root, options = {}) {
  const indexPath = path.join(root, '.okf', 'index.md');
  const logPath = path.join(root, '.okf', 'log.md');

  const indexChanged = writeIfChanged(indexPath, buildIndex(root, options));
  const logChanged = writeIfChanged(logPath, buildLog(root));

  return { changed: indexChanged || logChanged, path: indexPath, logPath, indexChanged, logChanged };
}
