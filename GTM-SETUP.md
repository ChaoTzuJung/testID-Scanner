# TestID Scanner — GTM 設定指南

## 1. 透過 GitHub + jsDelivr 託管

把 `testid-scanner.js` 放進你的 GitHub repo，就能透過 jsDelivr CDN 免費存取，不需要額外設定。

### Repo 結構

```
testID-Scanner/
├── dist/
│   ├── testid-scanner.js    ← 主程式
│   └── gtm-tag.html         ← GTM Custom HTML（完整內嵌版）
├── demo/
│   └── index.html            ← 示範頁面
├── GTM-SETUP.md              ← 本文件
└── README.md
```

### CDN 網址格式

推上 GitHub 後，jsDelivr 會自動產生 CDN 連結：

```
# 指定 branch（永遠拿最新）
https://cdn.jsdelivr.net/gh/<USER>/<REPO>@main/dist/testid-scanner.js

# 指定 tag 版本（穩定，有快取）
https://cdn.jsdelivr.net/gh/<USER>/<REPO>@v1.0.0/dist/testid-scanner.js

# 範例
https://cdn.jsdelivr.net/gh/AcmeCorp/testid-scanner@main/dist/testid-scanner.js
```

> **建議**：開發階段用 `@main`（即時更新），穩定後打 git tag 用 `@v1.x` 版本鎖定。

### 在任意頁面使用

```html
<script src="https://cdn.jsdelivr.net/gh/<USER>/<REPO>@main/dist/testid-scanner.js"></script>
```

---

## 2. GTM 設定步驟

### Step 1：建立觸發條件（Trigger）

進入 GTM → **觸發條件** → **新增**

因為你要「由 GTM 的觸發條件控制」，以下是三種常見做法，選一個最適合的：

#### 方案 A：用 URL 參數控制（推薦）

網址加上 `?testid-scan=true` 才會啟動，最彈性。

- **觸發條件類型**：網頁瀏覽 — DOM 就緒（DOM Ready）
- **此觸發條件的啟動時機**：部分網頁瀏覽
- **條件**：`Page URL` → `包含` → `testid-scan=true`

使用時只要在網址後面加參數：
```
https://staging.yourapp.com/campaigns?testid-scan=true
```

#### 方案 B：限定特定環境 hostname

只在 staging / dev 網域啟動。

- **觸發條件類型**：網頁瀏覽 — DOM 就緒（DOM Ready）
- **條件**：`Page Hostname` → `符合規則運算式` → `^(staging|dev)\.`

#### 方案 C：用 Cookie 控制

前端工程師在 DevTools console 輸入 `document.cookie="tid_scan=1"` 後重新整理。

- 先建立 **1st Party Cookie 變數**：名稱 `tid_scan`
- **觸發條件類型**：網頁瀏覽 — DOM 就緒（DOM Ready）
- **條件**：`tid_scan (Cookie)` → `等於` → `1`

---

### Step 2：建立代碼（Tag）

進入 GTM → **代碼** → **新增**

- **代碼類型**：自訂 HTML

你有兩種選擇：

#### 選項 A：外部載入（GitHub + jsDelivr）

```html
<script>
(function() {
  if (window.__TID_SCANNER__) return;
  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/gh/<USER>/<REPO>@main/dist/testid-scanner.js';
  s.async = true;
  document.head.appendChild(s);
})();
</script>
```

#### 選項 B：直接把 source code 放在 GTM（推薦，零託管）

不需要額外託管檔案，把整段程式碼貼進 GTM 即可。

重點：使用 `<script type="text/gtmscript">` 而非普通的 `<script>`，
因為 GTM 的 Closure Compiler 只支援 ES5，
用 `text/gtmscript` 可以繞過編譯，GTM 仍會正常執行。

直接把 `dist/gtm-tag.html` 的完整內容貼進 Custom HTML 欄位即可。

> 兩種選項的比較：
>
> | | 選項 A（GitHub + jsDelivr） | 選項 B（內嵌程式碼） |
> |--|--|--|
> | 託管 | GitHub repo（免費） | 不需要 |
> | 更新 | git push 即生效 | 需要進 GTM 改 Tag |
> | 載入速度 | jsDelivr CDN，全球快取 | 隨 GTM 一起載入 |
> | 容器大小 | 不影響 GTM 容器 | GTM 容器增加 ~26KB |
> | 推薦情境 | 推薦！版控清楚、更新方便 | 不想建 repo 時的備案 |

- **觸發條件**：選擇 Step 1 建立的觸發條件
- **進階設定 → 代碼觸發選項**：每個網頁一次（Once per page）

---

### Step 3：預覽 & 發佈

1. 點擊 GTM 右上角 **預覽**
2. 輸入你的 staging 網址（記得加 `?testid-scan=true`）
3. 確認 Tag 有被觸發（Tag Assistant 面板會顯示 "Fired"）
4. 確認頁面左下角出現 TestID Scanner 面板
5. 測試完成後回 GTM 點 **提交**（Submit）發佈

---

## 3. 安全考量

### 確保只在非 production 環境啟動

在 Tag 的 HTML 裡加一層保護：

```html
<script>
(function() {
  if (window.__TID_SCANNER__) return;

  // 安全檢查：只在允許的環境執行
  var host = location.hostname;
  var allowed = [
    'localhost',
    'staging.yourapp.com',
    'dev.yourapp.com'
  ];

  // 白名單 OR 有 URL 參數才載入
  var isAllowed = allowed.some(function(h) { return host.indexOf(h) >= 0; });
  var hasParam = location.search.indexOf('testid-scan=true') >= 0;

  if (!isAllowed && !hasParam) return;

  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/gh/<USER>/<REPO>@main/dist/testid-scanner.js';
  s.async = true;
  document.head.appendChild(s);
})();
</script>
```

### CSP（Content Security Policy）

如果你的網站有 CSP header，需要允許載入外部腳本：

```
script-src 'self' https://cdn.jsdelivr.net;
```

---

## 4. 團隊使用流程

```
前端工程師想檢查 data-testid 涵蓋率
        ↓
在 staging 網址後加上 ?testid-scan=true
        ↓
GTM 觸發 → 注入 testid-scanner.js
        ↓
頁面左下角出現 Scanner 面板
        ↓
按 I 啟動檢查模式 → 點擊元素查看 testid
        ↓
按 B 顯示全部標籤 → 一眼看出哪些缺少
        ↓
右側 tree 搜尋 → 快速定位特定元素
        ↓
點擊 selector → 複製 Playwright 選取器到測試碼
```

### 快捷鍵速查

| 按鍵 | 功能 |
|------|------|
| `I` | 切換檢查模式（hover 高亮 + 點擊檢查） |
| `B` | 切換 badge 標籤（顯示所有 testid） |
| `T` | 開關面板 |
| `Esc` | 退出檢查模式 / 關閉面板 |

### JS API（在 console 使用）

```javascript
// 取得統計數據
TestIDScanner.getStats()
// → { total: 28, withTestId: 22, missing: 6, coverage: "79%" }

// 匯出 JSON 報告
copy(TestIDScanner.exportJSON())

// 手動重新掃描
TestIDScanner.scan()
```
