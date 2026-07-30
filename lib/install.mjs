import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/**
 * `okf init` / `okf upgrade`.
 *
 * The payload is the kit's own working files - the same schema, templates, and
 * addendum this repo develops against - so the kit can never ship something it
 * does not itself use.
 *
 * Ownership is explicit, because that is what makes upgrades safe:
 *
 *   kit-owned     overwritten on upgrade, but only when the project has not
 *                 edited them (tracked by hash in .okf/.okf-kit.json)
 *   project-owned never touched: .okf/features/, .okf/decisions/, INDEX.md,
 *                 and everything in CLAUDE.md / AGENTS.md outside the markers
 */

export const MANIFEST = '.okf/.okf-kit.json';
export const MARKER_FILES = ['CLAUDE.md', 'AGENTS.md'];

const START_RE = /<!--\s*okf-kit:start(?:\s+[^\s>-]+)?\s*-->/;
const END_RE = /<!--\s*okf-kit:end\s*-->/;

const PAYLOAD_FILES = ['openspec/config.yaml', '.okf/README.md'];
const PAYLOAD_DIRS = ['openspec/schemas/okf-gated-feature', '.okf/templates'];
const ENSURE_DIRS = ['.okf/features', '.okf/decisions'];

const NEW_MARKER_FILE_LEAD = `# Project instructions

Add your project's own conventions above or below the okf-kit block. Anything
inside the markers is managed by okf-kit and replaced on upgrade.
`;

const sha = (text) => crypto.createHash('sha256').update(text).digest('hex');
const exists = (p) => fs.existsSync(p);

function walk(dir, base = dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, base, out);
    else out.push(path.relative(base, abs));
  }
  return out;
}

/** Every kit-owned file, as repo-relative paths. */
export function payloadPaths(kitRoot) {
  const paths = [];
  for (const f of PAYLOAD_FILES) {
    if (exists(path.join(kitRoot, f))) paths.push(f);
  }
  for (const d of PAYLOAD_DIRS) {
    const abs = path.join(kitRoot, d);
    if (!exists(abs)) continue;
    for (const rel of walk(abs)) paths.push(path.posix.join(d, rel.split(path.sep).join('/')));
  }
  return paths.sort();
}

export function readManifest(root) {
  const p = path.join(root, MANIFEST);
  if (!exists(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return { broken: true, files: {} };
  }
}

/** The addendum body between the markers, without the markers themselves. */
export function extractAddendum(kitRoot) {
  for (const name of MARKER_FILES) {
    const p = path.join(kitRoot, name);
    if (!exists(p)) continue;
    const text = fs.readFileSync(p, 'utf8');
    const s = START_RE.exec(text);
    const e = END_RE.exec(text);
    if (!s || !e || e.index < s.index) continue;
    return text.slice(s.index + s[0].length, e.index).trim();
  }
  throw new Error('the kit has no okf-kit marker block to install');
}

function wrapAddendum(body, version) {
  return `<!-- okf-kit:start v${version} -->\n${body}\n<!-- okf-kit:end -->`;
}

/**
 * What would change, without touching disk.
 * action: add | update | unchanged | skip-modified
 */
export function plan(kitRoot, root, version) {
  const manifest = readManifest(root) ?? { files: {} };
  const recorded = manifest.files ?? {};
  const actions = [];

  for (const rel of payloadPaths(kitRoot)) {
    const next = fs.readFileSync(path.join(kitRoot, rel), 'utf8');
    const target = path.join(root, rel);

    if (!exists(target)) {
      actions.push({ rel, action: 'add', content: next });
      continue;
    }
    const current = fs.readFileSync(target, 'utf8');
    if (current === next) {
      actions.push({ rel, action: 'unchanged', content: next });
      continue;
    }
    if (recorded[rel] && recorded[rel] !== sha(current)) {
      actions.push({ rel, action: 'skip-modified', content: next });
      continue;
    }
    actions.push({ rel, action: 'update', content: next });
  }

  const body = extractAddendum(kitRoot);
  const block = wrapAddendum(body, version);

  for (const name of MARKER_FILES) {
    const target = path.join(root, name);
    if (!exists(target)) {
      actions.push({ rel: name, action: 'add', marker: true, content: `${NEW_MARKER_FILE_LEAD}\n${block}\n` });
      continue;
    }
    const text = fs.readFileSync(target, 'utf8');
    const s = START_RE.exec(text);
    const e = END_RE.exec(text);

    if (!s || !e || e.index < s.index) {
      actions.push({
        rel: name,
        action: 'add',
        marker: true,
        content: `${text.replace(/\s*$/, '')}\n\n${block}\n`,
      });
      continue;
    }

    const currentBody = text.slice(s.index + s[0].length, e.index).trim();
    const nextText = text.slice(0, s.index) + block + text.slice(e.index + e[0].length);

    if (currentBody === body && nextText === text) {
      actions.push({ rel: name, action: 'unchanged', marker: true, content: text, blockBody: body });
      continue;
    }
    if (recorded[`${name}#block`] && recorded[`${name}#block`] !== sha(currentBody)) {
      actions.push({ rel: name, action: 'skip-modified', marker: true, content: nextText, blockBody: body });
      continue;
    }
    actions.push({ rel: name, action: 'update', marker: true, content: nextText, blockBody: body });
  }

  return { actions, manifest };
}

function applyActions(root, actions, { force }) {
  const written = [];
  for (const a of actions) {
    if (a.action === 'unchanged') continue;
    if (a.action === 'skip-modified' && !force) continue;
    const target = path.join(root, a.rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, a.content);
    written.push(a);
  }
  return written;
}

function writeManifest(root, kitRoot, version, body) {
  const files = {};
  for (const rel of payloadPaths(kitRoot)) {
    const target = path.join(root, rel);
    if (exists(target)) files[rel] = sha(fs.readFileSync(target, 'utf8'));
  }
  for (const name of MARKER_FILES) {
    const target = path.join(root, name);
    if (!exists(target)) continue;
    const text = fs.readFileSync(target, 'utf8');
    const s = START_RE.exec(text);
    const e = END_RE.exec(text);
    if (!s || !e || e.index < s.index) continue;
    files[`${name}#block`] = sha(text.slice(s.index + s[0].length, e.index).trim());
  }

  const manifest = {
    version,
    installedAt: new Date().toISOString(),
    note: 'Generated by okf init/upgrade. Hashes let upgrade tell an untouched file from one your team edited - do not edit by hand.',
    files,
  };
  const p = path.join(root, MANIFEST);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

export function install(kitRoot, root, version, { mode = 'init', dryRun = false, force = false } = {}) {
  const already = readManifest(root);
  if (mode === 'init' && already && !force) {
    return {
      ok: false,
      reason: `already initialised at v${already.version ?? '?'} - run \`okf upgrade\` instead`,
      actions: [],
    };
  }
  if (mode === 'upgrade' && !already) {
    return { ok: false, reason: 'no .okf/.okf-kit.json found - run `okf init` first', actions: [] };
  }

  const { actions } = plan(kitRoot, root, version);
  if (dryRun) return { ok: true, dryRun: true, actions, from: already?.version ?? null };

  for (const d of ENSURE_DIRS) {
    const abs = path.join(root, d);
    fs.mkdirSync(abs, { recursive: true });
    const keep = path.join(abs, '.gitkeep');
    if (!fs.readdirSync(abs).length) fs.writeFileSync(keep, '');
  }

  applyActions(root, actions, { force });
  const body = extractAddendum(kitRoot);
  writeManifest(root, kitRoot, version, body);

  return { ok: true, actions, from: already?.version ?? null };
}
