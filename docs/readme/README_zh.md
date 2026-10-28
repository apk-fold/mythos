<div align="center">

[English](README_en.md) · **简体中文** · [繁體中文](README_zh-TW.md) · [日本語](README_ja.md) · [한국어](README_ko.md) · [Türkçe](README_tr.md) · [Русский](README_ru.md) · [Tiếng Việt](README_vi.md) · [ไทย](README_th.md) · [Deutsch](README_de.md) · [Español](README_es.md) · [Français](../../README.md) · [Українська](README_uk.md) · [Polski](README_pl.md) · [Português (Brasil)](README_pt-BR.md) · [العربية](README_ar.md) · [فارسی](README_fa.md) · [Bahasa Indonesia](README_id.md) · [Italiano](README_it.md)
· [Ελληνικά](README_el.md) · [മലയാളം](README_ml.md) · [Roman Urdu](README_ur-Latn.md) · [Română](README_ro.md)

</div>

# Mythos —— 本地办公套件，无需服务器即可同步

![主页](../../docs/screenshots/home.png)

| 文字 | 表格 | 演示 |
|---|---|---|
| ![](../../docs/screenshots/writer.png) | ![](../../docs/screenshots/sheet.png) | ![](../../docs/screenshots/slides.png) |

| 设置 | 深色模式 |
|---|---|
| ![](../../docs/screenshots/settings.png) | ![](../../docs/screenshots/home-dark.png) |

**用 4 位数字代码同步**：在一台设备上选择*同步 → 显示代码*，在另一台上选择*输入代码*。代码只用于在中继服务器（ntfy.sh，可在设置中更改）上找到彼此，邀请内容在中继上是加密的。之后，你的文档会直接从一台设备传到另一台设备。

文字处理、表格和演示文稿集成在一个应用中，支持 **Windows、Linux 和 Android**。
文件保存在你自己的设备上；同步直接在设备之间进行。

## 安装

| 系统 | 文件 | 位置 |
|---|---|---|
| Windows | `Mythos-Setup-1.1.0.exe`（安装程序）或 `Mythos-Portable-1.1.0.exe` | `release/` |
| Linux | `Mythos-1.1.0-x64.tar.gz`（解压后运行 `./mythos`）；AppImage 需在 Linux 上用 `npm run dist:linux` 编译 | `release/` |
| Android | `app-debug.apk` | `android/app/build/outputs/apk/debug/` |

这些文件没有签名：Windows SmartScreen 会要求点击"更多信息 → 仍要运行"，
Android 会要求允许安装未知来源的应用。

## 重新编译

```sh
npm install
npm run dev          # 用于开发的浏览器版本（http://localhost:5173）
npm start            # 桌面应用
npm run dist:win     # Windows 安装程序 → release/
npm run dist:linux   # AppImage + tar.gz → release/（最好在 Linux 上运行）
npm run android      # 把网站复制到 android/，然后：
cd android && gradlew assembleDebug   # JAVA_HOME = JDK 21
```

## 无服务器同步

每个文档都是存储在 IndexedDB 中的 **Yjs CRDT**。两台设备离线修改同一个文档后，
会自动合并各自的更改，不会冲突，也不是"最后保存的版本获胜"。

连接设备的三种方式（**同步**面板）：

1. **直接配对（WebRTC）**：设备 A 显示邀请二维码，B 扫描（或粘贴代码）
   后显示回复二维码，再由 A 扫描。之后连接为端到端加密（DTLS），
   实时同步。在本地 Wi-Fi 中不使用任何服务器；"通过互联网"选项仅使用公共 STUN 服务器
   来发现公网地址（不会有任何数据经过它）。每次打开应用都需要重新配对。
2. **共享文件夹**（Windows / Linux）：选择一个由 Syncthing 同步的文件夹、U 盘或网络共享。
   每台设备在其中写入自己的 `mythos-<id>.mythos` 文件，并每 5 秒读取其他设备的文件。
3. **`.mythos` 文件**：手动导出/导入整个工作区（电子邮件、U 盘……）。导入时会合并，不会覆盖任何内容。

设备之间会转发更改：如果 A 连到 B，B 连到 C，那么 A 的更改也会到达 C。

## 支持的格式

| | 导入 | 导出 |
|---|---|---|
| 文字 | .docx, .html, .txt, .md | .docx, PDF（打印） |
| 表格 | .xlsx, .xls, .ods, .csv | .xlsx, .csv |
| 演示 | .pptx | .pptx, PDF（打印） |

指导本项目设计的 Word、Excel 和 PowerPoint 工作原理分析见 [docs/ANALYSE.md](../../docs/ANALYSE.md)（法语）。

## 结构

```
src/main.js            主页、路由、文件导入
src/store.js           本地存储（Y.Doc + IndexedDB）、文档库
src/sync/              同步协议、WebRTC、共享文件夹、界面
src/apps/writer.js     文字处理（ProseMirror/Tiptap）
src/apps/sheet.js      表格（canvas 网格）
src/apps/formula.js    公式引擎
src/apps/slides.js     演示文稿
src/io/                docx / xlsx / pptx 转换
electron/              桌面应用（Windows、Linux）
android/               Android 项目（Capacitor）
```

## 已知限制

- 文字：没有修订、批注、页眉/页脚，屏幕上也没有真正的分页
  （打印和 .docx 中会保留分页符）。
- 表格：没有图表、合并单元格、条件格式和数据透视表；
  导入 .xlsx 时会保留数值、公式、列宽和粗体，但不会保留所有样式。
- 演示：每个文本框只能有一种样式（无法逐词设置格式），没有动画；
  导入 .pptx 时会保留文字、形状、图片、颜色和备注，但不包括母版和主题。
- 每次启动都需要重新进行直接配对（没有服务器来找到设备）。
