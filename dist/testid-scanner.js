(function () {
  'use strict';

  // TestID Scanner v1.1 — https://github.com/AcmeCorp/testid-scanner

  // src/constants.ts
  var INTERACTIVE_SELECTOR = [
    "a[href]",
    "a[onclick]",
    "a[data-testid]",
    "button",
    "input",
    "select",
    "textarea",
    '[role="button"]',
    '[role="link"]',
    '[role="tab"]',
    '[role="checkbox"]',
    '[role="radio"]',
    '[role="menuitem"]',
    '[role="switch"]',
    '[role="option"]',
    '[role="combobox"]',
    "[onclick]",
    "[data-testid]"
  ].join(",");
  var DISPLAY_ATTRIBUTES = [
    "id",
    "class",
    "type",
    "role",
    "name",
    "placeholder",
    "href",
    "aria-label",
    "value"
  ];
  var HOST_ID = "__tid_host";
  var SCAN_DEBOUNCE_MS = 800;

  // src/styles.ts
  var PANEL_STYLES = (
    /* css */
    `
:host { all: initial !important }
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0 }

/* \u2500\u2500 Highlight overlay \u2500\u2500 */
.hl {
  position: fixed; pointer-events: none; z-index: 2147483641;
  border-radius: 3px; transition: all 50ms ease-out; display: none;
}
.hl.has  { border: 2px solid #22c55e; background: rgba(34,197,94,0.06) }
.hl.miss { border: 2px solid #ef4444; background: rgba(239,68,68,0.05) }
.hl.neut { border: 2px solid #6366f1; background: rgba(99,102,241,0.05) }
.hl-dim {
  position: absolute; bottom: -19px; left: 50%; transform: translateX(-50%);
  font: 10px/1 "SF Mono",Menlo,Consolas,monospace;
  color: #55556a; background: #0d0d11; border: 1px solid #2c2c35;
  border-radius: 3px; padding: 2px 6px; white-space: nowrap;
}

/* \u2500\u2500 Tooltip \u2500\u2500 */
.tip {
  position: fixed; pointer-events: none; z-index: 2147483643; display: none;
  font: 11px/1.4 "SF Mono",Menlo,Consolas,monospace;
  background: #0d0d11; border: 1px solid #2c2c35; border-radius: 6px;
  padding: 6px 10px; color: #e2e2e8; box-shadow: 0 8px 30px rgba(0,0,0,0.6);
  white-space: nowrap; max-width: 460px; overflow: hidden; text-overflow: ellipsis;
}
.tip .t { color: #6366f1; font-weight: 600 }
.tip .g { color: #22c55e }
.tip .r { color: #ef4444 }

/* \u2500\u2500 Panel (main container) \u2500\u2500 */
.panel {
  position: fixed; bottom: 16px; left: 16px; width: 660px; height: 390px;
  background: #0d0d11; border: 1px solid #2c2c35; border-radius: 12px;
  pointer-events: auto; overflow: hidden;
  box-shadow: 0 24px 64px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.04);
  display: flex; flex-direction: column;
  font: 12px/1.5 "SF Mono",Menlo,Consolas,monospace; color: #e2e2e8;
  opacity: 0; transform: translateY(14px) scale(0.97);
  transition: opacity .2s, transform .2s;
}
.panel.show { opacity: 1; transform: translateY(0) scale(1) }
.panel.mini { height: auto !important; width: auto !important; min-width: 240px }
.panel.mini .body, .panel.mini .foot { display: none !important }

/* \u2500\u2500 Header (draggable) \u2500\u2500 */
.hdr {
  display: flex; align-items: center; gap: 10px; padding: 9px 14px;
  background: #151519; border-bottom: 1px solid #2c2c35;
  cursor: move; user-select: none; flex-shrink: 0; min-height: 44px;
}
.logo {
  font: 700 12px/1 "SF Mono",Menlo,Consolas,monospace; letter-spacing: -0.3px;
  display: flex; align-items: center; gap: 7px; white-space: nowrap; color: #e2e2e8;
}
.logo .dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #22c55e; box-shadow: 0 0 8px rgba(34,197,94,0.35);
  animation: _pulse 2s ease-in-out infinite;
}
@keyframes _pulse { 0%, 100% { opacity: 1 } 50% { opacity: .45 } }

/* Stats row */
.stats { display: flex; gap: 14px; margin-left: 10px; font-size: 11px }
.st { display: flex; align-items: center; gap: 5px; color: #e2e2e8 }
.st .d { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0 }
.st .d.g { background: #22c55e }
.st .d.r { background: #ef4444 }
.st .d.a { background: #f59e0b }
.st .n { font-weight: 700 }
.st .l { color: #55556a }

/* Action buttons */
.acts { margin-left: auto; display: flex; gap: 3px }
.ab {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  border: 1px solid #2c2c35; border-radius: 6px; background: #1c1c22;
  color: #8e8ea0; cursor: pointer; transition: all .12s; flex-shrink: 0;
}
.ab:hover { background: #2c2c35; color: #e2e2e8 }
.ab.on   { background: rgba(99,102,241,0.14); border-color: #6366f1; color: #6366f1 }
.ab svg  { width: 14px; height: 14px; pointer-events: none }

/* \u2500\u2500 Body (two-column layout) \u2500\u2500 */
.body { display: flex; flex: 1; min-height: 0; overflow: hidden }

/* Left: element info */
.info { width: 260px; flex-shrink: 0; border-right: 1px solid #2c2c35; display: flex; flex-direction: column; overflow: hidden; background: #0d0d11 }
.info-hdr { padding: 10px 14px; background: #151519; border-bottom: 1px solid #2c2c35; flex-shrink: 0 }
.info-tag { font-size: 13px; font-weight: 700; color: #6366f1; word-break: break-all; line-height: 1.4 }
.info-q   { font-size: 11px; color: #8e8ea0; margin-top: 3px }
.info-q em { color: #a855f7; font-style: normal; font-weight: 600 }
.info-body { flex: 1; overflow-y: auto; padding: 10px 14px; background: #0d0d11 }
.info-body::-webkit-scrollbar       { width: 3px }
.info-body::-webkit-scrollbar-thumb { background: #2c2c35; border-radius: 3px }

.row { margin-bottom: 12px }
.rl  { font-size: 9px; text-transform: uppercase; letter-spacing: .6px; color: #55556a; margin-bottom: 5px; font-weight: 700 }
.bdg { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 5px; font-size: 11px; font-weight: 600 }
.bdg.ok { background: rgba(34,197,94,0.14); color: #22c55e }
.bdg.no { background: rgba(239,68,68,0.12); color: #ef4444 }

/* Playwright selector box */
.sel {
  padding: 8px 10px; background: #08080c; border: 1px solid #2c2c35;
  border-radius: 5px; font-size: 11px; line-height: 1.5; color: #e2e2e8;
  cursor: pointer; transition: border-color .15s; position: relative; word-break: break-all;
}
.sel:hover { border-color: #6366f1 }
.sel .kw   { color: #c084fc }
.sel .str  { color: #86efac }
.sel .cp   {
  position: absolute; top: 5px; right: 7px; font-size: 9px;
  color: #55556a; background: #1c1c22; padding: 2px 6px; border-radius: 3px;
  opacity: 0; transition: opacity .12s; pointer-events: none;
}
.sel:hover .cp { opacity: 1 }

/* Attribute list */
.at    { font-size: 10px; line-height: 1.8; color: #8e8ea0 }
.at .ak { color: #f59e0b }
.at .av { color: #e2e2e8 }

/* Right: element tree */
.tree   { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; background: #0d0d11 }
.tree-s { display: flex; align-items: center; gap: 8px; padding: 7px 12px; background: #151519; border-bottom: 1px solid #2c2c35; flex-shrink: 0 }
.tree-s svg   { width: 14px; height: 14px; color: #55556a; flex-shrink: 0 }
.tree-s input { flex: 1; background: none; border: none; outline: none; color: #e2e2e8; font: 12px "SF Mono",Menlo,Consolas,monospace }
.tree-s input::placeholder { color: #55556a }
.tree-s .cn { font-size: 10px; color: #55556a; white-space: nowrap }

.tl { flex: 1; overflow-y: auto; padding: 2px 0 }
.tl::-webkit-scrollbar       { width: 3px }
.tl::-webkit-scrollbar-thumb { background: #2c2c35; border-radius: 3px }

/* Tree items */
.ti {
  display: flex; align-items: center; gap: 5px;
  padding: 4px 12px 4px 8px; cursor: pointer;
  transition: background 60ms; white-space: nowrap;
  min-height: 26px; font-size: 12px; color: #e2e2e8;
}
.ti:hover   { background: #1c1c22 }
.ti.s       { background: rgba(99,102,241,0.14) }
.ti.s .tn   { color: #6366f1 }
.ti-sp { flex-shrink: 0 }
.ti-ic {
  width: 15px; height: 15px; flex-shrink: 0; border-radius: 3px;
  display: flex; align-items: center; justify-content: center;
  font-size: 8px; font-weight: 700; line-height: 1;
}
.ti-ic.ok { background: rgba(34,197,94,0.14); color: #22c55e }
.ti-ic.no { background: rgba(239,68,68,0.12); color: #ef4444 }
.tn { font-weight: 500; color: #e2e2e8 }
.tv { font-size: 10px; color: #22c55e; margin-left: 4px; opacity: .85 }
.tx { font-size: 10px; color: #55556a; margin-left: 4px; max-width: 140px; overflow: hidden; text-overflow: ellipsis }

/* \u2500\u2500 Footer \u2500\u2500 */
.foot { display: flex; align-items: center; padding: 7px 14px; background: #151519; border-top: 1px solid #2c2c35; flex-shrink: 0; min-height: 36px }
.tg   { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #8e8ea0 }
.tgsw {
  position: relative; width: 32px; height: 18px; background: #1c1c22;
  border-radius: 10px; cursor: pointer; border: 1px solid #2c2c35; transition: all .15s;
}
.tgsw.on { background: rgba(34,197,94,0.14); border-color: #22c55e }
.tgsw .k {
  position: absolute; top: 2px; left: 2px; width: 12px; height: 12px;
  border-radius: 50%; background: #8e8ea0; transition: all .15s;
}
.tgsw.on .k { left: 16px; background: #22c55e }
.fc   { margin-left: auto; font-size: 11px; color: #55556a }
.fc b { font-weight: 700; color: #e2e2e8 }

/* \u2500\u2500 Empty state \u2500\u2500 */
.emp     { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 14px; text-align: center; height: 100%; color: #55556a }
.emp svg { width: 32px; height: 32px; margin-bottom: 10px }
.emp h4  { font-size: 12px; color: #8e8ea0; margin-bottom: 4px; font-weight: 600 }
.emp p   { font-size: 10px; line-height: 1.6 }
.emp b   { color: #8e8ea0 }

/* \u2500\u2500 FAB (reopen button when panel is closed) \u2500\u2500 */
.fab {
  position: fixed; bottom: 16px; left: 16px; pointer-events: none;
  display: flex; align-items: center; gap: 7px; padding: 8px 14px;
  background: #0d0d11; border: 1px solid #2c2c35; border-radius: 10px;
  cursor: pointer; font: 700 11px/1 "SF Mono",Menlo,Consolas,monospace; color: #e2e2e8;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  opacity: 0; transform: scale(0.9); transition: all .2s; user-select: none;
}
.fab.show  { opacity: 1; transform: scale(1); pointer-events: auto }
.fab:hover { background: #1c1c22; border-color: #3a3a45 }
.fab .fdot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 8px rgba(34,197,94,0.35); flex-shrink: 0 }
.fab .fh   { font-size: 9px; color: #55556a; font-weight: 400; margin-left: 4px }

/* \u2500\u2500 Toast \u2500\u2500 */
.toast {
  position: fixed; bottom: 420px; left: 16px;
  background: #0d0d11; border: 1px solid #2c2c35; border-radius: 8px;
  padding: 7px 16px; font: 11px "SF Mono",Menlo,Consolas,monospace; color: #e2e2e8;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  pointer-events: none; opacity: 0; transform: translateY(6px); transition: all .2s;
}
.toast.show { opacity: 1; transform: translateY(0) }
`
  );

  // src/icons.ts
  var ICON_CURSOR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>`;
  var ICON_GRID = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>`;
  var ICON_CLOSE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  var ICON_MINIMIZE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
  var ICON_SEARCH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`;
  var ICON_POINTER = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>`;

  // src/template.ts
  function buildPanelHTML() {
    return `
<div class="hl" id="hl"><div class="hl-dim" id="hld"></div></div>
<div class="tip" id="tip"></div>

<div class="panel" id="pnl">
  <div class="hdr" id="hdr">
    <div class="logo"><span class="dot"></span>TestID Scanner</div>
    <div class="stats">
      <div class="st"><span class="d g"></span><span class="n" id="sOk">0</span><span class="l"> \u6709</span></div>
      <div class="st"><span class="d r"></span><span class="n" id="sNo">0</span><span class="l"> \u7F3A</span></div>
      <div class="st"><span class="d a"></span><span class="n" id="sPct">0%</span></div>
    </div>
    <div class="acts">
      <button class="ab" id="aI" title="\u9EDE\u9078\u6AA2\u67E5 (I)">${ICON_CURSOR}</button>
      <button class="ab" id="aB" title="\u986F\u793A\u6A19\u7C64 (B)">${ICON_GRID}</button>
      <button class="ab" id="aM" title="\u6700\u5C0F\u5316">${ICON_MINIMIZE}</button>
      <button class="ab" id="aC" title="\u95DC\u9589">${ICON_CLOSE}</button>
    </div>
  </div>

  <div class="body" id="bdy">
    <div class="info">
      <div class="info-hdr">
        <div class="info-tag" id="iTag">\u2013</div>
        <div class="info-q">\u6B64\u5143\u7D20\u662F\u5426\u6709 <em>data-testid</em>\uFF1F</div>
      </div>
      <div class="info-body" id="iBody">
        <div class="emp" id="iEmp">
          ${ICON_POINTER}
          <h4>\u9EDE\u64CA\u9801\u9762\u4E0A\u7684\u5143\u7D20</h4>
          <p>\u6309 <b>I</b> \u555F\u7528\u6AA2\u67E5\u6A21\u5F0F<br>hover \u9AD8\u4EAE\uFF0C\u9EDE\u64CA\u67E5\u770B\u8A73\u60C5</p>
        </div>
        <div id="iDet" style="display:none">
          <div class="row"><div class="rl">DATA-TESTID</div><div id="iBdg"></div></div>
          <div class="row"><div class="rl">PLAYWRIGHT \u9078\u53D6\u5668</div><div class="sel" id="iSel"><span class="cp">\u8907\u88FD</span></div></div>
          <div class="row"><div class="rl">\u5C6C\u6027</div><div class="at" id="iAt"></div></div>
        </div>
      </div>
    </div>

    <div class="tree">
      <div class="tree-s">
        ${ICON_SEARCH}
        <input type="text" placeholder="\u641C\u5C0B tag / testid..." id="tIn" autocomplete="off"/>
        <span class="cn" id="tCn">0</span>
      </div>
      <div class="tl" id="tL"></div>
    </div>
  </div>

  <div class="foot">
    <div class="tg"><div class="tgsw on" id="fTg"><div class="k"></div></div><span>\u6383\u63CF\u4E2D</span></div>
    <div class="fc"><b id="fCn">0</b> \u500B\u4E92\u52D5\u5143\u7D20</div>
  </div>
</div>

<div class="fab" id="fab">
  <span class="fdot"></span>TestID Scanner<span class="fh">(T)</span>
</div>

<div class="toast" id="tst"></div>
`;
  }

  // src/selector.ts
  function buildPlaywrightSelector(info) {
    if (info.has) {
      return `page.getByTestId('${info.tid}')`;
    }
    if (info.tag === "button" && info.tx) {
      return `page.getByRole('button', { name: '${info.tx}' })`;
    }
    if (info.tag === "a" && info.tx) {
      return `page.getByRole('link', { name: '${info.tx}' })`;
    }
    if (["input", "textarea", "select"].includes(info.tag)) {
      const label = findLabel(info.el);
      if (label) return `page.getByLabel('${label}')`;
    }
    if (info.tx) {
      return `page.getByText('${info.tx}')`;
    }
    return `page.locator('${info.tag}${info.cn}')`;
  }
  function findLabel(el) {
    const htmlEl = el;
    if (htmlEl.labels?.[0]) {
      return htmlEl.labels[0].textContent?.trim() ?? null;
    }
    const FORM_WRAPPER = ".form-group, .field, [class*=form], .fi";
    const wrapper = el.closest(FORM_WRAPPER);
    const wrapperLabel = wrapper?.querySelector("label")?.textContent?.trim();
    if (wrapperLabel) return wrapperLabel;
    return el.getAttribute("placeholder") || el.getAttribute("aria-label");
  }
  function highlightSelector(selector) {
    return selector.replace(/(page\.\w+)/g, '<span class="kw">$1</span>').replace(/'([^']*)'/g, `'<span class="str">$1</span>'`);
  }

  // src/scanner.ts
  var Scanner = class {
    constructor() {
      // ── State ──
      this.elements = [];
      this.selected = null;
      this.inspecting = false;
      this.badgesVisible = false;
      this.panelOpen = true;
      this.minimized = false;
      this.searchQuery = "";
      this.badges = [];
      this.scanTimer = 0;
      this.onMouseMove = (e) => {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (!el || el.closest(`#${HOST_ID}`)) {
          this.hlEl.style.display = "none";
          this.tipEl.style.display = "none";
          return;
        }
        const rect = el.getBoundingClientRect();
        const tid = el.getAttribute("data-testid");
        const hasId = !!tid;
        this.positionHighlight(rect, hasId ? "has" : el.matches(INTERACTIVE_SELECTOR) ? "miss" : "neut");
        const tag = el.tagName.toLowerCase();
        this.tipEl.style.display = "block";
        this.tipEl.style.left = `${Math.min(e.clientX + 14, window.innerWidth - 420)}px`;
        this.tipEl.style.top = `${Math.min(e.clientY + 20, window.innerHeight - 36)}px`;
        this.tipEl.innerHTML = hasId ? `<span class="t">&lt;${tag}&gt;</span> <span class="g">data-testid="${tid}"</span>` : `<span class="t">&lt;${tag}&gt;</span> <span class="r">\u2717 \u7121 data-testid</span>`;
      };
      this.onClick = (e) => {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (!el || el.closest(`#${HOST_ID}`)) return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const found = this.elements.find((x) => x.el === el) || this.elements.find((x) => x.el.contains(el)) || this.buildElementInfo(el);
        this.selectElement(found);
      };
      /** Reposition badges on scroll/resize */
      this.repositionBadges = () => {
        if (this.badgesVisible) {
          this.clearBadges();
          this.showBadges();
        }
      };
    }
    // main panel
    // ── Setup ──
    init() {
      this.createHost();
      this.bindHeaderActions();
      this.bindTreeEvents();
      this.bindFooter();
      this.bindKeyboard();
      this.observeMutations();
      this.scan();
      requestAnimationFrame(() => {
        this.panelEl.classList.add("show");
        this.toggleInspect();
      });
    }
    /** Create the Shadow DOM host and inject styles + template */
    createHost() {
      const host = document.createElement("div");
      host.id = HOST_ID;
      host.style.cssText = "all:initial!important;position:fixed!important;z-index:2147483640!important;top:0!important;left:0!important;width:0!important;height:0!important;pointer-events:none!important;";
      document.documentElement.appendChild(host);
      this.shadow = host.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = PANEL_STYLES;
      this.shadow.appendChild(style);
      const wrapper = document.createElement("div");
      wrapper.innerHTML = buildPanelHTML();
      this.shadow.appendChild(wrapper);
      this.hlEl = this.$("hl");
      this.hlDim = this.$("hld");
      this.tipEl = this.$("tip");
      this.panelEl = this.$("pnl");
    }
    // ── Scanning ──
    scan() {
      this.elements = [];
      const seen = /* @__PURE__ */ new Set();
      document.querySelectorAll(INTERACTIVE_SELECTOR).forEach((el) => {
        if (el.closest(`#${HOST_ID}`) || seen.has(el)) return;
        seen.add(el);
        this.elements.push(this.buildElementInfo(el));
      });
      this.updateStats();
      this.renderTree();
      if (this.badgesVisible) this.showBadges();
    }
    buildElementInfo(el) {
      const tag = el.tagName.toLowerCase();
      const tid = el.getAttribute("data-testid");
      const rawClass = el.className;
      const cn = rawClass && typeof rawClass === "string" ? "." + rawClass.trim().split(/\s+/).filter(Boolean).slice(0, 2).join(".") : "";
      return {
        el,
        tag,
        tid,
        has: !!tid,
        cn,
        id: el.id ? `#${el.id}` : "",
        tx: (el.textContent || "").trim().slice(0, 50),
        ty: el.getAttribute("type") || ""
      };
    }
    updateStats() {
      const withId = this.elements.filter((e) => e.has).length;
      const total = this.elements.length;
      this.$("sOk").textContent = String(withId);
      this.$("sNo").textContent = String(total - withId);
      this.$("sPct").textContent = total ? `${Math.round(withId / total * 100)}%` : "0%";
      this.$("fCn").textContent = String(total);
    }
    // ── Tree ──
    getFiltered() {
      const q = this.searchQuery.toLowerCase();
      if (!q) return this.elements;
      return this.elements.filter(
        (e) => e.tag.includes(q) || e.tid && e.tid.toLowerCase().includes(q) || e.tx.toLowerCase().includes(q) || e.cn.toLowerCase().includes(q)
      );
    }
    renderTree() {
      const filtered = this.getFiltered();
      this.$("tCn").textContent = String(filtered.length);
      if (!filtered.length) {
        this.$("tL").innerHTML = '<div class="emp"><p>\u6C92\u6709\u7B26\u5408\u7684\u5143\u7D20</p></div>';
        return;
      }
      const rows = filtered.map((it, i) => {
        const isSelected = this.selected === it ? " s" : "";
        const icon = it.has ? "ok" : "no";
        const symbol = it.has ? "\u2713" : "\u2717";
        const testIdLabel = it.tid ? `<span class="tv">${it.tid}</span>` : "";
        const textLabel = it.tx && !it.tid ? `<span class="tx">"${it.tx}"</span>` : "";
        const indent = Math.min(this.getDepth(it.el), 8) * 10;
        return `<div class="ti${isSelected}" data-i="${i}"><span class="ti-sp" style="width:${indent}px"></span><span class="ti-ic ${icon}">${symbol}</span><span class="tn">&lt;${it.tag}&gt;</span>${testIdLabel}${textLabel}</div>`;
      });
      this.$("tL").innerHTML = rows.join("");
    }
    /** Walk up from el to body to determine nesting depth (capped at 20) */
    getDepth(el) {
      let depth = 0;
      let node = el;
      while (node && node !== document.body && depth < 20) {
        node = node.parentElement;
        depth++;
      }
      return depth;
    }
    // ── Inspect mode ──
    toggleInspect() {
      this.inspecting = !this.inspecting;
      this.$("aI").classList.toggle("on", this.inspecting);
      if (this.inspecting) {
        document.addEventListener("mousemove", this.onMouseMove, true);
        document.addEventListener("click", this.onClick, true);
        document.body.style.cursor = "crosshair";
      } else {
        document.removeEventListener("mousemove", this.onMouseMove, true);
        document.removeEventListener("click", this.onClick, true);
        document.body.style.cursor = "";
        this.hlEl.style.display = "none";
        this.tipEl.style.display = "none";
      }
    }
    // ── Element selection (detail panel) ──
    selectElement(info) {
      this.selected = info;
      this.$("iTag").textContent = `<${info.tag}>${info.id}${info.cn}`;
      this.$("iEmp").style.display = "none";
      this.$("iDet").style.display = "block";
      this.$("iBdg").innerHTML = info.has ? `<div class="bdg ok">\u2713 ${info.tid}</div>` : '<div class="bdg no">\u2717 \u672A\u8A2D\u5B9A data-testid</div>';
      const selector = buildPlaywrightSelector(info);
      const selEl = this.$("iSel");
      selEl.innerHTML = `${highlightSelector(selector)}<span class="cp">\u8907\u88FD</span>`;
      selEl.setAttribute("data-r", selector);
      const attrs = [];
      for (const attr of DISPLAY_ATTRIBUTES) {
        const value = info.el.getAttribute(attr);
        if (value) {
          attrs.push(`<span class="ak">${attr}</span>=<span class="av">"${value.slice(0, 80)}"</span>`);
        }
      }
      this.$("iAt").innerHTML = attrs.length ? attrs.join("<br>") : '<span style="color:#55556a">\u7121\u984D\u5916\u5C6C\u6027</span>';
      this.flashHighlight(info.el, info.has);
      info.el.scrollIntoView({ behavior: "smooth", block: "center" });
      if (this.minimized) this.toggleMinimize();
      this.renderTree();
    }
    // ── Highlight helpers ──
    positionHighlight(rect, cls) {
      this.hlEl.style.display = "block";
      this.hlEl.style.left = `${rect.left}px`;
      this.hlEl.style.top = `${rect.top}px`;
      this.hlEl.style.width = `${rect.width}px`;
      this.hlEl.style.height = `${rect.height}px`;
      this.hlEl.className = `hl ${cls}`;
      this.hlDim.textContent = `${Math.round(rect.width)} \xD7 ${Math.round(rect.height)}`;
    }
    flashHighlight(el, hasTestId) {
      const rect = el.getBoundingClientRect();
      this.positionHighlight(rect, hasTestId ? "has" : "miss");
      if (!this.inspecting) {
        setTimeout(() => {
          this.hlEl.style.display = "none";
        }, 2e3);
      }
    }
    // ── Badges ──
    toggleBadges() {
      this.badgesVisible = !this.badgesVisible;
      this.$("aB").classList.toggle("on", this.badgesVisible);
      this.badgesVisible ? this.showBadges() : this.clearBadges();
    }
    showBadges() {
      this.clearBadges();
      for (const info of this.elements) {
        const rect = info.el.getBoundingClientRect();
        const badge = document.createElement("div");
        badge.className = "__tid_b";
        badge.style.cssText = `position:fixed;z-index:2147483639;pointer-events:none;font:700 9px/1 "SF Mono",Menlo,Consolas,monospace;padding:2px 7px;border-radius:3px;white-space:nowrap;left:${rect.left}px;top:${Math.max(0, rect.top - 18)}px;animation:__tb .15s ease-out;`;
        badge.style.background = info.has ? "#22c55e" : "#ef4444";
        badge.style.color = info.has ? "#000" : "#fff";
        badge.textContent = info.has ? info.tid : "\u2717 missing";
        document.body.appendChild(badge);
        this.badges.push(badge);
      }
      this.ensureBadgeAnimation();
    }
    clearBadges() {
      for (const b of this.badges) b.remove();
      this.badges = [];
    }
    ensureBadgeAnimation() {
      if (document.getElementById("__tid_bs")) return;
      const style = document.createElement("style");
      style.id = "__tid_bs";
      style.textContent = "@keyframes __tb{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}";
      document.head.appendChild(style);
    }
    // ── Panel controls ──
    toggleMinimize() {
      this.minimized = !this.minimized;
      this.panelEl.classList.toggle("mini", this.minimized);
    }
    togglePanel() {
      this.panelOpen = !this.panelOpen;
      this.panelEl.classList.toggle("show", this.panelOpen);
      this.$("fab").classList.toggle("show", !this.panelOpen);
    }
    // ── Toast ──
    toast(message) {
      const el = this.$("tst");
      el.textContent = message;
      el.classList.add("show");
      setTimeout(() => el.classList.remove("show"), 1800);
    }
    // ── Event binding ──
    bindHeaderActions() {
      const hdr = this.$("hdr");
      this.$("aI").addEventListener("click", () => this.toggleInspect());
      this.$("aB").addEventListener("click", () => this.toggleBadges());
      this.$("aM").addEventListener("click", () => this.toggleMinimize());
      this.$("aC").addEventListener("click", () => this.togglePanel());
      this.$("fab").addEventListener("click", () => this.togglePanel());
      this.$("iSel").addEventListener("click", () => {
        const raw = this.$("iSel").getAttribute("data-r");
        if (raw) {
          navigator.clipboard.writeText(raw).then(() => this.toast("\u5DF2\u8907\u88FD\u9078\u53D6\u5668"));
        }
      });
      this.bindDrag(hdr);
    }
    bindDrag(hdr) {
      let dragging = false;
      const offset = { x: 0, y: 0 };
      hdr.addEventListener("mousedown", (e) => {
        if (e.target.closest(".ab") || e.target.closest(".acts")) return;
        dragging = true;
        const rect = this.panelEl.getBoundingClientRect();
        offset.x = e.clientX - rect.left;
        offset.y = e.clientY - rect.top;
        const onMove = (ev) => {
          if (!dragging) return;
          this.panelEl.style.left = `${ev.clientX - offset.x}px`;
          this.panelEl.style.top = `${ev.clientY - offset.y}px`;
          this.panelEl.style.bottom = "auto";
        };
        const onUp = () => {
          dragging = false;
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      });
    }
    bindTreeEvents() {
      this.$("tIn").addEventListener("input", (e) => {
        this.searchQuery = e.target.value;
        this.renderTree();
      });
      this.$("tL").addEventListener("click", (e) => {
        const row = e.target.closest(".ti");
        if (!row) return;
        const info = this.getFiltered()[+row.dataset.i];
        if (info) this.selectElement(info);
      });
      this.$("tL").addEventListener("mouseover", (e) => {
        const row = e.target.closest(".ti");
        if (!row) return;
        const info = this.getFiltered()[+row.dataset.i];
        if (!info) return;
        const rect = info.el.getBoundingClientRect();
        this.positionHighlight(rect, info.has ? "has" : "miss");
      });
      this.$("tL").addEventListener("mouseleave", () => {
        if (!this.inspecting) this.hlEl.style.display = "none";
      });
    }
    bindFooter() {
      this.$("fTg").addEventListener("click", () => {
        const toggle = this.$("fTg");
        toggle.classList.toggle("on");
        if (toggle.classList.contains("on")) this.scan();
      });
    }
    bindKeyboard() {
      document.addEventListener("keydown", (e) => {
        const tag = e.target.tagName;
        if (["INPUT", "TEXTAREA"].includes(tag) || e.target.isContentEditable) return;
        if (e.key === "i" && !e.ctrlKey && !e.metaKey) this.toggleInspect();
        if (e.key === "b" && !e.ctrlKey && !e.metaKey) this.toggleBadges();
        if (e.key === "t" && !e.ctrlKey && !e.metaKey) this.togglePanel();
        if (e.key === "Escape") {
          if (this.inspecting) this.toggleInspect();
          else if (this.panelOpen) this.togglePanel();
        }
      });
    }
    observeMutations() {
      const observer = new MutationObserver(() => {
        clearTimeout(this.scanTimer);
        this.scanTimer = window.setTimeout(() => this.scan(), SCAN_DEBOUNCE_MS);
      });
      observer.observe(document.body, { childList: true, subtree: true });
      window.addEventListener("scroll", this.repositionBadges, true);
      window.addEventListener("resize", this.repositionBadges);
    }
    // ── Public API ──
    getElements() {
      return this.elements;
    }
    getStats() {
      const withId = this.elements.filter((e) => e.has).length;
      const total = this.elements.length;
      return {
        total,
        withTestId: withId,
        missing: total - withId,
        coverage: total ? `${Math.round(withId / total * 100)}%` : "0%"
      };
    }
    exportJSON() {
      const payload = {
        url: location.href,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        total: this.elements.length,
        elements: this.elements.map((e) => ({
          tag: e.tag,
          testId: e.tid ?? null,
          text: e.tx,
          selector: buildPlaywrightSelector(e)
        }))
      };
      return JSON.stringify(payload, null, 2);
    }
    // ── Helpers ──
    /** Shorthand to query by ID inside the shadow root */
    $(id) {
      return this.shadow.getElementById(id);
    }
  };

  // src/index.ts
  (function() {
    if (window.__TID_SCANNER__) return;
    window.__TID_SCANNER__ = true;
    const scanner = new Scanner();
    function bootstrap() {
      scanner.init();
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", bootstrap);
    } else {
      setTimeout(bootstrap, 200);
    }
    window.TestIDScanner = {
      scan: () => scanner.scan(),
      getElements: () => scanner.getElements(),
      getStats: () => scanner.getStats(),
      exportJSON: () => scanner.exportJSON()
    };
  })();

})();
