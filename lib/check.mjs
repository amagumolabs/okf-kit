import fs from 'node:fs';
import path from 'node:path';

import { parseFrontmatter, asList } from './frontmatter.mjs';
import { MARKER_FILES, readManifest } from './install.mjs';
import {
  allTableRows,
  isBlankRow,
  sectionUnder,
  splitRow,
  stripComments,
  stripFences,
  tableUnder,
} from './markdown.mjs';

const VERIFICATION_STATE = ['unverified', 'verified', 'needs-revision'];
const STATUS = ['draft', 'stable', 'deprecated'];
const CRITICALITY = ['normal', 'high'];
const DECISION_STATUS = ['accepted', 'superseded', 'reversed'];

/**
 * The OKF actor convention. Trust tier derivation keys off the `human:` prefix,
 * so an actor written outside these three forms silently loses its tier.
 */
const ACTOR = /^(human:[\w.\-]+|process:[\w.\-]+|[\w.\-]+\/[\w.\-]+)$/;
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;
const RESERVED_BUNDLE_FILES = new Set(['index.md', 'log.md']);
const SCALAR_VERIFIED = Symbol('scalar');
const TEST_STATUS = ['planned', 'skeleton', 'failing', 'passing'];
const VERDICTS = ['match', 'okf-gap', 'code-gap', 'conflict'];
const LEDGER_MAX_DAYS = 30;

/**
 * How hard the state/attestation coupling bites. It ships as a warning: a project
 * that has migrated but not yet re-verified holds entries that are verified by
 * the workflow and carry no attestation, and blocking them on a rule they had no
 * opportunity to satisfy would make migration unadoptable. Promote to 'error' one
 * release after migration ships - that is the whole change.
 */
const COUPLING_SEVERITY = 'warn';

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

/**
 * Is this occurrence of `openspec/changes/...` a pointer at one particular
 * change, or a sentence describing the path shape?
 *
 * Only the first answer is a reference, and only a reference can dangle. The
 * distinction is drawn from the text itself rather than from a list of excused
 * files, because a file list records that today's bundle is clean - not that the
 * rule is right - and stops protecting the moment a file is added.
 *
 * @param {string} text one `openspec/changes/`-prefixed run, prefix included
 * @returns {'prose' | 'locator'}
 */
export function classifyChangeReference(text) {
  const rest = text.replace(/^openspec\/changes\/?/, '');
  const segment = /^(?:archive\/)?([^/\s)`'"]*)/.exec(rest)[1];

  if (!segment) return 'prose'; // the bare prefix, or a bare `archive/`
  if (/^<.*>$/.test(segment)) return 'prose'; // a placeholder names the shape
  return 'locator';
}

/**
 * The change id a locator points at, for the message's suggested fix. An
 * archived directory carries a `<date>-` prefix that is not part of the id.
 */
function changeIdFromLocator(text) {
  const rest = text.replace(/^openspec\/changes\/?/, '');
  const archived = rest.startsWith('archive/');
  const segment = /^(?:archive\/)?([^/\s)`'"]*)/.exec(rest)[1];
  return archived ? segment.replace(/^\d{4}-\d{2}-\d{2}-/, '') : segment;
}

/**
 * Every `openspec/changes/...` run in `text`, comments and fences removed.
 *
 * Trailing punctuation is dropped: a path at the end of a sentence collects the
 * full stop, and one introducing a quote collects the colon. Keeping either
 * turns a real path into an unrecognisable one and puts the punctuation inside
 * the suggested change id.
 */
function findChangeReferences(text) {
  return [...stripFences(stripComments(text)).matchAll(/openspec\/changes[^\s)`'"|]*/g)].map((m) =>
    m[0].replace(/[.,:;]+$/, '')
  );
}

/**
 * A `sources` entry may be a path, a `change:<id>` reference, a URL, or a quoted
 * sentence. Only path-shaped values are checked, and they must resolve - a
 * dangling provenance link is worse than none, because it looks like evidence.
 *
 * Paths under `openspec/changes/` are rejected outright: archiving renames that
 * directory, so such a reference is guaranteed to break later. Use `change:<id>`.
 */
function checkProvenance(root, where, data, report) {
  const sources = Array.isArray(data.sources) ? data.sources : [];
  for (const s of sources) {
    const resource = String((s && s.resource) ?? '').trim();
    if (!resource) {
      report.warn(where, 'a sources entry has no resource');
      continue;
    }
    if (/^(change:|https?:)/i.test(resource)) continue;
    if (!/^[\w.\-/]+\.\w{1,6}$/.test(resource)) continue; // a quote or free text

    if (/^openspec\/changes\//.test(resource) && classifyChangeReference(resource) === 'locator') {
      report.error(
        where,
        `sources references "${resource}" - a path under openspec/changes/ is renamed at archive time; ` +
          'use `change:<change-id>` instead'
      );
      continue;
    }
    if (!exists(path.join(root, resource))) {
      report.error(where, `sources references "${resource}", which does not exist`);
    }
  }
}

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

/**
 * `verified` is the specification's attestation list: who vouches for the entry's
 * CURRENT content. Absent, empty, a bare mapping, and a list are all legitimate
 * shapes; a scalar is the pre-conformance workflow state and is an error.
 *
 * @returns {null | typeof SCALAR_VERIFIED | object[]} null when nobody vouches
 */
function readAttestations(data) {
  const v = data.verified;
  if (v === undefined || v === null) return null;
  if (Array.isArray(v)) return v.length ? v : null;
  if (typeof v === 'object') return [v]; // bare mapping - one-element list
  if (String(v).trim() === '') return null;
  return SCALAR_VERIFIED;
}

function checkAttestations(where, list, report) {
  for (const a of list) {
    const by = String(a.by ?? '').trim();
    const at = String(a.at ?? '').trim();
    if (!by) {
      report.error(where, 'an attestation has no `by` - the specification requires it whenever the family is present');
    } else if (!ACTOR.test(by)) {
      report.error(
        where,
        `attestation actor "${by}" is not one of <producer>/<version>, human:<id>, process:<id> - ` +
          'an actor outside the convention loses its trust tier'
      );
    }
    if (!at || !ISO_DATETIME.test(at)) {
      report.error(where, `an attestation \`at\` must be an ISO 8601 datetime, got "${at || '(empty)'}"`);
    }
  }
}

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

    for (const key of ['type', 'title', 'description', 'status', 'verification_state', 'criticality']) {
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
      ['verification_state', VERIFICATION_STATE],
      ['status', STATUS],
      ['criticality', CRITICALITY],
    ]) {
      if (data[key] && !allowed.includes(String(data[key]))) {
        report.error(where, `${key}: "${data[key]}" is not one of ${allowed.join(' | ')}`);
      }
    }

    const pending = asList(data.pending_changes);
    const codePaths = asList(data.code_paths);

    const state = String(data.verification_state ?? '').trim();
    const att = readAttestations(data);

    if (att === SCALAR_VERIFIED) {
      report.error(
        where,
        '`verified` holds a scalar - workflow state belongs in `verification_state`, and `verified` is ' +
          "the specification's attestation list. Run `okf migrate`."
      );
    }

    if (state === 'verified') {
      if (!data.verified_at || String(data.verified_at).trim() === '') {
        report.error(where, 'verified without verified_at - when was it checked?');
      }
      if (!codePaths.length) {
        report.warn(where, 'verified but code_paths is empty - later drift detection needs it');
      }

      if (att === null) {
        // Warning, not error: a project that has migrated but not yet re-verified
        // holds exactly this shape, and blocking it on a rule it had no chance to
        // satisfy would make migration unadoptable.
        report[COUPLING_SEVERITY](
          where,
          'verified but carries no attestation - `verified[]` records who vouched for the current content, ' +
            'and a migrated entry regains one at its next verification pass'
        );
      } else if (Array.isArray(att)) {
        checkAttestations(where, att, report);

        const newest = att
          .map((a) => String(a.at ?? '').trim())
          .filter(Boolean)
          .sort()
          .pop();
        if (newest && String(data.verified_at ?? '').trim() !== newest.slice(0, 10)) {
          report.error(
            where,
            `verified_at is ${data.verified_at} but the newest attestation is dated ${newest} - they must agree`
          );
        }

        // Absence is reportable; presence is not proof. No in-repo signal separates
        // a person's bytes from an agent's under a shared git identity, and an
        // error here would only manufacture forged sign-offs on the entries that
        // matter most.
        if (String(data.criticality) === 'high' && !att.some((a) => /^human:/.test(String(a.by ?? '').trim()))) {
          report.warn(
            where,
            'criticality: high and verified, but no `human:` actor vouches for it - this reports the absence ' +
              'only, and never claims that a present human attestation was written by a person'
          );
        }
      }
    } else if (state === 'unverified' || state === 'needs-revision') {
      if (att !== null && att !== SCALAR_VERIFIED) {
        report.error(
          where,
          `verification_state: ${state} but a \`verified\` key is present - a consumer derives its trust tier ` +
            'from that key and would read this entry as confirmed'
        );
      }
      if (state === 'unverified' && data.verified_at) {
        report.warn(where, 'unverified but carries a verified_at date');
      }
    }

    const generated = data.generated;
    if (generated && typeof generated === 'object') {
      const by = String(generated.by ?? '').trim();
      if (by && !ACTOR.test(by)) {
        report.error(
          where,
          `generated.by "${by}" is not one of <producer>/<version>, human:<id>, process:<id> - ` +
            'an actor outside the convention loses its trust tier'
        );
      }
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

    checkProvenance(root, where, data, report);
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
    for (const key of ['type', 'title', 'date', 'status', 'decision_status']) {
      if (!data[key] || String(data[key]).trim() === '') {
        report.error(where, `frontmatter is missing \`${key}\``);
      }
    }
    // Two lifecycles, two keys. `status` is the specification's document
    // lifecycle; a decision's own accepted/superseded state is the kit's, and
    // overloading one key would give consumers no way to tell them apart.
    if (data.status && !STATUS.includes(String(data.status))) {
      report.error(where, `status: "${data.status}" is not one of ${STATUS.join(' | ')}`);
    }
    if (data.decision_status && !DECISION_STATUS.includes(String(data.decision_status))) {
      report.error(
        where,
        `decision_status: "${data.decision_status}" is not one of ${DECISION_STATUS.join(' | ')}`
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}-/.test(path.basename(file))) {
      report.warn(where, 'decision file names start with the date: <YYYY-MM-DD>-<slug>.md');
    }
    checkProvenance(root, where, data, report);
    checkHygiene(where, text, report);
    decisions.push({ where, data });
  }
  return decisions;
}

// ---------------------------------------------------------------------------
// 4. The bundle root index, its version marker, and the needs-revision ledger
// ---------------------------------------------------------------------------

/**
 * Every `.md` file in the bundle that is not a reserved filename is a concept
 * document, and the specification's second conformance rule requires it to carry
 * a non-empty `type`. A file holding no knowledge either carries a type or lives
 * outside `.okf/`.
 */
function checkBundleFiles(root, report) {
  const bundle = path.join(root, '.okf');
  if (!exists(bundle)) return;

  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(abs);
        continue;
      }
      if (!e.name.endsWith('.md')) continue;
      if (RESERVED_BUNDLE_FILES.has(e.name)) continue;

      const { data } = parseFrontmatter(read(abs));
      if (!data || !data.type || String(data.type).trim() === '') {
        report.error(
          rel(root, abs),
          'every file in the bundle that is not index.md or log.md is a concept document and needs ' +
            'frontmatter with a non-empty `type` - give it one, or move the file outside .okf/'
        );
      }
    }
  };
  walk(bundle);
}

/**
 * Every `.md` in the bundle, scanned for references that name a change by
 * location instead of by identity.
 *
 * Reserved files are included, unlike in `checkBundleFiles` above. That
 * exemption is about the `type` frontmatter requirement - `index.md` and
 * `log.md` carry structural rather than concept content - and says nothing
 * about whether the references inside them resolve. `log.md` in particular is
 * generated from Verification History evidence, which is free text an author
 * wrote somewhere else.
 *
 * @param {string} root
 * @param {Report} report
 */
function checkDurableReferences(root, report) {
  const bundle = path.join(root, '.okf');
  if (!exists(bundle)) return;

  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(abs);
        continue;
      }
      if (!e.name.endsWith('.md')) continue;

      // Frontmatter is `checkProvenance`'s territory. Scanning it here too would
      // report one locator twice, in two different wordings.
      const { body } = parseFrontmatter(read(abs));

      for (const ref of findChangeReferences(body)) {
        if (classifyChangeReference(ref) === 'prose') continue;

        const id = changeIdFromLocator(ref);
        const why = ref.startsWith('openspec/changes/archive/')
          ? 'a path into the archive is still a location, and the id is already in the directory name'
          : 'a path under openspec/changes/ is renamed at archive time';
        report.error(rel(root, abs), `names "${ref}" - ${why}; use \`change:${id}\` instead`);
      }
    }
  };
  walk(bundle);
}

function checkIndex(root, entries, report) {
  const file = path.join(root, '.okf', 'index.md');
  if (!exists(file)) {
    report.error('.okf/index.md', 'missing - run `okf index`');
    return;
  }
  const where = rel(root, file);
  const text = read(file);

  const { data } = parseFrontmatter(text);
  if (!data || !data.okf_version || String(data.okf_version).trim() === '') {
    report.error(
      where,
      'no `okf_version` in frontmatter - the bundle root index is the only place the targeted ' +
        'specification version can be declared'
    );
  }

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
  const needing = entries.filter((e) => e.data.verification_state === 'needs-revision');

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
      if (data.verification_state === 'unverified') {
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

/**
 * Markdown wraps. A bullet continued on the next line is one bullet, and reading
 * it as two produces nonsense - the tail of a sentence looks like a statement of
 * its own.
 */
function logicalBullets(text) {
  const out = [];
  for (const line of text.split('\n')) {
    if (line.trim() === '') {
      out.push('');
      continue;
    }
    if (/^\s*[-*]\s/.test(line) || out.length === 0) out.push(line);
    else out[out.length - 1] += ' ' + line.trim();
  }
  return out.filter((b) => b.trim() !== '');
}

/**
 * A declaration, not a mention. "Integration: not applicable, no boundary" says
 * something; "see test-cases.md Not Applicable" only names a section. The phrase
 * must start the bullet's value to count.
 */
function notApplicableDeclaration(bullet) {
  let value = bullet.replace(/^\s*[-*]\s*/, '');
  const label = /^([^:]{1,24}):\s*/.exec(value);
  const perLevel = Boolean(label);
  if (label) value = value.slice(label[0].length);

  if (!/^not applicable/i.test(value)) return null;
  const reason = value
    .replace(/^not applicable\s*/i, '')
    .replace(/^(because)?\s*[:,.\-–—]*\s*/i, '')
    .trim();
  return { perLevel, reason };
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
  for (const bullet of logicalBullets(sectionUnder(clean, /Test Strategy/i))) {
    const decl = notApplicableDeclaration(bullet);
    if (!decl) continue;
    if (decl.reason.length < 10) {
      report.error(
        where,
        `"${bullet.trim()}" gives no specific reason - write what makes it not applicable`
      );
      continue;
    }
    if (!decl.perLevel) wholeFileExempt = true;
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

const DECISIONS_DIR = '.okf/decisions';

/**
 * Which of the two shapes `design.md` is in, per the schema's own `design` rule:
 * either a real design with a Decisions section, or the one-line
 * `Not required because <reason>.` waiver.
 *
 * Anything else is `unrecognised`, and the caller turns that into a required row
 * rather than a waiver. Treating an unreadable design as "nothing to promote" is
 * the bug this gate exists to close: a truncated, empty, or reworded file would
 * waive itself, and a check that never ran looks exactly like one that passed.
 */
function designShape(text) {
  const clean = stripFences(stripComments(text));
  if (sectionUnder(clean, /Decisions/i).trim()) return 'has-decisions';
  if (/^\s*Not required because\s+\S/im.test(clean)) return 'waived';
  return 'unrecognised';
}

/**
 * How many decisions the Decisions section holds.
 *
 * Deliberately heuristic, because the section has no fixed syntax: this repo's own
 * designs use `**Bold lead sentence.**` paragraphs, downstream projects use
 * `1. **Bold title**`, and either may use `###` subheadings. Recognising a
 * bold-lead line with an optional list marker or number covers all three and will
 * still sometimes be wrong - which is precisely why only the BR-6 warning depends
 * on this number, and never an error.
 */
function countDecisions(text) {
  const section = sectionUnder(stripFences(stripComments(text)), /Decisions/i);
  let n = 0;
  for (const line of section.split('\n')) {
    if (/^#{3,6}\s+\S/.test(line)) n++;
    else if (/^\s{0,3}(?:[-*+]\s+|\d+[.)]\s+)?\*\*\S/.test(line)) n++;
  }
  return n;
}

/** A `-` is this workflow's way of writing an empty cell. Both read as absent. */
const cellEmpty = (c) => c === '' || c === '-';

/**
 * The decision promotion gate (BR-3..BR-6, BR-8).
 *
 * Change-scoped, not entry-scoped: it runs whether or not any okf-link row
 * resolved to a feature entry. Keying it on that is what let a change declaring
 * `no domain knowledge` archive with its whole OKF pass blank.
 */
function checkDecisionPromotion(root, changeDir, verificationText, where, report) {
  const designFile = path.join(changeDir, 'design.md');
  const shape = exists(designFile) ? designShape(read(designFile)) : 'unrecognised';
  const rows = tableUnder(verificationText, /Decision Promotion/i).filter((c) => !isBlankRow(c));

  for (const cells of rows) {
    const decision = (cells[0] || '').trim() || '(unnamed)';
    const target = (cells[1] || '').replace(/`/g, '').trim();
    const reason = (cells[2] || '').trim();

    if (cellEmpty(target)) {
      if (cellEmpty(reason)) {
        report.error(
          where,
          `Decision Promotion row "${decision}" has neither a promoted path nor a reason for not promoting`
        );
      }
      continue;
    }
    const inside = target === DECISIONS_DIR || target.startsWith(`${DECISIONS_DIR}/`);
    if (!inside) {
      report.error(
        where,
        `Decision Promotion row "${decision}" promotes to ${target}, which is not under \`${DECISIONS_DIR}/\` - ` +
          'a decision filed anywhere else is buried just the same'
      );
    } else if (!exists(path.join(root, target))) {
      report.error(where, `Decision Promotion row "${decision}" points at ${target}, which does not exist on disk`);
    }
  }

  if (shape === 'waived') return;

  if (!rows.length) {
    if (shape === 'unrecognised') {
      report.error(
        where,
        'the Decision Promotion table is empty, and design.md is neither a design with a Decisions section nor ' +
          'the one-line "Not required because <reason>." waiver, so the table cannot be waived'
      );
    } else {
      report.error(
        where,
        'the Decision Promotion table is empty while design.md holds decisions - archiving buries design.md, so ' +
          'name each decision with a path under `.okf/decisions/` or a reason it is change-local'
      );
    }
    return;
  }

  const decisions = countDecisions(read(designFile));
  if (rows.length < decisions) {
    report.warn(
      where,
      `the Decision Promotion table has ${rows.length} row(s) for ${decisions} decision(s) in design.md - ` +
        'account for the rest, or state why they are change-local'
    );
  }
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
    // Entry-scoped gates: these describe a feature entry, so with no resolving
    // okf-link row there is nothing for them to describe and silence is correct.
    if (!evidence.length && linked.length) {
      report.error(where, 'the Rule Evidence table is empty - the OKF verification pass has not been done');
    }
    const outcome = tableUnder(text, /Entry Outcome/i).filter((c) => !isBlankRow(c));
    for (const { capability } of linked) {
      if (!outcome.some((cells) => (cells[0] || '').replace(/`/g, '').trim() === capability)) {
        report.error(where, `no Entry Outcome row for "${capability}"`);
      }
    }

    // Change-scoped gates: these describe the change itself. Keying them on
    // `linked` is what let a change declaring "no domain knowledge" archive with
    // its whole OKF pass blank, so they must not consult it.
    checkDecisionPromotion(root, changeDir, text, where, report);

    void changeId;
  }
}

// ---------------------------------------------------------------------------
// 6. Kit installation health
// ---------------------------------------------------------------------------

const MARKER_START = /<!--\s*okf-kit:start(?:\s+v?([^\s>-]+))?\s*-->/;
const MARKER_END = /<!--\s*okf-kit:end\s*-->/;

function markerBlock(text) {
  const s = MARKER_START.exec(text);
  const e = MARKER_END.exec(text);
  if (!s || !e || e.index < s.index) return null;
  return { version: s[1] ?? null, body: text.slice(s.index + s[0].length, e.index).trim() };
}

/**
 * Only meaningful in a project that was installed with `okf init`. The kit's own
 * repo has no manifest, so skip quietly there rather than inventing findings.
 */
function checkKitInstall(root, kitVersion, report) {
  const manifest = readManifest(root);
  const blocks = new Map();

  for (const name of MARKER_FILES) {
    const file = path.join(root, name);
    if (!exists(file)) {
      if (manifest) report.error(name, 'missing - the OKF addendum lives here, run `okf upgrade`');
      continue;
    }
    const block = markerBlock(read(file));
    if (!block) {
      report.error(name, 'has no okf-kit marker block - run `okf upgrade` to install it');
      continue;
    }
    blocks.set(name, block);
  }

  // Claude, Codex, and Cursor read different files; a divergence means one tool
  // is quietly following older rules than the others.
  const bodies = [...blocks.values()].map((b) => b.body);
  if (bodies.length === MARKER_FILES.length && new Set(bodies).size > 1) {
    report.error(
      MARKER_FILES.join(' / '),
      'the addendum blocks differ - the tools reading them would follow different rules'
    );
  }

  if (!manifest) return;
  if (manifest.broken) {
    report.error(rel(root, path.join(root, '.okf/.okf-kit.json')), 'is not valid JSON - re-run `okf upgrade`');
    return;
  }
  if (kitVersion && manifest.version && manifest.version !== kitVersion) {
    report.warn(
      '.okf/.okf-kit.json',
      `project is on kit v${manifest.version} but v${kitVersion} is installed - run \`okf upgrade\``
    );
  }
  for (const [name, block] of blocks) {
    if (block.version && manifest.version && block.version !== manifest.version) {
      report.warn(name, `addendum block is marked v${block.version} but the manifest says v${manifest.version}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function check(root, { archiveChange = null, kitVersion = null } = {}) {
  const report = new Report();

  if (!exists(path.join(root, '.okf'))) {
    report.error('.okf', 'not found - is this an okf-initialised repo?');
    return report;
  }

  checkConfig(root, report);
  checkKitInstall(root, kitVersion, report);
  const entries = checkFeatureEntries(root, report);
  checkDecisionEntries(root, report);
  checkBundleFiles(root, report);
  checkDurableReferences(root, report);
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
