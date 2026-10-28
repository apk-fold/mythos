<div align="center">

[English](README_en.md) · [简体中文](README_zh.md) · [繁體中文](README_zh-TW.md) · [日本語](README_ja.md) · [한국어](README_ko.md) · [Türkçe](README_tr.md) · [Русский](README_ru.md) · [Tiếng Việt](README_vi.md) · [ไทย](README_th.md) · [Deutsch](README_de.md) · [Español](README_es.md) · [Français](../../README.md) · [Українська](README_uk.md) · [Polski](README_pl.md) · [Português (Brasil)](README_pt-BR.md) · **العربية** · [فارسی](README_fa.md) · [Bahasa Indonesia](README_id.md) · [Italiano](README_it.md)
· [Ελληνικά](README_el.md) · [മലയാളം](README_ml.md) · [Roman Urdu](README_ur-Latn.md) · [Română](README_ro.md)

</div>

# Mythos — حزمة مكتبية محلية تتزامن دون خادم

![الصفحة الرئيسية](../../docs/screenshots/home.png)

| النصوص | الجداول | العروض التقديمية |
|---|---|---|
| ![](../../docs/screenshots/writer.png) | ![](../../docs/screenshots/sheet.png) | ![](../../docs/screenshots/slides.png) |

| الإعدادات | الوضع الداكن |
|---|---|
| ![](../../docs/screenshots/settings.png) | ![](../../docs/screenshots/home-dark.png) |

**المزامنة برمز من 4 أرقام**: على أحد الجهازين اختر *المزامنة ← عرض رمز*، وعلى الآخر *إدخال رمز*. يُستخدم الرمز فقط ليجد الجهازان بعضهما على خادم وسيط (ntfy.sh، يمكن تغييره من الإعدادات)، والدعوة مشفّرة هناك. بعد ذلك تنتقل مستنداتكم مباشرة من جهاز إلى آخر.

معالج نصوص وجداول بيانات وعروض تقديمية في تطبيق واحد، لأنظمة **Windows وLinux وAndroid**.
تبقى الملفات على أجهزتكم؛ وتتم المزامنة مباشرة من جهاز إلى جهاز.

## التثبيت

| النظام | الملف | الموقع |
|---|---|---|
| Windows | `Mythos-Setup-1.1.0.exe` (برنامج تثبيت) أو `Mythos-Portable-1.1.0.exe` | `release/` |
| Linux | `Mythos-1.1.0-x64.tar.gz` (فك الضغط ثم تشغيل `./mythos`)؛ يُبنى AppImage على Linux باستخدام `npm run dist:linux` | `release/` |
| Android | `app-debug.apk` | `android/app/build/outputs/apk/debug/` |

الملفات غير موقّعة: سيطلب Windows SmartScreen اختيار «مزيد من المعلومات ← التشغيل على أي حال»،
وسيطلب Android السماح بتثبيت التطبيقات من مصادر غير معروفة.

## إعادة البناء

```sh
npm install
npm run dev          # نسخة المتصفح للتطوير (http://localhost:5173)
npm start            # تطبيق سطح المكتب
npm run dist:win     # برنامج تثبيت Windows → release/
npm run dist:linux   # AppImage + tar.gz → release/ (يُفضَّل تشغيله على Linux)
npm run android      # ينسخ الموقع إلى android/، ثم:
cd android && gradlew assembleDebug   # JAVA_HOME = JDK 21
```

## المزامنة دون خادم

كل مستند هو **Yjs CRDT** مخزّن في IndexedDB. إذا عدّل جهازان المستند نفسه دون اتصال،
فإنهما يدمجان تعديلاتهما تلقائيًا، دون تعارض ودون قاعدة «آخر نسخة هي التي تفوز».

ثلاث طرق لربط الأجهزة (لوحة **المزامنة**):

1. **الاقتران المباشر (WebRTC)**: يعرض الجهاز A رمز QR للدعوة، فيمسحه B (أو يلصق الرمز)
   ويعرض رمز QR للرد يمسحه A بدوره. يصبح الاتصال بعد ذلك مشفّرًا من طرف إلى طرف (DTLS)
   وفي الوقت الفعلي. على شبكة Wi-Fi المحلية لا يُستخدم أي خادم؛ أما خيار «عبر الإنترنت» فيستخدم خادم STUN عامًا
   فقط لاكتشاف العنوان العام (لا تمر عبره أي بيانات). يجب إعادة الاقتران عند كل فتح للتطبيق.
2. **مجلد مشترك** (Windows / Linux): اختر مجلدًا يزامنه Syncthing، أو ذاكرة USB، أو مجلد شبكة مشتركًا.
   يكتب كل جهاز فيه ملفه الخاص `mythos-<id>.mythos` ويقرأ ملفات الأجهزة الأخرى كل 5 ثوانٍ.
3. **ملف `.mythos`**: تصدير/استيراد يدوي لمساحة العمل كاملة (بريد إلكتروني، ذاكرة USB…). الاستيراد يدمج ولا يستبدل أي شيء.

تنقل الأجهزة التعديلات فيما بينها: إذا كان A مرتبطًا بـ B وB مرتبطًا بـ C، تصل تعديلات A إلى C.

## الصيغ المدعومة

| | الاستيراد | التصدير |
|---|---|---|
| النصوص | .docx, .html, .txt, .md | .docx, PDF (طباعة) |
| الجداول | .xlsx, .xls, .ods, .csv | .xlsx, .csv |
| العروض التقديمية | .pptx | .pptx, PDF (طباعة) |

راجعوا [docs/ANALYSE.md](../../docs/ANALYSE.md) (بالفرنسية) للاطلاع على تحليل طريقة عمل Word وExcel وPowerPoint الذي وجّه التصميم.

## البنية

```
src/main.js            الصفحة الرئيسية، التوجيه، استيراد الملفات
src/store.js           التخزين المحلي (Y.Doc + IndexedDB)، المكتبة
src/sync/              بروتوكول المزامنة، WebRTC، المجلد المشترك، الواجهة
src/apps/writer.js     معالج النصوص (ProseMirror/Tiptap)
src/apps/sheet.js      الجداول (شبكة canvas)
src/apps/formula.js    محرك الصيغ
src/apps/slides.js     العروض التقديمية
src/io/                تحويلات docx / xlsx / pptx
electron/              تطبيق سطح المكتب (Windows، Linux)
android/               مشروع Android (Capacitor)
```

## القيود المعروفة

- النصوص: لا يوجد تتبع للتغييرات ولا تعليقات ولا رؤوس/تذييلات صفحات ولا تقسيم فعلي للصفحات على الشاشة
  (تُحترم فواصل الصفحات عند الطباعة وفي ملف .docx).
- الجداول: لا رسوم بيانية ولا دمج خلايا ولا تنسيق شرطي ولا جداول محورية؛
  يستعيد استيراد .xlsx القيم والصيغ وعرض الأعمدة والخط العريض، لا جميع الأنماط.
- العروض التقديمية: نمط واحد لكل مربع نص (لا تنسيق لكل كلمة على حدة)، ولا حركات؛
  يستعيد استيراد .pptx النصوص والأشكال والصور والألوان والملاحظات، لكن ليس الشرائح الرئيسية ولا السمات.
- يجب إعادة الاقتران المباشر عند كل تشغيل (لا يوجد خادم للعثور على الأجهزة).
