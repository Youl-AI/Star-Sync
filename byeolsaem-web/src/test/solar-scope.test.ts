import { describe, expect, it } from "vitest";
import { composeSolarReading } from "@/components/solar/solar-reading";
import { exampleSolarReturn } from "@/lib/example-sky";

describe("composeSolarReading", () => {
  const { chart } = exampleSolarReturn(new Date(Date.UTC(2026, 7, 23)));
  const reading = composeSolarReading(chart);

  it("세 축이 전부 나온다 (시각 있는 예시 차트)", () => {
    expect(reading.ascendant).not.toBeNull();
    expect(reading.sunHouse).not.toBeNull();
    expect(reading.moonSign).not.toBeNull();
  });
  it("각 축은 프레임 + 원자 본문으로 되어 있고 완결 문장이다", () => {
    for (const axis of [reading.ascendant!, reading.sunHouse!, reading.moonSign!]) {
      expect(axis.frame.endsWith("다.")).toBe(true);
      expect(axis.body.endsWith("다.")).toBe(true);
      expect(axis.title.length).toBeGreaterThan(2);
    }
  });
});
