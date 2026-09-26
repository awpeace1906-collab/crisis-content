// Rasterizes dist/figures/*.svg to PNG for iOS, which has no native SVG
// rendering. Run after export-figures.mjs (npm run build does both).
//
// Two deliberate choices:
//  - The dark surface colour is BAKED IN rather than left transparent. The
//    diagrams use light text on a dark surface, so a transparent PNG is
//    invisible anywhere it isn't composited on exactly the right background.
//    Baking it also matches how the web renders them (inside a .fig-svg box).
//  - One high-resolution PNG per figure rather than @1x/@2x/@3x variants.
//    SwiftUI scales with .resizable().scaledToFit(), the figures are flat
//    line art, and three variants would triple the asset weight for no
//    visible gain on any current device.
//  - PNG for line art, JPEG for any figure that embeds a raster <image> (a
//    Gray's plate, an ultrasound). Engraving hatching and speckle are
//    photographic content: as PNG those figures ran 400 KB-1.3 MB each and
//    blew the budget below; as JPEG they are about a third of that with no
//    visible loss. iOS looks for <figureId>.png, then .jpg.
//
// Fonts fall back to generic sans/mono, because librsvg resolves fonts from
// the host and CI (Linux) has neither Syne nor IBM Plex Mono. A consistent
// fallback everywhere beats rendering that differs between a laptop and CI.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import { createHash } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIG_DIR = path.resolve(__dirname, '../dist/figures');
const OUT = path.join(FIG_DIR, 'png');

const SURFACE = '#111720';
const TARGET_WIDTH = 1200; // ample for 3x on the widest iPhone
const WARN_TOTAL_KB = 4096; // asset-weight tripwire for the offline bundle

async function main() {
  let svgs;
  try {
    svgs = readdirSync(FIG_DIR).filter((f) => f.endsWith('.svg'));
  } catch {
    console.log('No dist/figures — run export-figures first.');
    return;
  }
  if (!svgs.length) {
    console.log('No figures to rasterize.');
    return;
  }

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  let totalBytes = 0;
  // figureId -> { file, sha1, bytes }. The iOS app fetches this after each
  // content refresh and downloads only figures whose sha1 differs from the
  // copy it already has, so a figure fix ships without an app release.
  const index = {};
  for (const file of svgs) {
    const svgPath = path.join(FIG_DIR, file);
    const svg = readFileSync(svgPath);

    // Derive the intrinsic size from the viewBox so the density scales to a
    // predictable output width regardless of how the figure was authored.
    const vb = /viewBox="([\d.\s-]+)"/.exec(svg.toString());
    if (!vb) {
      console.error(`  SKIP ${file} — no viewBox`);
      continue;
    }
    const [, , vbW] = vb[1].trim().split(/\s+/).map(Number);
    const density = Math.round((TARGET_WIDTH / vbW) * 72);

    const photographic = /<image\b/.test(svg.toString());
    const base = sharp(svg, { density }).flatten({ background: SURFACE });
    const png = photographic
      ? await base.jpeg({ quality: 82, mozjpeg: true }).toBuffer()
      : await base.png({ compressionLevel: 9 }).toBuffer();

    const outPath = path.join(OUT, file.replace(/\.svg$/, photographic ? '.jpg' : '.png'));
    writeFileSync(outPath, png);
    index[file.replace(/\.svg$/, '')] = {
      file: path.basename(outPath),
      sha1: createHash('sha1').update(png).digest('hex'),
      bytes: png.length,
    };
    const kb = statSync(outPath).size / 1024;
    totalBytes += statSync(outPath).size;
    const meta = await sharp(png).metadata();
    console.log(`  ${path.basename(outPath)}  ${meta.width}x${meta.height}  ${kb.toFixed(0)} KB`);
  }

  // Not index.json: iOS flattens bundled resources to the bundle root, where
  // a generic name could collide with some other file.
  writeFileSync(
    path.join(OUT, 'figures-index.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), figures: index }, null, 2),
  );

  const totalKB = totalBytes / 1024;
  console.log(`\nRasterized ${svgs.length} figure(s) — ${totalKB.toFixed(0)} KB total -> ${OUT}`);

  if (totalKB > WARN_TOTAL_KB) {
    console.error(`\nFigure assets total ${totalKB.toFixed(0)} KB, over the ${WARN_TOTAL_KB} KB budget.`);
    console.error('These ship inside the app bundle and the offline cache — trim or downscale before adding more.');
    process.exitCode = 1;
  }
}

main();
