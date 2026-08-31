// Staleness/review-cadence policy — Content Update Architecture, 2026-08-31.
//
// Every piece of content (protocol, procedure, envenomation species) can
// declare two source attributes:
//   - a review tier (1/2/3), how time-sensitive it is
//   - a lastVerified date (YYYY-MM-DD), when someone last checked it
//     against current evidence/guidelines
// From those two, a reviewDue date is computed. A CI tripwire
// (scripts/check-staleness.mjs) fails the build once any Tier 1 item's
// reviewDue date has passed, and the app surfaces `lastVerified` /
// `reviewDue` on every entry so a reader has a second way to notice drift
// even if the CI check gets ignored.
//
// Tier meanings (content-authoring judgment, not something an extractor can
// infer on its own):
//   1 = a specific number or agent choice is the crux and being wrong is
//       dangerous — drug/antivenom dosing, reversal-agent choice and dosing,
//       defibrillation/cardioversion energies, weight-based pediatric doses.
//       (The andexanet-correction case is exactly this class.)
//   2 = an algorithm/sequence/decision pathway where the *order* or
//       *criteria* matter but no single number is the failure point.
//   3 = background, rationale, epidemiology, historical framing — lowest
//       drift risk, still worth an occasional pass.
//
// Tag content explicitly via source HTML attributes:
//   Protocols/Procedures:  <body data-review-tier="1" data-last-verified="2026-08-25">
//   Envenomation species:  <div class="card" ... data-review-tier="1" data-last-verified="2026-08-25">
//
// Untagged content is NOT an error — it gets DEFAULT_TIER and a
// lastVerified inferred from the source file's own mtime (a real, if weak,
// proxy for "last touched"), so the pipeline never blocks on missing tags.
// Explicit tags always win. Bulk-classifying the full back-catalog by real
// clinical judgment is ongoing content work, not something this script does
// for you — treat DEFAULT_TIER assignments as provisional until someone
// reviews the actual file and tags it for real.
export const DEFAULT_TIER = 2;

export const REVIEW_INTERVAL_MONTHS = {
  1: 6,
  2: 12,
  3: 24,
};

export function parseTier(raw) {
  const n = Number(raw);
  return REVIEW_INTERVAL_MONTHS[n] ? n : null;
}

export function reviewDueDate(lastVerified, tier) {
  const months = REVIEW_INTERVAL_MONTHS[tier] ?? REVIEW_INTERVAL_MONTHS[DEFAULT_TIER];
  const d = new Date(`${lastVerified}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

/**
 * Resolves the final {reviewTier, lastVerified, reviewDue, reviewTierIsDefault}
 * for one piece of content given whatever it declared explicitly (either can
 * be missing) plus a fallback date (typically the source file's mtime).
 */
export function resolveReview({ declaredTier, declaredLastVerified, fallbackDate }) {
  const tier = parseTier(declaredTier) ?? DEFAULT_TIER;
  const lastVerified = declaredLastVerified || fallbackDate;
  return {
    reviewTier: tier,
    reviewTierIsDefault: parseTier(declaredTier) === null,
    lastVerified,
    reviewDue: reviewDueDate(lastVerified, tier),
  };
}
