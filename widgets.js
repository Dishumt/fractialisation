/*
 * widgets.js — reusable UI pieces used by all modes. Nothing here is object-specific:
 * objects only draw themselves; this file adds taps, keyboard, hints, labels and animations.
 */
'use strict';

(function () {
  const { el } = App;
  const S = App.strings;

  /**
   * An object (pizza, chocolate, ...) drawn as SVG.
   *   opts: { objectId, parts, selected: [indices], interactive, onChange(state) }
   * Returns { el, state, update(changes, {cut}), setInteractive(bool) }.
   *   changes may contain: objectId, parts, selected, hint, faded, labels
   *     hint   — pieces the child should select (dashed outline + light fill)
   *     faded  — pieces selected by mistake (dimmed)
   *     labels — 'selected' numbers the selected pieces 1..K, 'all' numbers every piece
   */
  App.createObjectView = function (opts) {
    const svg = App.svgEl('svg', { class: 'object-view' });
    const st = {
      objectId: opts.objectId,
      parts: opts.parts ?? 1,
      selected: new Set(opts.selected || []),
      hint: new Set(),
      faded: new Set(),
      labels: null,
      focus: 0, // keyboard: the one piece reachable with Tab; arrow keys move it
    };
    let interactive = !!opts.interactive;

    const pieceEl = (i) => svg.querySelector(`[data-piece="${i}"]`);
    const pieces = () => [...svg.querySelectorAll('[data-piece]')];

    function draw() {
      svg.replaceChildren();
      App.getObject(st.objectId).render(svg, {
        parts: st.parts,
        selected: st.selected,
        highlightColor: App.colors.selected,
      });
      svg.classList.toggle('interactive', interactive);
      svg.setAttribute('role', interactive ? 'group' : 'img');
      svg.setAttribute('aria-label', S.a11y.picture(st.selected.size, st.parts));

      for (const p of pieces()) {
        const i = +p.dataset.piece;
        p.classList.add('piece');
        p.classList.toggle('selected', st.selected.has(i));
        p.classList.toggle('faded', st.faded.has(i));
        if (interactive) {
          p.setAttribute('tabindex', i === st.focus ? '0' : '-1');
          p.setAttribute('role', 'button');
          p.setAttribute('aria-pressed', st.selected.has(i));
          p.setAttribute('aria-label', S.a11y.piece(i + 1));
        }
      }
      for (const i of st.hint) {
        const p = pieceEl(i);
        if (!p) continue;
        p.classList.add('hint');
        svg.appendChild(p); // on top, so the dashed outline is fully visible
      }
      if (st.labels) drawLabels();
    }

    // Numbers go at the centre of each piece's area (found by sampling points inside
    // its .piece-fill shape), so any object shape gets labels for free.
    // Needs the SVG to be in the document.
    function drawLabels() {
      if (!svg.isConnected) return;
      let n = 0;
      for (let i = 0; i < st.parts; i++) {
        if (st.labels === 'selected' && !st.selected.has(i)) continue;
        const fill = pieceEl(i).querySelector('.piece-fill');
        const { x, y, size } = labelSpot(fill);
        App.svgEl('text', { class: 'piece-label', x, y, 'font-size': size }, fill.parentNode).textContent = ++n;
      }
    }

    function labelSpot(shape) {
      const b = shape.getBBox();
      const STEPS = 16;
      let sx = 0, sy = 0, count = 0;
      for (let ix = 0; ix < STEPS; ix++) {
        for (let iy = 0; iy < STEPS; iy++) {
          const px = b.x + ((ix + 0.5) / STEPS) * b.width;
          const py = b.y + ((iy + 0.5) / STEPS) * b.height;
          if (shape.isPointInFill(new DOMPoint(px, py))) { sx += px; sy += py; count++; }
        }
      }
      const size = Math.max(12, Math.min(34, Math.sqrt(b.width * b.height * count / STEPS ** 2) * 0.42));
      return count
        ? { x: (sx / count).toFixed(1), y: (sy / count).toFixed(1), size: size.toFixed(1) }
        : { x: b.x + b.width / 2, y: b.y + b.height / 2, size: size.toFixed(1) };
    }

    // "Cutting": every piece briefly slides away from the centre, then settles.
    function animateCut() {
      if (st.parts < 2 || !svg.isConnected) return;
      const vb = svg.viewBox.baseVal;
      const cx = vb.x + vb.width / 2, cy = vb.y + vb.height / 2;
      for (const p of pieces()) {
        const b = p.getBBox();
        const dx = b.x + b.width / 2 - cx, dy = b.y + b.height / 2 - cy;
        const len = Math.hypot(dx, dy) || 1;
        p.style.setProperty('--dx', `${((dx / len) * 9).toFixed(1)}px`);
        p.style.setProperty('--dy', `${((dy / len) * 9).toFixed(1)}px`);
        p.classList.add('cut-anim');
      }
    }

    function toggle(i) {
      if (st.selected.has(i)) st.selected.delete(i);
      else st.selected.add(i);
      st.faded.delete(i);
      draw();
      const p = pieceEl(i);
      p.classList.add('pop-anim');
      return p;
    }

    function onActivate(e) {
      if (!interactive) return;
      const p = e.target.closest('[data-piece]');
      if (!p) return;
      const wasFocused = document.activeElement === p;
      st.focus = +p.dataset.piece;
      const fresh = toggle(st.focus);
      if (wasFocused) fresh.focus();
      opts.onChange?.(view.state);
    }

    const ARROWS = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

    svg.addEventListener('click', onActivate);
    svg.addEventListener('keydown', (e) => {
      if (!interactive) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onActivate(e);
      } else if (e.key in ARROWS) {
        e.preventDefault();
        pieceEl(st.focus)?.setAttribute('tabindex', '-1');
        st.focus = (st.focus + ARROWS[e.key] + st.parts) % st.parts;
        const p = pieceEl(st.focus);
        p.setAttribute('tabindex', '0');
        p.focus();
      }
    });

    const view = {
      el: svg,
      get state() {
        return { parts: st.parts, selected: [...st.selected].sort((a, b) => a - b) };
      },
      update(changes = {}, { cut = false } = {}) {
        if ('objectId' in changes) st.objectId = changes.objectId;
        if ('parts' in changes) st.parts = changes.parts;
        st.focus = Math.min(st.focus, st.parts - 1);
        if ('selected' in changes) st.selected = new Set(changes.selected);
        if ('hint' in changes) st.hint = new Set(changes.hint);
        if ('faded' in changes) st.faded = new Set(changes.faded);
        if ('labels' in changes) st.labels = changes.labels;
        draw();
        if (cut) animateCut();
      },
      setInteractive(value) {
        interactive = value;
        draw();
      },
    };
    draw();
    return view;
  };

  /** Standard mode layout: picture + controls (side by side on wide screens, stacked on narrow). */
  App.stage = (visual, ...controls) =>
    el('div', { class: 'stage' },
      el('div', { class: 'visual' }, visual),
      el('div', { class: 'controls' }, controls));

  /** "[blue square] Сині частини — зафарбовані": links the colour to the word used in the hints. */
  App.createLegend = (text) =>
    el('div', { class: 'legend' }, el('span', { class: 'swatch', 'aria-hidden': 'true' }), text);

  /** A fraction laid out like on paper; the numerator uses the selection color. */
  App.createFraction = function (num, den, className = '') {
    return el('span', { class: `frac ${className}`, role: 'img', 'aria-label': `${num}/${den}` },
      el('span', { class: 'frac-num', text: num }),
      el('span', { class: 'frac-bar' }),
      el('span', { class: 'frac-den', text: den }));
  };

  /** Two big number boxes with a fraction bar between them. */
  App.createFractionInput = function ({ onSubmit }) {
    const box = (label) => {
      const input = el('input', {
        class: 'frac-box', type: 'text', inputmode: 'numeric', pattern: '[0-9]*',
        maxlength: '2', autocomplete: 'off', 'aria-label': label,
      });
      input.addEventListener('input', () => { input.value = input.value.replace(/\D/g, ''); });
      input.addEventListener('focus', () => input.select()); // typing replaces the old number
      return input;
    };
    const num = box(S.a11y.numerator);
    const den = box(S.a11y.denominator);
    // preventDefault: otherwise the same Enter press also "clicks" the button that gets focus next.
    num.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); den.focus(); } });
    den.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); onSubmit(); } });
    const read = (input) => (input.value === '' ? null : Number(input.value));

    return {
      el: el('div', { class: 'frac frac-input' }, num, el('span', { class: 'frac-bar' }), den),
      read: () => ({ num: read(num), den: read(den) }),
      /** Focus the first empty box (or the numerator, with its text selected). */
      focus() {
        const target = num.value === '' ? num : den.value === '' ? den : num;
        target.focus();
        target.select();
      },
      setDisabled(value) { num.disabled = den.disabled = value; },
    };
  };

  /** [−]  ✂️ 5 частин  [+]   `nudge`: the + button pulses gently until it is first used. */
  App.createStepper = function ({ min, max, value, onChange, nudge = false }) {
    const minus = el('button', { class: 'step-btn', 'aria-label': S.a11y.fewer, text: '−' });
    const plus = el('button', { class: 'step-btn', 'aria-label': S.a11y.more, text: '+' });
    const number = el('span', { class: 'step-value' });
    const caption = el('span', { class: 'step-caption' });

    function set(v, fire) {
      value = Math.max(min, Math.min(max, v));
      number.textContent = value;
      caption.textContent = S.partsWord(value);
      minus.disabled = value <= min;
      plus.disabled = value >= max;
      if (value > min) plus.classList.remove('nudge'); // the object has been cut: no more nudging
      if (fire) onChange(value);
    }
    plus.classList.toggle('nudge', nudge);
    minus.addEventListener('click', () => set(value - 1, true));
    plus.addEventListener('click', () => set(value + 1, true));
    set(value, false);

    return {
      el: el('div', { class: 'stepper' },
        minus,
        el('div', { class: 'step-display', 'aria-live': 'polite' },
          el('span', { class: 'step-top' }, el('span', { 'aria-hidden': 'true', text: '✂️' }), number),
          caption),
        plus),
      get value() { return value; },
      setValue: (v) => set(v, false),
      setRange(newMin, newMax) { min = newMin; max = newMax; set(value, false); },
      setDisabled(d) { minus.disabled = plus.disabled = d; if (!d) set(value, false); },
    };
  };

  /**
   * The feedback panel that slides up from the bottom.
   * show({ kind: 'correct'|'wrong'|'info', title, message, extra: Node, actions: [{label, primary, onClick}],
   *        reveal: Node })  — `reveal` is scrolled into view above the panel if the panel would cover it.
   */
  App.feedback = (function () {
    const bar = el('div', { class: 'feedback', role: 'status', 'aria-live': 'polite' });
    bar.inert = true;
    document.body.append(bar);

    function show({ kind, title, message, extra, actions, reveal }) {
      bar.classList.remove('correct', 'wrong', 'info');
      bar.classList.add(kind, 'show');
      bar.replaceChildren(
        el('div', { class: 'fb-icon', 'aria-hidden': 'true', text: kind === 'correct' ? '✓' : '💡' }),
        el('div', { class: 'fb-text' },
          el('div', { class: 'fb-title', text: title }),
          message && el('div', { class: 'fb-msg', text: message }),
          extra),
        el('div', { class: 'fb-actions' }, actions.map((a) =>
          el('button', { class: `btn ${a.primary ? 'btn-primary' : 'btn-secondary'}`, onclick: a.onClick, text: a.label }))));
      bar.inert = false;
      document.body.classList.add('has-feedback');
      bar.querySelector('.btn-primary')?.focus({ preventScroll: true });
      if (reveal) {
        const covered = reveal.getBoundingClientRect().bottom - (innerHeight - bar.offsetHeight) + 12;
        if (covered > 0) window.scrollBy({ top: covered, behavior: 'smooth' });
      }
    }

    function hide() {
      bar.classList.remove('show');
      bar.inert = true;
      document.body.classList.remove('has-feedback');
    }

    return { show, hide };
  })();

  /** Short "well done" animation: the target bounces and stars burst out of it. */
  App.celebrate = function (target) {
    target.classList.remove('bounce');
    void target.getBoundingClientRect(); // restart the animation
    target.classList.add('bounce');

    const r = target.getBoundingClientRect();
    const burst = el('div', { class: 'burst', style: `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px` });
    const colors = ['#FFC233', '#2F6FE4', '#F2557A', '#19B37A'];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * 2 * Math.PI;
      const dist = 90 + Math.random() * 70;
      burst.append(el('span', {
        style: `--x:${(Math.cos(angle) * dist).toFixed(0)}px;--y:${(Math.sin(angle) * dist).toFixed(0)}px;--c:${colors[i % 4]}`,
        text: '★',
      }));
    }
    document.body.append(burst);
    setTimeout(() => burst.remove(), 900);
  };

  /** Standard "correct" feedback ("Молодець! Це 3/8") with a Next button. */
  App.showCorrect = function (target, onNext, [num, den]) {
    App.celebrate(target);
    App.feedback.show({
      kind: 'correct',
      reveal: target,
      title: App.pick(S.praise),
      extra: el('div', { class: 'fb-answer' }, S.itIs, App.createFraction(num, den)),
      actions: [{ label: `${S.next} →`, primary: true, onClick: onNext }],
    });
  };
})();
