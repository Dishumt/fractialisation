/*
 * Pizza — a circle cut into equal sectors.
 * Piece 0 starts at 12 o'clock; pieces go clockwise.
 *
 * This file is the reference example for adding a new object (see README.md):
 *   - every piece is a <g data-piece="i">; the app handles taps, focus, hints and labels
 *   - put class "piece-fill" on the shape that carries the piece color
 *     and "piece-outline" on the shape that draws its border (may be the same element)
 *   - do not set `transform` on the <g data-piece> itself (the app animates it);
 *     use an inner <g> if a piece needs to move
 *
 * Toppings and texture: every slice gets the same arrangement (a rotated copy), and
 * nothing crosses a cut, so all slices look exactly alike — no slice seems "bigger".
 */
'use strict';

(function () {
  const R = 100;         // pizza radius (viewBox units)
  const POP = 5;         // selected slices slide out a little so each one is visible
  const INK = '#1E2140';
  const EDGE = '#B9822F';

  // Toppings are scattered over the whole slice (centre and edge alike).
  // per = how many per radian of slice; size = radius; rMax = how far out they may go;
  // gap = minimum space between toppings.
  const TOPPINGS = [
    { per: 3.2, size: 10, rMax: 75, gap: 2.5, draw: pepperoni },
    { per: 1.9, size: 7, rMax: 78, gap: 2, draw: basil },
  ];

  // Small texture details, scattered by a fixed pattern (identical in every slice).
  // per = how many per radian of slice; r = ring band where they may appear.
  const CHEESE_DETAILS = [
    { per: 3.2, r: [16, 82], draw: cheeseBubble },
    { per: 2.2, r: [20, 80], draw: toastedSpot },
    { per: 8, r: [12, 84], draw: oregano },
  ];
  const CRUST_DETAILS = [{ per: 7, r: [91, 97], draw: crumb }];

  const point = (r, a) => `${(r * Math.cos(a)).toFixed(3)},${(r * Math.sin(a)).toFixed(3)}`;

  function sector(a0, a1) {
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M0,0 L${point(R, a0)} A${R},${R} 0 ${large} 1 ${point(R, a1)} Z`;
  }

  function arc(r, a0, a1) {
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M${point(r, a0)} A${r},${r} 0 ${large} 1 ${point(r, a1)}`;
  }

  // On selected slices toppings are drawn as light/dark shades of the selection colour,
  // so the texture stays visible but the slice reads clearly as "blue".
  const at = (g, x, y, rotate = 0) =>
    App.svgEl('g', { transform: `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rotate.toFixed(1)})` }, g);

  function pepperoni(g, x, y, sel) {
    const t = at(g, x, y);
    App.svgEl('circle', { r: 10, fill: sel ? 'rgba(0,0,0,.16)' : '#9C2A1B' }, t);       // curled, darker rim
    App.svgEl('circle', { r: 8.4, fill: sel ? 'rgba(255,255,255,.26)' : '#CF4733' }, t);
    for (const [dx, dy, r] of [[-3.8, 2.2, 1.4], [3.2, 3.6, 1.2], [2.4, -3.6, 1.1], [-0.6, 5.4, 0.9], [5.2, -0.4, 0.9]]) {
      App.svgEl('circle', { cx: dx, cy: dy, r, fill: sel ? 'rgba(255,255,255,.22)' : '#EE8D70' }, t); // fat
    }
    for (const [dx, dy] of [[0.4, 0.6], [-2.6, -1.8]]) {
      App.svgEl('circle', { cx: dx, cy: dy, r: 1, fill: sel ? 'rgba(0,0,0,.16)' : '#86200F' }, t);
    }
    App.svgEl('ellipse', { cx: -3, cy: -4.2, rx: 3.4, ry: 1.5, transform: 'rotate(-28 -3 -4.2)', fill: 'rgba(255,255,255,.4)' }, t);
  }

  function basil(g, x, y, sel, v) {
    const t = at(g, x, y, v * 360);
    App.svgEl('path', { d: 'M-7.5,0 Q0,-6 7.5,0 Q0,6 -7.5,0 Z', fill: sel ? 'rgba(255,255,255,.2)' : '#35893F' }, t);
    App.svgEl('path', { d: 'M-7.5,0 Q0,-6 7.5,0 Z', fill: sel ? 'rgba(255,255,255,.12)' : '#4FAE5A' }, t); // lit half
    App.svgEl('path', { d: 'M-6,0 L6,0 M-2,0 L0.5,-2.6 M2,0 L4,-2', fill: 'none', stroke: sel ? 'rgba(0,0,0,.16)' : '#25672D', 'stroke-width': 0.8, 'stroke-linecap': 'round' }, t);
  }

  function cheeseBubble(g, x, y, sel, v) {
    const rx = 2.4 + v * 1.8;
    App.svgEl('ellipse', { rx, ry: rx * 0.65, fill: sel ? 'rgba(255,255,255,.13)' : 'rgba(255,251,228,.8)' }, at(g, x, y, v * 180));
  }

  function toastedSpot(g, x, y, sel, v) {
    const rx = 1.8 + v * 1.8;
    App.svgEl('ellipse', { rx, ry: rx * 0.7, fill: sel ? 'rgba(0,0,0,.08)' : 'rgba(210,136,48,.38)' }, at(g, x, y, v * 180));
  }

  function oregano(g, x, y, sel, v) {
    App.svgEl('rect', { x: -0.9, y: -0.5, width: 1.8, height: 1, rx: 0.4, fill: sel ? 'rgba(0,0,0,.18)' : '#56682A' }, at(g, x, y, v * 180));
  }

  function crumb(g, x, y, sel, v) {
    App.svgEl('circle', { cx: x.toFixed(2), cy: y.toFixed(2), r: 0.7 + v * 0.6, fill: sel ? 'rgba(0,0,0,.2)' : '#B77628' }, g);
  }

  /** The same pseudo-random sequence every time, so every slice gets the same pattern. */
  function seeded(seed) {
    return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  }

  function drawDetails(g, list, a0, a1, whole, sel) {
    const width = a1 - a0;
    list.forEach((d, index) => {
      const rnd = seeded(1234 + index * 7919);
      const n = Math.round(d.per * width);
      const [r0, r1] = d.r;
      for (let j = 0; j < n; j++) {
        const r = Math.sqrt(r0 * r0 + rnd() * (r1 * r1 - r0 * r0)); // even spread over the area
        const f = rnd(), v = rnd();
        if (!whole && r * Math.sin(Math.min(f, 1 - f) * width) < 4) continue; // keep clear of the cuts
        const a = a0 + f * width;
        d.draw(g, r * Math.cos(a), r * Math.sin(a), sel, v);
      }
    });
  }

  /** Distance from a point (polar r, angle phi from a cut) to that cut line. */
  const toCut = (r, phi) => (phi < Math.PI / 2 ? r * Math.sin(phi) : r);

  // One arrangement per slice size, found by trying seeded random spots and keeping
  // those that fit (inside the slice, clear of the cuts, not overlapping). Every slice
  // of a pizza reuses it, so all slices look the same.
  const layouts = new Map();
  function toppingLayout(width, whole) {
    const key = whole ? 'whole' : width.toFixed(6);
    if (layouts.has(key)) return layouts.get(key);
    const rnd = seeded(4242);
    const placed = [];
    for (const t of TOPPINGS) {
      const target = Math.round(t.per * width);
      for (let count = 0, tries = 0; count < target && tries < 800; tries++) {
        const r = Math.sqrt(rnd()) * t.rMax; // even spread over the area
        const phi = rnd() * width, v = rnd();
        if (!whole && Math.min(toCut(r, phi), toCut(r, width - phi)) < t.size + 1.5) continue;
        const x = r * Math.cos(phi), y = r * Math.sin(phi);
        if (placed.some((p) => Math.hypot(p.x - x, p.y - y) < p.t.size + t.size + t.gap)) continue;
        placed.push({ t, r, phi, x, y, v });
        count++;
      }
    }
    layouts.set(key, placed);
    return placed;
  }

  function drawToppings(g, a0, a1, whole, sel) {
    for (const { t, r, phi, v } of toppingLayout(a1 - a0, whole)) {
      const a = a0 + phi;
      t.draw(g, r * Math.cos(a), r * Math.sin(a), sel, v);
    }
  }

  function drawPiece(svg, i, parts, isSelected, color, cheese) {
    const piece = App.svgEl('g', { 'data-piece': i }, svg);
    const a0 = (i / parts) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / parts) * 2 * Math.PI - Math.PI / 2;
    const mid = (a0 + a1) / 2;
    const pop = isSelected && parts > 1 ? POP : 0;
    const inner = App.svgEl('g', {
      transform: `translate(${(pop * Math.cos(mid)).toFixed(2)} ${(pop * Math.sin(mid)).toFixed(2)})`,
    }, piece);

    const whole = parts === 1;
    const shape = whole ? 'circle' : 'path';
    const geometry = whole ? { cx: 0, cy: 0, r: R } : { d: sector(a0, a1) };

    const band = (r) => (whole ? { cx: 0, cy: 0, r } : { d: arc(r, a0, a1) });
    const ring = (r, stroke, width, extra = {}) =>
      App.svgEl(shape, { ...band(r), fill: 'none', stroke, 'stroke-width': width, ...extra }, inner);

    App.svgEl(shape, { ...geometry, class: 'piece-fill', fill: isSelected ? color : `url(#${cheese})` }, inner);
    drawDetails(inner, CHEESE_DETAILS, a0, a1, whole, isSelected);
    ring(R - 12.5, isSelected ? 'rgba(0,0,0,.1)' : '#DC6A45', 2.6);  // tomato sauce peeking out
    drawToppings(inner, a0, a1, whole, isSelected);
    // Crust: a thick band along the outer edge, darker on selected slices.
    ring(R - 6, isSelected ? 'rgba(0,0,0,.24)' : '#DDA14A', 10);
    ring(R - 6, isSelected ? 'rgba(255,255,255,.18)' : '#EDBE6E', 3, { transform: 'translate(-.8 -1.2)' });
    ring(R - 1.8, isSelected ? 'rgba(0,0,0,.18)' : '#C4852F', 1.6);  // baked edge
    drawDetails(inner, CRUST_DETAILS, a0, a1, whole, isSelected);
    App.svgEl(shape, {
      ...geometry,
      class: 'piece-outline',
      fill: 'none',
      stroke: isSelected ? INK : EDGE,
      'stroke-width': isSelected ? 4 : 2,
      'stroke-linejoin': 'round',
    }, inner);
  }

  App.registerObject({
    id: 'pizza',
    name: App.strings.objects.pizza,
    icon: '🍕',
    supportedParts: { min: 1, max: 12 },

    render(svg, { parts, selected, highlightColor }) {
      svg.setAttribute('viewBox', '-116 -116 232 232');
      // Melted cheese: lighter in the middle, a little toasted towards the crust.
      const cheese = App.uid('cheese');
      const grad = App.svgEl('radialGradient', { id: cheese, cx: 0, cy: 0, r: R, gradientUnits: 'userSpaceOnUse' },
        App.svgEl('defs', {}, svg));
      App.svgEl('stop', { offset: '0', 'stop-color': '#FFEDB8' }, grad);
      App.svgEl('stop', { offset: '.75', 'stop-color': '#FCD983' }, grad);
      App.svgEl('stop', { offset: '1', 'stop-color': '#F2C266' }, grad);

      // Plate
      App.svgEl('circle', { cx: 0, cy: 4, r: 113, fill: '#D5DCEC' }, svg);
      App.svgEl('circle', { cx: 0, cy: 0, r: 113, fill: '#EEF2FA' }, svg);
      App.svgEl('circle', { cx: 0, cy: 0, r: 104, fill: 'none', stroke: '#DCE3F1', 'stroke-width': 2 }, svg);

      // Unselected first, so the thick outlines of selected slices are drawn on top.
      for (const isSelected of [false, true]) {
        for (let i = 0; i < parts; i++) {
          if (selected.has(i) === isSelected) drawPiece(svg, i, parts, isSelected, highlightColor, cheese);
        }
      }
    },
  });
})();
