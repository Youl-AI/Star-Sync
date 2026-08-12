// 가로로 흐르는 한 해의 강(스펙 §6.6, RENEWAL_PLAN §11.5 A단계 확정)의 기하.
//
// 화면 렌더링과 무관한 순수 계산이라 컴포넌트 밖에 둔다 — 노드가 실제 날짜
// 위에 앉는지, 화면 중앙선이 몇 월을 가리키는지는 브라우저 없이 검산할 수
// 있어야 한다.

/** 트랙 전체 폭. 화면 폭과 무관하게 고정 — 한 해가 이만큼의 길이를 가진다. */
export const TRACK_WIDTH = 3400;
export const TRACK_HEIGHT = 240;
// 양끝 여백은 강을 담는 창(clip) 반폭보다 커야 한다. 읽는 선이 창 가운데
// 붙박이이므로, 1월 1일이 그 선의 오른쪽에서 출발해 12월 31일이 왼쪽으로
// 다 지나가려면 강의 양끝 바깥에 창 반폭만큼의 빈 물이 있어야 한다.
// 강을 놓는 지면이 max-w-5xl(1024px) 안의 본문 열이라 창은 1040px을 넘지
// 못하고, 그래서 520이면 어떤 화면에서도 한 해 전체가 선을 지난다.
const LEFT = 520;
const RIGHT = TRACK_WIDTH - 520;

export function trackX(t: number): number {
  return LEFT + t * (RIGHT - LEFT);
}

/** 두 마루가 어긋나게 겹쳐 규칙적인 파도로 보이지 않게 한다. YearRiver와 같은 식. */
export function trackY(t: number): number {
  return 118 - 48 * Math.sin(2 * Math.PI * t) + 18 * Math.sin(4 * Math.PI * t + 0.9);
}

export const TRACK_PATH = Array.from({ length: 521 }, (_, i) => {
  const t = i / 520;
  return `${i === 0 ? "M" : "L"}${trackX(t).toFixed(1)} ${trackY(t).toFixed(1)}`;
}).join(" ");

/** 강줄기의 한 토막. 겹쳐 그으면 그 구간만 굵어진다. */
export function trackSpanPath(from: number, to: number): string {
  const steps = Math.max(2, Math.round((to - from) * 520));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = from + ((to - from) * i) / steps;
    return `${i === 0 ? "M" : "L"}${trackX(t).toFixed(1)} ${trackY(t).toFixed(1)}`;
  }).join(" ");
}

/** 그 해 각 달 1일이 한 해의 어디쯤인가. 달마다 길이가 다르므로 계산해서 찍는다. */
export function monthTicks(year: number): { month: number; at: number }[] {
  const start = Date.UTC(year - 1, 11, 31, 15);
  const span = Date.UTC(year, 11, 31, 15) - start;
  return Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    at: (Date.UTC(year, i, 1) - 9 * 3600_000 - start) / span,
  }));
}

/** 트랙이 왼쪽으로 밀릴 수 있는 최대 거리. 트랙이 창보다 좁으면 밀 것이 없다. */
export function maxShift(clipWidth: number): number {
  return Math.max(0, TRACK_WIDTH - clipWidth);
}

/**
 * 트랙이 shift만큼 밀렸을 때 화면(clip) 중앙선이 가리키는 한 해의 위치(0~1).
 * 진행 초에는 음수, 끝에는 1을 넘을 수 있다 — 강의 양 끝 여백이 화면 중앙을
 * 지나는 동안이다.
 */
export function centerFraction(shift: number, clipWidth: number): number {
  return (shift + clipWidth / 2 - LEFT) / (RIGHT - LEFT);
}

/**
 * 화면 중앙선을 지난 사건 중 마지막 것. 아직 아무것도 지나지 않았으면 -1.
 *
 * "지금 가장 가까운 것"이 아니라 "마지막으로 지난 것"인 이유: 다음 사건이
 * 다가온다고 설명이 미리 바뀌면, 강 위의 노드가 아직 중앙선 오른쪽에 있는데
 * 글은 이미 그 노드 이야기를 하고 있다 — 그림과 글이 어긋난다.
 */
export function pickEventIndex(
  centerT: number,
  events: { exact: { at: number }[] }[],
): number {
  let pick = -1;
  events.forEach((event, index) => {
    // 엡실론: 선이 노드 바로 위에 온 순간도 "지났다"로 센다. 픽셀 → 분수
    // 변환의 부동소수점 오차가 경계에서 어느 쪽으로 떨어질지 알 수 없다.
    if (event.exact[0].at <= centerT + 1e-9) pick = index;
  });
  return pick;
}
