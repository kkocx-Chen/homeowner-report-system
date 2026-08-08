# 專案維護規則

## Git 版本管理

每次完成任何程式碼、文件或設定範本的變更後：

1. 執行與變更相符的檢查。
2. 更新 `CHANGELOG.md`。
3. 建立清楚的 Git commit。
4. 執行 `git push vps main --tags`，讓 VPS 自動同步至 GitHub。

Git 推送不等於網站部署；只有使用者明確要求上線時，才能建置、重啟或改動正式服務。

## 不可提交的資料

不得提交 `data/report.json`、`data/uploads/`、任何 `.env` 檔、備份檔、SSH 私鑰、Token 或密碼。這些資料由 VPS 與 Dropbox 備份流程保護。
