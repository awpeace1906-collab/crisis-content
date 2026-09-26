// Build-time extractor: CV_Crisis_*.html (source protocol pages) -> public/data/protocols.json
// Run with `npm run extract:protocols`. Re-run any time a source HTML file is added/edited.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as cheerio from 'cheerio';
import {
  EXTRA_CATEGORY,
  PROTOCOL_CATEGORY_OVERRIDES,
  UNIFIED_CATEGORIES,
  ENTRY_ORDER,
  DEFAULT_ENTRY_ORDER,
  resolveSecondaryCategories,
} from './unified-categories.mjs';
import { resolveReview, lastChangedDate } from './review-policy.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, '../Protocols'); // crisis-content/Protocols/
const OUT_FILE = path.resolve(__dirname, '../dist/protocols.json');
const HUB_FILE = path.join(SRC_DIR, 'CV_Crisis_Management_Hub.html');

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// ---- 1. Parse the hub page for category groupings + card metadata ----
function parseHub() {
  const html = readFileSync(HUB_FILE, 'utf-8');
  const $ = cheerio.load(html);
  const categories = [];
  let currentCategory = null;

  $('.page').children().each((_, el) => {
    const $el = $(el);
    if ($el.hasClass('sec-head') && $el.find('h2').length) {
      const num = $el.find('.sec-num').text().trim();
      if (!/^\d+$/.test(num)) return; // skip the "every crisis file follows..." intro sec-head
      const colorClass = ($el.attr('class') || '').split(/\s+/).find((c) => c.startsWith('c-'));
      currentCategory = {
        id: slugify($el.find('h2').text().trim()),
        label: $el.find('h2').text().trim(),
        color: colorClass ? colorClass.slice(2) : 'teal',
        order: Number(num),
        cards: [],
      };
      categories.push(currentCategory);
    } else if ($el.hasClass('grid') && currentCategory) {
      $el.find('a.card').each((__, cardEl) => {
        const $card = $(cardEl);
        const href = $card.attr('href');
        const colorClass = ($card.attr('class') || '').split(/\s+/).find((c) => c.startsWith('t-'));
        currentCategory.cards.push({
          file: href,
          title: $card.find('.card-title').text().trim(),
          description: $card.find('.card-desc').text().trim(),
          color: colorClass ? colorClass.slice(2) : 'teal',
        });
      });
    }
  });

  return categories;
}

// ---- 2. Parse a single protocol page into structured blocks ----
function textOf($el) {
  return $el.text().replace(/\s+/g, ' ').trim();
}

/**
 * An alert's body: everything after its .alert-t title. One paragraph comes
 * through as bare inline HTML, which is the shape every existing alert has.
 * Several come through as <p>…</p><p>…</p>, and both apps lay those out as
 * separate paragraphs.
 *
 * This used to be `htmlOf($, $node.find('p'))`. Cheerio's .html() returns
 * only the FIRST matched element, so every paragraph after the first was
 * silently dropped. Four alerts were losing their second paragraph in both
 * apps (REBOA, TTM, uterine massage, active rewarming).
 */
function alertBodyHtml($, $node) {
  const $body = $node.clone();
  $body.find('.alert-t').remove();
  const $ps = $body.children('p');
  if ($ps.length === 1 && $body.children().length === 1) return htmlOf($, $ps.first());
  return htmlOf($, $body);
}

function htmlOf($, $el) {
  return $el.html()?.trim() ?? '';
}

/** Placeholder for a column covered by the previous cell's colspan. An HTML
 *  comment, so a renderer that doesn't know about it still shows nothing. */
const COLSPAN = '<!--colspan-->';

function parseTable($, $table) {
  const headers = [];
  $table.find('tr').first().find('th').each((_, th) => headers.push(textOf($(th))));
  const rows = [];
  $table.find('tr').slice(1).each((_, tr) => {
    const cells = [];
    $(tr).find('td').each((__, td) => {
      cells.push(htmlOf($, $(td)));
      // A cell spanning columns is followed by COLSPAN placeholders so every
      // later cell stays under its own header. Dropping the span shifted
      // them one column left: in the phone card layout an ECMO note came out
      // labeled "Return". Renderers read the placeholder back as a span.
      const span = Number($(td).attr('colspan')) || 1;
      for (let i = 1; i < span; i++) cells.push(COLSPAN);
    });
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

function parseSection($, $secHead, $stopBefore) {
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
  while ($node.length && !$node.is($stopBefore) && !$node.hasClass('sec-head') && !$node.hasClass('footer')) {
    if ($node.hasClass('tagline')) {
      section.tagline = textOf($node);
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
        html: alertBodyHtml($, $node),
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

function parseProtocol(filename, hubMeta) {
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
  $('.sec-head').each((_, el) => {
    const $secHead = $(el);
    // stop-before target is unused (we stop at next .sec-head via loop condition)
    sections.push(parseSection($, $secHead, null));
  });

  const footer = textOf($('.footer').first());

  // Staleness tracking (see review-policy.mjs) — explicit <body data-review-tier
  // data-last-verified> wins; falls back to the file's own mtime + a default
  // tier when a file hasn't been tagged yet.
  const review = resolveReview({
    declaredTier: $('body').attr('data-review-tier'),
    declaredLastVerified: $('body').attr('data-last-verified'),
    fallbackDate: lastChangedDate(filePath),
  });

  return {
    id,
    type: 'protocol',
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
    for (const card of cat.cards) {
      fileToMeta.set(card.file, {
        categoryId: cat.id,
        categoryLabel: cat.label,
        categoryOrder: cat.order,
        color: card.color,
        description: card.description,
      });
    }
  }

  const files = readdirSync(SRC_DIR).filter(
    (f) => f.startsWith('CV_Crisis_') && f.endsWith('.html') && f !== 'CV_Crisis_Management_Hub.html'
  );

  const protocols = [];
  const missing = [];
  for (const file of files) {
    try {
      protocols.push(parseProtocol(file, fileToMeta.get(file)));
    } catch (err) {
      console.error(`Failed to parse ${file}:`, err.message);
    }
  }

  // Per-protocol category overrides (see unified-categories.mjs) — applied
  // after normal hub-based categorization, before sort/color-cycling so
  // both reflect the final category.
  for (const p of protocols) {
    const overrideId = PROTOCOL_CATEGORY_OVERRIDES[p.id];
    if (!overrideId) continue;
    const target =
      [...categories.map((c) => ({ id: c.id, label: c.label, order: c.order })), ...UNIFIED_CATEGORIES].find(
        (c) => c.id === overrideId,
      );
    if (!target) throw new Error(`PROTOCOL_CATEGORY_OVERRIDES["${p.id}"] references unknown category "${overrideId}"`);
    p.category = target.id;
    p.categoryLabel = target.label;
    p.categoryOrder = target.order;
  }

  // Reconcile against the unified taxonomy. Protocols take label/order from the
  // protocol hub, procedures take theirs from UNIFIED_CATEGORIES — so any
  // category present in both has to resolve to the same numbers here, or the
  // two halves of a category render as two groups.
  for (const p of protocols) {
    const unified = UNIFIED_CATEGORIES.find((c) => c.id === p.category);
    if (!unified) continue;
    p.categoryLabel = unified.label;
    p.categoryOrder = unified.order;
  }

  // Report protocols the hub references but that don't exist on disk yet (queued content)
  for (const [file, meta] of fileToMeta) {
    if (!files.includes(file)) missing.push({ file, ...meta });
  }

  for (const p of protocols) {
    p.entryOrder = ENTRY_ORDER[p.id] ?? DEFAULT_ENTRY_ORDER;
    p.secondaryCategories = resolveSecondaryCategories(p.id);
  }
  protocols.sort(
    (a, b) => a.categoryOrder - b.categoryOrder || a.entryOrder - b.entryOrder || a.title.localeCompare(b.title),
  );

  // The hub's per-card colors are decorative and not sequence-aware, so
  // adjacent cards can (and do) land on the same color. Reassign by cycling
  // through the theme palette across the final display order instead —
  // guarantees no two consecutive protocols share a color, with no color
  // tied to any particular category.
  const PALETTE = ['teal', 'blue', 'purple', 'red', 'amber'];
  protocols.forEach((p, i) => {
    p.color = PALETTE[i % PALETTE.length];
  });

  // Home's category tile grid renders from this list. It used to be the hub's
  // own sections plus EXTRA_CATEGORY appended by hand — which meant any unified
  // category the hub has no section for silently got no tile. Airway was
  // exactly that (2026-09-24): it existed in every entry and rendered in the
  // HALO and Protocols lists, but Home had no Airway tile, so from Home you
  // tapped Anesthesia and found no procedures at all.
  //
  // Now built from UNIFIED_CATEGORIES, the same list that owns label and order
  // for every entry. The hub's colour is kept where the hub defines the
  // category, since it mirrors the live site.
  const hubColor = new Map(categories.map((c) => [c.id, c.color]));
  const categoryList = UNIFIED_CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    color: hubColor.get(c.id) ?? c.color,
    order: c.order,
  })).sort((a, b) => a.order - b.order);

  writeFileSync(
    OUT_FILE,
    JSON.stringify({ generatedAt: new Date().toISOString(), categories: categoryList, protocols, pending: missing }, null, 2)
  );

  console.log(`Wrote ${protocols.length} protocols (${missing.length} pending/not-yet-authored) -> ${OUT_FILE}`);
}

main();
