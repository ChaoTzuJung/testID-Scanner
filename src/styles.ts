/**
 * All CSS rules for the scanner UI (injected into Shadow DOM).
 * Colours are hardcoded because Shadow DOM cannot inherit :root vars from the host page.
 */
export const PANEL_STYLES = /* css */ `
:host { all: initial !important }
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0 }

/* ── Highlight overlay ── */
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

/* ── Tooltip ── */
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

/* ── Panel (main container) ── */
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

/* ── Header (draggable) ── */
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

/* ── Body (two-column layout) ── */
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

/* ── Footer ── */
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

/* ── Empty state ── */
.emp     { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 14px; text-align: center; height: 100%; color: #55556a }
.emp svg { width: 32px; height: 32px; margin-bottom: 10px }
.emp h4  { font-size: 12px; color: #8e8ea0; margin-bottom: 4px; font-weight: 600 }
.emp p   { font-size: 10px; line-height: 1.6 }
.emp b   { color: #8e8ea0 }

/* ── FAB (reopen button when panel is closed) ── */
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

/* ── Toast ── */
.toast {
  position: fixed; bottom: 420px; left: 16px;
  background: #0d0d11; border: 1px solid #2c2c35; border-radius: 8px;
  padding: 7px 16px; font: 11px "SF Mono",Menlo,Consolas,monospace; color: #e2e2e8;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  pointer-events: none; opacity: 0; transform: translateY(6px); transition: all .2s;
}
.toast.show { opacity: 1; transform: translateY(0) }
`;
