import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { 'testid-scanner': 'src/index.ts' },
  format: ['iife'],
  outDir: 'dist',
  // Output as testid-scanner.js (not index.global.js)
  outExtension: () => ({ js: '.js' }),
  globalName: '__TID_BUILD__',
  minify: false,
  splitting: false,
  sourcemap: false,
  clean: false,       // don't wipe dist/ (keeps gtm-tag.html, demo etc.)
  treeshake: true,
  // Banner wraps the IIFE so the file is self-contained
  banner: {
    js: '// TestID Scanner v1.1 — https://github.com/AcmeCorp/testid-scanner',
  },
});
