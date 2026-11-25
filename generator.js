/*
 * generator.js — produces the next task for a mode, mixing generated and fixed tasks
 * from tasks.js. A task looks like:
 *   { mode, type, objectId, parts, selected: [piece indices] }
 */
'use strict';

App.generator = (function () {
  const memory = {}; // per "mode:level": { lastKey, queue of fixed tasks }

  const config = () => App.taskConfig;
  const levelById = (id) => config().levels.find((l) => l.id === id) || config().levels[0];
  const fitsLevel = (item, level) => !item.level || item.level === level.id;
  const keyOf = (t) => [t.type, t.objectId, t.parts, t.selected.join('.')].join('|');

  function weightedPick(items) {
    const total = items.reduce((sum, t) => sum + (t.weight ?? 1), 0);
    let r = Math.random() * total;
    for (const t of items) {
      r -= t.weight ?? 1;
      if (r < 0) return t;
    }
    return items[items.length - 1];
  }

  function fromFixed(f) {
    const objectId = !f.object || f.object === 'random' ? App.pick(App.objects).id : f.object;
    const obj = App.getObject(objectId);
    const selected = Array.isArray(f.selected) ? f.selected.slice() : App.range(f.selected);
    const valid = obj &&
      f.parts >= obj.supportedParts.min && f.parts <= obj.supportedParts.max &&
      selected.length > 0 && selected.every((i) => i >= 0 && i < f.parts);
    if (!valid) {
      console.warn('tasks.js: skipping a fixed task that cannot be shown', f);
      return null;
    }
    return { mode: f.mode, type: f.type, objectId, parts: f.parts, selected };
  }

  function generate(mode, level) {
    const tpl = weightedPick(config().templates.filter((t) => t.mode === mode && fitsLevel(t, level)));
    const obj = App.pick(App.objects.filter((o) => !tpl.objects || tpl.objects.includes(o.id)));
    const [lo, hi] = level.parts;
    const denominators = (tpl.denominators || App.range(hi - lo + 1).map((i) => lo + i))
      .filter((n) => n >= Math.max(2, obj.supportedParts.min) && n <= obj.supportedParts.max);
    if (!denominators.length) console.warn('tasks.js: no piece counts fit', tpl, obj.id);
    const n = App.pick(denominators) || 2;
    const allowWhole = tpl.allowWhole ?? level.allowWhole;
    const k = Math.min(n, tpl.numerator ?? App.randInt(1, allowWhole ? n : n - 1));
    const selected = Math.random() < (level.scattered ?? 0)
      ? App.shuffle(App.range(n)).slice(0, k).sort((a, b) => a - b)
      : App.range(k);
    return { mode, type: tpl.type, objectId: obj.id, parts: n, selected };
  }

  /** Next task for `mode` ('quiz' | 'tasks') at level id `levelId`. */
  function next(mode, levelId) {
    const level = levelById(levelId);
    const mem = (memory[`${mode}:${level.id}`] ||= { lastKey: null, queue: [] });
    const fixed = config().fixed.filter((f) => f.mode === mode && fitsLevel(f, level));

    let task = null;
    for (let tries = 0; tries < 20; tries++) {
      let candidate;
      if (fixed.length && Math.random() < config().fixedShare) {
        if (!mem.queue.length) mem.queue = App.shuffle(fixed);
        candidate = fromFixed(mem.queue.pop());
      } else {
        candidate = generate(mode, level);
      }
      if (!candidate) continue;
      task = candidate;
      if (keyOf(task) !== mem.lastKey) break; // no immediate repeats
    }
    mem.lastKey = keyOf(task);
    return task;
  }

  return { next };
})();
