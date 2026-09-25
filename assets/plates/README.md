# Gray's Anatomy plates

Engravings by **Henry Vandyke Carter** from *Gray's Anatomy of the Human Body*,
20th edition (1918), as hosted on Wikimedia Commons. **Public domain.** Credit is
still rendered on every figure that uses one, both in the SVG and so on the
rasterized iOS PNG: it is honest about the source, and it tells a reader who
sees the engraving that the overlay on top of it is ours, not Gray's.

These are built into procedure figures by `scripts/build-plate-figures.mjs`
from the specs in `scripts/plate-figures.mjs`. That script **refuses to use a
plate whose sha1 does not match the table below**. The table values are the
Commons API's own `sha1` for the file, not a hash we computed, so the check
also proves the file is the unaltered Commons original.

To add a plate:

1. Resolve its URL and sha1 through the API (direct image URLs are hash-based):
   `https://commons.wikimedia.org/w/api.php?action=query&titles=File:Gray1215.png&prop=imageinfo&iiprop=url|sha1|size&format=json`
2. Download with a descriptive User-Agent (Wikimedia asks for one on scripted
   requests): `CRISIS-content-pipeline/1.0 (https://github.com/awpeace1906-collab/crisis-content)`.
3. Check the file's sha1 against the API value, then add a row here.
4. Register the overlay on an enlarged, gridded crop. Coordinates read by eye
   off the 400-600 px originals are not accurate enough.

Six of these plates (1195, 1211, 1215, 1217, 1218) were first vetted for the
companion app Kairos, which also chose the overlay positions reused for the
cricothyroid membrane, the safe triangle and the pericardiocentesis entry.

| File | Shows | Commons sha1 | Used in |
|---|---|---|---|
| `gray1195.png` | Neck, extended, near-profile | `3a7149ddd2a1123123a09d56135cd3dca8e15507` | Cricothyrotomy |
| `gray1211.png` | Back, surface anatomy | `5d7cd957f68e122238d355eb10cc7f0b12ea9e18` | Pacing (posterior pad) |
| `gray1215.png` | Lateral chest wall, arm raised | `539890420519d1a54975ccc2363ae7b66d193dea` | Chest tube, finger thoracostomy |
| `gray1217.png` | Lateral thorax: ribs, lung, pleura, spleen | `62b948741b90021b077f1e503d05a4944da25788` | Chest tube |
| `gray1218.png` | Heart projected on the chest wall | `a9c762fa8e42b75b633151ec940124c66c1033f5` | Pericardiocentesis, pacing (anterior pad) |
| `gray1219.png` | Front of trunk and upper thighs | `7c146414bff6830db86eca9aa8bcd9de899a8eb3` | Pelvic binder |
| `gray1245.png` | Front of right thigh: femoral artery and nerve | `92206e77d8752831dcffd9d6b51690f07ce1b88b` | Central line in arrest (femoral) |
| `gray894.png` | Tarsi and their ligaments, right eye | `620cc8c54682345177c707ca373255523fe12013` | Lateral canthotomy |
