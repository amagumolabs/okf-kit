import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { parseFrontmatter, asList } from './frontmatter.mjs';

/**
 * `okf audit` - drift detection.
 *
 * Rules: `.okf/features/okf-audit.md` (BR-1..BR-7).
 * Why git is queried this way: `openspec/changes/add-okf-audit/design.md`.
 *
 * This module reads. It must never write under `.okf/` (BR-6): deciding that
 * knowledge is wrong from commit history alone, without anyone reading either the
 * knowledge or the code, is exactly the failure the workflow exists to prevent.
 */

/**
 * @typedef {object} AuditResult
 * @property {string} capability
 * @property {'current'|'stale'|'unauditable'|'skipped'} verdict
 * @property {string} verifiedAt
 * @property {string|null} newestCommit
 * @property {string|null} triggeredBy    path whose commit made it stale
 * @property {string[]} missingPaths      declared paths matching nothing
 * @property {string|null} note           why it was skipped, if it was
 */

function git(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

function isGitRepo(root) {
  try {
    git(root, ['rev-parse', '--git-dir']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Newest commit date (YYYY-MM-DD) touching a pathspec, or null when the path has
 * no history. `:(glob)` magic keeps glob semantics in git - without it `**` stops
 * crossing directory boundaries.
 */
function newestCommitDate(root, glob) {
  try {
    return git(root, ['log', '-1', '--format=%cd', '--date=short', '--', `:(glob)${glob}`]).trim() || null;
  } catch {
    return null;
  }
}

/**
 * Whether a pathspec matches any tracked file. Needed because `git log` on a
 * pathspec that matches nothing prints nothing and still exits 0, so a vanished
 * path is indistinguishable from an old one by exit status alone.
 */
function matchesTrackedFiles(root, glob) {
  try {
    return git(root, ['ls-files', '--', `:(glob)${glob}`]).trim() !== '';
  } catch {
    return false;
  }
}

function listEntries(root) {
  const dir = path.join(root, '.okf', 'features');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => {
      const { data } = parseFrontmatter(fs.readFileSync(path.join(dir, f), 'utf8'));
      return { capability: path.basename(f, '.md'), data: data ?? {} };
    });
}

function blank(capability, data) {
  return {
    capability,
    verdict: 'skipped',
    verifiedAt: String(data.verified_at ?? '').trim(),
    newestCommit: null,
    triggeredBy: null,
    missingPaths: [],
    note: null,
  };
}

/**
 * @param {string} root
 * @returns {{ ok: boolean, reason?: string, results: AuditResult[], stale: number }}
 */
export function audit(root) {
  const entries = listEntries(root);

  // Checked up front so a missing git is reported as "could not run" rather than
  // as a repository full of current entries (BR-3 in spirit, criterion 10).
  if (!isGitRepo(root)) {
    return {
      ok: false,
      reason: 'not a git repository, or git is unavailable - cannot read commit history',
      results: entries.map((e) => blank(e.capability, e.data)),
      stale: 0,
    };
  }

  const results = [];

  for (const { capability, data } of entries) {
    const result = blank(capability, data);

    if (String(data.status ?? 'active') === 'deprecated') {
      result.note = 'deprecated - its code is expected to diverge';
      results.push(result);
      continue;
    }
    if (String(data.verified ?? '') !== 'verified') {
      result.note = `${data.verified || 'no verified field'} - already surfaced by okf check`;
      results.push(result);
      continue;
    }

    // BR-8: an unknown never becomes an assurance. No paths, and no date to
    // compare against, are both "cannot tell", not "fine". `okf check` already
    // rejects verified-without-verified_at, but the audit must not depend on
    // another tool having run to avoid making a false claim.
    const globs = asList(data.code_paths);
    if (!globs.length || !result.verifiedAt) {
      result.verdict = 'unauditable';
      result.note = globs.length ? 'verified but has no verified_at to compare against' : null;
      results.push(result);
      continue;
    }

    for (const glob of globs) {
      if (!matchesTrackedFiles(root, glob)) result.missingPaths.push(glob);
      const date = newestCommitDate(root, glob);
      if (date && (!result.newestCommit || date > result.newestCommit)) {
        result.newestCommit = date;
        result.triggeredBy = glob;
      }
    }

    if (!result.newestCommit) {
      // Paths declared, but git has no history for any of them (BR-8).
      result.verdict = 'unauditable';
      result.note = 'declared paths have no commit history';
      results.push(result);
      continue;
    }

    // String comparison on YYYY-MM-DD, and strictly greater: a commit dated the
    // same day as verification is not drift, because verification follows the
    // code it verifies and both carry only date precision (BR-2).
    const stale = result.newestCommit > result.verifiedAt;
    result.verdict = stale ? 'stale' : 'current';
    if (!stale) result.triggeredBy = null;
    results.push(result);
  }

  return { ok: true, results, stale: results.filter((r) => r.verdict === 'stale').length };
}
