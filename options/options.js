const SWATCHES = ['#ffc83d', '#ffa657', '#ff9bce', '#d2a8ff', '#79c0ff', '#7ee787'];
const MIN_LENGTH_RANGE = [1, 10];
const SAVE_DEBOUNCE_MS = 250;

const $ = (selector) => document.querySelector(selector);

const elements = {
  enabled: $('#enabled'),
  caseSensitive: $('#caseSensitive'),
  wholeWord: $('#wholeWord'),
  showCount: $('#showCount'),
  minLength: $('#minLength'),
  stepButtons: document.querySelectorAll('.stepper button'),
  swatches: $('#swatches'),
  customColor: $('#customColor'),
  opacity: $('#opacity'),
  opacityValue: $('#opacity-value'),
  styles: document.querySelectorAll('input[name="style"]'),
  previewText: $('#preview-text'),
  previewSelection: $('#preview-selection'),
  previewCount: $('#preview-count'),
  reset: $('#reset'),
  status: $('#status'),
};

const highlight = new Highlight();
CSS.highlights.set(TSH.HIGHLIGHT_NAME, highlight);
const sheet = new CSSStyleSheet();
document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];

let settings = { ...TSH.DEFAULTS };
let pending = {};
let saveTimer = 0;
let statusTimer = 0;

// Rendering

function renderSwatches() {
  for (const color of SWATCHES) {
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = 'swatch';
    swatch.role = 'radio';
    swatch.dataset.color = color;
    swatch.style.setProperty('--swatch', color);
    swatch.ariaLabel = color;
    swatch.addEventListener('click', () => update({ color }));
    elements.swatches.insertBefore(swatch, elements.customColor.parentElement);
  }
}

function renderPreview() {
  sheet.replaceSync(TSH.highlightCss(settings));
  const exclude = new Range();
  exclude.selectNodeContents(elements.previewSelection);
  const matcher = TSH.buildMatcher(elements.previewSelection.textContent, settings);
  const { ranges, total } = TSH.findRanges(elements.previewText, matcher, { exclude });

  highlight.clear();
  if (settings.enabled) for (const range of ranges) highlight.add(range);
  elements.previewCount.textContent = settings.enabled ? `${total} matches` : 'Off';
}

function render() {
  document.body.classList.toggle('is-disabled', !settings.enabled);
  for (const key of ['enabled', 'caseSensitive', 'wholeWord', 'showCount']) {
    elements[key].checked = settings[key];
  }

  elements.minLength.value = settings.minLength;
  const [min, max] = MIN_LENGTH_RANGE;
  for (const button of elements.stepButtons) {
    const next = settings.minLength + Number(button.dataset.step);
    button.disabled = next < min || next > max;
  }

  const isPreset = SWATCHES.includes(settings.color);
  for (const swatch of elements.swatches.querySelectorAll('[data-color]')) {
    swatch.ariaChecked = String(swatch.dataset.color === settings.color);
  }
  elements.customColor.value = settings.color;
  elements.customColor.classList.toggle('is-active', !isPreset);

  const percent = Math.round(settings.opacity * 100);
  elements.opacity.value = percent;
  elements.opacity.style.setProperty('--fill', `${((percent - 10) / 90) * 100}%`);
  elements.opacityValue.value = `${percent}%`;

  for (const radio of elements.styles) radio.checked = radio.value === settings.style;

  renderPreview();
}

// Persistence

function flash() {
  clearTimeout(statusTimer);
  elements.status.classList.add('is-visible');
  statusTimer = setTimeout(() => elements.status.classList.remove('is-visible'), 1400);
}

function update(patch) {
  Object.assign(settings, patch);
  Object.assign(pending, patch);
  render();
  // Debounced so dragging the slider doesn't hit the sync write quota.
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const changes = pending;
    pending = {};
    await chrome.storage.sync.set(changes);
    flash();
  }, SAVE_DEBOUNCE_MS);
}

// Events

for (const key of ['enabled', 'caseSensitive', 'wholeWord', 'showCount']) {
  elements[key].addEventListener('change', () => update({ [key]: elements[key].checked }));
}

for (const button of elements.stepButtons) {
  button.addEventListener('click', () => {
    update({ minLength: settings.minLength + Number(button.dataset.step) });
  });
}

elements.customColor.addEventListener('input', () => update({ color: elements.customColor.value }));
elements.opacity.addEventListener('input', () => update({ opacity: elements.opacity.value / 100 }));

for (const radio of elements.styles) {
  radio.addEventListener('change', () => update({ style: radio.value }));
}

elements.reset.addEventListener('click', () => update({ ...TSH.DEFAULTS }));

// Keep in sync with changes made from another settings tab.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  for (const [key, { newValue }] of Object.entries(changes)) {
    if (key in TSH.DEFAULTS && !(key in pending)) settings[key] = newValue ?? TSH.DEFAULTS[key];
  }
  render();
});

renderSwatches();
TSH.loadSettings().then((loaded) => {
  settings = loaded;
  render();
  requestAnimationFrame(() => document.body.classList.add('is-ready'));
});
