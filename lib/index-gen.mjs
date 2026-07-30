import fs from 'node:fs';
import path from 'node:path';

import { parseFrontmatter, asList } from './frontmatter.mjs';
import { tableUnder, isBlankRow } from './markdown.mjs';

const HEADER = `# OKF Index

<!--
GENERATED FILE - derived from the frontmatter of every file under \`features/\`
and \`decisions/\`. Regenerate with \`okf index\`; do not edit by hand.

The Needs Revision Ledger keeps its "What A Human Must Decide" notes across
regenerations - that column is the only hand-written content in this file.
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

export function buildIndex(root, { today = new Date().toISOString().slice(0, 10) } = {}) {
  const indexPath = path.join(root, '.okf', 'INDEX.md');
  const kept = existingLedger(indexPath);

  const features = [];
  for (const file of listMarkdown(path.join(root, '.okf', 'features'))) {
    const { data } = parseFrontmatter(fs.readFileSync(file, 'utf8'));
    if (!data) continue;
    features.push({ name: path.basename(file, '.md'), data });
  }

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
      `| [${f.name}](features/${f.name}.md) | ${cell(f.data.verified)} | ${cell(f.data.verified_at)} | ` +
        `${cell(asList(f.data.pending_changes))} | ${cell(f.data.criticality)} | ${cell(f.data.status)} |`
    );
  }

  out.push('\n## Decisions\n');
  out.push('| Decision | Date | Status | Affects |');
  out.push('| --- | --- | --- | --- |');
  for (const d of decisions) {
    out.push(
      `| [${d.data.title || d.file}](decisions/${d.file}) | ${cell(d.data.date)} | ` +
        `${cell(d.data.status)} | ${cell(asList(d.data.affects_features))} |`
    );
  }

  out.push('\n## Needs Revision Ledger\n');
  out.push(
    '<!-- The debt list. A row older than 30 days is an error, not a warning: a knowledge base ' +
      'that disagrees with its own code and nobody looks at is worse than none. -->\n'
  );
  out.push('| Capability | Since | Caused By Change | What A Human Must Decide |');
  out.push('| --- | --- | --- | --- |');
  for (const f of features.filter((x) => x.data.verified === 'needs-revision')) {
    const prev = kept.get(f.name);
    const since = prev?.since || f.data.verified_at || today;
    const cause = asList(f.data.linked_changes).slice(-1)[0] || '-';
    out.push(`| ${f.name} | ${cell(since)} | ${cell(cause)} | ${cell(prev?.note)} |`);
  }

  return out.join('\n') + '\n';
}

export function writeIndex(root, options = {}) {
  const indexPath = path.join(root, '.okf', 'INDEX.md');
  const next = buildIndex(root, options);
  const prev = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : null;
  if (prev === next) return { changed: false, path: indexPath };
  fs.writeFileSync(indexPath, next);
  return { changed: true, path: indexPath };
}
