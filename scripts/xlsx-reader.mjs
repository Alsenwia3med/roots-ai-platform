/**
 * Dependency-free XLSX reader for the controlled C-01 / C-02 workbooks.
 *
 * A .xlsx file is a ZIP container of OOXML parts. This module unzips it using
 * only node:zlib, then reads xl/workbook.xml, xl/sharedStrings.xml and the
 * worksheet parts. No third-party package is added, so the controlled sources
 * can be transcribed without changing the dependency surface of the deliverable.
 *
 * Both workbooks were produced by Google Sheets export, which the parser handles
 * explicitly: every OOXML tag carries a namespace prefix (<x:row>, <x:c>), so
 * each matcher allows an optional "(?:\w+:)?" prefix; and xl/sharedStrings.xml is
 * empty, the text being carried inline (t="inlineStr") or as strings (t="str").
 *
 * Exported: loadWorkbook(path) -> { fileName, fileSha256, contentSha256,
 * sheetNames, sheets, sheet(name), rows(name) }, plus cleanCell / findHeaderRow.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { inflateRawSync, inflateSync } from 'node:zlib';

/* ---------------------------------- unzip --------------------------------- */

function unzip(buf) {
  let eocd = -1;
  const floor = Math.max(0, buf.length - 22 - 65535);
  for (let i = buf.length - 22; i >= floor; i -= 1) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('not a zip archive (no end-of-central-directory)');

  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  const out = new Map();

  for (let n = 0; n < count; n += 1) {
    if (buf.readUInt32LE(off) !== 0x02014b50) {
      throw new Error('corrupt central directory header at byte ' + off);
    }
    const method = buf.readUInt16LE(off + 10);
    const csize = buf.readUInt32LE(off + 20);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const localOff = buf.readUInt32LE(off + 42);
    const name = buf.subarray(off + 46, off + 46 + nameLen).toString('utf8');

    if (buf.readUInt32LE(localOff) !== 0x04034b50) {
      throw new Error('corrupt local header for part ' + name);
    }
    const lnl = buf.readUInt16LE(localOff + 26);
    const lel = buf.readUInt16LE(localOff + 28);
    const start = localOff + 30 + lnl + lel;
    const raw = buf.subarray(start, start + csize);

    let data;
    if (method === 0) data = raw;
    else if (method === 8) data = inflateRawSync(raw);
    else if (method === 9) data = inflateSync(raw);
    else throw new Error('unsupported zip method ' + method + ' in ' + name);

    out.set(name, data);
    off += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}
/* ----------------------------------- xml ---------------------------------- */

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** Concatenate every <t> element of an XML fragment, joining rich-text runs. */
function textOf(fragment) {
  let out = '';
  const re = /<(?:\w+:)?t(?:\s[^>/]*)?>([\s\S]*?)<\/(?:\w+:)?t>|<(?:\w+:)?t(?:\s[^>]*)?\/>/g;
  let m;
  while ((m = re.exec(fragment)) !== null) out += decodeEntities(m[1] === undefined ? '' : m[1]);
  return out;
}

function attr(tag, name) {
  const m = tag.match(new RegExp('\\b' + name + '="([^"]*)"'));
  return m === null ? undefined : m[1];
}

function sharedStrings(parts) {
  const part = parts.get('xl/sharedStrings.xml');
  if (!part) return [];
  const xml = part.toString('utf8');
  const list = [];
  const re = /<(?:\w+:)?si(?:\s[^>]*)?>([\s\S]*?)<\/(?:\w+:)?si>|<(?:\w+:)?si(?:\s[^>]*)?\/>/g;
  let m;
  while ((m = re.exec(xml)) !== null) list.push(textOf(m[1] === undefined ? '' : m[1]));
  return list;
}

function sheetOrder(parts) {
  const wb = parts.get('xl/workbook.xml');
  const rels = parts.get('xl/_rels/workbook.xml.rels');
  if (!wb) return [];
  const relMap = new Map();
  if (rels) {
    const rxml = rels.toString('utf8');
    const rre = /<(?:\w+:)?Relationship\b[^>]*>/g;
    let r;
    while ((r = rre.exec(rxml)) !== null) {
      const id = attr(r[0], 'Id');
      const target = attr(r[0], 'Target');
      if (id && target) relMap.set(id, target);
    }
  }
  const sheets = [];
  const sre = /<(?:\w+:)?sheet\b[^>]*>/g;
  let m;
  while ((m = sre.exec(wb.toString('utf8'))) !== null) {
    const tag = m[0];
    const rid = attr(tag, 'r:id') || attr(tag, 'id');
    let target = rid ? relMap.get(rid) : undefined;
    if (target) {
      target = target.replace(/^\/+/, '');
      if (target.indexOf('xl/') !== 0) target = 'xl/' + target.replace(/^\.\//, '');
    }
    sheets.push({ name: decodeEntities(attr(tag, 'name') || '?'), part: target });
  }
  return sheets;
}

function columnIndex(ref) {
  const letters = (ref.match(/^([A-Z]+)/) || ['A'])[1];
  let n = 0;
  for (let i = 0; i < letters.length; i += 1) n = n * 26 + (letters.charCodeAt(i) - 64);
  return n - 1;
}

function readSheet(xml, strings) {
  const rows = [];
  const rowRe =
    /<(?:\w+:)?row\b([^>]*?)\/>|<(?:\w+:)?row\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?row>/g;
  let rm;
  let cursor = 0;
  while ((rm = rowRe.exec(xml)) !== null) {
    const tagAttrs = rm[1] !== undefined ? rm[1] : rm[2];
    const body = rm[3] !== undefined ? rm[3] : '';
    const declared = attr('x' + (tagAttrs || ''), 'r');
    const rowIndex = declared ? parseInt(declared, 10) - 1 : cursor;
    cursor = rowIndex + 1;
    const cells = [];
    const cre = /<(?:\w+:)?c\b[^>]*?(?:\/>|>[\s\S]*?<\/(?:\w+:)?c>)/g;
    let cm;
    while ((cm = cre.exec(body)) !== null) {
      const cell = cm[0];
      const ref = attr(cell, 'r');
      const type = attr(cell, 't');
      const openEnd = cell.indexOf('>');
      const inner = cell.slice(openEnd + 1, cell.lastIndexOf('<'));
      let value = '';
      const vMatch = inner.match(/<(?:\w+:)?v(?:\s[^>]*)?>([\s\S]*?)<\/(?:\w+:)?v>/);
      if (type === 's') {
        const idx = vMatch ? parseInt(vMatch[1], 10) : NaN;
        value = isNaN(idx) ? '' : strings[idx] === undefined ? '' : strings[idx];
      } else if (type === 'inlineStr') {
        value = textOf(inner);
      } else if (type === 'str' || type === 'e') {
        value = vMatch ? decodeEntities(vMatch[1]) : '';
      } else if (vMatch) {
        value = decodeEntities(vMatch[1]);
      } else {
        const f = inner.match(/<(?:\w+:)?f(?:\s[^>]*)?>([\s\S]*?)<\/(?:\w+:)?f>/);
        if (f) value = '=' + decodeEntities(f[1]);
      }
      const idx2 = ref ? columnIndex(ref) : cells.length;
      cells[idx2] = value;
    }
    for (let i = 0; i < cells.length; i += 1) if (cells[i] === undefined) cells[i] = '';
    rows[rowIndex] = cells;
  }
  for (let i = 0; i < rows.length; i += 1) if (!rows[i]) rows[i] = [];
  return rows;
}

/* ------------------------------ cell normalising --------------------------- */

/**
 * A controlled cell is read as text. Whitespace is trimmed and internal line
 * breaks are collapsed to a single space, because a workbook cell break is a
 * wrapping artefact rather than part of the canonical string. Nothing else is
 * altered: casing, punctuation, the trademark sign and wording stay verbatim.
 */
export function cleanCell(v) {
  return String(v === undefined || v === null ? '' : v)
    .replace(/\r/g, '')
    .replace(/\n/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/**
 * Locate a sheet's header row. Every controlled sheet carries title and prose
 * rows plus blank rows before the real column names, and how many of each differ
 * between sheets, so the header is found by SHAPE rather than by position.
 *
 * A header row is a fully-populated row of short, distinct labels. Title and
 * prose rows occupy one cell only and are therefore below the minimum width, and
 * data rows never beat the header because the header spans every column of the
 * table while blank cells (an absent N/A points value, an empty help text) make
 * data rows narrower. Column names are taken verbatim; they are not required to
 * be snake_case because C-02 labels several of them with prose words.
 */
export function findHeaderRow(rows) {
  let best = -1;
  let bestWidth = 0;
  const limit = Math.min(rows.length, 12);
  for (let i = 0; i < limit; i += 1) {
    const cells = rows[i].map(cleanCell);
    const filled = cells.filter((c) => c !== '');
    if (filled.length < 3) continue;
    if (new Set(filled).size !== filled.length) continue;
    if (filled.some((c) => c.length > 48 || /[.;]$/.test(c))) continue;
    if (filled.length > bestWidth) {
      best = i;
      bestWidth = filled.length;
    }
  }
  return best;
}

/* --------------------------------- workbook -------------------------------- */

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

/**
 * Load a controlled workbook into typed-ready row objects.
 *
 * Fingerprints are computed here, at the point the bytes are read, so that a
 * transcription can be PROVEN to come from the exact file received:
 *   fileSha256    — the package as stored (packaging-sensitive);
 *   contentSha256 — sheet names + column names + canonical cell values only, so
 *                   a legitimate re-export of unchanged content reproduces the
 *                   same digest while any edited cell changes it.
 */
export function loadWorkbook(filePath) {
  const abs = resolve(filePath);
  const buf = readFileSync(abs);
  const parts = unzip(buf);
  const strings = sharedStrings(parts);

  const sheets = sheetOrder(parts).map((s) => {
    const part = parts.get(s.part);
    if (!part) throw new Error(`sheet "${s.name}" has no worksheet part at ${s.part}`);
    const dense = readSheet(part.toString('utf8'), strings);
    /* Every cell is cleaned and empty rows dropped: this is the sheet as the
       controlled source states it, header row, title rows and prose included. */
    const rawRows = dense
      .map((r) => r.map(cleanCell))
      .filter((r) => r.some((c) => c !== ''));
    const header = findHeaderRow(dense);
    if (header < 0) {
      /* Narrative sheets (README) carry no table. They stay as raw text so the
         generator can read document metadata out of them, and so they are still
         covered by the content fingerprint. */
      return { name: s.name, partName: s.part, headerRow: 0, columns: [], rows: [], rawRows };
    }
    const columns = dense[header].map(cleanCell);
    const rows = dense
      .slice(header + 1)
      .map((r) => columns.map((_, i) => cleanCell(r[i])))
      .filter((r) => r.some((c) => c !== ''));
    return { name: s.name, partName: s.part, headerRow: header + 1, columns, rows, rawRows };
  });

  const byName = new Map(sheets.map((s) => [s.name, s]));

  const content = createHash('sha256');
  for (const s of sheets) {
    content.update('SHEET\u241f' + s.name + '\n');
    for (const r of s.rawRows) content.update(r.join('\u241e') + '\n');
    content.update('\u241d\n');
  }

  const workbook = {
    fileName: abs.split(/[\\/]/).pop(),
    filePath: abs,
    fileSha256: sha256(buf),
    contentSha256: content.digest('hex'),
    sheetNames: sheets.map((s) => s.name),
    sheets,
    sheet(name) {
      const s = byName.get(name);
      if (!s) {
        throw new Error(
          `${workbook.fileName}: no sheet "${name}" (available: ${workbook.sheetNames.join(', ')})`
        );
      }
      return s;
    },
    /** Rows as objects keyed by that sheet's own column names. */
    rows(name) {
      const s = workbook.sheet(name);
      if (!s.columns.length) {
        throw new Error(`${workbook.fileName}: sheet "${name}" has no header row; read it with sheetText()`);
      }
      return s.rows.map((r) => {
        const o = {};
        s.columns.forEach((c, i) => {
          o[c] = r[i] === undefined ? '' : r[i];
        });
        return o;
      });
    },
    /** Every non-empty cell of a sheet, row by row, as text. */
    sheetText(name) {
      return workbook.sheet(name).rawRows;
    },
  };
  return workbook;
}
