/*
 * Mode 3: Sandbox — free play. Pick an object, cut it, tap pieces;
 * the fraction updates live. When it can be simplified (4/8 = 1/2),
 * a small picture of the simpler fraction appears next to it.
 */
'use strict';

(function () {
  const { el } = App;
  const S = App.strings;
  const START_PARTS = 4;

  App.registerMode({
    id: 'sandbox',
    icon: '🎨',
    color: '#0E8FA0',
    title: S.modes.sandbox,
    start(root) {
      let obj = App.objects[0];

      const view = App.createObjectView({ objectId: obj.id, parts: START_PARTS, interactive: true, onChange: showFraction });
      const stepper = App.createStepper({
        min: obj.supportedParts.min,
        max: obj.supportedParts.max,
        value: START_PARTS,
        onChange: (parts) => {
          view.update({ parts, selected: [] }, { cut: true });
          showFraction();
        },
      });

      const pickButtons = App.objects.map((o) =>
        el('button', { class: 'pick-btn', 'aria-pressed': String(o === obj), onclick: () => choose(o) },
          el('span', { class: 'pick-icon', 'aria-hidden': 'true', text: o.icon }),
          el('span', { class: 'pick-name', text: o.name })));

      // Switching objects keeps the fraction, so the child can compare the same fraction on both.
      function choose(o) {
        obj = o;
        pickButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(App.objects[i] === o)));
        stepper.setRange(o.supportedParts.min, o.supportedParts.max);
        const parts = stepper.value;
        view.update({ objectId: o.id, parts, selected: view.state.selected.filter((i) => i < parts) });
        showFraction();
      }

      function reset() {
        stepper.setValue(START_PARTS);
        view.update({ parts: START_PARTS, selected: [] }, { cut: true });
        showFraction();
      }

      const fractionBox = el('div', { class: 'sandbox-frac', 'aria-live': 'polite' });

      function showFraction() {
        const { parts, selected } = view.state;
        const k = selected.length;
        const g = App.gcd(k, parts);
        fractionBox.replaceChildren(App.createFraction(k, parts, 'frac-xl'));
        if (k === 0 || g === 1) return;
        const sn = k / g, sd = parts / g;
        const mini = App.createObjectView({ objectId: obj.id, parts: sd, selected: App.range(sn) });
        fractionBox.append(el('div', { class: 'simplified' },
          el('span', { class: 'eq', text: '=' }),
          sd === 1 ? el('span', { class: 'whole', text: '1' }) : App.createFraction(sn, sd),
          mini.el));
      }

      const stage = App.stage(view.el, stepper.el, fractionBox);
      stage.classList.add('stage-sandbox');
      root.append(
        el('div', { class: 'toolbar' },
          el('div', { class: 'picker' }, pickButtons),
          el('button', { class: 'btn btn-secondary', onclick: reset, 'aria-label': S.reset },
            '↺ ', el('span', { class: 'reset-label', text: S.reset }))),
        stage);
      showFraction();
    },
  });
})();
