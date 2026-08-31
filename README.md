# crisis-content

Source content and build pipeline for the [CRISIS](https://github.com/awpeace1906-collab) clinical reference app — protocols, HALO procedures, and envenomation species data. This repo is the **content layer**: the web app and iOS app both consume `dist/*.json` from here at runtime and don't need a rebuild/resubmission to pick up a content fix.

## Content Update Architecture

- **Content lives as versioned JSON, fetched from a CDN.** `dist/*.json` is served via jsDelivr's GitHub CDN (`https://cdn.jsdelivr.net/gh/awpeace1906-collab/crisis-content@main/dist/...`) — free, no infra to run. Both apps cache the last-fetched bundle locally (IndexedDB on web, a local file on iOS) and render from that cache offline-first; a fresh fetch on launch/foreground picks up whatever's newest.
- **A correction is a commit, not a release.** Fix the source HTML in `Protocols/` or `Procedures/`, run `npm run build`, commit, push. `.github/workflows/build-and-check.yml` also does this automatically on every push that touches source content — it re-extracts, commits the rebuilt `dist/`, and purges the jsDelivr cache so the fix is live within seconds, no App Store review and no PWA redeploy involved.
- **Git history is the changelog.** No separate changelog file to maintain — `git log -- Protocols/CV_Crisis_AFE.html` (etc.) is the real audit trail of what changed and when. `dist/manifest.json`'s `commit` field ties whatever's currently live back to the exact commit that produced it.
- **Staleness has two independent tripwires**, because relying on someone remembering to re-check content is exactly how the andexanet mistake happened in the first place:
  1. **CI, on the calendar.** `scripts/check-staleness.mjs` runs on every push *and* on a daily schedule (so it fires even with zero content changes). It fails the build when any Tier 1 item's `reviewDue` date has passed, and opens/updates a pinned `content-staleness`-labeled issue for visibility beyond the Actions tab.
  2. **In-app, per reader.** Every entry shows its `lastVerified` date, and a "flag as outdated" control opens a pre-filled GitHub issue on this repo — so a reader who spots something can report it without needing write access or knowing this architecture exists.
- **This makes a found problem cheap to fix — it does not find problems for you.** The manual re-review pass that catches something like the andexanet dosing error still has to happen; this architecture just means that once it's caught, shipping the fix is a five-minute commit instead of an app-store cycle.

## Tagging content for staleness tracking

Untagged content still works — it gets a default tier (2) and a `lastVerified` inferred from the file's own mtime (see `scripts/review-policy.mjs`). Tag explicitly once you've actually reviewed a file, so the fallback stops standing in for a real answer:

```html
<!-- Protocols/CV_Crisis_*.html and Procedures/NN-*.html -->
<body data-review-tier="1" data-last-verified="2026-08-25">
```

```html
<!-- Envenomation/envenomation-*.html, per species card (one file holds many) -->
<div class="card" ... data-review-tier="1" data-last-verified="2026-08-25">
```

Tier meanings:

| Tier | Interval | What belongs here |
|---|---|---|
| 1 | 6 months | A specific number or agent choice is the crux and being wrong is dangerous — drug/antivenom dosing, reversal-agent choice and dosing, cardioversion/defibrillation energies, weight-based pediatric doses. |
| 2 (default) | 12 months | An algorithm/sequence/decision pathway where order or criteria matter, but no single number is the failure point. |
| 3 | 24 months | Background, rationale, epidemiology, historical framing — lowest drift risk. |

## Local workflow

```bash
npm install
npm run build             # extract Protocols/ + Procedures/ + Envenomation/ -> dist/*.json + manifest.json
npm run check-staleness   # same check CI runs, against whatever's currently in dist/
```

Then, from the app repo, run its `npm run sync-content` to pull the freshly built `dist/*.json` into the app's bundled offline-fallback copy (see that repo's README) — needed only for the *fallback* snapshot baked into the app binary, not for the live CDN path, which just needs this repo pushed.
