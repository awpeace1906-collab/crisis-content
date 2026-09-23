// Single source of truth for the unified 7-category taxonomy protocols and
// procedures both live under (Option 3 from the category-mapping proposal,
// 2026-08-25). The first 6 mirror CV_Crisis_Management_Hub.html exactly
// (label/color/order) — if that hub's category labels/colors ever change,
// update EXTRA_CATEGORY's neighbors here to match, since there's no
// automated link between the two.
// Label deliberately avoids "Resuscitation" — "Resuscitation & ACLS-Adjacent"
// already exists as a real hub category, and the two names sitting next to
// each other on Home read as a duplicate/typo rather than two distinct
// things. Also no longer "...Procedures" now that the MTP *protocol* was
// moved in here alongside its procedure (2026-08-25) — it's not
// procedure-only content anymore. `id` kept stable (used as the /category/
// URL slug and as a lookup key elsewhere) even though it no longer matches
// the label exactly.
// Airway, split out of Anesthesia & Perioperative Crises on 2026-09-23.
// That category had grown to 18 items and the airway content was scattered
// through transfusion reactions, awareness, fat embolism and TURP syndrome —
// so in a CICO event you were scanning an 18-item list for the two entries
// that matter.
//
// Deliberately NOT called "CICO". Only two of these entries are CICO
// procedures. Awake fiberoptic is the technique you use so that you never
// reach CICO — filing it under a CICO header inverts its meaning — and
// retrograde intubation needs minutes of oxygenation a CICO does not give you.
// The header names the anatomy; ENTRY_ORDER below puts the CICO pair on top.
//
// Order 1: airway precedes everything else in a resuscitation, and this is the
// category someone opens with the least time to spare.
export const AIRWAY_CATEGORY = {
  id: 'airway',
  label: 'Airway',
  color: 'teal',
  order: 1,
};

export const EXTRA_CATEGORY = {
  id: 'trauma-resuscitation-procedures',
  label: 'Trauma & Critical Care',
  color: 'amber',
  // 8, not 7 — everything shifted down one when Airway took order 1.
  order: 8,
};

// HALO's own 8 procedure-hub categories, each mapped onto one of the 6
// CRISIS categories or EXTRA_CATEGORY above. Two map 1:1 (their ids already
// match a CRISIS category slug); the rest were a deliberate choice among
// several options — see memory for the alternatives that were rejected.
export const HALO_CATEGORY_MAP = {
  'airway': 'airway',
  'vascular-access-circulatory': 'trauma-resuscitation-procedures',
  'thoracic': 'resuscitation-acls-adjacent',
  'hemorrhage-control': 'trauma-resuscitation-procedures',
  'cardiac-neuro': 'trauma-resuscitation-procedures',
  'obstetric': 'obstetric',
  // Field Amputation and MCI Triage read as prehospital/field-operations
  // content, not OR/ED trauma-resuscitation — moved here 2026-08-25 after
  // user review (was 'trauma-resuscitation-procedures' under the initial
  // Option 3 pass).
  'mass-casualty': 'environmental-prehospital',
  'environmental': 'environmental-prehospital',
};

// Per-protocol overrides, applied *after* the normal hub-derived category —
// for the rare case where a protocol belongs somewhere the actual
// CV_Crisis_Management_Hub.html doesn't (yet) have a section for. Keep this
// tiny and deliberate; it exists so we don't have to fabricate a matching
// section in the real site's hub just to satisfy the app's category grid.
export const PROTOCOL_CATEGORY_OVERRIDES = {
  // The MTP *procedure* (hands-on activation) already lives under Trauma &
  // Resuscitation Procedures via HALO_CATEGORY_MAP above; user asked
  // 2026-08-25 to move the MTP *protocol* (decision-making) alongside it,
  // out of Resuscitation & ACLS-Adjacent where the hub currently has it.
  'massive-transfusion-protocol': 'trauma-resuscitation-procedures',
  // The algorithm belongs with the procedures that carry it out (2026-09-23).
  // Laryngospasm moves too: it is a perioperative event, but it is also one of
  // the few that progresses to CICO, and it is treated at the airway.
  'difficult-failed-airway': 'airway',
  'laryngospasm': 'airway',
};

// Per-procedure overrides, same idea as PROTOCOL_CATEGORY_OVERRIDES above
// but for individual procedures that don't fit their whole HALO category's
// bulk mapping. Full-category review (2026-08-25) found that HALO's
// "Cardiac / Neuro" category — entirely routed to Trauma & Critical Care by
// HALO_CATEGORY_MAP — is actually a mixed bag: 3 of its 4 procedures are
// general ACLS arrhythmia/post-arrest care with no particular trauma tie,
// and read much more naturally alongside Torsades de Pointes/Refractory
// VF-pVT & ECPR/Hyperkalemic Cardiac Arrest in Resuscitation & ACLS-Adjacent.
// Only Lateral Canthotomy (orbital trauma) genuinely belongs in the trauma
// bucket, so it's left out of this override and keeps the category default.
export const PROCEDURE_CATEGORY_OVERRIDES = {
  'synchronized-cardioversion-vs-defibrillation': 'resuscitation-acls-adjacent',
  'targeted-temperature-management-initiation': 'resuscitation-acls-adjacent',
  'transcutaneous-transvenous-pacing': 'resuscitation-acls-adjacent',
};

// Explicit within-category ordering. Everything defaults to DEFAULT_ENTRY_ORDER
// and then falls back to alphabetical, which is fine nearly everywhere — but
// alphabetical inside Airway puts "Awake Fiberoptic Intubation" at the top of
// the list you open during a CICO. Lower sorts first.
//
// Note this cannot be fixed by ordering the JSON array: the app stores entries
// in IndexedDB with keyPath 'id', so getAll() returns them in primary-key
// order and any array order is thrown away. The app sorts on this field.
export const DEFAULT_ENTRY_ORDER = 50;

export const ENTRY_ORDER = {
  // CICO rescue first — recognize and declare, then the techniques.
  'front-of-neck-rescue-airway-in-cico': 10,
  'cricothyrotomy-surgical-percutaneous-needle': 11,
  // The algorithm that leads there, and the cause most likely to.
  'difficult-failed-airway': 12,
  'laryngospasm': 13,
  // Difficult airway with time to work — still oxygenating.
  'retrograde-intubation': 14,
  'awake-fiberoptic-intubation': 15,
  // Definitive / semi-elective.
  'percutaneous-surgical-tracheostomy': 16,
};

// Full unified list, for lookups by id (label/color/order). Kept in sync
// with the Crisis hub's 6 by hand — see the note on EXTRA_CATEGORY above.
export const UNIFIED_CATEGORIES = [
  AIRWAY_CATEGORY,
  { id: 'anesthesia-perioperative-crises', label: 'Anesthesia & Perioperative Crises', color: 'red', order: 2 },
  { id: 'resuscitation-acls-adjacent', label: 'Resuscitation & ACLS-Adjacent', color: 'blue', order: 3 },
  { id: 'toxicologic', label: 'Toxicologic', color: 'purple', order: 4 },
  { id: 'obstetric', label: 'Obstetric', color: 'teal', order: 5 },
  { id: 'pediatric-neonatal', label: 'Pediatric / Neonatal', color: 'blue', order: 6 },
  { id: 'environmental-prehospital', label: 'Environmental / Prehospital', color: 'purple', order: 7 },
  EXTRA_CATEGORY,
];
