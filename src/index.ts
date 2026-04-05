/**
 * TestID Scanner v1.1
 *
 * Drop-in script that scans interactive elements for data-testid coverage.
 * Usage:  <script src="testid-scanner.js"></script>
 *
 * Hotkeys: I = inspect | B = badges | T = toggle panel | Esc = close
 */

import { Scanner } from './scanner';

(function () {
  // Prevent double-init (e.g. GTM + manual script tag)
  if (window.__TID_SCANNER__) return;
  window.__TID_SCANNER__ = true;

  const scanner = new Scanner();

  function bootstrap() {
    scanner.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    setTimeout(bootstrap, 200);
  }

  // Expose public API
  window.TestIDScanner = {
    scan: () => scanner.scan(),
    getElements: () => scanner.getElements(),
    getStats: () => scanner.getStats(),
    exportJSON: () => scanner.exportJSON(),
  };
})();
