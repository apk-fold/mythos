<div align="center">

[English](README_en.md) · [简体中文](README_zh.md) · [繁體中文](README_zh-TW.md) · [日本語](README_ja.md) · [한국어](README_ko.md) · [Türkçe](README_tr.md) · [Русский](README_ru.md) · [Tiếng Việt](README_vi.md) · [ไทย](README_th.md) · [Deutsch](README_de.md) · [Español](README_es.md) · [Français](../../README.md) · [Українська](README_uk.md) · [Polski](README_pl.md) · [Português (Brasil)](README_pt-BR.md) · [العربية](README_ar.md) · [فارسی](README_fa.md) · **Bahasa Indonesia** · [Italiano](README_it.md)
· [Ελληνικά](README_el.md) · [മലയാളം](README_ml.md) · [Roman Urdu](README_ur-Latn.md) · [Română](README_ro.md)

</div>

# Mythos — paket perkantoran lokal, tersinkron tanpa server

![Beranda](../../docs/screenshots/home.png)

| Teks | Lembar kerja | Presentasi |
|---|---|---|
| ![](../../docs/screenshots/writer.png) | ![](../../docs/screenshots/sheet.png) | ![](../../docs/screenshots/slides.png) |

| Pengaturan | Mode gelap |
|---|---|
| ![](../../docs/screenshots/settings.png) | ![](../../docs/screenshots/home-dark.png) |

**Sinkronisasi dengan kode 4 digit**: di satu perangkat, *Sinkronisasi → Tampilkan kode*; di perangkat lain, *Masukkan kode*. Kode hanya dipakai agar kedua perangkat saling menemukan di sebuah relay (ntfy.sh, bisa diubah di Pengaturan), dan undangan di sana terenkripsi. Setelah itu, dokumen Anda berpindah langsung dari satu perangkat ke perangkat lain.

Pengolah kata, lembar kerja, dan presentasi dalam satu aplikasi, untuk **Windows, Linux, dan Android**.
File tetap berada di perangkat Anda; sinkronisasi terjadi langsung antarperangkat.

## Instalasi

| Sistem | File | Lokasi |
|---|---|---|
| Windows | `Mythos-Setup-1.1.0.exe` (penginstal) atau `Mythos-Portable-1.1.0.exe` | `release/` |
| Linux | `Mythos-1.1.0-x64.tar.gz` (ekstrak lalu jalankan `./mythos`); AppImage dikompilasi di Linux dengan `npm run dist:linux` | `release/` |
| Android | `app-debug.apk` | `android/app/build/outputs/apk/debug/` |

File tidak ditandatangani: Windows SmartScreen akan meminta "Info selengkapnya → Tetap jalankan",
dan Android akan meminta izin untuk memasang aplikasi dari sumber tidak dikenal.

## Kompilasi ulang

```sh
npm install
npm run dev          # versi browser untuk pengembangan (http://localhost:5173)
npm start            # aplikasi desktop
npm run dist:win     # penginstal Windows → release/
npm run dist:linux   # AppImage + tar.gz → release/ (sebaiknya dijalankan di Linux)
npm run android      # menyalin situs ke android/, lalu:
cd android && gradlew assembleDebug   # JAVA_HOME = JDK 21
```

## Sinkronisasi tanpa server

Setiap dokumen adalah **CRDT Yjs** yang disimpan di IndexedDB. Dua perangkat yang mengubah dokumen yang sama saat offline
akan menggabungkan perubahannya secara otomatis, tanpa konflik dan tanpa aturan "versi terakhir yang menang".

Tiga cara menghubungkan perangkat (panel **Sinkronisasi**):

1. **Pemasangan langsung (WebRTC)**: perangkat A menampilkan kode QR undangan, B memindainya (atau menempelkan kodenya)
   lalu menampilkan kode QR balasan yang gantian dipindai A. Setelah itu koneksi terenkripsi ujung ke ujung (DTLS),
   secara real-time. Di Wi-Fi lokal tidak ada server yang dipakai; opsi "lewat Internet" memakai server STUN publik
   hanya untuk mengetahui alamat publik (tidak ada data yang lewat sana). Harus diulang setiap kali aplikasi dibuka.
2. **Folder bersama** (Windows / Linux): pilih folder yang disinkronkan oleh Syncthing, flashdisk USB, atau folder bersama di jaringan.
   Setiap perangkat menulis file `mythos-<id>.mythos` miliknya di sana dan membaca file perangkat lain setiap 5 detik.
3. **File `.mythos`**: ekspor/impor manual seluruh ruang kerja (email, flashdisk…). Impor akan menggabungkan, tidak menimpa apa pun.

Perangkat saling meneruskan perubahan: jika A terhubung ke B dan B ke C, perubahan dari A sampai ke C.

## Format yang didukung

| | Impor | Ekspor |
|---|---|---|
| Teks | .docx, .html, .txt, .md | .docx, PDF (cetak) |
| Lembar kerja | .xlsx, .xls, .ods, .csv | .xlsx, .csv |
| Presentasi | .pptx | .pptx, PDF (cetak) |

Lihat [docs/ANALYSE.md](../../docs/ANALYSE.md) (dalam bahasa Prancis) untuk analisis cara kerja Word, Excel, dan PowerPoint yang memandu perancangan.

## Struktur

```
src/main.js            beranda, routing, impor file
src/store.js           penyimpanan lokal (Y.Doc + IndexedDB), pustaka
src/sync/              protokol sinkronisasi, WebRTC, folder bersama, antarmuka
src/apps/writer.js     pengolah kata (ProseMirror/Tiptap)
src/apps/sheet.js      lembar kerja (grid canvas)
src/apps/formula.js    mesin rumus
src/apps/slides.js     presentasi
src/io/                konversi docx / xlsx / pptx
electron/              aplikasi desktop (Windows, Linux)
android/               proyek Android (Capacitor)
```

## Keterbatasan yang diketahui

- Teks: belum ada lacak perubahan, komentar, header/footer, maupun pemisahan halaman sungguhan di layar
  (pemisah halaman tetap dipatuhi saat mencetak dan di .docx).
- Lembar kerja: belum ada grafik, penggabungan sel, format bersyarat, maupun tabel pivot;
  impor .xlsx mengambil nilai, rumus, lebar kolom, dan huruf tebal, tetapi tidak semua gaya.
- Presentasi: satu gaya per kotak teks (tidak bisa memformat per kata), tanpa animasi;
  impor .pptx mengambil teks, bentuk, gambar, warna, dan catatan, tetapi tidak termasuk master dan tema.
- Pemasangan langsung harus diulang setiap kali aplikasi dijalankan (tidak ada server untuk menemukan perangkat).
