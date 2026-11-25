/*
 * strings.js — ALL text shown in the app (Ukrainian).
 * To translate: copy this file, change the texts, keep the keys and the
 * function signatures (functions build sentences with numbers).
 */
'use strict';

/** Ukrainian plural: plural(5, 'частина', 'частини', 'частин') -> 'частин' */
function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

App.strings = {
  appTitle: 'Дроби',
  home: 'Додому',

  modes: { quiz: 'Вікторина', tasks: 'Завдання', sandbox: 'Пісочниця' },
  levelLabel: 'Рівень:',
  levels: { easy: 'Легко', harder: 'Складніше' },
  objects: { pizza: 'Піца', chocolate: 'Шоколадка' },

  check: 'Перевірити',
  next: 'Далі',
  tryAgain: 'Ще раз',
  reset: 'Скинути',

  praise: ['Молодець!', 'Чудово!', 'Правильно!', 'Супер!', 'Так тримати!'],
  itIs: 'Це',
  almost: 'Майже!',
  answerIs: 'Правильна відповідь:',

  // Explanations of typical mistakes (shown together with a visual hint).
  why: {
    top: 'Чисельник (зверху) — скільки частин зафарбовано.',
    bottom: 'Знаменник (знизу) — на скільки рівних частин поділили.',
    swapped: 'Зверху пишемо зафарбовані частини, а знизу — усі частини.',
    unselected: 'Зверху рахуємо зафарбовані частини, а не незафарбовані.',
    partToPart: 'Знизу рахуємо всі частини разом — і зафарбовані теж.',
  },

  // Small hint under the pictures. If you change App.colors.selected (core.js),
  // change the colour word here too.
  legend: 'Сині частини — зафарбовані',
  legendTap: 'Торкнись — частина стане синьою',

  quiz: {
    whichFraction: 'Який дріб на малюнку?',
    find: 'Знайди',
    seeCorrect: 'Правильний малюнок — у зеленій рамці.',
  },

  tasks: {
    write: 'Запиши дріб',
    show: 'Покажи',
    equivalentTitle: 'Це теж правильно!',
    equivalentMsg: 'Але спробуй записати так, як на малюнку.',
    cutHint: (n, k) =>
      `Знаменник ${n}: розріж на ${n} ${plural(n, 'частину', 'частини', 'частин')}.\n` +
      `Чисельник ${k}: зафарбуй ${k}.`,
    countHint: (k) => `Чисельник ${k}: зафарбуй ${k} ${plural(k, 'частину', 'частини', 'частин')}.`,
  },

  // Words under the piece counter: "5 частин"
  partsWord: (n) => plural(n, 'частина', 'частини', 'частин'),

  // Screen-reader labels
  a11y: {
    numerator: 'Чисельник',
    denominator: 'Знаменник',
    fewer: 'Менше частин',
    more: 'Більше частин',
    piece: (i) => `Частина ${i}`,
    picture: (k, n) => `Зафарбовано ${k} з ${n}`,
  },
};
