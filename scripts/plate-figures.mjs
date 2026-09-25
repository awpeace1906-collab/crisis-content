// Specs for figures drawn on Gray's Anatomy plates. Built into the procedure
// HTML by scripts/build-plate-figures.mjs — see that file for the format.
//
// Coordinates inside `panels[].shapes` and `leaders[].from` are in the PLATE's
// own pixel space (read them off an enlarged, gridded crop — by eye on the
// 400-600 px originals is not accurate enough). Everything else is in figure
// space. Overlays that came from Kairos keep Kairos's registration verbatim;
// those plates and coordinates were vetted there first.

const credit = (n) => `Plate: H. V. Carter, Gray&rsquo;s Anatomy, 20th ed. (1918), fig. ${n} &mdash; public domain`;

export const FIGURES = [
  // ---------------------------------------------------------------------------
  {
    id: 'cricothyroid-membrane-on-a-real-neck',
    file: '01-cricothyrotomy.html',
    title: 'The same landmarks, on a real neck',
    subtitle: 'Neck extended, as for the procedure. Gray&rsquo;s own leader lines.',
    panels: [{
      plate: 1195, crop: [104, 125, 208, 205], at: [0, 50], width: 280, grayscale: true,
      // Registration from Kairos (cricothyroidotomy.json).
      shapes: [
        { kind: 'line', from: [236, 203], to: [229, 330], stroke: 'muted', sw: 1.2, dash: true, opacity: 0.85 },
        { kind: 'ellipse', at: [232, 278.5], rx: 9, ry: 4.5, fill: 'good', opacity: 0.35 },
        { kind: 'ellipse', at: [232, 278.5], rx: 9, ry: 4.5, stroke: 'good', sw: 2 },
        { kind: 'line', from: [212, 279.5], to: [222, 279], stroke: 'good', sw: 1.4 },
        { kind: 'label', at: [108, 270], lines: [{ t: 'TARGET', bold: true, fill: 'good' }, 'cricothyroid membrane'] },
        { kind: 'label', at: [232, 318], anchor: 'middle', lines: [{ t: 'MIDLINE', bold: true, fill: 'muted', size: 9.5 }] },
      ],
    }],
    // Dark-side labels sit where Gray's leader lines leave the crop, so they
    // read as the continuation of his pointers.
    notes: [
      [292, 135, 'n', 'floor of mouth'],
      [292, 189, 's', 'HYOID'],
      [292, 220, 's', 'THYROID CARTILAGE'],
      [292, 246, 's', 'CRICOID'],
      [292, 260, 'n', 'the firm, complete ring'],
      [292, 273, 'n', 'just below the target'],
      [0, 350, 's', 'Two soft gaps in the midline. Take the lower one.', 'good'],
      [0, 370, 'c', 'The upper gap, hyoid to thyroid cartilage, is the thyrohyoid'],
      [0, 384, 'c', 'membrane &mdash; above the cords, and the wrong one. The target'],
      [0, 398, 'c', 'lies between the lower edge of the thyroid cartilage and the'],
      [0, 412, 'c', 'cricoid ring. This is a thin male neck; in women and in obesity'],
      [0, 426, 'c', 'you may feel none of it, which is why the incision is vertical.'],
    ],
    credit: [credit(1195), 'Overlay placed by hand on the engraving.'],
    height: 480,
    aria: 'Gray\'s Anatomy engraving of an extended neck in near-profile, with the cricothyroid membrane marked as the target between the lower edge of the thyroid cartilage and the cricoid ring, below the hyoid bone, on a dashed midline. The upper soft gap between the hyoid and the thyroid cartilage is the thyrohyoid membrane, the wrong target. Plate by Henry Vandyke Carter, Gray\'s Anatomy 1918, public domain.',
    caption: 'The schematic above tells you the order; this is what it looks like on a neck. Walk down the midline from the hyoid: the first soft gap is the <b>thyrohyoid membrane &mdash; wrong</b>. The second, between the thyroid cartilage and the <b>cricoid ring</b>, is the target. On a neck you cannot read, the vertical incision is what saves you, not the picture.',
  },
  // ---------------------------------------------------------------------------
  {
    id: 'safe-triangle-on-real-anatomy',
    file: '14-chest-tube-thoracostomy.html',
    alsoIn: ['11-finger-thoracostomy.html'],
    title: 'The safe triangle, on real anatomy',
    subtitle: 'Left side, arm raised &mdash; the insertion position. Mirror it for the right.',
    height: 490,
    panels: [{
      plate: 1215, crop: [0, 110, 463, 270], at: [0, 50], width: 520, grayscale: true,
      // Registration from Kairos (tube-thoracostomy.json), rib angle measured
      // there from Gray's fig. 1217.
      shapes: [
        { kind: 'path', d: 'M 165.7 278.6 L 213.1 257.4 L 265.3 380 L 133.0 380 Z', fill: 'danger', opacity: 0.16 },
        { kind: 'line', from: [140, 290], to: [262, 290], stroke: 'warning', sw: 1.6, dash: true, opacity: 0.85 },
        { kind: 'circle', at: [140, 290], r: 6, stroke: 'warning', sw: 1.8 },
        { kind: 'path', d: 'M 190 203 L 165.7 278.6 L 213.1 257.4 Z', fill: 'good', opacity: 0.32 },
        { kind: 'path', d: 'M 165.7 278.6 L 190 203 L 213.1 257.4', stroke: 'good', sw: 2.8 },
        { kind: 'line', from: [140, 290], to: [227, 251.3], stroke: 'good', sw: 3.2 },
        { kind: 'circle', at: [190, 250.7], r: 5.5, fill: 'accent', stroke: 'outline', sw: 1.2 },
        { kind: 'line', from: [190, 179], to: [190, 199], stroke: 'good', sw: 1.4 },
        { kind: 'label', at: [190, 156], anchor: 'middle', lines: [{ t: 'SAFE TRIANGLE', bold: true, fill: 'good', size: 12 }] },
        { kind: 'line', from: [196, 250.7], to: [236, 238], stroke: 'outline', sw: 1 },
        { kind: 'label', at: [236, 222], lines: [{ t: 'INSERT: 4th&ndash;5th space', bold: true, fill: 'accent' }, 'just anterior to mid-axillary,', 'over the TOP of the rib'] },
        { kind: 'line', from: [228, 289], to: [240, 297], stroke: 'outline', sw: 1 },
        { kind: 'label', at: [240, 290], lines: [{ t: 'Horizontal line sits ~1 space', bold: true, fill: 'warning' }, 'low here: ribs rise to the back'] },
        { kind: 'label', at: [118, 262], anchor: 'end', lines: [{ t: 'base follows', bold: true, fill: 'good' }, { t: 'the rib, not', bold: true, fill: 'good' }, { t: 'the floor', bold: true, fill: 'good' }] },
        { kind: 'label', at: [212, 345], anchor: 'middle', lines: [{ t: 'Below the triangle:', bold: true, fill: 'danger' }, { t: 'diaphragm, liver, spleen', fill: 'danger' }] },
        { kind: 'text', at: [6, 376], text: '← anterior', fill: 'muted', size: 10 },
        { kind: 'text', at: [457, 376], text: 'posterior →', fill: 'muted', size: 10, anchor: 'end' },
      ],
    }],
    notes: [
      [0, 378, 's', 'Front edge pectoralis major. Back edge latissimus.', 'good'],
      [0, 398, 'c', 'Apex: the axilla. The lower edge is usually given as a horizontal line'],
      [0, 412, 'c', 'at the nipple, but on the side wall the ribs climb toward the back, so'],
      [0, 426, 'c', 'a line drawn level from the nipple ends up about one space low by the'],
      [0, 440, 'c', 'latissimus edge &mdash; toward the diaphragm. Count the space by feel.'],
    ],
    credit: [credit(1215), 'Overlay: hand-registered to the engraving; rib angle from fig. 1217.'],
    aria: 'Gray\'s Anatomy engraving of the left side of the chest with the arm raised. The safe triangle is shaded between the lateral border of pectoralis major in front, the anterior border of latissimus dorsi behind, and the axilla above. Its lower edge follows the slope of the rib rather than a horizontal line from the nipple, which on the lateral wall lies about one interspace low. The insertion point is in the fourth to fifth interspace just anterior to the mid-axillary line, over the top of the rib. The area below the triangle, over the diaphragm, liver and spleen, is shaded red. Plate by Henry Vandyke Carter, Gray\'s Anatomy 1918, public domain.',
    caption: 'Pectoralis major in front, latissimus dorsi behind, the axilla above. Enter in the <b>4th&ndash;5th interspace just anterior to the mid-axillary line</b>, over the top of the rib. The one refinement over the usual description: the lower edge <b>follows the rib</b>. A horizontal line drawn back from the nipple drifts about one space low by the time it reaches latissimus.',
  },
  // ---------------------------------------------------------------------------
  {
    id: 'why-the-lower-edge-follows-the-rib',
    file: '14-chest-tube-thoracostomy.html',
    title: 'Why the lower edge follows the rib',
    subtitle: 'Same side, ribs drawn in. Gray&rsquo;s colors.',
    height: 432,
    panels: [{
      plate: 1217, crop: [40, 60, 240, 320], at: [0, 50], width: 250,
      // Registration from Kairos (tube-thoracostomy.json).
      shapes: [
        { kind: 'line', from: [108, 280.7], to: [238, 280.7], stroke: 'muted', sw: 1.4, dash: true },
        { kind: 'line', from: [108, 280.7], to: [238, 222.8], stroke: 'accent', sw: 2.8 },
        { kind: 'circle', at: [113, 197], r: 5, stroke: 'warning', sw: 1.6 },
        { kind: 'label', at: [62, 182], lines: [{ t: 'nipple', fill: 'warning', size: 9.5 }] },
      ],
    }],
    leaders: [
      { from: [200, 240], to: [266, 150], color: 'accent', dot: 'accent' },
      { from: [140, 305], to: [266, 250], color: 'danger', dot: 'danger' },
    ],
    notes: [
      [266, 66, 'n', 'purple lung &middot; blue pleura', 'vessel'],
      [266, 80, 'n', 'green spleen', 'good'],
      [266, 94, 'n', 'dashed: true horizontal'],
      [266, 142, 's', 'RIBS RISE ~24&deg;', 'accent'],
      [266, 160, 'n', 'toward the back. A level line'],
      [266, 174, 'n', 'from the nipple crosses into'],
      [266, 188, 'n', 'a lower space as it goes.'],
      [266, 242, 's', 'THE RECESS', 'danger'],
      [266, 260, 'n', 'Pleura continues for a band of'],
      [266, 274, 'n', 'ribs below the lung, with the'],
      [266, 288, 'n', 'spleen (liver, on the right)'],
      [266, 302, 'n', 'just under the diaphragm.'],
      [266, 322, 'n', 'That band is where a low tube'],
      [266, 336, 'n', 'goes &mdash; and what the finger'],
      [266, 350, 'n', 'sweep is checking for.'],
      [0, 404, 's', 'A finger that feels smooth, moving and solid is too low.', 'danger'],
    ],
    credit: [credit(1217)],
    aria: 'Gray\'s Anatomy engraving of the lateral thorax with the ribs, the lung in purple, the pleura in blue and the spleen in green. A line along a rib rises toward the back at about 24 degrees compared with a dashed true horizontal from the level of the nipple. Below the lung the pleura continues as the costodiaphragmatic recess, a band with no lung in it, with the spleen just beneath the diaphragm. Plate by Henry Vandyke Carter, Gray\'s Anatomy 1918, public domain.',
    caption: 'The ribs climb toward the back, so a level line from the nipple crosses into a lower space as it goes. Below the lung, the <b>costodiaphragmatic recess</b> is pleura with no lung in it, and the spleen (on the right, the liver) sits just under the diaphragm beneath it. A low tube goes there.',
  },
  // ---------------------------------------------------------------------------
  {
    id: 'subxiphoid-approach-on-the-hearts-projection',
    file: '13-pericardiocentesis.html',
    title: 'Subxiphoid approach, on the heart&rsquo;s projection',
    subtitle: 'Front view: the patient&rsquo;s left, and the apex, are on the right of the picture.',
    height: 574,
    panels: [{
      plate: 1218, crop: [60, 130, 349, 300], at: [0, 50], width: 520,
      // Registration from Kairos (pericardiocentesis.json).
      shapes: [
        { kind: 'circle', at: [205, 376], r: 4, stroke: 'outline', sw: 1.8 },
        { kind: 'line', from: [242.6, 305.1], to: [271, 203], stroke: 'good', sw: 2.6, dash: true },
        { kind: 'arrow', from: [220, 386], to: [242.6, 305.1], stroke: 'good', sw: 3.4, head: 12 },
        { kind: 'circle', at: [220, 386], r: 5.5, fill: 'good', stroke: 'outline', sw: 1.4 },
        { kind: 'circle', at: [320, 318], r: 9, stroke: 'vessel', sw: 2.4 },
        { kind: 'line', from: [180, 350], to: [201, 373], stroke: 'outline', sw: 1 },
        { kind: 'label', at: [84, 334], lines: [{ t: 'Xiphoid process', bold: true }, 'tip at the circle'] },
        { kind: 'line', from: [226, 388], to: [238, 393], stroke: 'outline', sw: 1 },
        { kind: 'label', at: [238, 378], lines: [{ t: 'ENTRY: just below and', bold: true, fill: 'good' }, { t: 'left of the xiphoid', bold: true, fill: 'good' }, 'the patient&rsquo;s left'] },
        { kind: 'line', from: [270, 222], to: [262, 238], stroke: 'outline', sw: 1 },
        { kind: 'label', at: [272, 196], lines: [{ t: 'AIM: left shoulder,', bold: true, fill: 'good' }, 'about 45&deg; to the skin'] },
        { kind: 'line', from: [322, 327], to: [330, 336], stroke: 'outline', sw: 1 },
        { kind: 'label', at: [316, 336], lines: [{ t: 'Apical window', bold: true, fill: 'vessel' }, 'ultrasound-guided'] },
        { kind: 'label', at: [64, 134], lines: [{ t: 'patient&rsquo;s right', size: 9.5 }] },
        { kind: 'label', at: [406, 134], anchor: 'end', lines: [{ t: 'patient&rsquo;s left', size: 9.5 }] },
      ],
    }],
    notes: [
      [0, 518, 's', 'With ultrasound, choose the window &mdash; not the habit.', 'good'],
      [0, 536, 'c', 'Puncture where the fluid is deepest and closest, free of lung and liver;'],
      [0, 550, 'c', 'that is often apical or parasternal. The needle path here is drawn by hand.'],
    ],
    credit: [credit(1218)],
    aria: 'Gray\'s Anatomy engraving of the heart projected onto the front of the chest wall. The xiphoid tip is circled. The entry point lies just below and to the patient\'s left of the xiphoid, with an arrow passing under the costal margin toward the left shoulder, continuing as a dashed line over the inferior surface of the heart. An apical window, for ultrasound-guided puncture, is circled at the cardiac apex. Plate by Henry Vandyke Carter, Gray\'s Anatomy 1918, public domain.',
    caption: 'Blind or landmark-guided: enter <b>just left of and below the xiphoid</b>, pass under the costal margin at about 45&deg; to the skin, and aim for the <b>left shoulder</b>, aspirating as you go. The needle meets the inferior surface of the heart, mostly right ventricle. With ultrasound, scan every window and use the one where the fluid is largest and closest.',
  },
  // ---------------------------------------------------------------------------
  {
    id: 'transcutaneous-pad-placement-anterior-posterior',
    file: '19-pacing-transcutaneous-transvenous.html',
    title: 'Pad placement: sandwich the heart',
    subtitle: 'Anterior-posterior, both pads on the patient&rsquo;s left.',
    height: 438,
    panels: [
      {
        plate: 1218, crop: [60, 40, 330, 360], at: [0, 64], width: 255,
        shapes: [
          { kind: 'rect', at: [238, 168], size: [80, 112], rx: 9, fill: 'good', opacity: 0.3 },
          { kind: 'rect', at: [238, 168], size: [80, 112], rx: 9, stroke: 'good', sw: 2.2 },
          { kind: 'label', at: [278, 292], anchor: 'middle', lines: [{ t: 'ANTERIOR', bold: true, fill: 'good', size: 10 }, { t: 'V2&ndash;V3, left of', size: 9 }, { t: 'the sternum', size: 9 }] },
        ],
      },
      {
        plate: 1211, crop: [20, 60, 310, 338], at: [265, 64], width: 255, grayscale: true,
        // Midline read off the spinal furrow (x~236); the left scapular tip is
        // the mirror of Gray's labeled right one at (321, 264).
        shapes: [
          { kind: 'line', from: [236, 70], to: [236, 396], stroke: 'muted', sw: 1.2, dash: true },
          { kind: 'rect', at: [140, 244], size: [82, 110], rx: 9, fill: 'good', opacity: 0.3 },
          { kind: 'rect', at: [140, 244], size: [82, 110], rx: 9, stroke: 'good', sw: 2.2 },
          { kind: 'label', at: [181, 186], anchor: 'middle', lines: [{ t: 'POSTERIOR', bold: true, fill: 'good', size: 10 }, { t: 'below the scapula,', size: 9 }, { t: 'beside the spine', size: 9 }] },
          { kind: 'label', at: [242, 360], lines: [{ t: 'spine', size: 9 }] },
        ],
      },
    ],
    notes: [
      [0, 56, 'n', 'FRONT'],
      [265, 56, 'n', 'BACK &mdash; patient&rsquo;s left is on the left'],
      [0, 366, 's', 'Avoid bone: sternum and spine both shunt current.', 'good'],
      [0, 384, 'c', 'Keep a pad 8 cm or more from a device generator. Shave and dry the'],
      [0, 398, 'c', 'skin first &mdash; sweat and hair are why most pads fail to capture.'],
    ],
    credit: [`${credit(1218).replace(' &mdash; public domain', '')} and ${1211} &mdash; public domain`],
    aria: 'Two Gray\'s Anatomy engravings. Front: the heart projected on the chest wall, with the anterior pacing pad over the left precordium just left of the sternum, at roughly the V2 to V3 position, over the heart. Back: the back surface anatomy, with the posterior pad on the patient\'s left, below the scapula and beside but not over the spine. Together the two pads sandwich the heart. Plates by Henry Vandyke Carter, Gray\'s Anatomy 1918, public domain.',
    caption: 'Anterior pad over the <b>left precordium</b>, just left of the sternum (about V2&ndash;V3). Posterior pad on the <b>left back, below the scapula and beside the spine</b>. The current runs through the heart between them. Pad positions are drawn by hand on the engravings.',
  },
  // ---------------------------------------------------------------------------
  {
    id: 'binder-level-trochanters-not-iliac-crests',
    file: '16-pelvic-binder.html',
    title: 'The level: trouser pocket, not waistband',
    subtitle: 'The greater trochanters sit about level with the pubic symphysis.',
    height: 510,
    panels: [{
      plate: 1219, crop: [30, 370, 398, 270], at: [0, 50], width: 520, grayscale: true,
      // Registered on a 2.2x gridded crop: ASIS at Gray's own pointer (300, 440);
      // symphysis just above the root of the penis, midline x~194; the
      // silhouette is widest (the trochanters) at the same level, y~530.
      shapes: [
        { kind: 'line', from: [62, 422], to: [328, 422], stroke: 'danger', sw: 2.2, dash: '7 5' },
        { kind: 'label', at: [194, 392], anchor: 'middle', lines: [{ t: 'TOO HIGH: iliac crests, the waistband', bold: true, fill: 'danger', size: 10 }] },
        { kind: 'rect', at: [52, 509], size: [286, 42], rx: 4, fill: 'good', opacity: 0.24 },
        { kind: 'rect', at: [52, 509], size: [286, 42], rx: 4, stroke: 'good', sw: 2.2 },
        { kind: 'circle', at: [64, 530], r: 4.5, fill: 'accent', stroke: 'outline', sw: 1 },
        { kind: 'circle', at: [326, 530], r: 4.5, fill: 'accent', stroke: 'outline', sw: 1 },
        { kind: 'circle', at: [194, 527], r: 3.5, fill: 'accent', stroke: 'outline', sw: 1 },
        { kind: 'label', at: [194, 562], anchor: 'middle', lines: [{ t: 'HERE: centered on the greater trochanters,', bold: true, fill: 'good', size: 10 }, { t: 'level with the symphysis', size: 10 }] },
      ],
    }],
    notes: [
      [0, 432, 's', 'Blue dots: both trochanters and the symphysis &mdash; one line.', 'accent'],
      [0, 452, 'c', 'At the crests the binder squeezes above the axis the hemipelves rotate'],
      [0, 466, 'c', 'around: it does not close the symphysis, and can lever the ring open.'],
    ],
    credit: [credit(1219), 'Band positions drawn by hand on the engraving.'],
    aria: 'Gray\'s Anatomy engraving of the front of the lower trunk and upper thighs. A dashed red line across the iliac crests, at waistband level, is marked too high. A green band lower down, centered on the greater trochanters at the widest point of the hips and level with the pubic symphysis, is marked as the correct binder position. Plate by Henry Vandyke Carter, Gray\'s Anatomy 1918, public domain.',
    caption: 'The binder closes the ring by rotating both halves of the pelvis around the femoral heads, so it has to sit <b>at the greater trochanters, level with the symphysis</b> &mdash; far lower than instinct says. At the iliac crests it squeezes above that axis and does nothing useful.',
  },
  // ---------------------------------------------------------------------------
  {
    id: 'lateral-canthotomy-on-the-tarsal-plates',
    file: '22-lateral-canthotomy.html',
    title: 'What you are cutting',
    subtitle: 'Right eye, skin removed. Lateral is on the LEFT of the picture.',
    height: 506,
    panels: [{
      plate: 894, crop: [0, 60, 330, 220], at: [0, 50], width: 520, grayscale: true,
      // Registered on a 6x gridded crop: the tarsi meet at the lateral
      // commissure (~180, 188); Gray's raphe pointer runs along y 188 and the
      // orbital margin crosses it at x~157. The crura are drawn by hand.
      shapes: [
        { kind: 'line', from: [183, 181], to: [158, 187], stroke: 'muted', sw: 2.2, dash: '4 3' },
        { kind: 'line', from: [183, 195], to: [158, 190], stroke: 'warning', sw: 3.4 },
        { kind: 'line', from: [182, 188], to: [154, 188], stroke: 'danger', sw: 4 },
        { kind: 'circle', at: [157, 188.5], r: 2.6, fill: 'outline' },
        { kind: 'line', from: [96, 228], to: [165, 189], stroke: 'danger', sw: 1.2 },
        { kind: 'label', at: [4, 214], lines: [{ t: '1  CANTHOTOMY', bold: true, fill: 'danger' }, 'commissure to the rim'] },
        { kind: 'line', from: [96, 262], to: [170, 194], stroke: 'warning', sw: 1.2 },
        { kind: 'label', at: [4, 248], lines: [{ t: '2  INFERIOR CRUS', bold: true, fill: 'warning' }, 'cut until the lid is free'] },
      ],
    }],
    notes: [
      [0, 420, 's', 'The skin cut is not the release. The tendon is.', 'warning'],
      [0, 440, 'c', '1  Canthotomy: horizontal, full thickness, out to the lateral rim.'],
      [0, 454, 'c', '2  Pull the lower lid away, strum, cut the inferior crus until it is free.'],
      [0, 468, 'c', '3  Still tense: the superior crus (dashed), scissors pointing up.'],
    ],
    credit: [credit(894), 'Crura drawn by hand; the plate shows the tarsi and the lateral raphe.'],
    aria: 'Gray\'s Anatomy engraving of the tarsal plates and their ligaments of the right eye with the skin removed, lateral side on the left of the picture. A red horizontal line from the lateral commissure to the orbital rim marks the canthotomy. An orange line from the lateral end of the lower tarsus to the rim marks the inferior crus of the lateral canthal tendon, cut in cantholysis. A dashed line marks the superior crus, released only if the inferior release is not enough. Plate by Henry Vandyke Carter, Gray\'s Anatomy 1918, public domain.',
    caption: 'The tarsal plates are anchored to the lateral orbital rim by the two crura of the lateral canthal tendon. The canthotomy (1) only gets you to them; the pressure comes off when the <b>inferior crus</b> (2) is cut and the lower lid swings free. If it is still tight, take the superior crus.',
  },
  // ---------------------------------------------------------------------------
  {
    id: 'femoral-vein-below-the-inguinal-ligament',
    file: '07-central-line-arrest.html',
    title: 'The femoral vein, from bone landmarks',
    subtitle: 'Right thigh. For a left femoral line, mirror it.',
    height: 404,
    panels: [{
      plate: 1245, crop: [20, 15, 227, 185], at: [0, 50], width: 280,
      // Registered on a 4x gridded crop: ASIS (68, 38) and pubic tubercle
      // (150, 117) are the ends of Gray's own ligament line; the artery
      // emerges under it at (105, 91). The vein is drawn by hand ~1 cm medial,
      // running down to the saphenous opening (fossa ovalis).
      shapes: [
        { kind: 'line', from: [68, 38], to: [150, 117], stroke: 'warning', sw: 3, opacity: 0.8 },
        { kind: 'circle', at: [68, 38], r: 3.4, fill: 'warning', stroke: 'outline', sw: 1 },
        { kind: 'circle', at: [150, 117], r: 3.4, fill: 'warning', stroke: 'outline', sw: 1 },
        { kind: 'line', from: [114, 97], to: [116, 146], stroke: 'vessel', sw: 3.2, dash: '5 3' },
        { kind: 'circle', at: [104, 102], r: 4.5, stroke: 'danger', sw: 2 },
        { kind: 'circle', at: [115, 110], r: 4, fill: 'good', stroke: 'outline', sw: 1.2 },
        { kind: 'text', at: [97, 104], text: 'artery', fill: 'danger', size: 9, anchor: 'end' },
        { kind: 'text', at: [120, 136], text: 'vein', fill: 'vessel', size: 9 },
      ],
    }],
    leaders: [
      { from: [68, 38], to: [288, 70], color: 'warning', dot: 'warning' },
      { from: [150, 117], to: [288, 186], color: 'warning', dot: 'warning' },
      { from: [115, 110], to: [288, 244], color: 'good', dot: 'good' },
    ],
    notes: [
      [292, 74, 's', 'ASIS', 'warning'],
      [292, 88, 'n', 'anterior superior iliac spine'],
      [292, 190, 's', 'PUBIC TUBERCLE', 'warning'],
      [292, 204, 'n', 'The line between the two is'],
      [292, 218, 'n', 'the inguinal ligament.'],
      [292, 248, 's', 'PUNCTURE', 'good'],
      [292, 262, 'n', '1&ndash;2 cm below the ligament,'],
      [292, 276, 'n', 'just medial to the artery'],
      [0, 304, 's', 'Bone landmarks, not the skin crease.', 'warning'],
      [0, 322, 'c', 'In obesity the crease can sit centimeters below the ligament, among'],
      [0, 336, 'c', 'branching vessels. Above the ligament, a puncture bleeds into the'],
      [0, 350, 'c', 'retroperitoneum. Lateral to medial: nerve, artery, vein.'],
    ],
    credit: [credit(1245), 'Vein and puncture site drawn by hand; the plate shows artery and nerve.'],
    aria: 'Gray\'s Anatomy engraving of the front of the right thigh and groin with the femoral artery and nerve marked. The inguinal ligament is highlighted between the anterior superior iliac spine and the pubic tubercle. The femoral artery is circled just below the ligament, the femoral vein is drawn as a dashed line just medial to it, and the puncture site is marked one to two centimeters below the ligament and just medial to the artery. Plate by Henry Vandyke Carter, Gray\'s Anatomy 1918, public domain.',
    caption: 'Find the ligament from bone: <b>ASIS to pubic tubercle</b>. Puncture <b>1&ndash;2 cm below it, just medial to the artery</b> &mdash; which in arrest you find with the probe, not your fingers. Too low, in the crease, you are among the branches; too high, you are in the retroperitoneum.',
  },
];
