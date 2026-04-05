import {
  ICON_CURSOR, ICON_GRID, ICON_CLOSE,
  ICON_MINIMIZE, ICON_SEARCH, ICON_POINTER,
} from './icons';

/** Build the full panel HTML (injected into Shadow DOM) */
export function buildPanelHTML(): string {
  return `
<div class="hl" id="hl"><div class="hl-dim" id="hld"></div></div>
<div class="tip" id="tip"></div>

<div class="panel" id="pnl">
  <div class="hdr" id="hdr">
    <div class="logo"><span class="dot"></span>TestID Scanner</div>
    <div class="stats">
      <div class="st"><span class="d g"></span><span class="n" id="sOk">0</span><span class="l"> 有</span></div>
      <div class="st"><span class="d r"></span><span class="n" id="sNo">0</span><span class="l"> 缺</span></div>
      <div class="st"><span class="d a"></span><span class="n" id="sPct">0%</span></div>
    </div>
    <div class="acts">
      <button class="ab" id="aI" title="點選檢查 (I)">${ICON_CURSOR}</button>
      <button class="ab" id="aB" title="顯示標籤 (B)">${ICON_GRID}</button>
      <button class="ab" id="aM" title="最小化">${ICON_MINIMIZE}</button>
      <button class="ab" id="aC" title="關閉">${ICON_CLOSE}</button>
    </div>
  </div>

  <div class="body" id="bdy">
    <div class="info">
      <div class="info-hdr">
        <div class="info-tag" id="iTag">\u2013</div>
        <div class="info-q">此元素是否有 <em>data-testid</em>？</div>
      </div>
      <div class="info-body" id="iBody">
        <div class="emp" id="iEmp">
          ${ICON_POINTER}
          <h4>點擊頁面上的元素</h4>
          <p>按 <b>I</b> 啟用檢查模式<br>hover 高亮，點擊查看詳情</p>
        </div>
        <div id="iDet" style="display:none">
          <div class="row"><div class="rl">DATA-TESTID</div><div id="iBdg"></div></div>
          <div class="row"><div class="rl">PLAYWRIGHT 選取器</div><div class="sel" id="iSel"><span class="cp">複製</span></div></div>
          <div class="row"><div class="rl">屬性</div><div class="at" id="iAt"></div></div>
        </div>
      </div>
    </div>

    <div class="tree">
      <div class="tree-s">
        ${ICON_SEARCH}
        <input type="text" placeholder="搜尋 tag / testid..." id="tIn" autocomplete="off"/>
        <span class="cn" id="tCn">0</span>
      </div>
      <div class="tl" id="tL"></div>
    </div>
  </div>

  <div class="foot">
    <div class="tg"><div class="tgsw on" id="fTg"><div class="k"></div></div><span>掃描中</span></div>
    <div class="fc"><b id="fCn">0</b> 個互動元素</div>
  </div>
</div>

<div class="fab" id="fab">
  <span class="fdot"></span>TestID Scanner<span class="fh">(T)</span>
</div>

<div class="toast" id="tst"></div>
`;
}
