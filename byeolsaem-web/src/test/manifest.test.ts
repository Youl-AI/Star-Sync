import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("PWA manifest", () => {
  const raw = readFileSync(
    join(import.meta.dirname, "..", "..", "public", "manifest.webmanifest"),
    "utf-8",
  );
  const manifest = JSON.parse(raw);

  it("설치에 필요한 필드가 전부 있다", () => {
    expect(manifest.name).toBe("별샘");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
    expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(true);
  });
  it("테마색이 사이트 잉크색이다", () => {
    expect(manifest.theme_color).toBe("#0b1026");
    expect(manifest.background_color).toBe("#0b1026");
  });
});
