// Build-time extractor: Envenomation/envenomation-*.html -> public/data/envenomation.json
// Run with `npm run extract:envenomation`. Re-run any time a source HTML file is added/edited.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { resolveReview } from './review-policy.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, '../Protocols/Envenomation');
const OUT_FILE = path.resolve(__dirname, '../dist/envenomation.json');

function textOf($el) {
  return $el.text().replace(/\s+/g, ' ').trim();
}
function htmlOf($, $el) {
  return $el.html()?.trim() ?? '';
}

function parseSpeciesCard($, cardEl, fallbackDate) {
  const $card = $(cardEl);
  const $head = $card.find('.card-head');
  const tags = {};
  $head.find('.tag').each((_, t) => {
    const $t = $(t);
    const cls = ($t.attr('class') || '').split(/\s+/).find((c) => c !== 'tag');
    tags[cls] = textOf($t);
  });

  const fields = [];
  $card.find('.card-body > .field').each((_, f) => {
    const $f = $(f);
    fields.push({
      label: textOf($f.find('.field-label')),
      html: htmlOf($, $f.find('.field-body')),
    });
  });

  let pearls = null;
  const $pearlsBox = $card.find('.card-body > .box.t-color');
  if ($pearlsBox.length) {
    pearls = {
      label: textOf($pearlsBox.find('.box-label')),
      html: htmlOf($, $pearlsBox.find('.field-body')),
    };
  }

  // Staleness tracking (see review-policy.mjs) — antivenom dosing is
  // exactly the class of content the andexanet-correction case was about,
  // so species get the same per-item tier/lastVerified tagging as
  // protocols/procedures, via data-review-tier/data-last-verified on the
  // .card element itself rather than a whole-file <body> attribute (one
  // region file holds many species, each potentially reviewed separately).
  const review = resolveReview({
    declaredTier: $card.attr('data-review-tier'),
    declaredLastVerified: $card.attr('data-last-verified'),
    fallbackDate,
  });

  return {
    id: $card.attr('id') || null,
    class: $card.attr('data-class') || null,
    mechanism: $card.attr('data-mechanism') || null,
    search: $card.attr('data-search') || '',
    regionTag: tags.region || null,
    classTag: tags.class || null,
    mechanismTag: tags.mechanism || null,
    title: textOf($card.find('.card-title')),
    subtitle: textOf($card.find('.card-sub')),
    fields,
    pearls,
    ...review,
  };
}

function parseNonCritical($) {
  const $notice = $('.notice').first();
  if (!$notice.length) return null;
  const items = [];
  $notice.find('.notice-list li').each((_, li) => {
    const $li = $(li);
    const $clone = $li.clone();
    const name = textOf($clone.find('strong').first());
    $clone.find('strong').first().remove();
    items.push({ name, html: $clone.html()?.trim() ?? '' });
  });
  return {
    label: textOf($notice.find('.notice-label')),
    sub: textOf($notice.find('.notice-sub')),
    items,
  };
}

function parseRegionFile(filename) {
  const filePath = path.join(SRC_DIR, filename);
  const html = readFileSync(filePath, 'utf-8');
  const $ = cheerio.load(html);

  const id = filename.replace(/^envenomation-/, '').replace(/\.html$/, '');
  const label = $('h1').first().text().trim();
  const lede = textOf($('.lede').first());
  const fallbackDate = statSync(filePath).mtime.toISOString().slice(0, 10);

  const species = [];
  $('.card').each((_, el) => species.push(parseSpeciesCard($, el, fallbackDate)));

  const nonCritical = parseNonCritical($);

  return { id, file: filename, label, lede, species, nonCritical };
}

function main() {
  const files = readdirSync(SRC_DIR).filter(
    (f) => f.startsWith('envenomation-') && f.endsWith('.html')
  );

  const regions = files.map(parseRegionFile).sort((a, b) => a.label.localeCompare(b.label));
  const totalSpecies = regions.reduce((sum, r) => sum + r.species.length, 0);

  writeFileSync(
    OUT_FILE,
    JSON.stringify({ generatedAt: new Date().toISOString(), regions }, null, 2)
  );

  console.log(`Wrote ${regions.length} regions / ${totalSpecies} species -> ${OUT_FILE}`);
}

main();
