/*
 * tasks.js — WHAT the children practise. Edit freely; no code knowledge needed.
 *
 * Task types:
 *   mode 'quiz'  : 'pictureToFraction'  picture with pieces selected -> choose the fraction
 *                  'fractionToPicture'  a fraction -> choose the picture
 *   mode 'tasks' : 'typeFraction'       picture -> type numerator and denominator
 *                  'cut'                a fraction -> cut the object and select pieces
 *
 * Objects: 'pizza', 'chocolate' (or any object added in objects/), or 'random'.
 * Each new task is either generated (from `templates`) or taken from your `fixed`
 * list; fixed tasks are shuffled and each is shown once before any repeats.
 * The same task never appears twice in a row.
 */
'use strict';

App.taskConfig = {
  // Difficulty levels (the toggle on the home screen).
  //   parts      — [min, max] number of pieces (the denominator)
  //   allowWhole — may the whole object be selected (e.g. 4/4)?
  //   scattered  — share of tasks (0..1) where the coloured pieces are not next to each
  //                other, so the child has to count instead of judging by shape
  // A new level also needs its button text in strings.js -> levels.
  levels: [
    { id: 'easy', label: App.strings.levels.easy, parts: [2, 8], allowWhole: false, scattered: 0 },
    { id: 'harder', label: App.strings.levels.harder, parts: [2, 12], allowWhole: true, scattered: 0.4 },
  ],

  // Probability (0..1) that the next task comes from the `fixed` list
  // (when the list has tasks for this mode and level).
  fixedShare: 0.3,

  // Generator templates. Each one is picked with probability proportional to `weight`.
  // Optional fields:
  //   level        — only for this level id ('easy' / 'harder')
  //   objects      — only these objects, e.g. ['pizza']
  //   denominators — only these piece counts, e.g. [2, 4, 8] (instead of the level range)
  //   numerator    — always this many selected pieces, e.g. 1 for unit fractions
  //   allowWhole   — overrides the level setting
  templates: [
    { mode: 'quiz', type: 'pictureToFraction', weight: 1 },
    { mode: 'quiz', type: 'fractionToPicture', weight: 1 },
    { mode: 'tasks', type: 'typeFraction', weight: 1 },
    { mode: 'tasks', type: 'cut', weight: 1 },

    // Examples — remove the // to switch on:
    // { mode: 'quiz', type: 'pictureToFraction', weight: 1, level: 'easy', denominators: [2, 4, 8] },
    // { mode: 'tasks', type: 'cut', weight: 1, objects: ['pizza'], numerator: 1 },
  ],

  // Your own tasks. Fields:
  //   mode, type  — see the top of this file
  //   object      — 'pizza', 'chocolate' or 'random'
  //   parts       — number of pieces (denominator)
  //   selected    — a number (first N pieces) or a list of piece numbers starting at 0,
  //                 e.g. [0, 2, 5] for scattered pieces
  //   level       — optional: show only on this level
  fixed: [
    { mode: 'quiz', type: 'pictureToFraction', object: 'pizza', parts: 4, selected: 1 },
    { mode: 'quiz', type: 'fractionToPicture', object: 'chocolate', parts: 6, selected: 2 },
    { mode: 'tasks', type: 'typeFraction', object: 'chocolate', parts: 8, selected: [0, 2, 5] },
    { mode: 'tasks', type: 'cut', object: 'pizza', parts: 3, selected: 2, level: 'easy' },
  ],
};
