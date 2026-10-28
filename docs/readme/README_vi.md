<div align="center">

[English](README_en.md) · [简体中文](README_zh.md) · [繁體中文](README_zh-TW.md) · [日本語](README_ja.md) · [한국어](README_ko.md) · [Türkçe](README_tr.md) · [Русский](README_ru.md) · **Tiếng Việt** · [ไทย](README_th.md) · [Deutsch](README_de.md) · [Español](README_es.md) · [Français](../../README.md) · [Українська](README_uk.md) · [Polski](README_pl.md) · [Português (Brasil)](README_pt-BR.md) · [العربية](README_ar.md) · [فارسی](README_fa.md) · [Bahasa Indonesia](README_id.md) · [Italiano](README_it.md)
· [Ελληνικά](README_el.md) · [മലയാളം](README_ml.md) · [Roman Urdu](README_ur-Latn.md) · [Română](README_ro.md)

</div>

# Mythos — bộ ứng dụng văn phòng cục bộ, đồng bộ không cần máy chủ

![Màn hình chính](../../docs/screenshots/home.png)

| Văn bản | Bảng tính | Trình chiếu |
|---|---|---|
| ![](../../docs/screenshots/writer.png) | ![](../../docs/screenshots/sheet.png) | ![](../../docs/screenshots/slides.png) |

| Cài đặt | Chế độ tối |
|---|---|
| ![](../../docs/screenshots/settings.png) | ![](../../docs/screenshots/home-dark.png) |

**Đồng bộ bằng mã 4 chữ số**: trên một thiết bị, chọn *Đồng bộ → Hiển thị mã*; trên thiết bị kia, chọn *Nhập mã*. Mã chỉ dùng để hai bên tìm thấy nhau trên một máy chuyển tiếp (ntfy.sh, có thể đổi trong Cài đặt), và lời mời được mã hóa ở đó. Sau đó tài liệu của bạn đi thẳng từ thiết bị này sang thiết bị kia.

Trình soạn thảo văn bản, bảng tính và trình chiếu trong một ứng dụng duy nhất, cho **Windows, Linux và Android**.
Tệp nằm trên thiết bị của bạn; việc đồng bộ diễn ra trực tiếp giữa các thiết bị.

## Cài đặt

| Hệ điều hành | Tệp | Vị trí |
|---|---|---|
| Windows | `Mythos-Setup-1.1.0.exe` (trình cài đặt) hoặc `Mythos-Portable-1.1.0.exe` | `release/` |
| Linux | `Mythos-1.1.0-x64.tar.gz` (giải nén rồi chạy `./mythos`); AppImage được biên dịch trên Linux bằng `npm run dist:linux` | `release/` |
| Android | `app-debug.apk` | `android/app/build/outputs/apk/debug/` |

Các tệp không được ký: Windows SmartScreen sẽ yêu cầu chọn "Thông tin thêm → Vẫn chạy",
và Android sẽ yêu cầu cho phép cài ứng dụng từ nguồn không xác định.

## Biên dịch lại

```sh
npm install
npm run dev          # phiên bản trình duyệt để phát triển (http://localhost:5173)
npm start            # ứng dụng máy tính
npm run dist:win     # trình cài đặt Windows → release/
npm run dist:linux   # AppImage + tar.gz → release/ (nên chạy trên Linux)
npm run android      # sao chép trang web vào android/, sau đó:
cd android && gradlew assembleDebug   # JAVA_HOME = JDK 21
```

## Đồng bộ không cần máy chủ

Mỗi tài liệu là một **Yjs CRDT** được lưu trong IndexedDB. Hai thiết bị cùng sửa một tài liệu khi ngoại tuyến
sẽ tự động hợp nhất thay đổi của nhau, không xung đột và không theo kiểu "bản cuối cùng thắng".

Ba cách liên kết thiết bị (bảng **Đồng bộ**):

1. **Ghép đôi trực tiếp (WebRTC)**: thiết bị A hiển thị mã QR mời, B quét nó (hoặc dán mã)
   rồi hiển thị mã QR phản hồi để A quét lại. Sau đó kết nối được mã hóa đầu cuối (DTLS),
   theo thời gian thực. Trong Wi-Fi nội bộ không dùng máy chủ nào; tùy chọn "qua Internet" dùng một máy chủ STUN công khai
   chỉ để tìm địa chỉ công khai (không có dữ liệu nào đi qua đó). Phải làm lại mỗi lần mở ứng dụng.
2. **Thư mục dùng chung** (Windows / Linux): chọn một thư mục được Syncthing đồng bộ, một USB hoặc một thư mục chia sẻ qua mạng.
   Mỗi thiết bị ghi vào đó tệp `mythos-<id>.mythos` của riêng mình và đọc tệp của các thiết bị khác mỗi 5 giây.
3. **Tệp `.mythos`**: xuất/nhập thủ công toàn bộ không gian làm việc (email, USB…). Khi nhập sẽ hợp nhất, không ghi đè gì cả.

Các thiết bị chuyển tiếp thay đổi cho nhau: nếu A liên kết với B và B với C, thay đổi của A sẽ đến được C.

## Định dạng được hỗ trợ

| | Nhập | Xuất |
|---|---|---|
| Văn bản | .docx, .html, .txt, .md | .docx, PDF (in) |
| Bảng tính | .xlsx, .xls, .ods, .csv | .xlsx, .csv |
| Trình chiếu | .pptx | .pptx, PDF (in) |

Xem [docs/ANALYSE.md](../../docs/ANALYSE.md) (bằng tiếng Pháp) để đọc phần phân tích cách Word, Excel và PowerPoint hoạt động đã định hướng thiết kế.

## Cấu trúc

```
src/main.js            màn hình chính, định tuyến, nhập tệp
src/store.js           lưu trữ cục bộ (Y.Doc + IndexedDB), thư viện
src/sync/              giao thức đồng bộ, WebRTC, thư mục dùng chung, giao diện
src/apps/writer.js     trình soạn thảo văn bản (ProseMirror/Tiptap)
src/apps/sheet.js      bảng tính (lưới canvas)
src/apps/formula.js    bộ máy công thức
src/apps/slides.js     trình chiếu
src/io/                chuyển đổi docx / xlsx / pptx
electron/              ứng dụng máy tính (Windows, Linux)
android/               dự án Android (Capacitor)
```

## Hạn chế đã biết

- Văn bản: chưa có theo dõi thay đổi, chú thích, đầu trang/chân trang hay phân trang thực sự trên màn hình
  (ngắt trang vẫn được giữ khi in và trong tệp .docx).
- Bảng tính: chưa có biểu đồ, gộp ô, định dạng có điều kiện hay bảng tổng hợp;
  nhập .xlsx lấy lại giá trị, công thức, độ rộng cột và chữ đậm, nhưng không phải mọi kiểu định dạng.
- Trình chiếu: mỗi khung văn bản một kiểu (không định dạng từng từ), không có hiệu ứng động;
  nhập .pptx giữ văn bản, hình dạng, hình ảnh, màu sắc và ghi chú, nhưng không giữ trang chiếu cái và chủ đề.
- Ghép đôi trực tiếp phải làm lại mỗi lần khởi động (không có máy chủ để tìm thiết bị).
