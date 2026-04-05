import type { ElementInfo } from './types';

/**
 * Generate a Playwright-style selector for an element.
 * Prefers getByTestId → getByRole → getByLabel → getByText → locator fallback.
 */
export function buildPlaywrightSelector(info: ElementInfo): string {
  if (info.has) {
    return `page.getByTestId('${info.tid}')`;
  }

  if (info.tag === 'button' && info.tx) {
    return `page.getByRole('button', { name: '${info.tx}' })`;
  }

  if (info.tag === 'a' && info.tx) {
    return `page.getByRole('link', { name: '${info.tx}' })`;
  }

  if (['input', 'textarea', 'select'].includes(info.tag)) {
    const label = findLabel(info.el);
    if (label) return `page.getByLabel('${label}')`;
  }

  if (info.tx) {
    return `page.getByText('${info.tx}')`;
  }

  return `page.locator('${info.tag}${info.cn}')`;
}

/** Try to resolve a human-readable label for a form control */
function findLabel(el: Element): string | null {
  const htmlEl = el as HTMLInputElement;

  // 1. Explicit <label for="...">
  if (htmlEl.labels?.[0]) {
    return htmlEl.labels[0].textContent?.trim() ?? null;
  }

  // 2. Closest form-group wrapper with a <label>
  const FORM_WRAPPER = '.form-group, .field, [class*=form], .fi';
  const wrapper = el.closest(FORM_WRAPPER);
  const wrapperLabel = wrapper?.querySelector('label')?.textContent?.trim();
  if (wrapperLabel) return wrapperLabel;

  // 3. Fallback to placeholder / aria-label
  return el.getAttribute('placeholder') || el.getAttribute('aria-label');
}

/** Syntax-highlight a selector string for display in the panel */
export function highlightSelector(selector: string): string {
  return selector
    .replace(/(page\.\w+)/g, '<span class="kw">$1</span>')
    .replace(/'([^']*)'/g, `'<span class="str">$1</span>'`);
}
