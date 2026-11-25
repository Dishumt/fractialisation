/*
 * Mode 1: Quiz — multiple choice.
 *   pictureToFraction: a picture -> choose the fraction
 *   fractionToPicture: a fraction -> choose the picture
 * Wrong options are built from typical mistakes; each carries `why`
 * (a key of strings.why) so the feedback can explain that exact mistake.
 */
'use strict';

(function () {
  const { el } = App;
  const S = App.strings;
  const DISTRACTORS = 3;

  const sameValue = (a, b) => a.num * b.den === b.num * a.den;

  /** Correct fraction k/n plus up to 3 "typical mistake" fractions, shuffled. */
  function fractionOptions(n, k) {
    const correct = { num: k, den: n };
    const conceptual = App.shuffle([
      { num: n, den: k, why: 'swapped' },          // numerator and denominator swapped
      { num: n - k, den: n, why: 'unselected' },   // counted the unselected pieces
      { num: k, den: n - k, why: 'partToPart' },   // selected over unselected
    ]);
    const counting = App.shuffle([
      { num: k, den: n + 1, why: 'bottom' },       // miscounted all pieces
      { num: k, den: n - 1, why: 'bottom' },
      { num: k + 1, den: n, why: 'top' },          // miscounted the selected pieces
      { num: k - 1, den: n, why: 'top' },
    ]);
    const ok = (f) => f.num >= 1 && f.den >= 1 && !sameValue(f, correct) &&
      (f.why === 'swapped' || f.num <= f.den);
    return pickDistractors(correct, conceptual.filter(ok), counting.filter(ok),
      (f) => `${f.num}/${f.den}`);
  }

  /** Correct picture (n pieces, k selected) plus pictures of typical mistakes. */
  function pictureOptions(obj, n, k) {
    const correct = { parts: n, count: k };
    const conceptual = [{ parts: n, count: n - k, why: 'unselected' }];
    const counting = [
      ...App.shuffle([
        { parts: n + 1, count: k, why: 'bottom' },
        { parts: n - 1, count: k, why: 'bottom' },
        { parts: n, count: k + 1, why: 'top' },
        { parts: n, count: k - 1, why: 'top' },
      ]),
      // fallbacks for edge cases such as 12/12, where the mistakes above are impossible
      { parts: n, count: k - 2, why: 'top' },
      { parts: n, count: k + 2, why: 'top' },
    ];
    const { min, max } = obj.supportedParts;
    const ok = (p) => p.parts >= Math.max(2, min) && p.parts <= max &&
      p.count >= 1 && p.count <= p.parts && p.count * n !== k * p.parts;
    return pickDistractors(correct, conceptual.filter(ok), counting.filter(ok),
      (p) => `${p.parts}/${p.count}`);
  }

  /** Prefer up to 2 conceptual mistakes, fill the rest with counting mistakes. */
  function pickDistractors(correct, conceptual, counting, keyOf) {
    const chosen = [];
    const seen = new Set([keyOf(correct)]);
    const add = (item) => {
      if (chosen.length >= DISTRACTORS || seen.has(keyOf(item))) return;
      seen.add(keyOf(item));
      chosen.push(item);
    };
    conceptual.slice(0, 2).forEach(add);
    counting.forEach(add);
    conceptual.forEach(add);
    return App.shuffle([correct, ...chosen]);
  }

  /** Shared answer handling for both question types. */
  function makeChooser(buttons, options, fraction, onWrong, next) {
    let answered = false;
    return (index) => {
      if (answered) return;
      answered = true;
      buttons.forEach((b) => { b.disabled = true; });
      const chosen = options[index];
      const correctIndex = options.findIndex((o) => !o.why);
      buttons[correctIndex].classList.add('correct');
      if (!chosen.why) {
        App.showCorrect(buttons[index], next, fraction);
        return;
      }
      buttons[index].classList.add('wrong');
      onWrong(chosen, correctIndex);
    };
  }

  function askFraction(root, task, next) {
    const n = task.parts, k = task.selected.length;
    const view = App.createObjectView({ objectId: task.objectId, parts: n, selected: task.selected });
    const options = fractionOptions(n, k);
    const buttons = options.map((o, i) =>
      el('button', { class: 'option option-frac', onclick: () => choose(i) }, App.createFraction(o.num, o.den)));

    const choose = makeChooser(buttons, options, [k, n], (chosen) => {
      view.update({ labels: chosen.why === 'bottom' || chosen.why === 'partToPart' ? 'all' : 'selected' });
      App.feedback.show({
        kind: 'wrong',
        reveal: view.el,
        title: S.almost,
        message: S.why[chosen.why],
        extra: el('div', { class: 'fb-answer' }, S.answerIs, App.createFraction(k, n)),
        actions: [{ label: `${S.next} →`, primary: true, onClick: next }],
      });
    }, next);

    root.append(
      el('h2', { class: 'prompt', text: S.quiz.whichFraction }),
      App.stage([view.el, App.createLegend(S.legend)], el('div', { class: 'options options-frac' }, buttons)));
  }

  function askPicture(root, task, next) {
    const n = task.parts, k = task.selected.length;
    const options = pictureOptions(App.getObject(task.objectId), n, k);
    const views = options.map((o) =>
      App.createObjectView({ objectId: task.objectId, parts: o.parts, selected: App.range(o.count) }));
    const buttons = views.map((v, i) =>
      el('button', { class: 'option option-pic', onclick: () => choose(i), 'aria-label': `${i + 1}` }, v.el));

    const choose = makeChooser(buttons, options, [k, n], (chosen, correctIndex) => {
      views[correctIndex].update({ labels: 'selected' });
      App.feedback.show({
        kind: 'wrong',
        reveal: buttons[correctIndex],
        title: S.almost,
        message: `${S.why[chosen.why]}\n${S.quiz.seeCorrect}`,
        actions: [{ label: `${S.next} →`, primary: true, onClick: next }],
      });
    }, next);

    root.append(
      el('h2', { class: 'prompt' }, S.quiz.find, App.createFraction(k, n, 'frac-prompt')),
      App.createLegend(S.legend),
      el('div', { class: 'options options-pic' }, buttons));
  }

  App.registerMode({
    id: 'quiz',
    icon: '❓',
    color: '#6D4FE0',
    title: S.modes.quiz,
    start(root, ctx) {
      function next() {
        App.feedback.hide();
        const task = App.generator.next('quiz', ctx.level);
        root.replaceChildren();
        window.scrollTo(0, 0);
        (task.type === 'fractionToPicture' ? askPicture : askFraction)(root, task, next);
      }
      next();
    },
  });
})();
