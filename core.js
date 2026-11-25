/*
 * core.js — shared namespace, registries and small helpers.
 * Loaded first; every other file adds to the global `App` object.
 */
'use strict';

window.App = {
  objects: [], // filled by objects/*.js via App.registerObject
  modes: [],   // filled by modes/*.js via App.registerMode

  colors: {
    selected: '#2F6FE4', // selected pieces AND every numerator use this color
    hintFill: '#C9DAFF', // pieces the child should select (shown after a mistake)
  },
};

/* ---------- Registries (extension points) ---------- */

/**
 * EXTENSION POINT — new object. See objects/pizza.js and README.md.
 * @param {{id:string, name:string, icon:string,
 *          supportedParts:{min:number,max:number},
 *          render:(svg:SVGSVGElement, opts:{parts:number, selected:Set<number>, highlightColor:string})=>void}} obj
 */
App.registerObject = (obj) => App.objects.push(obj);
App.getObject = (id) => App.objects.find((o) => o.id === id);

/**
 * EXTENSION POINT — new mode. Home-screen buttons appear in registration order.
 * @param {{id:string, icon:string, color:string, title:string,
 *          start:(root:HTMLElement, ctx:{level:string})=>void}} mode
 */
App.registerMode = (mode) => App.modes.push(mode);

/* ---------- Math & random ---------- */

App.gcd = (a, b) => (b ? App.gcd(b, a % b) : Math.abs(a));
App.range = (n) => Array.from({ length: n }, (_, i) => i);
App.randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
App.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
App.shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* ---------- DOM helpers ---------- */

/** Unique id for SVG gradients etc. (many pictures share one page, so ids must not clash). */
let uidCounter = 0;
App.uid = (prefix) => `${prefix}-${++uidCounter}`;

/** Create an HTML element: el('button', {class:'btn', onclick: fn}, 'text', childNode, ...) */
App.el = (tag, props, ...children) => {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value == null || value === false) continue;
    if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else node.setAttribute(key, value === true ? '' : value);
  }
  node.append(...children.flat().filter((c) => c != null && c !== false));
  return node;
};

/** Create an SVG element with attributes and (optionally) append it to `parent`. */
App.svgEl = (tag, attrs, parent) => {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs || {})) node.setAttribute(key, value);
  if (parent) parent.appendChild(node);
  return node;
};
