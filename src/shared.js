// Shared by the content script and the settings page. Loaded as a classic
// script, so everything is exposed on a single `TSH` global.
// eslint-disable-next-line no-var
var TSH = (() => {
  const DEFAULTS = Object.freeze({
    enabled: true,
    caseSensitive: false,
    wholeWord: false,
    minLength: 2,
    color: '#ffc83d',
    opacity: 0.45,
    style: 'fill', // 'fill' | 'underline'
    showCount: true,
  });

  const HIGHLIGHT_NAME = 'text-select-highlighter';
  const MAX_TERM_LENGTH = 300;
  const MAX_MATCHES = 2000;

  // Text inside these elements is never matched.
  const SKIP_TAGS = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'TEXTAREA', 'SELECT', 'OPTION',
    'IFRAME', 'OBJECT', 'CANVAS', 'HEAD', 'TITLE',
  ]);

  // Text from different blocks is joined with a newline so a match can't run
  // from the end of one paragraph into the next by accident.
  const BLOCK_TAGS = new Set([
    'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'BODY', 'DD', 'DETAILS', 'DIALOG',
    'DIV', 'DL', 'DT', 'FIELDSET', 'FIGCAPTION', 'FIGURE', 'FOOTER', 'FORM',
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER', 'HR', 'LI', 'MAIN', 'NAV', 'OL',
    'P', 'PRE', 'SECTION', 'SUMMARY', 'TABLE', 'TBODY', 'TD', 'TFOOT', 'TH',
    'THEAD', 'TR', 'UL',
  ]);

  async function loadSettings() {
    const stored = await chrome.storage.sync.get(DEFAULTS);
    return { ...DEFAULTS, ...stored };
  }

  function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  }

  // Any run of whitespace in the selection matches any run of whitespace on
  // the page, since the rendered text rarely matches the DOM byte for byte.
  function buildMatcher(term, { caseSensitive, wholeWord }) {
    const words = term.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return null;
    let source = words.map(escapeRegExp).join('\\s+');
    if (wholeWord) source = `(?<![\\p{L}\\p{N}_])${source}(?![\\p{L}\\p{N}_])`;
    return new RegExp(source, caseSensitive ? 'gu' : 'giu');
  }

  function blockOf(element, root, cache) {
    const path = [];
    let block = element;
    while (block && block !== root && !BLOCK_TAGS.has(block.tagName)) {
      if (cache.has(block)) {
        block = cache.get(block);
        break;
      }
      path.push(block);
      block = block.parentElement;
    }
    block ??= root;
    for (const element of path) cache.set(element, block);
    return block;
  }

  function collectText(root) {
    const nodes = [];
    const starts = [];
    const blocks = new Map();
    let text = '';
    let previousBlock = null;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) =>
        node.data && node.parentElement && !SKIP_TAGS.has(node.parentElement.tagName)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT,
    });

    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const block = blockOf(node.parentElement, root, blocks);
      if (previousBlock && block !== previousBlock) text += '\n';
      previousBlock = block;
      starts.push(text.length);
      nodes.push(node);
      text += node.data;
    }
    return { text, nodes, starts };
  }

  // Index of the text node containing character `position`.
  function nodeIndexAt(starts, position) {
    let low = 0;
    let high = starts.length - 1;
    while (low < high) {
      const mid = (low + high + 1) >> 1;
      if (starts[mid] <= position) low = mid;
      else high = mid - 1;
    }
    return low;
  }

  function isVisible(element, cache) {
    if (!cache.has(element)) {
      let visible = element.checkVisibility
        ? element.checkVisibility({ visibilityProperty: true, checkVisibilityCSS: true })
        : true;
      // `display: contents` elements have no box of their own.
      if (!visible && element.parentElement && getComputedStyle(element).display === 'contents') {
        visible = isVisible(element.parentElement, cache);
      }
      cache.set(element, visible);
    }
    return cache.get(element);
  }

  function overlaps(a, b) {
    try {
      return (
        a.compareBoundaryPoints(Range.END_TO_START, b) < 0 &&
        a.compareBoundaryPoints(Range.START_TO_END, b) > 0
      );
    } catch {
      return false; // Ranges in different trees (e.g. shadow DOM).
    }
  }

  // Returns ranges for every visible match under `root`, skipping the one that
  // overlaps `exclude` (the user's own selection). `total` includes it.
  function findRanges(root, matcher, { exclude = null, max = MAX_MATCHES } = {}) {
    const { text, nodes, starts } = collectText(root);
    const visibility = new Map();
    const ranges = [];
    let total = 0;

    for (const match of text.matchAll(matcher)) {
      const end = match.index + match[0].length;
      const first = nodeIndexAt(starts, match.index);
      const last = nodeIndexAt(starts, end - 1);
      if (!isVisible(nodes[first].parentElement, visibility)) continue;

      const range = new Range();
      range.setStart(nodes[first], match.index - starts[first]);
      range.setEnd(nodes[last], end - starts[last]);
      total++;
      if (exclude && overlaps(range, exclude)) continue;
      ranges.push(range);
      if (ranges.length >= max) break;
    }
    return { ranges, total };
  }

  function toRgba(hex, alpha) {
    const value = parseInt(hex.slice(1), 16);
    return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
  }

  function highlightCss({ color, opacity, style }) {
    const paint = toRgba(color, opacity);
    const declarations =
      style === 'underline'
        ? `text-decoration-line: underline; text-decoration-color: ${paint}; text-decoration-thickness: 3px;`
        : `background-color: ${paint};`;
    return `::highlight(${HIGHLIGHT_NAME}) { ${declarations} }`;
  }

  return {
    DEFAULTS,
    HIGHLIGHT_NAME,
    MAX_TERM_LENGTH,
    loadSettings,
    buildMatcher,
    findRanges,
    highlightCss,
  };
})();
