<div align="center">

[English](README_en.md) · [简体中文](README_zh.md) · [繁體中文](README_zh-TW.md) · **日本語** · [한국어](README_ko.md) · [Türkçe](README_tr.md) · [Русский](README_ru.md) · [Tiếng Việt](README_vi.md) · [ไทย](README_th.md) · [Deutsch](README_de.md) · [Español](README_es.md) · [Français](../../README.md) · [Українська](README_uk.md) · [Polski](README_pl.md) · [Português (Brasil)](README_pt-BR.md) · [العربية](README_ar.md) · [فارسی](README_fa.md) · [Bahasa Indonesia](README_id.md) · [Italiano](README_it.md)
· [Ελληνικά](README_el.md) · [മലയാളം](README_ml.md) · [Roman Urdu](README_ur-Latn.md) · [Română](README_ro.md)

</div>

# Mythos — ローカルのオフィススイート、サーバーなしで同期

![ホーム](../../docs/screenshots/home.png)

| 文書 | 表計算 | プレゼンテーション |
|---|---|---|
| ![](../../docs/screenshots/writer.png) | ![](../../docs/screenshots/sheet.png) | ![](../../docs/screenshots/slides.png) |

| 設定 | ダークモード |
|---|---|
| ![](../../docs/screenshots/settings.png) | ![](../../docs/screenshots/home-dark.png) |

**4 桁のコードで同期**：一方のデバイスで*同期 → コードを表示*、もう一方で*コードを入力*を選びます。コードはリレー（ntfy.sh、設定で変更可能）上でお互いを見つけるためだけに使われ、招待はそこで暗号化されています。その後、ドキュメントはデバイスからデバイスへ直接送られます。

ワープロ、表計算、プレゼンテーションを 1 つのアプリにまとめ、**Windows・Linux・Android** に対応。
ファイルはあなたのデバイスに保存され、同期はデバイス同士で直接行われます。

## インストール

| OS | ファイル | 場所 |
|---|---|---|
| Windows | `Mythos-Setup-1.1.0.exe`（インストーラー）または `Mythos-Portable-1.1.0.exe` | `release/` |
| Linux | `Mythos-1.1.0-x64.tar.gz`（展開して `./mythos` を起動）。AppImage は Linux 上で `npm run dist:linux` によりビルド | `release/` |
| Android | `app-debug.apk` | `android/app/build/outputs/apk/debug/` |

ファイルは署名されていません：Windows SmartScreen では「詳細情報 → 実行」を選ぶ必要があり、
Android では提供元不明のアプリのインストールを許可するよう求められます。

## 再ビルド

```sh
npm install
npm run dev          # 開発用のブラウザ版（http://localhost:5173）
npm start            # デスクトップアプリ
npm run dist:win     # Windows インストーラー → release/
npm run dist:linux   # AppImage + tar.gz → release/（できれば Linux 上で実行）
npm run android      # サイトを android/ にコピーしたあと：
cd android && gradlew assembleDebug   # JAVA_HOME = JDK 21
```

## サーバーなしの同期

各ドキュメントは IndexedDB に保存された **Yjs CRDT** です。2 台のデバイスがオフラインで同じドキュメントを編集しても、
変更は自動的にマージされ、競合も「最後の版が勝つ」こともありません。

デバイスをつなぐ 3 つの方法（**同期**パネル）：

1. **直接ペアリング（WebRTC）**：デバイス A が招待用の QR コードを表示し、B がそれを読み取って（またはコードを貼り付けて）
   返信用の QR コードを表示し、それを A が読み取ります。以後、接続はエンドツーエンドで暗号化され（DTLS）、
   リアルタイムで同期されます。ローカル Wi-Fi ではサーバーを一切使いません。「インターネット経由」オプションでは公開 STUN サーバーを
   公開アドレスを調べるためだけに使います（データはそこを通りません）。アプリを開くたびにやり直す必要があります。
2. **共有フォルダー**（Windows / Linux）：Syncthing で同期されたフォルダー、USB メモリ、ネットワーク共有を選びます。
   各デバイスはそこに自分の `mythos-<id>.mythos` ファイルを書き込み、ほかのデバイスのファイルを 5 秒ごとに読み込みます。
3. **`.mythos` ファイル**：ワークスペース全体の手動エクスポート / インポート（メール、USB メモリ……）。インポートはマージ方式で、何も上書きしません。

デバイスは変更を中継します：A が B と、B が C とつながっていれば、A の変更は C にも届きます。

## 対応フォーマット

| | インポート | エクスポート |
|---|---|---|
| 文書 | .docx, .html, .txt, .md | .docx, PDF（印刷） |
| 表計算 | .xlsx, .xls, .ods, .csv | .xlsx, .csv |
| プレゼンテーション | .pptx | .pptx, PDF（印刷） |

設計の指針とした Word・Excel・PowerPoint の動作分析は [docs/ANALYSE.md](../../docs/ANALYSE.md)（フランス語）を参照してください。

## 構成

```
src/main.js            ホーム、ルーティング、ファイルのインポート
src/store.js           ローカル保存（Y.Doc + IndexedDB）、ライブラリ
src/sync/              同期プロトコル、WebRTC、共有フォルダー、画面
src/apps/writer.js     ワープロ（ProseMirror/Tiptap）
src/apps/sheet.js      表計算（canvas グリッド）
src/apps/formula.js    数式エンジン
src/apps/slides.js     プレゼンテーション
src/io/                docx / xlsx / pptx の変換
electron/              デスクトップアプリ（Windows、Linux）
android/               Android プロジェクト（Capacitor）
```

## 既知の制限

- 文書：変更履歴、コメント、ヘッダー / フッター、画面上の実際のページ分割はありません
  （改ページは印刷時と .docx では反映されます）。
- 表計算：グラフ、セルの結合、条件付き書式、ピボットテーブルはありません。
  .xlsx のインポートでは値、数式、列幅、太字は復元されますが、すべてのスタイルではありません。
- プレゼンテーション：テキストボックスごとに 1 つのスタイル（単語単位の書式設定は不可）、アニメーションなし。
  .pptx のインポートではテキスト、図形、画像、色、ノートは引き継がれますが、マスターとテーマは引き継がれません。
- 直接ペアリングは起動のたびにやり直す必要があります（デバイスを見つけるためのサーバーがないため）。
