/*
 * Chocolate bar — a rectangle of equal pieces.
 * The bar always has the same outer size (the "whole" never changes);
 * it is divided into a grid chosen automatically: 6 -> 2x3, 8 -> 2x4, 5 -> 1x5, 12 -> 3x4.
 * Pieces are numbered row by row, left to right.
 * Each piece is a raised tile: light top/left edges, dark bottom/right edges and a little
 * shine. The shading is semi-transparent, so it works on brown and on the selection colour.
 */
'use strict';

(function () {
  const W = 300, H = 180, PAD = 10;
  const CHOC = '#6E3D22';
  const GROOVE = '#3A1F10';
  const INK = '#1E2140';

  /** rows = the largest divisor of n that is <= sqrt(n); the bar stays wider than tall. */
  function grid(n) {
    let rows = 1;
    for (let d = 1; d * d <= n; d++) if (n % d === 0) rows = d;
    return { rows, cols: n / rows };
  }

  const poly = (points, fill, parent) =>
    App.svgEl('polygon', { points: points.map((p) => p.map((v) => v.toFixed(2)).join(',')).join(' '), fill }, parent);

  function drawTile(g, x, y, w, h) {
    const b = Math.min(12, Math.min(w, h) * 0.16); // bevel width
    const [x2, y2] = [x + w, y + h];
    poly([[x, y], [x2, y], [x2 - b, y + b], [x + b, y + b]], 'rgba(255,255,255,.22)', g);   // top
    poly([[x, y], [x + b, y + b], [x + b, y2 - b], [x, y2]], 'rgba(255,255,255,.12)', g);   // left
    poly([[x, y2], [x + b, y2 - b], [x2 - b, y2 - b], [x2, y2]], 'rgba(0,0,0,.28)', g);     // bottom
    poly([[x2, y], [x2, y2], [x2 - b, y2 - b], [x2 - b, y + b]], 'rgba(0,0,0,.16)', g);     // right
    const fw = w - 2 * b, fh = h - 2 * b;
    App.svgEl('rect', {
      x: x + b + fw * 0.12, y: y + b + fh * 0.14, width: fw * 0.42, height: Math.max(2, fh * 0.09),
      rx: Math.max(1, fh * 0.045), fill: 'rgba(255,255,255,.2)',
    }, g); // shine
  }

  App.registerObject({
    id: 'chocolate',
    name: App.strings.objects.chocolate,
    icon: '🍫',
    supportedParts: { min: 1, max: 12 },

    render(svg, { parts, selected, highlightColor }) {
      svg.setAttribute('viewBox', `0 0 ${W + 2 * PAD} ${H + 2 * PAD}`);
      App.svgEl('rect', { x: PAD + 2, y: PAD + 5, width: W, height: H, rx: 3, fill: 'rgba(30,33,64,.16)' }, svg); // shadow

      const { rows, cols } = grid(parts);
      const cw = W / cols, ch = H / rows;

      for (let i = 0; i < parts; i++) {
        const isSelected = selected.has(i);
        const x = PAD + (i % cols) * cw;
        const y = PAD + Math.floor(i / cols) * ch;
        const sw = isSelected ? 5 : 3; // border drawn inside the cell so neighbours never cover it
        const piece = App.svgEl('g', { 'data-piece': i }, svg);

        App.svgEl('rect', { x, y, width: cw, height: ch, class: 'piece-fill', fill: isSelected ? highlightColor : CHOC }, piece);
        drawTile(piece, x, y, cw, ch);
        App.svgEl('rect', {
          x: x + sw / 2, y: y + sw / 2, width: cw - sw, height: ch - sw,
          class: 'piece-outline', fill: 'none', stroke: isSelected ? INK : GROOVE, 'stroke-width': sw,
        }, piece);
      }
    },
  });
})();
