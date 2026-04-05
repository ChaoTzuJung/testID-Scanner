/**
 * CSS selector for all interactive elements we care about.
 * Covers links, buttons, form controls, ARIA roles, and anything with data-testid.
 */
export const INTERACTIVE_SELECTOR = [
  'a[href]',
  'a[onclick]',
  'a[data-testid]',
  'button',
  'input',
  'select',
  'textarea',
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="menuitem"]',
  '[role="switch"]',
  '[role="option"]',
  '[role="combobox"]',
  '[onclick]',
  '[data-testid]',
].join(',');

/** Attributes shown in the detail panel */
export const DISPLAY_ATTRIBUTES = [
  'id', 'class', 'type', 'role', 'name',
  'placeholder', 'href', 'aria-label', 'value',
] as const;

/** ID of our host container — used to exclude self from scanning */
export const HOST_ID = '__tid_host';

/** Debounce delay (ms) for MutationObserver re-scans */
export const SCAN_DEBOUNCE_MS = 800;
