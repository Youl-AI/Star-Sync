# ✨ Star Sync : AI 점성학 운세 & 천궁도 분석 서비스

> **배포 주소:** [https://daily-star-sync.vercel.app](https://daily-star-sync.vercel.app)
> 
> **개발 기간:** 2026.01 ~ 2026.02 (약 1개월)
> 
> **개발 인원:** 1인 (기획, 디자인, 프론트엔드, 백엔드 전체 구현)

---

## 📌 1. 프로젝트 소개 (Introduction)
전통적인 점성학(Astrology)의 천궁도(Natal Chart) 계산 로직에 **생성형 AI(Google Gemini)** 를 결합하여, 사용자의 생년월일시와 위치 정보를 기반으로 개인화된 인생 전략과 운세를 제공하는 풀스택 웹 서비스입니다. 기존의 정적인 텍스트 운세에서 벗어나, 동적인 우주 UI와 SNS 공유에 최적화된 결과 포스터를 제공합니다.

---

## 🛠 2. 기술 스택 (Tech Stack)
- **Frontend:** HTML5, CSS3, Vanilla JavaScript, `html2canvas` (이미지 렌더링), Kakao SDK (공유 기능)
- **Backend:** Python, FastAPI, `Kerykeion` (천궁도 계산), `Geopy` (위치 좌표 변환)
- **AI / API:** Google Gemini 3.0 Flash Preview API
- **Deployment & Analytics:** Vercel (Frontend 배포 및 Analytics), Render (Backend 배포), Google Search Console (SEO)

---

## 🚀 3. 핵심 기능 (Key Features)
1. **정밀 천궁도 계산:** Geopy를 통한 정확한 위경도/타임존 추출 후 Kerykeion 라이브러리로 행성(Sun, Moon, Rising 등) 배치 계산
2. **AI 맞춤형 운세 생성:** Gemini API 프롬프트 엔지니어링을 통해 '키워드, 테마, 종합 점수, 럭키 아이템' 형태의 정형화된 JSON/Dict 응답 추출
3. **결과 카드 캡처 & 공유:** `html2canvas`를 활용해 분석 결과를 인스타그램/카카오톡 공유에 최적화된 포스터 이미지(1200x1600)로 렌더링 후 다운로드
4. **수익화 연동 (BM):** 사용자의 럭키 아이템을 쿠팡 파트너스 트래킹 링크와 자동 연결하여 제휴 마케팅 수익 창출 지원
5. **다국어 지원 (i18n):** JavaScript 기반 상태 관리를 통한 한국어(KR) / 영어(EN) 실시간 번역 지원

---

## ⚙️ 4. 시스템 아키텍처 (Architecture)
1. **Client Request:** 사용자가 생년월일/고민 입력 ➔ Frontend에서 검증 후 Backend(FastAPI)로 데이터 전송
2. **Data Processing:** Backend에서 Geopy로 좌표 변환 ➔ Kerykeion으로 행성 위치 데이터(Chart Data) 연산
3. **AI Interpretation:** 계산된 차트 데이터와 고민 내용을 조합하여 Gemini API에 전송 (프롬프트 제어)
4. **Parsing & Response:** AI의 자연어 응답을 정규표현식(Regex)으로 파싱하여 Keyword와 Report 본문 분리 ➔ Frontend로 JSON 응답
5. **Rendering:** Frontend에서 동적 UI 생성 및 html2canvas로 공유용 카드 이미지 렌더링

---

## 💡 5. 핵심 트러블슈팅 (Troubleshooting & Problem Solving)

### ① AI의 비정형 텍스트에서 정확한 '키워드' 파싱 (Prompt & Regex)
* **문제:** AI에게 사용자의 고민을 전달했을 때, 해시태그용 키워드(예: `#건강운`)만 추출해야 하나 불필요한 서술어나 특수기호가 섞여 출력되는 포맷 불안정성 발생.
* **해결:** 백엔드(FastAPI)의 시스템 프롬프트(f-string)를 개선하여 무조건 첫 줄에 `[키워드] OO운` 형태로 출력하도록 강제함. 이후 파이썬의 **정규표현식(`re.search`)**을 사용해 빈 줄이나 특수기호가 섞이더라도 정확하게 키워드 그룹만 파싱하여 프론트엔드로 전달하는 로직 구현.

### ② html2canvas 캡처 시 레이아웃 붕괴 현상 해결
* **문제:** 웹 브라우저 화면에서는 정상적으로 렌더링되는 UI가, 이미지 캡처(`html2canvas`) 시 여백(Margin)이 무시되거나 내부 요소가 캔버스 밖으로 밀려나는 렌더링 버그 발생.
* **해결:** 전체 웹용 CSS와 캡처 카드용 CSS 공간을 완전 분리. `.share-card` 하위 선택자에만 적용되는 캡처 전용 `!important` 값들을 별도 지정하고, 캔버스가 인식하는 상하단 공백을 강제 조정하는 스크립트를 적용하여 1200x1600 비율의 완벽한 캡처 퀄리티 확보.

### ③ 쿠팡 파트너스 수익 트래킹 누락(API 리다이렉트) 이슈 우회
* **문제:** 동적 검색어 주소(`www.coupang.com/np/search...`)로 제휴 링크를 동적 구성했으나, 쿠팡 보안 정책상 정상 발급된 파트너스 단축 링크가 아니면 클릭 및 수익 트래킹이 유실되고 메인 홈으로 튕기는 현상 발견.
* **해결:** 15만 원 매출 달성 전까지 파트너스 API 사용이 불가한 딜레마를 해결하기 위해, 공식 간편 링크 기반의 라우팅 구조로 즉시 수정. 버튼 텍스트를 직관적으로 변경(`(쿠팡에서 검색)`)하여 UX를 해치지 않으면서도, 클릭수 100% 집계 및 24시간 쿠키(Cookie) 기반의 수익 창출이 정상 작동하도록 로직 우회 적용.

---

## 🎓 6. 프로젝트를 통해 배운 점 (Learnings)
- AI에게 단순히 좋은 대답을 요구하는 것을 넘어, 시스템이 파싱할 수 있는 '**엄격한 포맷(JSON, 특수기호 규칙)**'을 강제하고, 이를 정규식으로 안전하게 추출해 내는 파이프라인 설계 역량을 길렀습니다.
- 단순한 프론트엔드/백엔드 연동을 넘어, 외부 API(Google Gemini, Kakao SDK, Coupang Partners)들의 **각기 다른 정책과 응답 형식을 능동적으로 핸들링하는 능력**을 길렀습니다.
- 서비스 배포(Vercel, Render) 후 **Google Analytics 연결 및 SEO 메타 태그(Open Graph) 최적화**를 통해, 단순히 '기능 구현'에서 끝나는 것이 아니라 '실제 유저를 유입시키고 운영하는 관점'을 배우게 되었습니다.
