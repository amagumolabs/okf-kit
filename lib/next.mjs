import fs from 'node:fs';
import path from 'node:path';

import { readChangeState } from './check.mjs';

/**
 * What a change still owes under `.okf/`. Reports; never acts.
 *
 * Derives owed steps from file state via `readChangeState` - the same read the
 * archive gate uses - so the advisor and the gate cannot silently disagree.
 *
 * @param {string} root
 * @param {string} changeId
 * @returns {{
 *   answered: boolean,
 *   owed: { step: string, command: string }[],
 *   statement?: string,
 *   error?: string,
 * }}
 */
export function next(root, changeId) {
  if (!changeId) {
    return { answered: false, owed: [], error: 'missing change id' };
  }

  const activeDir = path.join(root, 'openspec', 'changes', changeId);
  if (!fs.existsSync(activeDir)) {
    if (isArchivedChange(root, changeId)) {
      return {
        answered: false,
        owed: [],
        error: `"${changeId}" is archived - okf next advises on active work`,
      };
    }
    return {
      answered: false,
      owed: [],
      error: `no such change: "${changeId}"`,
    };
  }

  const state = readChangeState(root, changeId);
  const gate = `okf check --archive ${changeId}`;

  // BR-2: the artifact half is named, never re-derived.
  if (!state.artifacts.okfLink) {
    return {
      answered: true,
      owed: [
        {
          step: 'okf-link.md is not written yet - ask OpenSpec what artifact comes next',
          command: 'openspec status',
        },
      ],
    };
  }

  /** @type {{ step: string, command: string }[]} */
  const owed = [];

  const broken = state.unresolved.filter(
    (u) => u.kind === 'missing-file' || u.kind === 'missing-target' || u.kind === 'placeholder'
  );
  if (broken.length) {
    const names = broken.map((u) => u.capability).filter(Boolean).join(', ');
    owed.push({
      step:
        `okf-link rows do not resolve to entries` +
        (names ? ` (${names})` : '') +
        ' - create or fix the linked OKF entries',
      command: gate,
    });
  }

  if (!state.artifacts.verification) {
    owed.push({
      step: 'verification.md is missing - the OKF verification pass has not been recorded',
      command: gate,
    });
  } else if (state.linked.length > 0 && state.evidenceRows.length === 0) {
    owed.push({
      step: 'Rule Evidence table is empty - fill evidence for each cited BR-n',
      command: gate,
    });
  }

  if (state.pendingIn.length) {
    const names = state.pendingIn.map((e) => e.capability).join(', ');
    owed.push({
      step: `verification pass still owed - pending_changes still lists this change on ${names}`,
      command: gate,
    });
  }

  if (!owed.length) {
    return {
      answered: true,
      owed: [],
      statement: `Nothing owed under .okf/. Confirm with: ${gate}`,
    };
  }

  return { answered: true, owed };
}

/** True when `changeId` matches an archived directory name, with or without its date prefix. */
function isArchivedChange(root, changeId) {
  const dir = path.join(root, 'openspec', 'changes', 'archive');
  if (!fs.existsSync(dir)) return false;
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .some((e) => e.name === changeId || e.name.replace(/^\d{4}-\d{2}-\d{2}-/, '') === changeId);
}
