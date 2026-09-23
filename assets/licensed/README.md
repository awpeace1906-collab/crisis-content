# Licensed third-party images

Images here are **not ours**. Every one carries a license that requires
attribution, and that attribution has to be rendered somewhere the reader can
see it — not just recorded in this file. Do not move an image out of this
folder into general use without carrying its credit line with it.

**In use:** `us-transverse-cricothyroid.jpg` (Fig 5) ships in the Cricothyrotomy
entry, §04 "Finding the Membrane", as of 2026-09-23. The other three are still
unused — see "Why the other three are still unused" below.

---

## `airway-ultrasound/` — anterior neck ultrasound

**Source:** Riveros-Perez E, Avella-Molano B, Rocuts A. *Airway Ultrasound: A
Narrative Review of Present Use and Future Applications in Anesthesia.*
Healthcare (Basel). 2025;13(13):1502. doi:10.3390/healthcare13131502

**License:** **CC BY 4.0** — verified on the article page, quoted verbatim:
"Licensee MDPI, Basel, Switzerland. This article is an open access article
distributed under the terms and conditions of the Creative Commons Attribution
(CC BY) license."

This is plain CC BY, **not** CC BY-NC — commercial use is permitted, which
matters if CRISIS is ever anything other than free. Attribution is the only
condition.

**Required credit line** (render with the figure, e.g. in the caption):
> Ultrasound image: Riveros-Perez et al., *Healthcare* 2025;13:1502, CC BY 4.0

| File | Original | What it shows |
|---|---|---|
| `us-transverse-cricothyroid.jpg` | Fig 5 | Transverse cricothyroid view, arrow on the cricothyroid membrane. **The most useful single image** — this is the view you'd actually take to find the membrane in an impalpable neck. |
| `us-longitudinal-string-of-pearls.jpg` | Fig 10 | Longitudinal midline, two panels, the classic "string of pearls" of tracheal rings with numbered structures. Small (788×291) — needs cropping to one panel to be legible on a phone. |
| `us-transverse-cricoid.jpg` | Fig 6 | Transverse suprasternal at the cricoid. |
| `us-transverse-tracheal-rings.jpg` | Fig 7 | Transverse suprasternal at the tracheal rings — relevant to **percutaneous tracheostomy** site selection, not just cricothyrotomy. |

## How Fig 5 is used

Embedded as a base64 JPEG inside an `<image>` element in an ordinary inline-SVG
figure, with our own annotation drawn over it. That was chosen because it reuses
the entire existing pipeline with **no app changes on either platform**: the PWA
renders the figure's `svg` field as-is, `export-figures` extracts it, and
`rasterize-figures` flattens it to a PNG for iOS, which has no SVG renderer.
Verified end to end.

Cropped to the ultrasound sector (the machine chrome and depth scale are
illegible at phone width, and a half-clipped "2.5cm" reads as a defect).
Cropping is permitted under CC BY.

**The credit line is rendered twice, deliberately:** in the `<figcaption>`, and
again as text *inside the SVG*. The second one matters — on iOS the figure may
be shown as the rasterized PNG, and a PNG that can be screenshotted or shared
must carry its own attribution. If you ever re-crop or re-export, keep the
in-SVG credit.

## Why the other three are still unused

`us-transverse-tracheal-rings.jpg` (Fig 7), `us-transverse-cricoid.jpg` (Fig 6)
and `us-longitudinal-string-of-pearls.jpg` (Fig 10) carry the paper's own
numeric labels (1, 2, 3, 4) which are meaningless without its captions.

**Those captions could not be verified.** MDPI returns HTTP 403 to automated
fetches, and the PMC full text (PMC12248689) strips figure captions — the
article body survives but every `Figure N` reference renders as an empty `()`.
The paper's prose describes the *views* but never states what each number is.

So the numbers must not be guessed at. Fig 5 is in use precisely because its
annotation is a single unambiguous arrow. To use the others, someone needs to
read the captions off the published PDF and either explain the numbers or
re-annotate the images. **Do not infer them from the sonoanatomy** — a confident
wrong label on a reference image is worse than no image.

---

## Deliberately NOT sourced

**Cricothyrotomy and escharotomy photographs.** Cadaveric and intraoperative
images carry consent and licensing complications well beyond ordinary image
reuse, and for landmark teaching a diagram genuinely serves better. Decided
2026-09-21; revisit only with images the user owns or has explicit consent for.
