/**
 * `okf migrate`.
 *
 * The only command permitted to write to `.okf/features/` and `.okf/decisions/`.
 * `okf upgrade` cannot: its payload is the schema, the templates, the config, and
 * the addendum, and widening it would trade a durable safety property for one
 * release's convenience.
 *
 * What it refuses to do is the point. Migrating an entry that was verified under
 * the old field shape does NOT produce a `verified[]` attestation - nobody knows
 * who performed that verification, and inventing an actor puts fabricated
 * provenance in the one file whose job is to be trustworthy. A migrated entry
 * reads as unverified to an external consumer until its next verification pass.
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Feature entries: the workflow state leaves the specification's `verified` key,
 * and the lifecycle moves to the specification's vocabulary.
 *
 * A `verified:` line with nothing after it introduces an attestation list and is
 * already the new shape - only a scalar on the same line is the old one.
 *
 * @returns {string[] | null} the new frontmatter lines, or null when nothing changed
 */
function migrateFeature(frontmatter) {
  let changed = false;
  const out = frontmatter.map((line) => {
    const scalar = /^verified:[ \t]+(\S.*)$/.exec(line);
    if (scalar) {
      changed = true;
      return `verification_state: ${scalar[1].trim()}`;
    }
    if (/^status:[ \t]+active[ \t]*$/.test(line)) {
      changed = true;
      return 'status: stable';
    }
    return line;
  });
  return changed ? out : null;
}

/**
 * Decision entries carry two lifecycles that used to share one key: the
 * specification's document status, and the decision's own accepted/superseded
 * state. Split them rather than picking one.
 */
function migrateDecision(frontmatter) {
  let changed = false;
  const out = [];
  for (const line of frontmatter) {
    const own = /^status:[ \t]+(accepted|superseded|reversed)[ \t]*$/.exec(line);
    if (own) {
      changed = true;
      out.push('status: stable');
      out.push(`decision_status: ${own[1]}`);
      continue;
    }
    if (/^status:[ \t]+active[ \t]*$/.test(line)) {
      changed = true;
      out.push('status: stable');
      continue;
    }
    out.push(line);
  }
  return changed ? out : null;
}

/**
 * @param {string} root
 * @param {{ dryRun?: boolean }} [options]
 * @returns {{ examined: string[], rewritten: string[], alreadyCurrent: string[], unparseable: string[] }}
 */
export function migrate(root, { dryRun = false } = {}) {
  const result = { examined: [], rewritten: [], alreadyCurrent: [], unparseable: [] };

  for (const [dir, migrateOne] of [
    ['features', migrateFeature],
    ['decisions', migrateDecision],
  ]) {
    const abs = path.join(root, '.okf', dir);
    if (!fs.existsSync(abs)) continue;

    for (const name of fs.readdirSync(abs).filter((f) => f.endsWith('.md')).sort()) {
      const file = path.join(abs, name);
      const where = path.relative(root, file).split(path.sep).join('/');
      result.examined.push(where);

      const text = fs.readFileSync(file, 'utf8');
      const lines = text.split('\n');
      if (lines[0]?.trim() !== '---') {
        result.unparseable.push(where);
        continue;
      }
      let end = -1;
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '---') {
          end = i;
          break;
        }
      }
      if (end === -1) {
        result.unparseable.push(where);
        continue;
      }

      const next = migrateOne(lines.slice(1, end));
      if (!next) {
        result.alreadyCurrent.push(where);
        continue;
      }

      result.rewritten.push(where);
      // Only the frontmatter region is rebuilt. The body is the reason a person is
      // willing to run this on files the kit otherwise never touches.
      if (!dryRun) fs.writeFileSync(file, [lines[0], ...next, ...lines.slice(end)].join('\n'));
    }
  }

  return result;
}
