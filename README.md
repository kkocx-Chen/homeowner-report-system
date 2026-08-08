# 屋主回報系統

提供屋主查看房屋銷售狀況，並讓專員透過 Admin 後台更新：

- 賞屋人數與四週趨勢
- 周遭行情、價格區間與相似成交
- 專員個人分析與本期建議
- 591 瀏覽次數（由 Admin 手動同步，無爬蟲）

## 本機啟動

需求：Node.js 22 以上。

```bash
npm install
cp .env.example .env.local
npm run dev
```

屋主頁：`http://localhost:3000/`<br>
管理頁：`http://localhost:3000/admin`

開發環境未設定 `.env.local` 時，管理密碼預設為 `demo1234`。正式上線不會啟用預設密碼。

## 寶塔面板 + Nginx 上架

目前正式站使用 Debian 12、1 核心、2 GB RAM、40 GB SSD。若在主機上執行建置，建議保留足夠 swap 或以較低記憶體上限執行建置。

### 1. 安裝環境

在寶塔面板的軟體商店安裝：

- Nginx
- Node.js 版本管理器，並安裝 Node.js 22

目前正式站以 systemd 的 `report-kkocx` 服務管理 Node.js，不使用 PM2。

### 2. 上傳網站

把專案放到：

```text
/www/wwwroot/report.kkocx.com
```

在網站根目錄新增 `.env.production`：

```env
ADMIN_PASSWORD=請填入至少12碼的強密碼
SESSION_SECRET=請填入至少32碼的隨機字串
ADMIN_AUTH_DISABLED=false
```

請勿把 `.env.production` 公開或提交到版本庫。
調整期若要暫停後台驗證，可將 `ADMIN_AUTH_DISABLED` 設為 `true`；正式上線前應改回 `false`。

### 3. 安裝與建置

在寶塔終端機進入網站目錄後執行：

```bash
pnpm install
NODE_OPTIONS=--max-old-space-size=768 pnpm run build
sudo chown -R www:www .next
sudo systemctl restart report-kkocx
```

正式服務會以 Node.js 22 在 `127.0.0.1:3100` 運行，Nginx 反向代理後由網域提供 HTTPS 連線。可用 `sudo systemctl status report-kkocx` 檢查狀態。

### 4. 設定 Nginx

在寶塔新增網站並綁定網域，再加入反向代理：

- 代理名稱：`homeowner-report`
- 目標 URL：`http://127.0.0.1:3100`
- 傳送網域：`$host`

可直接參考 `deploy/nginx.conf.example`。防火牆只需要開放 80、443 與 SSH 管理埠，不需要開放 3100。

### 5. 網域與 HTTPS

將網域 A 記錄指向 VPS IPv4，等待 DNS 生效後，在寶塔網站的 SSL 頁面申請 Let's Encrypt 憑證，並開啟強制 HTTPS。

### 6. 備份

所有 Admin 更新內容都保存在：

```text
/www/wwwroot/report.kkocx.com/data/report.json
```

請在寶塔排程中每天備份這個檔案。部署時使用單一 Node 行程（PM2 `instances: 1`），避免多行程同時寫入同一份資料。

## 更新版本

上傳新版程式碼後執行：

```bash
pnpm install
NODE_OPTIONS=--max-old-space-size=768 pnpm run build
sudo chown -R www:www .next
sudo systemctl restart report-kkocx
```

更新前請先備份 `data/report.json`，且不要用空白檔覆蓋它。

## Git 與 GitHub 版本管理

此專案採用「程式碼與即時資料分開」的方式管理：GitHub 保存程式碼、文件與設定範本；正式站的即時資料則保留在 VPS 與 Dropbox 備份。這可避免日後部署時覆蓋屋主資料、買方資訊、公告照片或正式環境密碼。

不會提交到 GitHub 的內容包括：

- `data/report.json` 與 `data/uploads/`：後台實際輸入的內容與公告圖片。
- `.env.production`、`.env.local`：管理密碼與 Session Secret。
- `releases/`、`backups/`：舊版封包與備份檔。

每次功能更新的流程：

1. 在本機完成修改與檢查。
2. 更新 `CHANGELOG.md` 的 `Unreleased` 區塊。
3. 建立清楚的 Git commit，例如 `feat: 新增公告彈窗`。
4. 推送到 VPS Git 中繼；它會使用專屬 SSH deploy key 自動同步到私有 GitHub repository。
5. 只有確認要上線時，才在 VPS 執行部署、建置與重啟服務。

本機已設定名為 `vps` 的 Git remote；完成一項更新後，使用：

```bash
git push vps main --tags
```

單純 Git 推送不會影響 `report.kkocx.com`；網站部署會是另一個明確執行的步驟。VPS 的 Git 中繼位於 `/www/git/homeowner-report-system.git`，不在正式網站目錄內。
