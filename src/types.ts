/** Represents a scanned interactive element and its test-ID status */
export interface ElementInfo {
  el: Element;
  tag: string;
  tid: string | null;
  has: boolean;
  cn: string;   // first 2 class names, e.g. ".card.active"
  id: string;   // e.g. "#main"
  tx: string;   // trimmed text content (max 50 chars)
  ty: string;   // input type attribute
}

export interface ScannerStats {
  total: number;
  withTestId: number;
  missing: number;
  coverage: string;
}

export interface ExportedElement {
  tag: string;
  testId: string | null;
  text: string;
  selector: string;
}

export interface ExportPayload {
  url: string;
  timestamp: string;
  total: number;
  elements: ExportedElement[];
}

/** Public API exposed on window.TestIDScanner */
export interface TestIDScannerAPI {
  scan(): void;
  getElements(): ElementInfo[];
  getStats(): ScannerStats;
  exportJSON(): string;
}

declare global {
  interface Window {
    __TID_SCANNER__?: boolean;
    TestIDScanner: TestIDScannerAPI;
  }
}
