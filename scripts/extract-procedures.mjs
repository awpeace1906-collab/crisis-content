// Build-time extractor: Procedures/NN-*.html (HALO procedure pages) -> public/data/procedures.json
// Run with `npm run extract:procedures`. Re-run any time a source HTML file is added/edited.
//
// Structurally near-identical to extract-protocols.mjs (same sec-head/box/
// steps/table/alert/xref/sources block vocabulary) — kept as a separate
// script rather than unified because the hub layout differs (category
// sections wrap sibling `.cards` blocks here, vs. a single `.grid` per
// category on the Crisis hub) and the two content types are edited
// independently.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { HALO_CATEGORY_MAP, UNIFIED_CATEGORIES, PROCEDURE_CATEGORY_OVERRIDES } from './unified-categories.mjs';
import { resolveReview } from './review-policy.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, '../Procedures'); // crisis-content/Procedures/
const OUT_FILE = path.resolve(__dirname, '../dist/procedures.json');
const HUB_FILE = path.join(SRC_DIR, '00-crisis-procedures-hub.html');

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function textOf($el) {
  return $el.text().replace(/\s+/g, ' ').trim();
}
function htmlOf($, $el) {
  return $el.html()?.trim() ?? '';
}

// ---- 1. Parse the hub page for category groupings + card metadata ----
function parseHub() {
  const html = readFileSync(HUB_FILE, 'utf-8');
  const $ = cheerio.load(html);
  const categories = [];

  $('.sec-head.sec-group').each((_, el) => {
    const $secHead = $(el);
    const num = textOf($secHead.find('.sec-num'));
    const colorClass = ($secHead.attr('class') || '').split(/\s+/).find((c) => c.startsWith('c-'));
    const label = $secHead.find('h2').text().trim();
    const catAttr = $secHead.attr('data-cat') || label;

    const category = {
      id: slugify(label),
      label,
      color: colorClass ? colorClass.slice(2) : 'teal',
      order: Number(num) || categories.length + 1,
      cards: [],
    };

    const $cardsBlock = $(`.cards[data-cat-group="${catAttr}"]`);
    $cardsBlock.find('a.card').each((__, cardEl) => {
      const $card = $(cardEl);
      category.cards.push({
        file: $card.attr('href').replace(/^\.\//, ''),
        title: textOf($card.find('.ct')),
        description: textOf($card.find('.cd')),
      });
    });

    categories.push(category);
  });

  return categories;
}

// ---- 2. Parse a single procedure page into structured blocks (shared vocabulary with protocols) ----
function parseTable($, $table) {
  const headers = [];
  $table.find('tr').first().find('th').each((_, th) => headers.push(textOf($(th))));
  const rows = [];
  $table.find('tr').slice(1).each((_, tr) => {
    const cells = [];
    $(tr).find('td').each((__, td) => cells.push(htmlOf($, $(td))));
    if (cells.length) rows.push(cells);
  });
  return { type: 'table', headers, rows };
}

function parseSteps($, $box) {
  const steps = [];
  $box.find('.step-row').each((_, row) => {
    const $row = $(row);
    const colorStyle = $row.find('.step-num').attr('style') || '';
    const colorMatch = colorStyle.match(/var\(--(\w+)\)/);
    steps.push({
      num: textOf($row.find('.step-num')),
      color: colorMatch ? colorMatch[1] : 'teal',
      title: textOf($row.find('.step-title')),
      html: htmlOf($, $row.find('.step-desc')),
    });
  });
  return { type: 'steps', steps };
}

function parseSources($, $ul) {
  const items = [];
  $ul.find('li').each((_, li) => {
    const $li = $(li);
    const tier = textOf($li.find('.tier'));
    const $clone = $li.clone();
    $clone.find('.tier').remove();
    items.push({ tier, html: $clone.html()?.trim() ?? '' });
  });
  return { type: 'sources', items };
}

function parseSection($, $secHead) {
  const colorClass = ($secHead.attr('class') || '').split(/\s+/).find((c) => c.startsWith('c-'));
  const section = {
    id: $secHead.attr('id') || slugify($secHead.find('h2').text().trim()),
    num: textOf($secHead.find('.sec-num')),
    color: colorClass ? colorClass.slice(2) : 'teal',
    title: $secHead.find('h2').text().trim(),
    tagline: null,
    blocks: [],
  };

  let $node = $secHead.next();
  while ($node.length && !$node.hasClass('sec-head') && !$node.hasClass('footer')) {
    if ($node.hasClass('tagline')) {
      // Procedures can carry several tagline lines per section (one per
      // technique variant, e.g. "Needle" / "Percutaneous" / "Surgical"
      // cricothyrotomy each get their own steps box) — unlike protocols,
      // which have at most one. Always emit inline rather than trying to
      // hoist to a single section-level tagline slot.
      section.blocks.push({ type: 'tagline', html: htmlOf($, $node) });
    } else if ($node.hasClass('box') && $node.find('.step-row').length) {
      section.blocks.push(parseSteps($, $node));
    } else if ($node.hasClass('box')) {
      const colorC = ($node.attr('class') || '').split(/\s+/).find((c) => c.startsWith('t-'));
      section.blocks.push({ type: 'box', color: colorC ? colorC.slice(2) : 'teal', html: htmlOf($, $node) });
    } else if ($node.hasClass('alert')) {
      const colorC = ($node.attr('class') || '').split(/\s+/).find((c) => ['red', 'amber'].includes(c));
      section.blocks.push({
        type: 'alert',
        color: colorC || 'red',
        title: textOf($node.find('.alert-t')),
        html: htmlOf($, $node.find('p')),
      });
    } else if ($node.is('table.rt')) {
      section.blocks.push(parseTable($, $node));
    } else if ($node.hasClass('xref')) {
      section.blocks.push({ type: 'xref', html: htmlOf($, $node) });
    } else if ($node.hasClass('sources')) {
      section.blocks.push(parseSources($, $node));
    } else if ($node.is('div,p,ul')) {
      const html = htmlOf($, $node);
      if (html) section.blocks.push({ type: 'html', html });
    }
    $node = $node.next();
  }

  return section;
}

function parseProcedure(filename, hubMeta) {
  const filePath = path.join(SRC_DIR, filename);
  const html = readFileSync(filePath, 'utf-8');
  const $ = cheerio.load(html);

  const title = $('h1').first().text().trim();
  const id = slugify(title);
  const kicker = textOf($('.kicker').first());
  const subtitle = textOf($('.subtitle').first());
  const badges = [];
  $('.badges .badge').each((_, b) => {
    const $b = $(b);
    const colorClass = ($b.attr('class') || '').split(/\s+/).find((c) => c !== 'badge');
    badges.push({ color: colorClass || 'teal', text: textOf($b) });
  });

  const sections = [];
  $('.sec-head').each((_, el) => sections.push(parseSection($, $(el))));

  const footer = textOf($('.footer').first());

  // Staleness tracking (see review-policy.mjs) — same mechanism as protocols.
  const review = resolveReview({
    declaredTier: $('body').attr('data-review-tier'),
    declaredLastVerified: $('body').attr('data-last-verified'),
    fallbackDate: statSync(filePath).mtime.toISOString().slice(0, 10),
  });

  return {
    id,
    type: 'procedure',
    file: filename,
    title,
    kicker,
    subtitle,
    badges,
    category: hubMeta?.categoryId ?? null,
    categoryLabel: hubMeta?.categoryLabel ?? null,
    categoryOrder: hubMeta?.categoryOrder ?? 99,
    color: hubMeta?.color ?? 'teal',
    description: hubMeta?.description ?? subtitle,
    ...review,
    sections,
    footer,
  };
}

function main() {
  const categories = parseHub();
  const fileToMeta = new Map();
  for (const cat of categories) {
    // Remap HALO's own 8 procedure-hub categories onto the unified 7-category
    // taxonomy protocols and procedures now share (Option 3, 2026-08-25) —
    // see unified-categories.mjs. `cat` (id/label/order/color from the
    // procedures hub) is only used here to look up card metadata below;
    // the emitted category fields are the unified target's, not the hub's.
    const targetId = HALO_CATEGORY_MAP[cat.id];
    const target = UNIFIED_CATEGORIES.find((c) => c.id === targetId);
    if (!target) throw new Error(`No unified category mapping for HALO category "${cat.id}" — update HALO_CATEGORY_MAP in unified-categories.mjs`);
    for (const card of cat.cards) {
      fileToMeta.set(card.file, {
        categoryId: target.id,
        categoryLabel: target.label,
        categoryOrder: target.order,
        color: target.color,
        description: card.description,
      });
    }
  }

  const files = readdirSync(SRC_DIR).filter(
    (f) => /^\d\d-.*\.html$/.test(f) && f !== '00-crisis-procedures-hub.html'
  );

  const procedures = [];
  const missing = [];
  for (const file of files) {
    try {
      procedures.push(parseProcedure(file, fileToMeta.get(file)));
    } catch (err) {
      console.error(`Failed to parse ${file}:`, err.message);
    }
  }

  for (const [file, meta] of fileToMeta) {
    if (!files.includes(file)) missing.push({ file, ...meta });
  }

  // Per-procedure category overrides (see unified-categories.mjs) — for
  // procedures that don't fit their whole HALO category's bulk mapping.
  for (const p of procedures) {
    const overrideId = PROCEDURE_CATEGORY_OVERRIDES[p.id];
    if (!overrideId) continue;
    const target = UNIFIED_CATEGORIES.find((c) => c.id === overrideId);
    if (!target) throw new Error(`PROCEDURE_CATEGORY_OVERRIDES["${p.id}"] references unknown category "${overrideId}"`);
    p.category = target.id;
    p.categoryLabel = target.label;
    p.categoryOrder = target.order;
  }

  procedures.sort((a, b) => a.categoryOrder - b.categoryOrder || a.title.localeCompare(b.title));

  // Same adjacent-no-repeat cycling used for protocols — see extract-protocols.mjs.
  const PALETTE = ['teal', 'blue', 'purple', 'red', 'amber'];
  procedures.forEach((p, i) => {
    p.color = PALETTE[i % PALETTE.length];
  });

  // The original 8 HALO hub categories, kept as sourced metadata only —
  // each procedure's own category/categoryLabel/categoryOrder fields carry
  // the *unified* taxonomy now (see fileToMeta above), which is what the
  // app actually groups by. Nothing reads this array anymore.
  const categoryList = categories.map((c) => ({ id: c.id, label: c.label, color: c.color, order: c.order }));

  writeFileSync(
    OUT_FILE,
    JSON.stringify({ generatedAt: new Date().toISOString(), categories: categoryList, procedures, pending: missing }, null, 2)
  );

  console.log(`Wrote ${procedures.length} procedures (${missing.length} pending/not-yet-authored) -> ${OUT_FILE}`);
}

main();
