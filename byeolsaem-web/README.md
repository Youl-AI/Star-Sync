# 별샘 (byeolsaem.com) — 리뉴얼 프론트엔드

별샘 리뉴얼 B 서브프로젝트의 프론트엔드다. 태어난 순간의 실제 하늘로 읽는
천궁도 해석 서비스의 랜딩 페이지 및 입력 흐름(의식형 온보딩)을 담고 있다.

## 스택

- **Next.js 16** — App Router, 정적 export (`output: "export"`)
- **Tailwind CSS 4** — `@theme` 토큰 기반 색상/타이포 시스템
- **React Three Fiber / three.js** — WebGL 별하늘 배경 (`SkyBackdrop`)
- **GSAP (Flip 플러그인)** — 히어로 시퀀스 전환 애니메이션
- **Lenis** — 부드러운 스크롤
- **Vitest** — 유닛 테스트 (`src/lib/*`)

폰트(Pretendard Variable, MaruBuri)는 npm 패키지가 아니라 `src/fonts/`에 직접
포함된 파일을 `next/font/local`로 로드한다.

## 개발

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 정적 export 빌드 (out/)
npm test         # vitest run
npx tsc --noEmit # 타입 체크
```

## 아직 배포용이 아님

이 리포는 랜딩 페이지와 입력 흐름(도착 → CTA → 4단계 입력 → 결과 목업)까지만
구현돼 있다. 다음이 아직 준비되지 않았다:

- `/today`, `/natal`, `/synastry`, `/yearly` 등 서브페이지 미구현 (링크만 존재)
- 실제 천궁도 계산 백엔드 미연결 — 결과 화면은 목업 데이터
- 정적 export이므로 서버 사이드 로직(연도 계산 등)은 클라이언트 마운트 시점에
  런타임으로 채워야 한다 (`TodayDate.tsx`, `getFortuneYear` 참고)

메인 랜딩 페이지 단독 데모 목적으로만 배포/공유할 것.
