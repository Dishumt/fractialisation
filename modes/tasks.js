/*
 * Mode 2: Tasks — the child produces the answer.
 *   typeFraction: a picture -> type numerator and denominator.
 *     Only the exact fraction is accepted; an equivalent one (e.g. 1/2 for 2/4)
 *     gets a friendly note asking to write it "as in the picture".
 *   cut: a fraction k/n -> cut the object into exactly n pieces and select any k of them.
 */
'use strict';

(function () {
  const { el } = App;
  const S = App.strings;

  /** Which typical mistake does num/den represent for the picture k/n? (a key of strings.why) */
  function classify(num, den, n, k) {
    if (num === n && den === k) return 'swapped';
    if (den !== n) return num === k && den === n - k ? 'partToPart' : 'bottom';
    if (num === n - k) return 'unselected';
    return 'top';
  }

  function typeTask(root, task, next) {
    const n = task.parts, k = task.selected.length;
    const view = App.createObjectView({ objectId: task.objectId, parts: n, selected: task.selected });
    const input = App.createFractionInput({ onSubmit: check });
    const checkBtn = el('button', { class: 'btn btn-primary btn-big', onclick: check, text: S.check });

    const retry = () => { App.feedback.hide(); input.focus(); };

    function check() {
      const { num, den } = input.read();
      if (num == null || den == null) {
        input.focus();
        return;
      }
      if (num === k && den === n) {
        input.setDisabled(true);
        checkBtn.hidden = true;
        App.showCorrect(view.el, next, [k, n]);
      } else if (den > 0 && num * n === den * k) {
        App.feedback.show({
          kind: 'info',
          title: S.tasks.equivalentTitle,
          message: S.tasks.equivalentMsg,
          actions: [{ label: S.tryAgain, primary: true, onClick: retry }],
        });
      } else {
        const why = classify(num, den, n, k);
        view.update({ labels: why === 'bottom' || why === 'partToPart' ? 'all' : 'selected' });
        App.feedback.show({
          kind: 'wrong',
          reveal: view.el,
          title: S.almost,
          message: S.why[why],
          actions: [
            { label: S.tryAgain, primary: true, onClick: retry },
            { label: `${S.next} →`, onClick: next },
          ],
        });
      }
    }

    root.append(
      el('h2', { class: 'prompt', text: S.tasks.write }),
      App.stage([view.el, App.createLegend(S.legend)], input.el, checkBtn));
    // Focus the box right away with a mouse; on touch screens the keyboard would hide the picture.
    if (matchMedia('(pointer: fine)').matches) input.focus();
  }

  function cutTask(root, task, next) {
    const n = task.parts, k = task.selected.length;
    const obj = App.getObject(task.objectId);
    const view = App.createObjectView({
      objectId: task.objectId,
      parts: 1,
      interactive: true,
      onChange: () => App.feedback.hide(),
    });
    const stepper = App.createStepper({
      min: obj.supportedParts.min,
      max: obj.supportedParts.max,
      value: 1,
      nudge: true,
      onChange: (parts) => {
        App.feedback.hide();
        view.update({ parts, selected: [], hint: [], faded: [] }, { cut: true });
      },
    });
    const checkBtn = el('button', { class: 'btn btn-primary btn-big', onclick: check, text: S.check });

    function showHint(message) {
      App.feedback.show({
        kind: 'wrong',
        reveal: view.el,
        title: S.almost,
        message,
        actions: [
          { label: S.tryAgain, primary: true, onClick: () => App.feedback.hide() },
          { label: `${S.next} →`, onClick: next },
        ],
      });
    }

    function check() {
      const { parts, selected } = view.state;
      if (parts === n && selected.length === k) {
        view.update({ hint: [], faded: [] });
        view.setInteractive(false);
        stepper.setDisabled(true);
        checkBtn.hidden = true;
        App.showCorrect(view.el, next, [k, n]);
      } else if (parts !== n) {
        // Show the right cut, with the pieces to select outlined.
        stepper.setValue(n);
        view.update({ parts: n, selected: [], hint: App.range(k), faded: [] }, { cut: true });
        showHint(S.tasks.cutHint(n, k));
      } else {
        // Right cut, wrong count: keep the child's pieces where possible.
        const keep = [...selected, ...App.range(n).filter((i) => !selected.includes(i))].slice(0, k);
        view.update({ hint: keep, faded: selected.filter((i) => !keep.includes(i)) });
        showHint(S.tasks.countHint(k));
      }
    }

    root.append(
      el('h2', { class: 'prompt' }, S.tasks.show, App.createFraction(k, n, 'frac-prompt')),
      App.stage([view.el, App.createLegend(S.legendTap)], stepper.el, checkBtn));
  }

  App.registerMode({
    id: 'tasks',
    icon: '✏️',
    color: '#D9650F',
    title: S.modes.tasks,
    start(root, ctx) {
      function next() {
        App.feedback.hide();
        const task = App.generator.next('tasks', ctx.level);
        root.replaceChildren();
        window.scrollTo(0, 0);
        (task.type === 'cut' ? cutTask : typeTask)(root, task, next);
      }
      next();
    },
  });
})();
