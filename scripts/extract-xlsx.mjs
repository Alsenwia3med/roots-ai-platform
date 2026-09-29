/**
 * Dependency-free XLSX reader.
 *
 * A .xlsx file is a ZIP container of OOXML parts. This script unzips it using
 * only node:zlib, then reads xl/workbook.xml, xl/sharedStrings.xml and the
 * worksheet parts. No third-party package is added, so the controlled source
 * workbooks can be transcribed without changing the dependency surface of the
 * deliverable.
 *
 * Usage:
 *   node scripts/extract-xlsx.mjs manifest <file.xlsx>
 *   node scripts/extract-xlsx.mjs dump <file.xlsx> [sheetNameSubstring]
 */
import { readFileSync, writeFileSync } from 'node:fs';
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

/* ----------------------------------- cli ---------------------------------- */

const [mode, file, filter] = process.argv.slice(2);
if (!mode || !file) {
  console.error('usage: node scripts/extract-xlsx.mjs manifest|dump <file.xlsx> [sheetSubstring]');
  process.exit(2);
}

const parts = unzip(readFileSync(file));
const strings = sharedStrings(parts);
const sheets = sheetOrder(parts);

if (mode === 'list') {
  Array.from(parts.keys()).sort().forEach((k) => {
    console.log(String(parts.get(k).length).padStart(9) + '  ' + k);
  });
  process.exit(0);
}

if (mode === 'manifest') {
  console.log('zip parts: ' + parts.size + '   sharedStrings entries: ' + strings.length);
  sheets.forEach((s, i) => {
    const p = s.part ? parts.get(s.part) : undefined;
    const rows = p ? readSheet(p.toString('utf8'), strings) : [];
    const width = rows.reduce((a, r) => Math.max(a, r.length), 0);
    const nonEmpty = rows.filter((r) => r.some((c) => c !== '')).length;
    console.log(
      'sheet ' + (i + 1) + '  name="' + s.name + '"  part=' + s.part +
      '  rows=' + rows.length + '  nonEmpty=' + nonEmpty + '  cols=' + width
    );
  });
  process.exit(0);
}

const lines = [];
const emit = (s) => lines.push(s);

for (const s of sheets) {
  if (filter && s.name.toLowerCase().indexOf(filter.toLowerCase()) === -1) continue;
  const p = s.part ? parts.get(s.part) : undefined;
  if (!p) {
    emit('=== SHEET "' + s.name + '" : part missing (' + s.part + ') ===');
    continue;
  }
  const rows = readSheet(p.toString('utf8'), strings);
  emit('=== SHEET "' + s.name + '"  rows=' + rows.length + ' ===');
  rows.forEach((r, i) => {
    const clean = r.map((c) => String(c).replace(/\r/g, '').replace(/\n/g, ' [NL] ').trim());
    emit('r' + (i + 1) + '|' + clean.join(' ||| '));
  });
  emit('');
}

const outIdx = process.argv.indexOf('--out');
if (outIdx !== -1 && process.argv[outIdx + 1]) {
  writeFileSync(process.argv[outIdx + 1], lines.join('\n'), 'utf8');
  console.log('wrote ' + lines.length + ' lines to ' + process.argv[outIdx + 1]);
} else {
  console.log(lines.join('\n'));
}
