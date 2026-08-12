import { describe, expect, it } from "vitest";
import {
  TRACK_WIDTH,
  centerFraction,
  maxShift,
  monthTicks,
  pickEventIndex,
  trackX,
} from "@/lib/year-track";

// 가로 강의 계산. 그림 없이도 검산할 수 있어야 하는 것들 — 특히 "한 해 전체가
// 읽는 선을 지나가는가"는 눈으로 확인하기 어렵다(12월 사건 하나가 끝내 짚이지
// 않는 형태로만 드러난다).

describe("year-track 기하", () => {
  it("달 눈금은 12개, 1월 1일이 강의 머리다", () => {
    const ticks = monthTicks(2026);
    expect(ticks).toHaveLength(12);
    expect(ticks[0].at).toBe(0);
    for (let i = 1; i < 12; i += 1) expect(ticks[i].at).toBeGreaterThan(ticks[i - 1].at);
    expect(ticks[11].at).toBeLessThan(1);
  });

  it("창보다 넓은 만큼만 밀 수 있다", () => {
    expect(maxShift(800)).toBe(TRACK_WIDTH - 800);
    expect(maxShift(TRACK_WIDTH + 100)).toBe(0);
  });

  it("어떤 본문 폭에서도 한 해 전체가 읽는 선을 지난다", () => {
    // 강이 놓이는 본문 열은 max-w-5xl 안이라 1040px을 넘지 못한다.
    for (const clip of [640, 820, 1040]) {
      const start = centerFraction(0, clip);
      const end = centerFraction(maxShift(clip), clip);
      expect(start).toBeLessThanOrEqual(0); // 1월 1일이 선의 오른쪽에서 출발하고
      expect(end).toBeGreaterThanOrEqual(1); // 12월 31일이 선을 넘어 왼쪽으로 간다
    }
  });

  it("읽는 선이 노드 바로 위에 왔을 때 그 사건이 짚인다", () => {
    const clip = 820;
    const at = 0.42;
    // 노드(trackX(at))가 창 가운데 오도록 트랙을 민 상태
    const shift = trackX(at) - clip / 2;
    const events = [{ exact: [{ at: 0.1 }] }, { exact: [{ at: 0.42 }] }, { exact: [{ at: 0.9 }] }];
    expect(pickEventIndex(centerFraction(shift, clip), events)).toBe(1);
  });

  it("아직 아무 노드도 지나지 않았으면 -1", () => {
    expect(pickEventIndex(-0.02, [{ exact: [{ at: 0.1 }] }])).toBe(-1);
  });

  it("여러 번 지나는 사건은 첫 날짜 기준으로 짚인다", () => {
    const events = [{ exact: [{ at: 0.2 }, { at: 0.6 }] }, { exact: [{ at: 0.4 }] }];
    // 0.5 시점: 두 사건 모두 첫 날짜는 지났고, 마지막으로 지난 것은 0.4쪽이다
    expect(pickEventIndex(0.5, events)).toBe(1);
  });
});
