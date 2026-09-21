// Exports every inline figure SVG from the built bundles into
// dist/figures/<figureId>.svg, plus a contact-sheet preview page.
//
// The SVG's source of truth stays INLINE in the procedure/protocol HTML —
// these files are generated, never hand-edited, exactly like dist/*.json.
// That avoids the two-copies-that-drift problem you'd get from maintaining
// standalone .svg files alongside the content.
//
// This is also step one of iOS rasterization: rasterize-figures.mjs turns
// these same files into PNGs, since SwiftUI can't render SVG.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');
const OUT = path.join(DIST, 'figures');

function loadFigures() {
  const figures = [];
  for (const [file, key] of [['procedures.json', 'procedures'], ['protocols.json', 'protocols']]) {
    let bundle;
    try {
      bundle = JSON.parse(readFileSync(path.join(DIST, file), 'utf-8'));
    } catch {
      continue;
    }
    for (const entry of bundle[key] ?? []) {
      for (const section of entry.sections ?? []) {
        for (const block of section.blocks ?? []) {
          if (block.type === 'figure' && block.svg) {
            figures.push({
              figureId: block.figureId,
              svg: block.svg,
              caption: block.caption ?? '',
              alt: block.alt ?? '',
              entry: entry.title,
              section: section.title,
            });
          }
        }
      }
    }
  }
  return figures;
}

/**
 * Catches content drawn outside the viewBox, which renders as a silent clip
 * — a label at y=472 in a 470-tall viewBox just vanishes at the edge, with
 * no error anywhere. Easy to do once and very easy to repeat across dozens
 * of hand-authored diagrams, so it's checked on every build.
 */
function checkBounds(fig) {
  const vb = /viewBox="([\d.\s-]+)"/.exec(fig.svg);
  if (!vb) return [`${fig.figureId}: no viewBox`];
  const [, , w, h] = vb[1].trim().split(/\s+/).map(Number);
  const problems = [];

  const note = (what, x, y) => {
    if (y != null && (y < 0 || y > h)) problems.push(`${what} y=${y} outside 0..${h}`);
    if (x != null && (x < 0 || x > w)) problems.push(`${what} x=${x} outside 0..${w}`);
  };

  // <text x= y=> — add a rough descender allowance so text sitting exactly
  // on the bottom edge is still flagged.
  for (const m of fig.svg.matchAll(/<text[^>]*\sx="([-\d.]+)"[^>]*\sy="([-\d.]+)"/g)) {
    note('text', Number(m[1]), Number(m[2]) + 4);
  }
  // <polyline points="x,y x,y ...">
  for (const m of fig.svg.matchAll(/points="([^"]+)"/g)) {
    for (const pair of m[1].trim().split(/\s+/)) {
      const [x, y] = pair.split(',').map(Number);
      note('point', x, y);
    }
  }
  // <line x1 y1 x2 y2>
  for (const m of fig.svg.matchAll(/<line[^>]*x1="([-\d.]+)"[^>]*y1="([-\d.]+)"[^>]*x2="([-\d.]+)"[^>]*y2="([-\d.]+)"/g)) {
    note('line', Number(m[1]), Number(m[2]));
    note('line', Number(m[3]), Number(m[4]));
  }
  // <path d="M x,y L x,y">
  for (const m of fig.svg.matchAll(/\sd="([^"]+)"/g)) {
    for (const pair of m[1].matchAll(/([-\d.]+),([-\d.]+)/g)) {
      note('path', Number(pair[1]), Number(pair[2]));
    }
  }
  return problems.map((p) => `${fig.figureId}: ${p}`);
}

function main() {
  const figures = loadFigures();
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  for (const f of figures) {
    writeFileSync(path.join(OUT, `${f.figureId}.svg`), f.svg);
  }

  const problems = figures.flatMap(checkBounds);
  if (problems.length) {
    console.error(`\n${problems.length} figure bounds problem(s) — content will be silently clipped:`);
    for (const p of problems) console.error(`  ${p}`);
    process.exitCode = 1;
  }

  // Contact sheet — every diagram on the app's real background, so they can
  // be reviewed together for visual consistency rather than one at a time.
  const cards = figures.map((f) => `
    <section>
      <h2>${f.entry}</h2>
      <p class="loc">${f.section}</p>
      <div class="frame">${f.svg}</div>
      ${f.caption ? `<p class="cap">${f.caption}</p>` : ''}
      <p class="id">${f.figureId}.svg</p>
    </section>`).join('\n');

  const html = `<!doctype html><meta charset="utf-8"><title>CRISIS figures</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;500&family=Source+Serif+4:ital@0;1&display=swap" rel="stylesheet">
<style>
  body{background:#0a0e14;color:#e8edf5;font-family:Syne,sans-serif;margin:0;padding:32px 20px;}
  .wrap{max-width:720px;margin:0 auto;}
  h1{font-size:22px;margin:0 0 4px;}
  .sub{color:#8a9ab5;font-size:13px;margin:0 0 28px;font-family:'IBM Plex Mono',monospace;}
  section{margin-bottom:40px;}
  h2{font-size:15px;margin:0 0 2px;}
  .loc{color:#4a5670;font-family:'IBM Plex Mono',monospace;font-size:11px;margin:0 0 10px;}
  .frame{background:#111720;border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:16px;}
  .frame svg{display:block;width:100%;height:auto;}
  .cap{color:#8a9ab5;font-family:'Source Serif 4',serif;font-style:italic;font-size:13px;line-height:1.55;margin:10px 0 0;}
  .id{color:#4a5670;font-family:'IBM Plex Mono',monospace;font-size:10.5px;margin:8px 0 0;}
</style>
<div class="wrap">
<h1>CRISIS &mdash; figure contact sheet</h1>
<p class="sub">${figures.length} figure${figures.length === 1 ? '' : 's'} &middot; generated from dist/ &middot; ${new Date().toISOString().slice(0, 10)}</p>
${cards}
</div>`;

  writeFileSync(path.join(OUT, 'index.html'), html);
  console.log(`Exported ${figures.length} figure(s) -> ${OUT}`);
  for (const f of figures) console.log(`  ${f.figureId}.svg  (${f.entry})`);
}

main();
