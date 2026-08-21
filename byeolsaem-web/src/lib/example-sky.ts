import { computeChart, type Chart } from "./chart";
import { assembleReading, type Reading } from "./reading";

/**
 * 예시 하늘 — 출생 정보를 넣기 전의 /natal이 보여주는 고정 차트.
 *
 * 왜 예시가 먼저인가: 정보가 없으면 결과물의 생김새를 알 길이 없었고, 그 상태로
 * "생일·시각·장소부터 내라"는 순서였다(시안 2026-08-22 승인). 예시를 실제 결과와
 * 같은 조립기로 렌더하면 예시가 곧 결과물의 정직한 미리보기가 된다.
 *
 * 날짜는 임의의 과거 한 시점이다. 실존 인물의 것이 아니고, 화면이 날짜·시각·장소를
 * 처음부터 밝힌다 — 개인화인 척하지 않는 것이 이 기능의 신뢰 조건이다.
 * 시각이 있는 차트라 상승궁까지 전부 보인다.
 */
export const EXAMPLE_BIRTH = {
  /** 화면에 그대로 보여 주는 문구. 계산 입력과 어긋나면 안 된다(테스트가 지킨다). */
  label: "1995년 7월 14일 오전 9시 30분, 서울에서 태어난 사람의 하늘",
  date: "1995-07-14",
  time: "09:30",
  latitude: 37.5665,
  longitude: 126.978,
  timezoneOffsetHours: 9,
} as const;

/** 모듈 로드 시 한 번만 계산한다. 결정론이라 캐시가 곧 정답이다. */
let cached: { chart: Chart; reading: Reading } | null = null;

export function exampleSky(): { chart: Chart; reading: Reading } {
  if (!cached) {
    const chart = computeChart({
      date: EXAMPLE_BIRTH.date,
      time: EXAMPLE_BIRTH.time,
      latitude: EXAMPLE_BIRTH.latitude,
      longitude: EXAMPLE_BIRTH.longitude,
      timezoneOffsetHours: EXAMPLE_BIRTH.timezoneOffsetHours,
    });
    cached = { chart, reading: assembleReading(chart, null) };
  }
  return cached;
}
