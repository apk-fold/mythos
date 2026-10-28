<div align="center">

[English](README_en.md) · [简体中文](README_zh.md) · [繁體中文](README_zh-TW.md) · [日本語](README_ja.md) · **한국어** · [Türkçe](README_tr.md) · [Русский](README_ru.md) · [Tiếng Việt](README_vi.md) · [ไทย](README_th.md) · [Deutsch](README_de.md) · [Español](README_es.md) · [Français](../../README.md) · [Українська](README_uk.md) · [Polski](README_pl.md) · [Português (Brasil)](README_pt-BR.md) · [العربية](README_ar.md) · [فارسی](README_fa.md) · [Bahasa Indonesia](README_id.md) · [Italiano](README_it.md)
· [Ελληνικά](README_el.md) · [മലയാളം](README_ml.md) · [Roman Urdu](README_ur-Latn.md) · [Română](README_ro.md)

</div>

# Mythos — 로컬 오피스 제품군, 서버 없이 동기화

![홈](../../docs/screenshots/home.png)

| 문서 | 스프레드시트 | 프레젠테이션 |
|---|---|---|
| ![](../../docs/screenshots/writer.png) | ![](../../docs/screenshots/sheet.png) | ![](../../docs/screenshots/slides.png) |

| 설정 | 다크 모드 |
|---|---|
| ![](../../docs/screenshots/settings.png) | ![](../../docs/screenshots/home-dark.png) |

**4자리 코드로 동기화**: 한 기기에서 *동기화 → 코드 표시*, 다른 기기에서 *코드 입력*을 선택하세요. 코드는 릴레이(ntfy.sh, 설정에서 변경 가능)에서 서로를 찾는 데만 쓰이며, 초대는 그곳에서 암호화됩니다. 그다음부터 문서는 기기에서 기기로 직접 전송됩니다.

워드 프로세서, 스프레드시트, 프레젠테이션을 하나의 앱에 담았고, **Windows, Linux, Android**를 지원합니다.
파일은 여러분의 기기에 머물고, 동기화는 기기끼리 직접 이루어집니다.

## 설치

| 시스템 | 파일 | 위치 |
|---|---|---|
| Windows | `Mythos-Setup-1.1.0.exe`(설치 프로그램) 또는 `Mythos-Portable-1.1.0.exe` | `release/` |
| Linux | `Mythos-1.1.0-x64.tar.gz`(압축을 풀고 `./mythos` 실행); AppImage는 Linux에서 `npm run dist:linux`로 빌드 | `release/` |
| Android | `app-debug.apk` | `android/app/build/outputs/apk/debug/` |

파일은 서명되지 않았습니다: Windows SmartScreen에서는 "추가 정보 → 실행"을 선택해야 하고,
Android에서는 출처를 알 수 없는 앱의 설치를 허용하라고 요청합니다.

## 다시 빌드하기

```sh
npm install
npm run dev          # 개발용 브라우저 버전 (http://localhost:5173)
npm start            # 데스크톱 앱
npm run dist:win     # Windows 설치 프로그램 → release/
npm run dist:linux   # AppImage + tar.gz → release/ (가급적 Linux에서 실행)
npm run android      # 사이트를 android/에 복사한 다음:
cd android && gradlew assembleDebug   # JAVA_HOME = JDK 21
```

## 서버 없는 동기화

각 문서는 IndexedDB에 저장되는 **Yjs CRDT**입니다. 두 기기가 오프라인 상태에서 같은 문서를 수정하더라도
변경 사항이 자동으로 병합되며, 충돌도 없고 "마지막 버전이 이기는" 방식도 아닙니다.

기기를 연결하는 세 가지 방법(**동기화** 패널):

1. **직접 페어링(WebRTC)**: 기기 A가 초대 QR 코드를 표시하면 B가 이를 스캔(또는 코드 붙여넣기)하고
   응답 QR 코드를 표시하며, A가 다시 그것을 스캔합니다. 이후 연결은 종단 간 암호화(DTLS)되어
   실시간으로 동작합니다. 로컬 Wi-Fi에서는 서버를 전혀 쓰지 않으며, "인터넷을 통해" 옵션은 공개 STUN 서버를
   공인 주소를 알아내는 데만 사용합니다(데이터는 거치지 않음). 앱을 열 때마다 다시 해야 합니다.
2. **공유 폴더**(Windows / Linux): Syncthing으로 동기화되는 폴더, USB 메모리, 네트워크 공유 중 하나를 선택합니다.
   각 기기는 그곳에 자신의 `mythos-<id>.mythos` 파일을 쓰고, 다른 기기의 파일을 5초마다 읽습니다.
3. **`.mythos` 파일**: 작업 공간 전체를 직접 내보내기/가져오기(이메일, USB 메모리…). 가져오기는 병합 방식이라 아무것도 덮어쓰지 않습니다.

기기들은 변경 사항을 중계합니다: A가 B와, B가 C와 연결되어 있으면 A의 변경 사항이 C에도 도착합니다.

## 지원 형식

| | 가져오기 | 내보내기 |
|---|---|---|
| 문서 | .docx, .html, .txt, .md | .docx, PDF(인쇄) |
| 스프레드시트 | .xlsx, .xls, .ods, .csv | .xlsx, .csv |
| 프레젠테이션 | .pptx | .pptx, PDF(인쇄) |

설계의 바탕이 된 Word, Excel, PowerPoint 작동 방식 분석은 [docs/ANALYSE.md](../../docs/ANALYSE.md)(프랑스어)를 참고하세요.

## 구조

```
src/main.js            홈, 라우팅, 파일 가져오기
src/store.js           로컬 저장소(Y.Doc + IndexedDB), 라이브러리
src/sync/              동기화 프로토콜, WebRTC, 공유 폴더, 화면
src/apps/writer.js     워드 프로세서(ProseMirror/Tiptap)
src/apps/sheet.js      스프레드시트(canvas 그리드)
src/apps/formula.js    수식 엔진
src/apps/slides.js     프레젠테이션
src/io/                docx / xlsx / pptx 변환
electron/              데스크톱 앱(Windows, Linux)
android/               Android 프로젝트(Capacitor)
```

## 알려진 제한 사항

- 문서: 변경 내용 추적, 메모, 머리글/바닥글, 화면상의 실제 페이지 나누기가 없습니다
  (페이지 나누기는 인쇄할 때와 .docx에서는 반영됩니다).
- 스프레드시트: 차트, 셀 병합, 조건부 서식, 피벗 테이블이 없습니다.
  .xlsx 가져오기는 값, 수식, 열 너비, 굵게를 가져오지만 모든 스타일을 가져오지는 않습니다.
- 프레젠테이션: 텍스트 상자마다 하나의 스타일(단어별 서식 불가), 애니메이션 없음.
  .pptx 가져오기는 텍스트, 도형, 이미지, 색상, 메모를 가져오지만 마스터와 테마는 가져오지 않습니다.
- 직접 페어링은 실행할 때마다 다시 해야 합니다(기기를 찾아 줄 서버가 없기 때문).
