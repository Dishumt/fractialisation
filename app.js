/*
 * app.js — home screen and navigation between modes.
 * Each mode has its own address (index.html#quiz, #tasks, #sandbox), so a link
 * can open a mode directly and the browser "back" button returns home.
 */
'use strict';

(function () {
  const { el } = App;
  const S = App.strings;
  const root = document.getElementById('app');
  const LEVEL_KEY = 'fractions.level';

  document.title = S.appTitle;
  document.documentElement.style.setProperty('--sel', App.colors.selected);
  document.documentElement.style.setProperty('--hint-fill', App.colors.hintFill);

  let level = App.taskConfig.levels[0].id;
  try {
    const saved = localStorage.getItem(LEVEL_KEY);
    if (App.taskConfig.levels.some((l) => l.id === saved)) level = saved;
  } catch { /* storage unavailable: use the default level */ }

  function levelToggle() {
    const buttons = App.taskConfig.levels.map((l) =>
      el('button', { 'aria-pressed': String(l.id === level), onclick: () => setLevel(l.id), text: l.label }));
    function setLevel(id) {
      level = id;
      try { localStorage.setItem(LEVEL_KEY, id); } catch { /* ignore */ }
      buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(App.taskConfig.levels[i].id === id)));
    }
    return el('div', { class: 'level' }, el('span', { text: S.levelLabel }), el('div', { class: 'seg' }, buttons));
  }

  function showHome() {
    const logo = App.createObjectView({ objectId: App.objects[0].id, parts: 4, selected: [0] });
    logo.el.setAttribute('aria-hidden', 'true');
    root.replaceChildren(el('div', { class: 'home' },
      el('h1', { class: 'app-title' }, logo.el, S.appTitle),
      el('nav', { class: 'mode-list' }, App.modes.map((m) =>
        el('a', { class: 'mode-btn', href: `#${m.id}`, style: `--mode-color:${m.color}` },
          el('span', { class: 'mode-icon', 'aria-hidden': 'true', text: m.icon }),
          el('span', { text: m.title })))),
      levelToggle()));
  }

  function showMode(mode) {
    const body = el('main', { class: 'screen' });
    root.replaceChildren(
      el('header', { class: 'topbar' },
        el('a', { class: 'home-btn', href: '#', title: S.home, 'aria-label': S.home },
          el('span', { class: 'home-icon', 'aria-hidden': 'true', text: '🏠' }),
          el('span', { class: 'home-label', text: S.home })),
        el('h1', { class: 'mode-title' },
          el('span', { 'aria-hidden': 'true', text: mode.icon }), mode.title)),
      body);
    document.documentElement.style.setProperty('--accent', mode.color);
    mode.start(body, { level });
  }

  function route() {
    App.feedback.hide();
    document.documentElement.style.removeProperty('--accent');
    const mode = App.modes.find((m) => `#${m.id}` === location.hash);
    if (mode) showMode(mode);
    else showHome();
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', route);
  route();
})();
