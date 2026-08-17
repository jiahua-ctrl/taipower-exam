# 台電電力交易平台資格測驗｜刷題系統 v1

這是一個純前端、可部署到 GitHub Pages 的模擬考網站。

## 已有功能

- 隨機 10 題 / 20 題
- 科目一專練
- 科目二專練
- 全題模擬
- 作答後立即顯示正解與解析
- 顯示官方來源連結
- 自動計分
- 科目一 / 科目二分科正確率
- 依 40% / 60% 做加權成績參考
- localStorage 儲存答題紀錄
- 錯題本
- 答對後自動移出錯題本
- 單元弱點分析
- 深色 / 淺色模式
- 手機、平板、電腦響應式版面

## 直接測試

打開 `index.html` 就可以使用內建 30 題。

## 接上 Google 試算表

1. 將 `115台電電力交易平台_模擬題庫_v1.xlsx` 上傳 Google Drive，開成 Google 試算表。
2. 確認工作表名稱為「題庫」，第一列欄位不要更改。
3. 在 Google 試算表選擇「檔案 → 共用 → 發布到網路」。
4. 選擇「題庫」工作表，格式選 CSV，發布。
5. 複製產生的 CSV 網址。
6. 打開 `config.js`，把網址貼到：

```js
GOOGLE_SHEET_CSV_URL: "你的 CSV 網址"
```

之後題庫更新時，網站重新整理即可讀取最新內容。

## GitHub Pages 部署

1. 建立一個新的 GitHub repository，例如 `taipower-exam`。
2. 把這個資料夾內的檔案全部上傳到 repository 根目錄。
3. GitHub → Settings → Pages。
4. Build and deployment 選 `Deploy from a branch`。
5. Branch 選 `main`，資料夾選 `/(root)`。
6. 儲存後即可取得公開網站網址。

## 題庫欄位

網站會讀取以下欄位：

`id, subject, topic, level, question, option_a, option_b, option_c, option_d, answer, explanation, source_title, source_url, source_locator, is_active, tags`

`answer` 必須是 A / B / C / D。

## 備註

本網站題目為依官方資料整理的模擬題，不是正式考古題。若台電市場規則更新，請同步更新題庫。
