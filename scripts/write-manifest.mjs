// Writes dist/manifest.json — a small, single version marker for the whole
// content bundle, separate from each JSON file's own `generatedAt`.
// Content Update Architecture, 2026-08-31.
//
// The app's Settings screen shows `commit` so a correction is traceable
// straight to the git commit that made it (git history doubling as the
// changelog, per the solo-maintainer workflow this whole architecture is
// built around) — no separate changelog file to keep in sync by hand.
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');

function commitSha() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try {
    return execSync('git rev-parse HEAD', { cwd: path.resolve(__dirname, '..') }).toString().trim();
  } catch {
    return 'local';
  }
}

function loadJSON(name) {
  return JSON.parse(readFileSync(path.join(DIST_DIR, name), 'utf-8'));
}

function main() {
  const protocolsData = loadJSON('protocols.json');
  const proceduresData = loadJSON('procedures.json');
  const envenomationData = loadJSON('envenomation.json');

  const manifest = {
    commit: commitSha(),
    builtAt: new Date().toISOString(),
    version: `${protocolsData.generatedAt}|${envenomationData.generatedAt}|${proceduresData.generatedAt}`,
    counts: {
      protocols: protocolsData.protocols.length,
      procedures: proceduresData.procedures.length,
      species: envenomationData.regions.reduce((n, r) => n + r.species.length, 0),
    },
  };

  writeFileSync(path.join(DIST_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`Wrote manifest.json — commit ${manifest.commit.slice(0, 7)}, version ${manifest.version}`);
}

main();
