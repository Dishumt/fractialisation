# Дроби: fractions, visually

A small browser app that helps children in grades 3–6 understand fractions using pictures you can tap.
It is plain HTML, CSS and JavaScript, with no frameworks, build step or internet connection needed.

| Mode | What the child does |
|---|---|
| ❓ **Вікторина** (Quiz) | Picks the fraction for a picture, or the picture for a fraction (3–4 options). |
| ✏️ **Завдання** (Tasks) | Types the fraction for a picture, or cuts the object and colours pieces to show a fraction. |
| 🎨 **Пісочниця** (Sandbox) | Free play: choose an object, cut it, tap pieces and watch the fraction change. |

Each mode has its own link: `index.html#quiz`, `index.html#tasks` and `index.html#sandbox`.
You can send a student straight to one mode. The level toggle (Легко / Складніше) on the home screen is remembered in the browser.

## Run it locally

Double-click `index.html`. That's all you need.

If you prefer a local web server (for example, to open it on a tablet in the same Wi-Fi network):

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy to GitHub Pages

1. Push the files to a GitHub repository (they must stay in the repository root).
2. On GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**. Pick your branch (e.g. `main`) and the `/ (root)` folder, then click **Save**.
4. After a minute the app is live at `https://<your-user>.github.io/<repository>/`.

No build step or configuration is needed.

## Files

```
index.html          page shell + list of scripts (order matters)
styles.css          all styling; colours at the top
strings.js          ALL Ukrainian text, in one place
core.js             shared helpers and the object/mode registries
objects/pizza.js    pizza: a circle cut into equal slices
objects/chocolate.js  chocolate bar: a fixed-size rectangle split into a grid
tasks.js            levels, task generator settings and your own tasks   <- edit this
generator.js        picks the next task (generated + yours, no immediate repeats)
widgets.js          reusable UI: object view, fraction, input boxes, piece counter, feedback
modes/quiz.js       mode 1
modes/tasks.js      mode 2
modes/sandbox.js    mode 3
app.js              home screen and navigation
```

The app uses plain `<script>` tags, not ES modules. Browsers block modules on pages opened by double-click (`file://`).

## How answers are checked

- **Quiz.** Wrong options come from typical mistakes:
  - numerator and denominator swapped
  - counting the unselected pieces
  - selected over unselected pieces ("3/5" instead of "3/8")
  - miscounting the total or the selected pieces

  A wrong pick explains that particular mistake, numbers the pieces on the picture and shows the right answer.
- **Typing a fraction.** Only the exact fraction from the picture counts. An equivalent fraction (e.g. 1/2 for a picture of 2/4) gets a friendly note: *"Це теж правильно! Але спробуй записати так, як на малюнку."* After a mistake the pieces get numbered so the child can count them.
- **Cutting.** The object must be cut into exactly *N* pieces, and then any *K* pieces count. Wrong number of pieces: the object is cut correctly and the *K* pieces to colour are outlined. Right cut, wrong count: the pieces to keep are outlined and extra ones are dimmed.

## Add your own tasks

Open `tasks.js`. Every field is explained in the comments there.

**A fixed task.** Add a line to the `fixed` list. Fixed tasks are mixed with generated ones; `fixedShare: 0.3` means about 30% of the time.

```js
fixed: [
  // pizza in 8 slices, first 3 coloured -> "which fraction?"
  { mode: 'quiz', type: 'pictureToFraction', object: 'pizza', parts: 8, selected: 3 },
  // chocolate with scattered pieces 0, 2 and 5 coloured -> type the fraction
  { mode: 'tasks', type: 'typeFraction', object: 'chocolate', parts: 8, selected: [0, 2, 5] },
  // show 2/3 by cutting a random object; only on the easy level
  { mode: 'tasks', type: 'cut', object: 'random', parts: 3, selected: 2, level: 'easy' },
],
```

The types are:

| Mode | Type | What it asks |
|---|---|---|
| `quiz` | `pictureToFraction` | picture → choose the fraction |
| `quiz` | `fractionToPicture` | fraction → choose the picture |
| `tasks` | `typeFraction` | picture → type the fraction |
| `tasks` | `cut` | fraction → cut the object and colour pieces |

**Change the generator.** Edit `levels` or add templates. A level sets:
- the range of pieces
- whether the whole object can be coloured
- `scattered`: how often the coloured pieces are not next to each other, so the child has to count instead of judging by shape (harder level: 40% of generated tasks)

Template example:

```js
templates: [
  // extra practice with halves, quarters and eighths on the easy level
  { mode: 'quiz', type: 'pictureToFraction', weight: 2, level: 'easy', denominators: [2, 4, 8] },
  // unit fractions (1/N) on pizza only
  { mode: 'tasks', type: 'cut', weight: 1, objects: ['pizza'], numerator: 1 },
],
```

## Add a new object

1. Create `objects/<name>.js` and call `App.registerObject` with this interface:

   | Field | Meaning |
   |---|---|
   | `id` | short unique name, used in `tasks.js` |
   | `name`, `icon` | shown on the sandbox picker (put the name in `strings.js`) |
   | `supportedParts` | `{ min, max }` pieces this object can be cut into (`min: 1` = the uncut whole) |
   | `render(svg, { parts, selected, highlightColor })` | draw the object cut into `parts` equal pieces; `selected` is a `Set` of piece indices |

   Rules for `render`:
   - Set the `viewBox`, and draw each piece inside its own `<g data-piece="i">`.
   - Mark the piece's main shape (a `path`, `rect`, `circle`, …) with class `piece-fill`, and its border with `piece-outline`. They can be the same element.
   - Don't set `transform` on the `<g data-piece>` itself, because the app animates it. Use an inner `<g>` if a piece needs to move.
   - Keep the outer size the same for every `parts`, so the whole stays the same size.

   You don't write any tap, keyboard, hint, number-label or animation code: `widgets.js` adds all of that to every object.

2. Add one line to `index.html`, next to the other objects:

   ```html
   <script src="objects/ribbon.js"></script>
   ```

**Example: a ribbon cut into strips** (`objects/ribbon.js`):

```js
'use strict';

App.registerObject({
  id: 'ribbon',
  name: App.strings.objects.ribbon, // add  ribbon: 'Стрічка'  to strings.js -> objects
  icon: '🎀',
  supportedParts: { min: 1, max: 12 },

  render(svg, { parts, selected, highlightColor }) {
    svg.setAttribute('viewBox', '0 0 320 80');
    const w = 300 / parts;
    for (let i = 0; i < parts; i++) {
      const isSelected = selected.has(i);
      const piece = App.svgEl('g', { 'data-piece': i }, svg);
      App.svgEl('rect', {
        x: 10 + i * w, y: 10, width: w, height: 60,
        class: 'piece-fill piece-outline',
        fill: isSelected ? highlightColor : '#F9C9DA',
        stroke: '#1E2140', 'stroke-width': isSelected ? 4 : 2,
      }, piece);
    }
  },
});
```

The new object then appears in the sandbox picker and in random tasks automatically.

## Other changes

- **Texts / translation:** everything is in `strings.js`.
- **Selection colour:** `App.colors.selected` in `core.js`. It is used for the selected pieces and every numerator. If you change it, also change the colour word in the hint under the pictures (`legend` and `legendTap` in `strings.js`).
- **A new mode:** create `modes/<name>.js` that calls `App.registerMode({ id, icon, color, title, start(root, ctx) })` and add its `<script>` line. It gets a home-screen button and an `index.html#<id>` link automatically.
