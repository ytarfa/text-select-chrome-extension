# Text Select Highlighter

A Chrome extension that highlights every other occurrence of the text you select, like VS Code's selection highlighting.

## Features

- Select text anywhere on a page and every other match lights up
- Case-sensitive or case-insensitive matching
- Optional whole-word matching and a minimum selection length
- Customisable highlight colour, opacity and style (fill or underline)
- Match count shown on the toolbar icon
- Doesn't touch the page's DOM. Highlights are painted with the [CSS Custom Highlight API](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Custom_Highlight_API), so pages don't break or reflow

## Install (unpacked)

1. Clone this repo
2. Open `chrome://extensions` and turn on **Developer mode**
3. Click **Load unpacked** and pick the repo folder

Click the toolbar icon to open the settings. Changes apply right away to every open tab.

## Project layout

```
manifest.json         Manifest V3 config
src/shared.js         Defaults, matching and highlight styling (used by content script + settings)
src/content.js        Watches the selection and paints matches
src/background.js     Toolbar badge and opening the settings page
options/              Settings page
icons/                icon.svg and the rendered PNGs
```

To regenerate the icons after editing `icons/icon.svg`:

```sh
cd icons && for s in 16 32 48 128; do rsvg-convert -w $s -h $s icon.svg -o icon-$s.png; done
```
