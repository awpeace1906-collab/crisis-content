// CI tripwire — Content Update Architecture, 2026-08-31.
// Reads the built dist/*.json bundles and reports every item whose
// reviewDue date has passed. Exits non-zero (fails the CI job) only when a
// Tier 1 item is overdue — Tier 2/3 overdue items are reported but don't
// fail the build, since they're lower-stakes drift that can wait for the
// next scheduled pass rather than blocking every push.
//
// Run locally any time with `npm run check-staleness` after `npm run
// extract`. In CI (.github/workflows/build-and-check.yml) this also runs on
// a daily schedule with no content change at all, specifically so items
// don't quietly cross their reviewDue date unnoticed between edits — a
// tripwire that fires on the calendar, not just on a diff.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');

function loadJSON(name) {
  return JSON.parse(readFileSync(path.join(DIST_DIR, name), 'utf-8'));
}

function collectItems() {
  const protocols = loadJSON('protocols.json').protocols;
  const procedures = loadJSON('procedures.json').procedures;
  const envenomation = loadJSON('envenomation.json').regions;

  const items = [];
  for (const p of protocols) {
    items.push({ kind: 'protocol', id: p.id, title: p.title, ...pick(p) });
  }
  for (const p of procedures) {
    items.push({ kind: 'procedure', id: p.id, title: p.title, ...pick(p) });
  }
  for (const region of envenomation) {
    for (const s of region.species) {
      items.push({ kind: 'species', id: `${region.id}/${s.id}`, title: s.title, ...pick(s) });
    }
  }
  return items;
}

function pick(item) {
  return {
    reviewTier: item.reviewTier,
    reviewTierIsDefault: item.reviewTierIsDefault,
    lastVerified: item.lastVerified,
    lastVerifiedIsInferred: item.lastVerifiedIsInferred,
    reviewDue: item.reviewDue,
  };
}

function main() {
  const today = new Date().toISOString().slice(0, 10);
  const items = collectItems();
  const overdue = items.filter((i) => i.reviewDue < today).sort((a, b) => a.reviewDue.localeCompare(b.reviewDue));
  const overdueTier1 = overdue.filter((i) => i.reviewTier === 1);

  const untagged = items.filter((i) => i.reviewTierIsDefault);
  const inferred = items.filter((i) => i.lastVerifiedIsInferred);

  console.log(`Staleness check — ${items.length} items, today=${today}`);
  const taggedT1 = items.filter((i) => i.reviewTier === 1 && !i.reviewTierIsDefault).length;
  console.log(`  ${taggedT1} tagged Tier 1 · ${untagged.length} untagged (default tier applied)`);
  // An inferred lastVerified is the date the file last changed, NOT a date on
  // which a human checked the content. Saying so matters: without the
  // distinction, a spelling fix reads as a clinical review.
  if (inferred.length) {
    console.log(`  ${inferred.length} item(s) have an INFERRED last-verified date (file last changed, not reviewed)`);
  }

  if (overdue.length === 0) {
    console.log('Nothing overdue.');
    return;
  }

  console.log(`\n${overdue.length} item(s) past their review-due date:\n`);
  for (const i of overdue) {
    const flag = i.reviewTier === 1 ? '[TIER 1]' : `[tier ${i.reviewTier}]`;
    const defaulted = i.reviewTierIsDefault ? ' (untagged — default tier applied)' : '';
    const inf = i.lastVerifiedIsInferred ? ' [inferred date]' : '';
    console.log(`  ${flag} ${i.kind}/${i.id} — "${i.title}" — due ${i.reviewDue}, last verified ${i.lastVerified}${inf}${defaulted}`);
  }

  if (overdueTier1.length > 0) {
    console.error(`\n${overdueTier1.length} Tier 1 item(s) overdue — failing.`);
    process.exitCode = 1;
  } else {
    console.log('\nNo Tier 1 items overdue — not failing, but worth a look.');
  }
}

main();
