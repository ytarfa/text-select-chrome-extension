# Chrome Web Store listing

Copy these into the [developer dashboard](https://chrome.google.com/webstore/devconsole) when creating the item.

## Package

Upload `dist/text-select-highlighter-<version>.zip`, built with `scripts/package.sh`.

## Store listing tab

**Name:** Text Select Highlighter (from the manifest)

**Summary** (from the manifest description, max 132 characters):

> Select text and every other match on the page lights up, just like in a code editor.

**Description:**

```
Select any text on a page and every other occurrence lights up instantly, the way code editors highlight matches of your selection.

• Works everywhere: articles, docs, code, search results
• Case-sensitive or case-insensitive matching
• Optional whole-word matching, so "row" doesn't light up inside "arrow"
• Choose any highlight colour and opacity, as a fill or an underline
• See the number of matches on the toolbar icon
• Minimal settings page with light and dark mode

Highlights are painted with the browser's built-in CSS Custom Highlight API, so the extension never modifies the page. Layouts don't shift, and the extension doesn't interfere with the sites you visit.

Private by design: everything happens on your device. No data is collected, no network requests are made, and nothing is tracked.
```

**Category:** Tools
**Language:** English

**Graphic assets** (in `store/`, regenerate with `scripts/render-store-assets.sh`):

| Field | File |
| --- | --- |
| Store icon (128×128) | `icons/icon-128.png` |
| Screenshots (1280×800) | `screenshot-1-highlight.png`, `screenshot-2-settings.png`, `screenshot-3-code.png` |
| Small promo tile (440×280) | `promo-small-440x280.png` |

**Homepage URL:** https://github.com/ytarfa/text-select-chrome-extension
**Support URL:** https://github.com/ytarfa/text-select-chrome-extension/issues

## Privacy practices tab

**Single purpose:**

> Highlights every other occurrence of the text the user selects on the current web page.

**Permission justifications:**

- **storage:** Saves the user's highlight settings (case sensitivity, whole-word matching, minimum length, colour, opacity, style, badge visibility).
- **Host permissions** (content script on all URLs): The extension has to find and highlight matches of the user's selection on whatever page they're reading, so its content script runs on all pages. It only reads page text locally to locate matches. Nothing is stored or transmitted.

**Remote code:** No, I am not using remote code.

**Data usage:** Leave every data type unchecked. Page text is processed only on the device and never collected or transmitted.

Tick all three certifications:

- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL:** https://github.com/ytarfa/text-select-chrome-extension/blob/main/PRIVACY.md

## Distribution tab

- **Visibility:** Public (or Unlisted to share by link only)
- **Regions:** All regions
- **Pricing:** Free

## Releasing an update

1. Bump `version` in `manifest.json`
2. Run `scripts/package.sh`
3. Upload the new zip from the item's **Package** tab and submit for review
