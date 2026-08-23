import { describe, expect, it } from "vitest";
import { composeCompositeReading, COMPOSITE_INTRO } from "@/components/synastry/composite-reading";
import { compositeChart } from "@/lib/composite";
import { computeChart } from "@/lib/chart";

describe("composeCompositeReading", () => {
  const composite = compositeChart(
    computeChart({ date: "1995-07-14", time: "09:30", latitude: 37.5665, longitude: 126.978, timezoneOffsetHours: 9 }),
    computeChart({ date: "1997-04-19", time: "20:10", latitude: 35.1796, longitude: 129.0756, timezoneOffsetHours: 9 }),
  );
  const reading = composeCompositeReading(composite);

  it("세 축이 전부 나오고 제목에 자리 이름이 붙는다", () => {
    expect(reading.sun.title).toContain("관계의 태양");
    expect(reading.moon.title).toContain("관계의 달");
    expect(reading.venus.title).toContain("관계의 금성");
    expect(reading.sun.title).toMatch(/자리/);
  });
  it("프레임과 본문이 완결 문장이다", () => {
    for (const axis of [reading.sun, reading.moon, reading.venus]) {
      expect(axis.frame.endsWith("다.")).toBe(true);
      expect(axis.body.endsWith("다.")).toBe(true);
    }
    expect(COMPOSITE_INTRO.endsWith("다.")).toBe(true);
  });
});
