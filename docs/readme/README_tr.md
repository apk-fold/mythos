<div align="center">

[English](README_en.md) · [简体中文](README_zh.md) · [繁體中文](README_zh-TW.md) · [日本語](README_ja.md) · [한국어](README_ko.md) · **Türkçe** · [Русский](README_ru.md) · [Tiếng Việt](README_vi.md) · [ไทย](README_th.md) · [Deutsch](README_de.md) · [Español](README_es.md) · [Français](../../README.md) · [Українська](README_uk.md) · [Polski](README_pl.md) · [Português (Brasil)](README_pt-BR.md) · [العربية](README_ar.md) · [فارسی](README_fa.md) · [Bahasa Indonesia](README_id.md) · [Italiano](README_it.md)
· [Ελληνικά](README_el.md) · [മലയാളം](README_ml.md) · [Roman Urdu](README_ur-Latn.md) · [Română](README_ro.md)

</div>

# Mythos — yerel ofis paketi, sunucusuz senkronizasyon

![Ana ekran](../../docs/screenshots/home.png)

| Metin | Tablo | Sunum |
|---|---|---|
| ![](../../docs/screenshots/writer.png) | ![](../../docs/screenshots/sheet.png) | ![](../../docs/screenshots/slides.png) |

| Ayarlar | Koyu mod |
|---|---|
| ![](../../docs/screenshots/settings.png) | ![](../../docs/screenshots/home-dark.png) |

**4 haneli kodla senkronizasyon**: bir cihazda *Senkronizasyon → Kod göster*, diğerinde *Kod gir*. Kod yalnızca bir aktarıcı sunucuda (ntfy.sh, Ayarlar'dan değiştirilebilir) birbirinizi bulmak için kullanılır ve davet orada şifrelidir. Belgeleriniz daha sonra doğrudan bir cihazdan diğerine geçer.

Kelime işlemci, hesap tablosu ve sunumlar tek bir uygulamada, **Windows, Linux ve Android** için.
Dosyalar sizin cihazlarınızda kalır; senkronizasyon doğrudan cihazdan cihaza yapılır.

## Kurulum

| Sistem | Dosya | Konum |
|---|---|---|
| Windows | `Mythos-Setup-1.1.0.exe` (yükleyici) veya `Mythos-Portable-1.1.0.exe` | `release/` |
| Linux | `Mythos-1.1.0-x64.tar.gz` (arşivi açın, sonra `./mythos` çalıştırın); AppImage, Linux'ta `npm run dist:linux` ile derlenir | `release/` |
| Android | `app-debug.apk` | `android/app/build/outputs/apk/debug/` |

Dosyalar imzalı değil: Windows SmartScreen "Ek bilgi → Yine de çalıştır" seçmenizi isteyecek,
Android de bilinmeyen kaynaklardan uygulama yüklemeye izin vermenizi isteyecek.

## Yeniden derleme

```sh
npm install
npm run dev          # geliştirme için tarayıcı sürümü (http://localhost:5173)
npm start            # masaüstü uygulaması
npm run dist:win     # Windows yükleyicisi → release/
npm run dist:linux   # AppImage + tar.gz → release/ (tercihen Linux'ta çalıştırın)
npm run android      # siteyi android/ içine kopyalar, ardından:
cd android && gradlew assembleDebug   # JAVA_HOME = JDK 21
```

## Sunucusuz senkronizasyon

Her belge, IndexedDB'de saklanan bir **Yjs CRDT**'dir. Aynı belgeyi çevrimdışıyken düzenleyen iki cihaz,
değişikliklerini otomatik olarak birleştirir; çakışma olmaz ve "son sürüm kazanır" mantığı yoktur.

Cihazları bağlamanın üç yolu (**Senkronizasyon** paneli):

1. **Doğrudan eşleştirme (WebRTC)**: A cihazı bir davet QR kodu gösterir, B onu tarar (ya da kodu yapıştırır)
   ve A'nın sırayla tarayacağı bir yanıt QR kodu gösterir. Bağlantı bundan sonra uçtan uca şifrelidir (DTLS)
   ve gerçek zamanlıdır. Yerel Wi-Fi'de hiçbir sunucu kullanılmaz; "İnternet üzerinden" seçeneği, genel bir STUN sunucusunu
   yalnızca genel adresi bulmak için kullanır (oradan hiçbir veri geçmez). Uygulama her açıldığında yeniden yapılmalıdır.
2. **Paylaşılan klasör** (Windows / Linux): Syncthing ile senkronize edilen bir klasör, bir USB bellek ya da bir ağ paylaşımı seçin.
   Her cihaz oraya kendi `mythos-<id>.mythos` dosyasını yazar ve diğerlerinin dosyalarını 5 saniyede bir okur.
3. **`.mythos` dosyası**: tüm çalışma alanının elle dışa/içe aktarımı (e-posta, USB bellek…). İçe aktarma birleştirir, hiçbir şeyin üzerine yazmaz.

Cihazlar değişiklikleri aktarır: A, B'ye ve B, C'ye bağlıysa A'nın değişiklikleri C'ye ulaşır.

## Desteklenen biçimler

| | İçe aktarma | Dışa aktarma |
|---|---|---|
| Metin | .docx, .html, .txt, .md | .docx, PDF (yazdırma) |
| Tablo | .xlsx, .xls, .ods, .csv | .xlsx, .csv |
| Sunum | .pptx | .pptx, PDF (yazdırma) |

Tasarıma yön veren Word, Excel ve PowerPoint'in işleyiş analizi için [docs/ANALYSE.md](../../docs/ANALYSE.md) dosyasına (Fransızca) bakın.

## Yapı

```
src/main.js            ana ekran, yönlendirme, dosya içe aktarma
src/store.js           yerel depolama (Y.Doc + IndexedDB), kitaplık
src/sync/              senkronizasyon protokolü, WebRTC, paylaşılan klasör, arayüz
src/apps/writer.js     kelime işlemci (ProseMirror/Tiptap)
src/apps/sheet.js      hesap tablosu (canvas ızgara)
src/apps/formula.js    formül motoru
src/apps/slides.js     sunumlar
src/io/                docx / xlsx / pptx dönüşümleri
electron/              masaüstü uygulaması (Windows, Linux)
android/               Android projesi (Capacitor)
```

## Bilinen sınırlamalar

- Metin: değişiklik izleme, yorumlar, üst bilgi/alt bilgi ya da ekranda gerçek sayfalama yok
  (sayfa sonları yazdırırken ve .docx dosyasında korunur).
- Tablo: grafik, hücre birleştirme, koşullu biçimlendirme ve pivot tablo yok;
  .xlsx içe aktarımı değerleri, formülleri, sütun genişliklerini ve kalın yazıyı getirir, tüm stilleri değil.
- Sunum: metin kutusu başına tek stil (kelime kelime biçimlendirme yok), animasyon yok;
  .pptx içe aktarımı metinleri, şekilleri, görselleri, renkleri ve notları alır, ama asıl slaytları ve temaları almaz.
- Doğrudan eşleştirme her açılışta yeniden yapılmalıdır (cihazları bulacak bir sunucu yoktur).
