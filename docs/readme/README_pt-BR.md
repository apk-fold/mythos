<div align="center">

[English](README_en.md) · [简体中文](README_zh.md) · [繁體中文](README_zh-TW.md) · [日本語](README_ja.md) · [한국어](README_ko.md) · [Türkçe](README_tr.md) · [Русский](README_ru.md) · [Tiếng Việt](README_vi.md) · [ไทย](README_th.md) · [Deutsch](README_de.md) · [Español](README_es.md) · [Français](../../README.md) · [Українська](README_uk.md) · [Polski](README_pl.md) · **Português (Brasil)** · [العربية](README_ar.md) · [فارسی](README_fa.md) · [Bahasa Indonesia](README_id.md) · [Italiano](README_it.md)
· [Ελληνικά](README_el.md) · [മലയാളം](README_ml.md) · [Roman Urdu](README_ur-Latn.md) · [Română](README_ro.md)

</div>

# Mythos — pacote de escritório local, sincronizado sem servidor

![Início](../../docs/screenshots/home.png)

| Texto | Planilha | Apresentações |
|---|---|---|
| ![](../../docs/screenshots/writer.png) | ![](../../docs/screenshots/sheet.png) | ![](../../docs/screenshots/slides.png) |

| Configurações | Modo escuro |
|---|---|
| ![](../../docs/screenshots/settings.png) | ![](../../docs/screenshots/home-dark.png) |

**Sincronização por código de 4 dígitos**: em um aparelho, *Sincronização → Mostrar um código*; no outro, *Digitar um código*. O código serve apenas para os aparelhos se encontrarem em um relay (ntfy.sh, alterável nas Configurações), e o convite é criptografado lá. Depois disso, seus documentos passam diretamente de um aparelho para o outro.

Processador de texto, planilha e apresentações em um único aplicativo, para **Windows, Linux e Android**.
Os arquivos ficam nos seus aparelhos; a sincronização acontece diretamente de aparelho para aparelho.

## Instalar

| Sistema | Arquivo | Local |
|---|---|---|
| Windows | `Mythos-Setup-1.1.0.exe` (instalador) ou `Mythos-Portable-1.1.0.exe` | `release/` |
| Linux | `Mythos-1.1.0-x64.tar.gz` (extraia e execute `./mythos`); o AppImage é compilado no Linux com `npm run dist:linux` | `release/` |
| Android | `app-debug.apk` | `android/app/build/outputs/apk/debug/` |

Os arquivos não são assinados: o Windows SmartScreen vai pedir "Mais informações → Executar assim mesmo",
e o Android vai pedir para permitir a instalação de apps de fontes desconhecidas.

## Recompilar

```sh
npm install
npm run dev          # versão de navegador para desenvolver (http://localhost:5173)
npm start            # aplicativo de desktop
npm run dist:win     # instalador do Windows → release/
npm run dist:linux   # AppImage + tar.gz → release/ (de preferência no Linux)
npm run android      # copia o site para android/, e depois:
cd android && gradlew assembleDebug   # JAVA_HOME = JDK 21
```

## Sincronização sem servidor

Cada documento é um **CRDT do Yjs** armazenado no IndexedDB. Dois aparelhos que editaram o mesmo documento offline
mesclam suas alterações automaticamente, sem conflito e sem "a última versão vence".

Três formas de conectar os aparelhos (painel **Sincronizar**):

1. **Pareamento direto (WebRTC)**: o aparelho A mostra um QR code de convite, B o escaneia (ou cola o código)
   e mostra um QR code de resposta, que A escaneia por sua vez. A conexão passa a ser criptografada de ponta a ponta (DTLS),
   em tempo real. Em Wi-Fi local nenhum servidor é usado; a opção "pela Internet" usa um servidor STUN público
   apenas para descobrir o endereço público (nenhum dado passa por ele). É preciso refazer a cada abertura do aplicativo.
2. **Pasta compartilhada** (Windows / Linux): escolha uma pasta sincronizada pelo Syncthing, um pendrive ou um compartilhamento de rede.
   Cada aparelho grava ali o próprio arquivo `mythos-<id>.mythos` e lê os dos outros a cada 5 s.
3. **Arquivo `.mythos`**: exportação/importação manual de todo o espaço (e-mail, pendrive…). A importação mescla, não sobrescreve nada.

Os aparelhos repassam as alterações: se A está conectado a B e B a C, as alterações de A chegam a C.

## Formatos suportados

| | Importação | Exportação |
|---|---|---|
| Texto | .docx, .html, .txt, .md | .docx, PDF (impressão) |
| Planilha | .xlsx, .xls, .ods, .csv | .xlsx, .csv |
| Apresentações | .pptx | .pptx, PDF (impressão) |

Veja [docs/ANALYSE.md](../../docs/ANALYSE.md) (em francês) para a análise do funcionamento do Word, Excel e PowerPoint que orientou o projeto.

## Estrutura

```
src/main.js            início, roteamento, importação de arquivos
src/store.js           armazenamento local (Y.Doc + IndexedDB), biblioteca
src/sync/              protocolo de sincronização, WebRTC, pasta compartilhada, interface
src/apps/writer.js     processador de texto (ProseMirror/Tiptap)
src/apps/sheet.js      planilha (grade em canvas)
src/apps/formula.js    motor de fórmulas
src/apps/slides.js     apresentações
src/io/                conversões docx / xlsx / pptx
electron/              aplicativo de desktop (Windows, Linux)
android/               projeto Android (Capacitor)
```

## Limitações conhecidas

- Texto: sem controle de alterações, comentários, cabeçalhos/rodapés nem paginação real na tela
  (as quebras de página são respeitadas na impressão e no .docx).
- Planilha: sem gráficos, mesclagem de células, formatação condicional nem tabelas dinâmicas;
  a importação de .xlsx recupera valores, fórmulas, larguras de coluna e negrito, não todos os estilos.
- Apresentações: um estilo por caixa de texto (sem formatação palavra por palavra), sem animações;
  a importação de .pptx traz textos, formas, imagens, cores e notas, mas não os mestres nem os temas.
- O pareamento direto precisa ser refeito a cada inicialização (não há servidor para encontrar os aparelhos).
