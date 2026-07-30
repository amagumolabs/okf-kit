/**
 * Small markdown helpers shared by the checks. Nothing general-purpose here -
 * just enough to read the tables and headings this workflow's artifacts use.
 */

export function stripComments(text) {
  return text.replace(/<!--[\s\S]*?-->/g, '');
}

export function stripFences(text) {
  return text.replace(/```[\s\S]*?```/g, '');
}

function isSeparatorRow(line) {
  return /^\|[\s|:-]+\|?\s*$/.test(line.trim()) && line.includes('-');
}

/**
 * Cells of one table row. `\|` is the legal markdown escape for a literal pipe -
 * splitting on every `|` shreds any cell containing one (a regex, a shell
 * pipeline, an enum written `a | b`) and produces findings about columns that
 * were never there.
 */
export function splitRow(line) {
  const t = line.trim().replace(/^\|/, '').replace(/(?<!\\)\|$/, '');
  return t.split(/(?<!\\)\|/).map((c) => c.replace(/\\\|/g, '|').trim());
}

/**
 * Rows of the first markdown table under a heading matching `headingRe`.
 * Returns [] when the heading or table is absent. The header row and the
 * separator row are dropped; empty rows are kept so callers can flag them.
 */
export function tableUnder(text, headingRe) {
  const lines = stripComments(text).split('\n');
  let i = lines.findIndex((l) => /^#{1,6}\s/.test(l) && headingRe.test(l));
  if (i === -1) return [];

  const rows = [];
  let seenHeader = false;
  for (i++; i < lines.length; i++) {
    const line = lines[i];
    if (/^#{1,6}\s/.test(line)) break;
    if (!line.trim().startsWith('|')) continue;
    if (isSeparatorRow(line)) continue;
    if (!seenHeader) {
      seenHeader = true;
      continue;
    }
    rows.push(splitRow(line));
  }
  return rows;
}

/** Every markdown table row in the document, header and separator rows dropped. */
export function allTableRows(text) {
  const lines = stripComments(text).split('\n');
  const rows = [];
  let inTable = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim().startsWith('|')) {
      inTable = false;
      continue;
    }
    if (isSeparatorRow(line)) {
      inTable = true;
      continue;
    }
    if (inTable) rows.push(splitRow(line));
  }
  return rows;
}

export function isBlankRow(cells) {
  return cells.every((c) => c === '');
}

/**
 * Text under a heading, up to the next heading of the same or a higher level.
 * Subsections are included - `## Capabilities` keeps its `### New Capabilities`.
 */
export function sectionUnder(text, headingRe) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => /^#{1,6}\s/.test(l) && headingRe.test(l));
  if (start === -1) return '';
  const level = /^(#{1,6})\s/.exec(lines[start])[1].length;

  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    const m = /^(#{1,6})\s/.exec(lines[i]);
    if (m && m[1].length <= level) break;
    out.push(lines[i]);
  }
  return out.join('\n');
}
