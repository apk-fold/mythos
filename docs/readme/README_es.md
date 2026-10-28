<div align="center">

[English](README_en.md) · [简体中文](README_zh.md) · [繁體中文](README_zh-TW.md) · [日本語](README_ja.md) · [한국어](README_ko.md) · [Türkçe](README_tr.md) · [Русский](README_ru.md) · [Tiếng Việt](README_vi.md) · [ไทย](README_th.md) · [Deutsch](README_de.md) · **Español** · [Français](../../README.md) · [Українська](README_uk.md) · [Polski](README_pl.md) · [Português (Brasil)](README_pt-BR.md) · [العربية](README_ar.md) · [فارسی](README_fa.md) · [Bahasa Indonesia](README_id.md) · [Italiano](README_it.md)
· [Ελληνικά](README_el.md) · [മലയാളം](README_ml.md) · [Roman Urdu](README_ur-Latn.md) · [Română](README_ro.md)

</div>

# Mythos — suite ofimática local, sincronizada sin servidor

![Inicio](../../docs/screenshots/home.png)

| Texto | Hoja de cálculo | Presentaciones |
|---|---|---|
| ![](../../docs/screenshots/writer.png) | ![](../../docs/screenshots/sheet.png) | ![](../../docs/screenshots/slides.png) |

| Ajustes | Modo oscuro |
|---|---|
| ![](../../docs/screenshots/settings.png) | ![](../../docs/screenshots/home-dark.png) |

**Sincronización con un código de 4 cifras**: en un dispositivo, *Sincronización → Mostrar un código*; en el otro, *Introducir un código*. El código solo sirve para encontrarse en un relé (ntfy.sh, modificable en los Ajustes), y la invitación va cifrada allí. Después, tus documentos pasan directamente de un dispositivo a otro.

Procesador de textos, hoja de cálculo y presentaciones en una sola aplicación, para **Windows, Linux y Android**.
Los archivos se quedan en tus dispositivos; la sincronización se hace directamente de dispositivo a dispositivo.

## Instalar

| Sistema | Archivo | Ubicación |
|---|---|---|
| Windows | `Mythos-Setup-1.1.0.exe` (instalador) o `Mythos-Portable-1.1.0.exe` | `release/` |
| Linux | `Mythos-1.1.0-x64.tar.gz` (extraer y ejecutar `./mythos`); el AppImage se compila desde Linux con `npm run dist:linux` | `release/` |
| Android | `app-debug.apk` | `android/app/build/outputs/apk/debug/` |

Los archivos no están firmados: Windows SmartScreen pedirá «Más información → Ejecutar de todas formas»,
y Android pedirá permitir la instalación de aplicaciones de origen desconocido.

## Recompilar

```sh
npm install
npm run dev          # versión de navegador para desarrollar (http://localhost:5173)
npm start            # aplicación de escritorio
npm run dist:win     # instalador de Windows → release/
npm run dist:linux   # AppImage + tar.gz → release/ (mejor ejecutarlo en Linux)
npm run android      # copia el sitio en android/, y después:
cd android && gradlew assembleDebug   # JAVA_HOME = JDK 21
```

## Sincronización sin servidor

Cada documento es un **CRDT de Yjs** almacenado en IndexedDB. Dos dispositivos que han modificado el mismo documento sin conexión
fusionan sus cambios automáticamente, sin conflictos y sin que «gane la última versión».

Tres formas de conectar los dispositivos (panel **Sincronizar**):

1. **Emparejamiento directo (WebRTC)**: el dispositivo A muestra un código QR de invitación, B lo escanea (o pega el código)
   y muestra un código QR de respuesta que A escanea a su vez. A partir de ahí la conexión está cifrada de extremo a extremo (DTLS),
   en tiempo real. En wifi local no se usa ningún servidor; la opción «por Internet» usa un servidor STUN público
   solo para descubrir la dirección pública (ningún dato pasa por él). Hay que repetirlo cada vez que se abre la aplicación.
2. **Carpeta compartida** (Windows / Linux): elige una carpeta sincronizada con Syncthing, una memoria USB o un recurso de red compartido.
   Cada dispositivo escribe ahí su propio archivo `mythos-<id>.mythos` y lee los de los demás cada 5 s.
3. **Archivo `.mythos`**: exportación/importación manual de todo el espacio (correo, memoria USB…). La importación fusiona, no sobrescribe nada.

Los dispositivos retransmiten los cambios: si A está conectado a B y B a C, los cambios de A llegan a C.

## Formatos compatibles

| | Importar | Exportar |
|---|---|---|
| Texto | .docx, .html, .txt, .md | .docx, PDF (impresión) |
| Hoja de cálculo | .xlsx, .xls, .ods, .csv | .xlsx, .csv |
| Presentaciones | .pptx | .pptx, PDF (impresión) |

Consulta [docs/ANALYSE.md](../../docs/ANALYSE.md) (en francés) para ver el análisis del funcionamiento de Word, Excel y PowerPoint que guió el diseño.

## Estructura

```
src/main.js            inicio, enrutamiento, importación de archivos
src/store.js           almacenamiento local (Y.Doc + IndexedDB), biblioteca
src/sync/              protocolo de sincronización, WebRTC, carpeta compartida, interfaz
src/apps/writer.js     procesador de textos (ProseMirror/Tiptap)
src/apps/sheet.js      hoja de cálculo (cuadrícula canvas)
src/apps/formula.js    motor de fórmulas
src/apps/slides.js     presentaciones
src/io/                conversiones docx / xlsx / pptx
electron/              aplicación de escritorio (Windows, Linux)
android/               proyecto Android (Capacitor)
```

## Limitaciones conocidas

- Texto: sin control de cambios, comentarios, encabezados/pies de página ni paginación real en pantalla
  (los saltos de página se respetan al imprimir y en el .docx).
- Hoja de cálculo: sin gráficos, combinación de celdas, formato condicional ni tablas dinámicas;
  la importación de .xlsx recupera valores, fórmulas, anchos de columna y negrita, no todos los estilos.
- Presentaciones: un estilo por cuadro de texto (sin formato palabra a palabra), sin animaciones;
  la importación de .pptx recupera textos, formas, imágenes, colores y notas, pero no los patrones ni los temas.
- El emparejamiento directo hay que repetirlo en cada inicio (no hay servidor para encontrar los dispositivos).
