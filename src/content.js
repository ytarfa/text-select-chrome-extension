(() => {
  if (!globalThis.CSS?.highlights) return;

  const SELECTION_DEBOUNCE_MS = 120;

  // The CSS Custom Highlight API paints ranges without touching the page's DOM.
  const highlight = new Highlight();
  CSS.highlights.set(TSH.HIGHLIGHT_NAME, highlight);

  // A constructed stylesheet isn't subject to the page's CSP, unlike <style>.
  const sheet = new CSSStyleSheet();

  let settings = { ...TSH.DEFAULTS };
  let lastCount = null;
  let timer = 0;

  function applyStyle() {
    sheet.replaceSync(TSH.highlightCss(settings));
    if (!document.adoptedStyleSheets.includes(sheet)) {
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    }
  }

  function reportCount(count) {
    if (count === lastCount) return;
    lastCount = count;
    try {
      chrome.runtime.sendMessage({ type: 'tsh:count', count }).catch(() => {});
    } catch {
      // The extension was reloaded or removed; this script is orphaned.
    }
  }

  function clear() {
    highlight.clear();
    reportCount(0);
  }

  function refresh() {
    const selection = document.getSelection();
    const term = selection && !selection.isCollapsed ? selection.toString().trim() : '';
    if (!settings.enabled || term.length < settings.minLength || term.length > TSH.MAX_TERM_LENGTH) {
      clear();
      return;
    }

    const matcher = TSH.buildMatcher(term, settings);
    if (!matcher) {
      clear();
      return;
    }

    const root = document.body ?? document.documentElement;
    const { ranges, total } = TSH.findRanges(root, matcher, { exclude: selection.getRangeAt(0) });
    highlight.clear();
    for (const range of ranges) highlight.add(range);
    reportCount(settings.showCount ? total : 0);
  }

  document.addEventListener('selectionchange', () => {
    clearTimeout(timer);
    timer = setTimeout(refresh, SELECTION_DEBOUNCE_MS);
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    for (const [key, { newValue }] of Object.entries(changes)) {
      if (key in TSH.DEFAULTS) settings[key] = newValue ?? TSH.DEFAULTS[key];
    }
    applyStyle();
    refresh();
  });

  TSH.loadSettings().then((loaded) => {
    settings = loaded;
    applyStyle();
    refresh();
  });
})();
