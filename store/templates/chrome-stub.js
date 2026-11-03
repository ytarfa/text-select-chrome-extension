// Stands in for the extension APIs so pages render outside an extension.
// Initial settings come from `window.STUB_SETTINGS` or the `?settings=<json>`
// query parameter, and match counts are re-dispatched as a `tsh-count` event
// for the mock badge.
(() => {
  const stored =
    window.STUB_SETTINGS ?? JSON.parse(new URLSearchParams(location.search).get('settings') || '{}');
  window.chrome = Object.assign(window.chrome || {}, {
    storage: {
      sync: { get: async (defaults) => ({ ...defaults, ...stored }), set: async () => {} },
      onChanged: { addListener: () => {} },
    },
    runtime: {
      sendMessage: async ({ count }) =>
        document.dispatchEvent(new CustomEvent('tsh-count', { detail: count })),
    },
  });
})();
