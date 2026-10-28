<div align="center">

[English](README_en.md) · [简体中文](README_zh.md) · **繁體中文** · [日本語](README_ja.md) · [한국어](README_ko.md) · [Türkçe](README_tr.md) · [Русский](README_ru.md) · [Tiếng Việt](README_vi.md) · [ไทย](README_th.md) · [Deutsch](README_de.md) · [Español](README_es.md) · [Français](../../README.md) · [Українська](README_uk.md) · [Polski](README_pl.md) · [Português (Brasil)](README_pt-BR.md) · [العربية](README_ar.md) · [فارسی](README_fa.md) · [Bahasa Indonesia](README_id.md) · [Italiano](README_it.md)
· [Ελληνικά](README_el.md) · [മലയാളം](README_ml.md) · [Roman Urdu](README_ur-Latn.md) · [Română](README_ro.md)

</div>

# Mythos —— 本機辦公套件，免伺服器同步

![首頁](../../docs/screenshots/home.png)

| 文書 | 試算表 | 簡報 |
|---|---|---|
| ![](../../docs/screenshots/writer.png) | ![](../../docs/screenshots/sheet.png) | ![](../../docs/screenshots/slides.png) |

| 設定 | 深色模式 |
|---|---|
| ![](../../docs/screenshots/settings.png) | ![](../../docs/screenshots/home-dark.png) |

**以 4 位數代碼同步**：在一台裝置上選擇*同步 → 顯示代碼*，在另一台上選擇*輸入代碼*。代碼只用來在中繼站（ntfy.sh，可在設定中更改）上找到彼此，邀請內容在中繼站上是加密的。之後，你的文件會直接從一台裝置傳到另一台裝置。

文書處理、試算表和簡報整合在同一個應用程式中，支援 **Windows、Linux 和 Android**。
檔案留在你自己的裝置上；同步直接在裝置之間進行。

## 安裝

| 系統 | 檔案 | 位置 |
|---|---|---|
| Windows | `Mythos-Setup-1.1.0.exe`（安裝程式）或 `Mythos-Portable-1.1.0.exe` | `release/` |
| Linux | `Mythos-1.1.0-x64.tar.gz`（解壓縮後執行 `./mythos`）；AppImage 需在 Linux 上以 `npm run dist:linux` 編譯 | `release/` |
| Android | `app-debug.apk` | `android/app/build/outputs/apk/debug/` |

這些檔案未經簽署：Windows SmartScreen 會要求點選「其他資訊 → 仍要執行」，
Android 則會要求允許安裝不明來源的應用程式。

## 重新編譯

```sh
npm install
npm run dev          # 開發用的瀏覽器版本（http://localhost:5173）
npm start            # 桌面應用程式
npm run dist:win     # Windows 安裝程式 → release/
npm run dist:linux   # AppImage + tar.gz → release/（最好在 Linux 上執行）
npm run android      # 將網站複製到 android/，然後：
cd android && gradlew assembleDebug   # JAVA_HOME = JDK 21
```

## 免伺服器同步

每份文件都是儲存在 IndexedDB 中的 **Yjs CRDT**。兩台裝置離線修改同一份文件後，
會自動合併各自的變更，不會衝突，也不是「最後儲存的版本勝出」。

連結裝置的三種方式（**同步**面板）：

1. **直接配對（WebRTC）**：裝置 A 顯示邀請 QR 碼，B 掃描（或貼上代碼）
   後顯示回覆 QR 碼，再由 A 掃描。之後連線即為端對端加密（DTLS），
   即時同步。在本機 Wi-Fi 中不使用任何伺服器；「透過網際網路」選項只使用公開的 STUN 伺服器
   來找出公開位址（不會有任何資料經過它）。每次開啟應用程式都需要重新配對。
2. **共用資料夾**（Windows / Linux）：選擇一個由 Syncthing 同步的資料夾、隨身碟或網路共用。
   每台裝置在其中寫入自己的 `mythos-<id>.mythos` 檔案，並每 5 秒讀取其他裝置的檔案。
3. **`.mythos` 檔案**：手動匯出/匯入整個工作區（電子郵件、隨身碟……）。匯入時會合併，不會覆寫任何內容。

裝置之間會轉送變更：如果 A 連到 B，B 連到 C，那麼 A 的變更也會傳到 C。

## 支援的格式

| | 匯入 | 匯出 |
|---|---|---|
| 文書 | .docx, .html, .txt, .md | .docx, PDF（列印） |
| 試算表 | .xlsx, .xls, .ods, .csv | .xlsx, .csv |
| 簡報 | .pptx | .pptx, PDF（列印） |

引導本專案設計的 Word、Excel 和 PowerPoint 運作分析請見 [docs/ANALYSE.md](../../docs/ANALYSE.md)（法文）。

## 結構

```
src/main.js            首頁、路由、檔案匯入
src/store.js           本機儲存（Y.Doc + IndexedDB）、文件庫
src/sync/              同步協定、WebRTC、共用資料夾、介面
src/apps/writer.js     文書處理（ProseMirror/Tiptap）
src/apps/sheet.js      試算表（canvas 格線）
src/apps/formula.js    公式引擎
src/apps/slides.js     簡報
src/io/                docx / xlsx / pptx 轉換
electron/              桌面應用程式（Windows、Linux）
android/               Android 專案（Capacitor）
```

## 已知限制

- 文書：沒有追蹤修訂、註解、頁首/頁尾，螢幕上也沒有真正的分頁
  （列印時和 .docx 中會保留分頁符號）。
- 試算表：沒有圖表、合併儲存格、設定格式化的條件和樞紐分析表；
  匯入 .xlsx 時會保留數值、公式、欄寬和粗體，但不會保留所有樣式。
- 簡報：每個文字方塊只能有一種樣式（無法逐字設定格式），沒有動畫；
  匯入 .pptx 時會保留文字、圖形、圖片、顏色和備忘稿，但不包括母片和佈景主題。
- 每次啟動都必須重新進行直接配對（沒有伺服器可以找到裝置）。
