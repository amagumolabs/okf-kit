/**
 * Minimal YAML frontmatter reader.
 *
 * Deliberately not a YAML parser. It understands exactly the shapes OKF
 * frontmatter uses - top-level scalars, top-level sequences of scalars, inline
 * `[]`, and sequences of flat mappings (`sources`) - and ignores anything else
 * rather than guessing. Keeping it dependency-free means `okf check` runs in any
 * repo and any CI job with nothing installed.
 */

const KEY = /^([A-Za-z_][\w-]*):[ \t]?(.*)$/;

function stripQuotes(s) {
  const t = s.trim();
  if (t.length >= 2 && ((t[0] === '"' && t.endsWith('"')) || (t[0] === "'" && t.endsWith("'")))) {
    return t.slice(1, -1);
  }
  return t;
}

function parseInline(value) {
  const t = value.trim();
  if (t.startsWith('[') && t.endsWith(']')) {
    const inner = t.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map((p) => stripQuotes(p)).filter((p) => p !== '');
  }
  return stripQuotes(t);
}

function indentOf(line) {
  return line.length - line.trimStart().length;
}

function parseBlock(lines) {
  const out = {};
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trimStart().startsWith('#')) {
      i++;
      continue;
    }
    const m = KEY.exec(line);
    if (!m || indentOf(line) !== 0) {
      i++;
      continue;
    }

    const key = m[1];
    const inline = m[2].trim();
    if (inline !== '') {
      out[key] = parseInline(inline);
      i++;
      continue;
    }

    // Empty inline value: either an indented sequence follows, or the key is null.
    const items = [];
    let sawSequence = false;
    let j = i + 1;

    while (j < lines.length) {
      const l = lines[j];
      if (!l.trim()) {
        j++;
        continue;
      }
      if (indentOf(l) === 0) break;

      if (/^\s*-(\s|$)/.test(l)) {
        sawSequence = true;
        const head = l.replace(/^\s*-\s?/, '');
        const parts = [head];
        let k = j + 1;
        while (k < lines.length) {
          const l2 = lines[k];
          if (!l2.trim()) {
            k++;
            continue;
          }
          if (indentOf(l2) === 0 || /^\s*-(\s|$)/.test(l2)) break;
          parts.push(l2.trim());
          k++;
        }

        const looksLikeMapping = parts.length > 1 || KEY.test(head.trim());
        if (looksLikeMapping) {
          const obj = {};
          for (const p of parts) {
            const mm = KEY.exec(p.trim());
            if (mm) obj[mm[1]] = stripQuotes(mm[2]);
          }
          items.push(obj);
        } else if (head.trim() !== '') {
          items.push(stripQuotes(head));
        }
        j = k;
      } else {
        j++;
      }
    }

    out[key] = sawSequence ? items : '';
    i = j;
  }

  return out;
}

export function parseFrontmatter(text) {
  const lines = text.split('\n');
  if (lines[0]?.trim() !== '---') {
    return { data: null, body: text };
  }
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      end = i;
      break;
    }
  }
  if (end === -1) return { data: null, body: text };

  return {
    data: parseBlock(lines.slice(1, end)),
    body: lines.slice(end + 1).join('\n'),
  };
}

/** Frontmatter list fields may legitimately be '' (null) or an array. */
export function asList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') return [value.trim()];
  return [];
}
