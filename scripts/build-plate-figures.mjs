// Builds figures drawn on real anatomy: a public-domain Gray's Anatomy plate
// (1918, Henry Vandyke Carter) cropped, embedded as a base64 <image>, with our
// overlay drawn on top. Specs live in scripts/plate-figures.mjs.
//
// This is an AUTHORING command, not part of `npm run build`: it rewrites the
// procedure HTML between `<!-- plate:ID -->` and `<!-- /plate:ID -->` markers,
// and CI must never edit source. Run it after changing a spec, then build.
//
//   node scripts/build-plate-figures.mjs            write every figure
//   node scripts/build-plate-figures.mjs --preview  also write PNG previews
//                                                   to dist/plate-previews/
//
// Why the output is flat SVG rather than a nested <svg> in plate coordinates:
// export-figures' bounds checker reads raw coordinates, so every shape is
// transformed into figure space here and the checker still sees the truth.
//
// Every plate is checked against the sha1 recorded in assets/plates/README.md's
// table (the Wikimedia Commons API value) before it is used — the same guard
// Kairos uses, so a swapped or re-saved file cannot slip in silently.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { FIGURES } from './plate-figures.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PLATES = path.join(ROOT, 'assets/plates');

// Colors drawn ON the plate — the plate is paper, so this is a light palette
// in every theme (same rule as Kairos). Deliberately darker than the app's
// on-dark accents so thin strokes stay legible over hatching.
const PAPER = {
  good: '#08866b', danger: '#c62828', warning: '#b45309', accent: '#1d4ed8',
  vessel: '#7b3f8f', muted: '#5a6273', text: '#1d2129', outline: '#3a3742',
  surface: '#fbfaf8',
};
// Colors drawn on the dark figure surface around the plate (CRISIS house palette).
const DARK = {
  good: '#00d4aa', danger: '#e84c4c', warning: '#f59e0b', accent: '#2563eb',
  vessel: '#b58ad0', muted: '#8a9ab5', text: '#e8edf5', outline: '#4a5670',
};
const FONT = "Verdana,'DejaVu Sans',sans-serif"; // same wide metrics on Mac, iOS and the Ubuntu CI box

const r1 = (n) => Math.round(n * 10) / 10;
const esc = (s) => String(s).replace(/&(?![a-z]+;|#\d+;)/g, '&amp;').replace(/</g, '&lt;');

function recordedSha1s() {
  const readme = readFileSync(path.join(PLATES, 'README.md'), 'utf8');
  const map = {};
  for (const m of readme.matchAll(/\|\s*`gray(\d+)\.png`\s*\|[^|]*\|\s*`([0-9a-f]{40})`/g)) map[m[1]] = m[2];
  return map;
}

async function plateImage(panel, sha1s) {
  const file = path.join(PLATES, `gray${panel.plate}.png`);
  const buf = readFileSync(file);
  const actual = createHash('sha1').update(buf).digest('hex');
  const expected = sha1s[panel.plate];
  if (!expected) throw new Error(`gray${panel.plate}.png has no sha1 row in assets/plates/README.md`);
  if (actual !== expected) throw new Error(`gray${panel.plate}.png sha1 ${actual} != recorded ${expected}`);

  const [x, y, w, h] = panel.crop;
  // 2x the displayed size, capped at 3x the source pixels: enough for a
  // 1200-px rasterization without inventing detail the scan never had.
  const outW = Math.round(Math.min(panel.width * 2, w * 3));
  let img = sharp(buf).extract({ left: x, top: y, width: w, height: h })
    .flatten({ background: '#ffffff' })
    .resize({ width: outW, kernel: 'lanczos3' });
  if (panel.grayscale) img = img.grayscale();
  const jpg = await img.clone().jpeg({ quality: 78, mozjpeg: true }).toBuffer();
  return `data:image/jpeg;base64,${jpg.toString('base64')}`;
}

/** Plate-space -> figure-space transform for one panel. */
function mapper(panel) {
  const [cx, cy, cw] = panel.crop;
  const s = panel.width / cw;
  const [px, py] = panel.at;
  return { s, pt: ([x, y]) => [r1(px + (x - cx) * s), r1(py + (y - cy) * s)] };
}

function transformPath(d, pt) {
  // Absolute M/L/Q/C/Z only — every coordinate is an x,y pair.
  return d.replace(/(-?[\d.]+)[ ,]+(-?[\d.]+)/g, (_, a, b) => pt([Number(a), Number(b)]).join(','));
}

function attrs(sh, pal) {
  const out = [];
  out.push(`fill="${sh.fill ? pal[sh.fill] ?? sh.fill : 'none'}"`);
  if (sh.stroke) out.push(`stroke="${pal[sh.stroke] ?? sh.stroke}"`, `stroke-width="${sh.sw ?? 1.6}"`);
  if (sh.dash) out.push(`stroke-dasharray="${sh.dash === true ? '5 4' : sh.dash}"`);
  if (sh.opacity != null) out.push(`opacity="${sh.opacity}"`);
  out.push('stroke-linecap="round" stroke-linejoin="round"');
  return out.join(' ');
}

function arrowHead(x1, y1, x2, y2, color, size = 8) {
  const a = Math.atan2(y2 - y1, x2 - x1), w = size * 0.5;
  const bx = x2 - size * Math.cos(a), by = y2 - size * Math.sin(a);
  const l = [bx + w * Math.sin(a), by - w * Math.cos(a)], r = [bx - w * Math.sin(a), by + w * Math.cos(a)];
  return { back: [r1(bx), r1(by)], poly: `<polygon points="${r1(x2)},${r1(y2)} ${r1(l[0])},${r1(l[1])} ${r1(r[0])},${r1(r[1])}" fill="${color}"/>` };
}

/** A boxed label on the plate, sized from its own text so it never clips. */
function label(sh, pos) {
  const lines = sh.lines.map((l) => (typeof l === 'string' ? { t: l } : l));
  const sizes = lines.map((l) => l.size ?? (l.bold ? 11 : 10));
  const widths = lines.map((l, i) => l.t.replace(/&[a-z]+;|&#\d+;/g, 'x').length * sizes[i] * (l.bold ? 0.66 : 0.62));
  const pad = 5, lh = sizes.map((s) => s * 1.28);
  const w = Math.max(...widths) + pad * 2, h = lh.reduce((a, b) => a + b, 0) + pad * 1.2;
  let [x, y] = pos;
  if (sh.anchor === 'end') x -= w;
  if (sh.anchor === 'middle') x -= w / 2;
  let out = `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="3" fill="${PAPER.surface}" opacity="0.93" stroke="${PAPER.outline}" stroke-width="0.6"/>`;
  let ty = y + pad * 0.6;
  lines.forEach((l, i) => {
    ty += lh[i];
    out += `<text x="${r1(x + pad)}" y="${r1(ty - sizes[i] * 0.3)}" style="font-family:${FONT};font-size:${sizes[i]}px;font-weight:${l.bold ? 700 : 400};fill:${PAPER[l.fill ?? (l.bold ? 'text' : 'muted')]}">${esc(l.t)}</text>`;
  });
  return out;
}

function shapeSvg(sh, pt, s, pal) {
  switch (sh.kind) {
    case 'line': {
      const [a, b] = [pt(sh.from), pt(sh.to)];
      return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" ${attrs(sh, pal)}/>`;
    }
    case 'arrow': {
      const [a, b] = [pt(sh.from), pt(sh.to)];
      const color = pal[sh.stroke];
      const head = arrowHead(a[0], a[1], b[0], b[1], color, sh.head ?? 10);
      return `<line x1="${a[0]}" y1="${a[1]}" x2="${head.back[0]}" y2="${head.back[1]}" ${attrs(sh, pal)}/>${head.poly}`;
    }
    case 'path':
      return `<path d="${transformPath(sh.d, pt)}" ${attrs(sh, pal)}/>`;
    case 'rect': {
      const [a] = [pt(sh.at)];
      return `<rect x="${a[0]}" y="${a[1]}" width="${r1(sh.size[0] * s)}" height="${r1(sh.size[1] * s)}" rx="${r1((sh.rx ?? 0) * s)}" ${attrs(sh, pal)}/>`;
    }
    case 'circle': {
      const a = pt(sh.at);
      return `<circle cx="${a[0]}" cy="${a[1]}" r="${r1(sh.r * (sh.fixed ? 1 : s))}" ${attrs(sh, pal)}/>`;
    }
    case 'ellipse': {
      const a = pt(sh.at);
      return `<ellipse cx="${a[0]}" cy="${a[1]}" rx="${r1(sh.rx * s)}" ry="${r1(sh.ry * s)}" ${attrs(sh, pal)}/>`;
    }
    case 'label':
      return label(sh, pt(sh.at));
    case 'text': {
      const a = pt(sh.at);
      return `<text x="${a[0]}" y="${a[1]}" style="font-family:${FONT};font-size:${sh.size ?? 10}px;font-weight:${sh.bold ? 700 : 400};fill:${pal[sh.fill ?? 'text']}"${sh.anchor ? ` text-anchor="${sh.anchor}"` : ''}>${esc(sh.text)}</text>`;
    }
    default:
      throw new Error(`unknown shape kind ${sh.kind}`);
  }
}

const identity = { s: 1, pt: (p) => p };

async function buildFigure(fig, sha1s) {
  const parts = [];
  parts.push(`<style>
  .t{fill:#e8edf5;font-family:Syne,sans-serif;font-weight:700;font-size:17px}
  .c{fill:#4a5670;font-family:'IBM Plex Mono',monospace;font-size:10.5px}
  .s{fill:#8a9ab5;font-family:'IBM Plex Mono',monospace;font-size:11.5px}
  .n{fill:#8a9ab5;font-family:'IBM Plex Mono',monospace;font-size:10.5px}
  .cr{fill:#4a5670;font-family:'IBM Plex Mono',monospace;font-size:9.5px}
</style>`);
  parts.push(`<text class="t" x="0" y="17">${fig.title}</text>`);
  if (fig.subtitle) parts.push(`<text class="c" x="0" y="34">${fig.subtitle}</text>`);

  const panelMaps = [];
  for (const panel of fig.panels) {
    const m = mapper(panel);
    panelMaps.push(m);
    const [x, y] = panel.at;
    const w = panel.width, h = r1(panel.crop[3] * m.s);
    const href = await plateImage(panel, sha1s);
    parts.push(`<image href="${href}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"/>`);
    parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#4a5670" stroke-width="1"/>`);
    for (const sh of panel.shapes ?? []) parts.push(shapeSvg(sh, m.pt, m.s, PAPER));
  }
  // Leaders from a point on a plate out to the dark surface.
  for (const l of fig.leaders ?? []) {
    const from = panelMaps[l.panel ?? 0].pt(l.from);
    parts.push(`<line x1="${from[0]}" y1="${from[1]}" x2="${l.to[0]}" y2="${l.to[1]}" stroke="${DARK[l.color ?? 'outline']}" stroke-width="1" opacity="0.9"/>`);
    parts.push(`<circle cx="${from[0]}" cy="${from[1]}" r="2.2" fill="${PAPER[l.dot ?? 'outline']}"/>`);
  }
  for (const sh of fig.shapes ?? []) parts.push(shapeSvg(sh, identity.pt, 1, DARK));
  // Notes: [x, y, cls, text, colorToken?]
  for (const [x, y, cls, text, color] of fig.notes ?? []) {
    parts.push(`<text class="${cls}" x="${x}" y="${y}"${color ? ` style="fill:${DARK[color]}"` : ''}>${text}</text>`);
  }
  const W = fig.width ?? 520, H = fig.height;
  const sepY = H - 7 - fig.credit.length * 13;
  parts.push(`<line x1="0" y1="${sepY}" x2="${W - 8}" y2="${sepY}" stroke="#4a5670" stroke-width="1" opacity="0.4"/>`);
  for (const [i, line] of fig.credit.entries()) {
    parts.push(`<text class="cr" x="0" y="${H - 6 - (fig.credit.length - 1 - i) * 13}">${line}</text>`);
  }

  const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(fig.aria).replace(/"/g, '&quot;')}">\n${parts.join('\n')}\n</svg>`;
  return { svg, html: `<figure class="fig" id="${fig.id}">\n${svg}\n<figcaption>${fig.caption}</figcaption>\n</figure>` };
}

// librsvg is a strict XML parser and knows no HTML entities. The procedure
// HTML goes through cheerio before export-figures sees it, which decodes
// them; the preview skips that step, so decode the common ones here.
const ENTITIES = { mdash: '\u2014', ndash: '\u2013', rsquo: '\u2019', lsquo: '\u2018', ldquo: '\u201c', rdquo: '\u201d', rarr: '\u2192', larr: '\u2190', uarr: '\u2191', darr: '\u2193', deg: '\u00b0', middot: '\u00b7', times: '\u00d7', ge: '\u2265', le: '\u2264', asymp: '\u2248', nbsp: '\u00a0' };
const forXml = (svg) => svg.replace(/&([a-z]+);/g, (m, n) => ENTITIES[n] ?? (n === 'amp' || n === 'lt' || n === 'gt' || n === 'quot' ? m : (() => { throw new Error(`unknown entity ${m}`); })()));

function splice(html, id, block, file) {
  const re = new RegExp(`(<!-- plate:${id} -->)[\\s\\S]*?(<!-- /plate:${id} -->)`);
  if (!re.test(html)) throw new Error(`${file}: no <!-- plate:${id} --> ... <!-- /plate:${id} --> markers`);
  return html.replace(re, `$1\n${block}\n$2`);
}

const preview = process.argv.includes('--preview');
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7);
const sha1s = recordedSha1s();
const byFile = new Map();
for (const fig of FIGURES) {
  if (only && fig.id !== only) continue;
  const { svg, html } = await buildFigure(fig, sha1s);
  for (const file of [fig.file, ...(fig.alsoIn ?? [])]) {
    const p = path.join(ROOT, 'Procedures', file);
    const cur = byFile.get(p) ?? readFileSync(p, 'utf8');
    byFile.set(p, splice(cur, fig.id, html, file));
  }
  if (preview) {
    const dir = path.join(ROOT, 'dist/plate-previews');
    mkdirSync(dir, { recursive: true });
    const W = fig.width ?? 520;
    await sharp(Buffer.from(forXml(svg)), { density: Math.round((1200 / W) * 72) })
      .flatten({ background: '#111720' }).png().toFile(path.join(dir, `${fig.id}.png`));
  }
  console.log(`  ${fig.id}  (${Math.round(html.length / 1024)} KB)`);
}
for (const [p, html] of byFile) writeFileSync(p, html);
console.log(`Wrote ${byFile.size} file(s).`);
