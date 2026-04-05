import type { ElementInfo, ExportPayload, ScannerStats } from './types';
import { INTERACTIVE_SELECTOR, DISPLAY_ATTRIBUTES, HOST_ID, SCAN_DEBOUNCE_MS } from './constants';
import { PANEL_STYLES } from './styles';
import { buildPanelHTML } from './template';
import { buildPlaywrightSelector, highlightSelector } from './selector';

/**
 * Core scanner — owns all UI state and DOM interactions.
 * Everything runs inside a Shadow DOM to avoid style conflicts with the host page.
 */
export class Scanner {
  // ── State ──
  private elements: ElementInfo[] = [];
  private selected: ElementInfo | null = null;
  private inspecting = false;
  private badgesVisible = false;
  private panelOpen = true;
  private minimized = false;
  private searchQuery = '';
  private badges: HTMLDivElement[] = [];
  private scanTimer = 0;

  // ── Shadow DOM refs ──
  private shadow!: ShadowRoot;
  private hlEl!: HTMLElement;      // highlight overlay
  private hlDim!: HTMLElement;     // dimension label
  private tipEl!: HTMLElement;     // tooltip
  private panelEl!: HTMLElement;   // main panel

  // ── Setup ──

  init(): void {
    this.createHost();
    this.bindHeaderActions();
    this.bindTreeEvents();
    this.bindFooter();
    this.bindKeyboard();
    this.observeMutations();
    this.scan();
    requestAnimationFrame(() => {
      this.panelEl.classList.add('show');
      this.toggleInspect();
    });
  }

  /** Create the Shadow DOM host and inject styles + template */
  private createHost(): void {
    const host = document.createElement('div');
    host.id = HOST_ID;
    host.style.cssText =
      'all:initial!important;position:fixed!important;z-index:2147483640!important;' +
      'top:0!important;left:0!important;width:0!important;height:0!important;pointer-events:none!important;';
    document.documentElement.appendChild(host);

    this.shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = PANEL_STYLES;
    this.shadow.appendChild(style);

    const wrapper = document.createElement('div');
    wrapper.innerHTML = buildPanelHTML();
    this.shadow.appendChild(wrapper);

    this.hlEl = this.$('hl');
    this.hlDim = this.$('hld');
    this.tipEl = this.$('tip');
    this.panelEl = this.$('pnl');
  }

  // ── Scanning ──

  scan(): void {
    this.elements = [];
    const seen = new Set<Element>();

    document.querySelectorAll(INTERACTIVE_SELECTOR).forEach((el) => {
      if (el.closest(`#${HOST_ID}`) || seen.has(el)) return;
      seen.add(el);
      this.elements.push(this.buildElementInfo(el));
    });

    this.updateStats();
    this.renderTree();
    if (this.badgesVisible) this.showBadges();
  }

  private buildElementInfo(el: Element): ElementInfo {
    const tag = el.tagName.toLowerCase();
    const tid = el.getAttribute('data-testid');
    const rawClass = el.className;
    const cn = rawClass && typeof rawClass === 'string'
      ? '.' + rawClass.trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.')
      : '';
    return {
      el,
      tag,
      tid,
      has: !!tid,
      cn,
      id: el.id ? `#${el.id}` : '',
      tx: (el.textContent || '').trim().slice(0, 50),
      ty: el.getAttribute('type') || '',
    };
  }

  private updateStats(): void {
    const withId = this.elements.filter((e) => e.has).length;
    const total = this.elements.length;
    this.$('sOk').textContent = String(withId);
    this.$('sNo').textContent = String(total - withId);
    this.$('sPct').textContent = total ? `${Math.round((withId / total) * 100)}%` : '0%';
    this.$('fCn').textContent = String(total);
  }

  // ── Tree ──

  private getFiltered(): ElementInfo[] {
    const q = this.searchQuery.toLowerCase();
    if (!q) return this.elements;
    return this.elements.filter((e) =>
      e.tag.includes(q) ||
      (e.tid && e.tid.toLowerCase().includes(q)) ||
      e.tx.toLowerCase().includes(q) ||
      e.cn.toLowerCase().includes(q),
    );
  }

  private renderTree(): void {
    const filtered = this.getFiltered();
    this.$('tCn').textContent = String(filtered.length);

    if (!filtered.length) {
      this.$('tL').innerHTML = '<div class="emp"><p>沒有符合的元素</p></div>';
      return;
    }

    const rows = filtered.map((it, i) => {
      const isSelected = this.selected === it ? ' s' : '';
      const icon = it.has ? 'ok' : 'no';
      const symbol = it.has ? '✓' : '✗';
      const testIdLabel = it.tid ? `<span class="tv">${it.tid}</span>` : '';
      const textLabel = it.tx && !it.tid ? `<span class="tx">"${it.tx}"</span>` : '';
      const indent = Math.min(this.getDepth(it.el), 8) * 10;

      return (
        `<div class="ti${isSelected}" data-i="${i}">` +
        `<span class="ti-sp" style="width:${indent}px"></span>` +
        `<span class="ti-ic ${icon}">${symbol}</span>` +
        `<span class="tn">&lt;${it.tag}&gt;</span>` +
        `${testIdLabel}${textLabel}</div>`
      );
    });

    this.$('tL').innerHTML = rows.join('');
  }

  /** Walk up from el to body to determine nesting depth (capped at 20) */
  private getDepth(el: Element): number {
    let depth = 0;
    let node: Element | null = el;
    while (node && node !== document.body && depth < 20) {
      node = node.parentElement;
      depth++;
    }
    return depth;
  }

  // ── Inspect mode ──

  toggleInspect(): void {
    this.inspecting = !this.inspecting;
    this.$('aI').classList.toggle('on', this.inspecting);

    if (this.inspecting) {
      document.addEventListener('mousemove', this.onMouseMove, true);
      document.addEventListener('click', this.onClick, true);
      document.body.style.cursor = 'crosshair';
    } else {
      document.removeEventListener('mousemove', this.onMouseMove, true);
      document.removeEventListener('click', this.onClick, true);
      document.body.style.cursor = '';
      this.hlEl.style.display = 'none';
      this.tipEl.style.display = 'none';
    }
  }

  private onMouseMove = (e: MouseEvent): void => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el.closest(`#${HOST_ID}`)) {
      this.hlEl.style.display = 'none';
      this.tipEl.style.display = 'none';
      return;
    }

    const rect = el.getBoundingClientRect();
    const tid = el.getAttribute('data-testid');
    const hasId = !!tid;

    // Position highlight
    this.positionHighlight(rect, hasId ? 'has' : (el.matches(INTERACTIVE_SELECTOR) ? 'miss' : 'neut'));

    // Position tooltip
    const tag = el.tagName.toLowerCase();
    this.tipEl.style.display = 'block';
    this.tipEl.style.left = `${Math.min(e.clientX + 14, window.innerWidth - 420)}px`;
    this.tipEl.style.top = `${Math.min(e.clientY + 20, window.innerHeight - 36)}px`;
    this.tipEl.innerHTML = hasId
      ? `<span class="t">&lt;${tag}&gt;</span> <span class="g">data-testid="${tid}"</span>`
      : `<span class="t">&lt;${tag}&gt;</span> <span class="r">✗ 無 data-testid</span>`;
  };

  private onClick = (e: MouseEvent): void => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el.closest(`#${HOST_ID}`)) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const found =
      this.elements.find((x) => x.el === el) ||
      this.elements.find((x) => x.el.contains(el)) ||
      this.buildElementInfo(el);

    this.selectElement(found);
  };

  // ── Element selection (detail panel) ──

  private selectElement(info: ElementInfo): void {
    this.selected = info;

    this.$('iTag').textContent = `<${info.tag}>${info.id}${info.cn}`;
    this.$('iEmp').style.display = 'none';
    this.$('iDet').style.display = 'block';

    // Badge: has / missing
    this.$('iBdg').innerHTML = info.has
      ? `<div class="bdg ok">✓ ${info.tid}</div>`
      : '<div class="bdg no">✗ 未設定 data-testid</div>';

    // Playwright selector
    const selector = buildPlaywrightSelector(info);
    const selEl = this.$('iSel');
    selEl.innerHTML = `${highlightSelector(selector)}<span class="cp">複製</span>`;
    selEl.setAttribute('data-r', selector);

    // Attributes
    const attrs: string[] = [];
    for (const attr of DISPLAY_ATTRIBUTES) {
      const value = info.el.getAttribute(attr);
      if (value) {
        attrs.push(`<span class="ak">${attr}</span>=<span class="av">"${value.slice(0, 80)}"</span>`);
      }
    }
    this.$('iAt').innerHTML = attrs.length
      ? attrs.join('<br>')
      : '<span style="color:#55556a">無額外屬性</span>';

    // Flash highlight and scroll into view
    this.flashHighlight(info.el, info.has);
    info.el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (this.minimized) this.toggleMinimize();
    this.renderTree();
  }

  // ── Highlight helpers ──

  private positionHighlight(rect: DOMRect, cls: 'has' | 'miss' | 'neut'): void {
    this.hlEl.style.display = 'block';
    this.hlEl.style.left = `${rect.left}px`;
    this.hlEl.style.top = `${rect.top}px`;
    this.hlEl.style.width = `${rect.width}px`;
    this.hlEl.style.height = `${rect.height}px`;
    this.hlEl.className = `hl ${cls}`;
    this.hlDim.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
  }

  private flashHighlight(el: Element, hasTestId: boolean): void {
    const rect = el.getBoundingClientRect();
    this.positionHighlight(rect, hasTestId ? 'has' : 'miss');
    if (!this.inspecting) {
      setTimeout(() => { this.hlEl.style.display = 'none'; }, 2000);
    }
  }

  // ── Badges ──

  toggleBadges(): void {
    this.badgesVisible = !this.badgesVisible;
    this.$('aB').classList.toggle('on', this.badgesVisible);
    this.badgesVisible ? this.showBadges() : this.clearBadges();
  }

  private showBadges(): void {
    this.clearBadges();
    for (const info of this.elements) {
      const rect = info.el.getBoundingClientRect();
      const badge = document.createElement('div');
      badge.className = '__tid_b';
      badge.style.cssText =
        `position:fixed;z-index:2147483639;pointer-events:none;` +
        `font:700 9px/1 "SF Mono",Menlo,Consolas,monospace;` +
        `padding:2px 7px;border-radius:3px;white-space:nowrap;` +
        `left:${rect.left}px;top:${Math.max(0, rect.top - 18)}px;` +
        `animation:__tb .15s ease-out;`;
      badge.style.background = info.has ? '#22c55e' : '#ef4444';
      badge.style.color = info.has ? '#000' : '#fff';
      badge.textContent = info.has ? info.tid! : '✗ missing';
      document.body.appendChild(badge);
      this.badges.push(badge);
    }
    this.ensureBadgeAnimation();
  }

  private clearBadges(): void {
    for (const b of this.badges) b.remove();
    this.badges = [];
  }

  private ensureBadgeAnimation(): void {
    if (document.getElementById('__tid_bs')) return;
    const style = document.createElement('style');
    style.id = '__tid_bs';
    style.textContent =
      '@keyframes __tb{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}';
    document.head.appendChild(style);
  }

  /** Reposition badges on scroll/resize */
  repositionBadges = (): void => {
    if (this.badgesVisible) {
      this.clearBadges();
      this.showBadges();
    }
  };

  // ── Panel controls ──

  toggleMinimize(): void {
    this.minimized = !this.minimized;
    this.panelEl.classList.toggle('mini', this.minimized);
  }

  togglePanel(): void {
    this.panelOpen = !this.panelOpen;
    this.panelEl.classList.toggle('show', this.panelOpen);
    this.$('fab').classList.toggle('show', !this.panelOpen);
  }

  // ── Toast ──

  private toast(message: string): void {
    const el = this.$('tst');
    el.textContent = message;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 1800);
  }

  // ── Event binding ──

  private bindHeaderActions(): void {
    const hdr = this.$('hdr');

    this.$('aI').addEventListener('click', () => this.toggleInspect());
    this.$('aB').addEventListener('click', () => this.toggleBadges());
    this.$('aM').addEventListener('click', () => this.toggleMinimize());
    this.$('aC').addEventListener('click', () => this.togglePanel());
    this.$('fab').addEventListener('click', () => this.togglePanel());

    // Copy selector
    this.$('iSel').addEventListener('click', () => {
      const raw = this.$('iSel').getAttribute('data-r');
      if (raw) {
        navigator.clipboard.writeText(raw).then(() => this.toast('已複製選取器'));
      }
    });

    // Drag
    this.bindDrag(hdr);
  }

  private bindDrag(hdr: HTMLElement): void {
    let dragging = false;
    const offset = { x: 0, y: 0 };

    hdr.addEventListener('mousedown', (e) => {
      if ((e.target as Element).closest('.ab') || (e.target as Element).closest('.acts')) return;
      dragging = true;
      const rect = this.panelEl.getBoundingClientRect();
      offset.x = e.clientX - rect.left;
      offset.y = e.clientY - rect.top;

      const onMove = (ev: MouseEvent) => {
        if (!dragging) return;
        this.panelEl.style.left = `${ev.clientX - offset.x}px`;
        this.panelEl.style.top = `${ev.clientY - offset.y}px`;
        this.panelEl.style.bottom = 'auto';
      };
      const onUp = () => {
        dragging = false;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  private bindTreeEvents(): void {
    // Search
    this.$('tIn').addEventListener('input', (e) => {
      this.searchQuery = (e.target as HTMLInputElement).value;
      this.renderTree();
    });

    // Click on tree item
    this.$('tL').addEventListener('click', (e) => {
      const row = (e.target as Element).closest('.ti') as HTMLElement | null;
      if (!row) return;
      const info = this.getFiltered()[+row.dataset.i!];
      if (info) this.selectElement(info);
    });

    // Hover on tree item → highlight element
    this.$('tL').addEventListener('mouseover', (e) => {
      const row = (e.target as Element).closest('.ti') as HTMLElement | null;
      if (!row) return;
      const info = this.getFiltered()[+row.dataset.i!];
      if (!info) return;
      const rect = info.el.getBoundingClientRect();
      this.positionHighlight(rect, info.has ? 'has' : 'miss');
    });

    this.$('tL').addEventListener('mouseleave', () => {
      if (!this.inspecting) this.hlEl.style.display = 'none';
    });
  }

  private bindFooter(): void {
    this.$('fTg').addEventListener('click', () => {
      const toggle = this.$('fTg');
      toggle.classList.toggle('on');
      if (toggle.classList.contains('on')) this.scan();
    });
  }

  private bindKeyboard(): void {
    document.addEventListener('keydown', (e) => {
      const tag = (e.target as Element).tagName;
      if (['INPUT', 'TEXTAREA'].includes(tag) || (e.target as HTMLElement).isContentEditable) return;

      if (e.key === 'i' && !e.ctrlKey && !e.metaKey) this.toggleInspect();
      if (e.key === 'b' && !e.ctrlKey && !e.metaKey) this.toggleBadges();
      if (e.key === 't' && !e.ctrlKey && !e.metaKey) this.togglePanel();
      if (e.key === 'Escape') {
        if (this.inspecting) this.toggleInspect();
        else if (this.panelOpen) this.togglePanel();
      }
    });
  }

  private observeMutations(): void {
    const observer = new MutationObserver(() => {
      clearTimeout(this.scanTimer);
      this.scanTimer = window.setTimeout(() => this.scan(), SCAN_DEBOUNCE_MS);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('scroll', this.repositionBadges, true);
    window.addEventListener('resize', this.repositionBadges);
  }

  // ── Public API ──

  getElements(): ElementInfo[] {
    return this.elements;
  }

  getStats(): ScannerStats {
    const withId = this.elements.filter((e) => e.has).length;
    const total = this.elements.length;
    return {
      total,
      withTestId: withId,
      missing: total - withId,
      coverage: total ? `${Math.round((withId / total) * 100)}%` : '0%',
    };
  }

  exportJSON(): string {
    const payload: ExportPayload = {
      url: location.href,
      timestamp: new Date().toISOString(),
      total: this.elements.length,
      elements: this.elements.map((e) => ({
        tag: e.tag,
        testId: e.tid ?? null,
        text: e.tx,
        selector: buildPlaywrightSelector(e),
      })),
    };
    return JSON.stringify(payload, null, 2);
  }

  // ── Helpers ──

  /** Shorthand to query by ID inside the shadow root */
  private $(id: string): HTMLElement {
    return this.shadow.getElementById(id) as HTMLElement;
  }
}
