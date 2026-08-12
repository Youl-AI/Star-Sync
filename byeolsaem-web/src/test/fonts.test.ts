import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * 제목 폰트(마루부리)는 저장소 안의 글자만 남기고 잘라 쓴다. 통짜 파일이 865KB인데
 * 그중 실제로 화면에 나가는 글자는 일부라서, 그대로 두면 페이지에서 제일 무거운
 * 자원이 된다(RENEWAL_PLAN §11.6, §7의 LCP 예산).
 *
 * 잘라 쓰면 대가가 하나 생긴다 — 새 글을 쓰고 `python scripts/subset-maruburi.py`를
 * 다시 돌리지 않으면, 그 글자만 제목 한가운데서 본문 폰트로 떨어진다. 한 글자라
 * 화면을 직접 열어 보지 않으면 알아채기 어렵고, 알아챘을 때는 이미 배포된 뒤다.
 *
 * 그래서 여기서 막는다. 서브셋이 무엇을 남겼는지는 스크립트가 적어 두고, 이 테스트가
 * 저장소의 글자와 맞춰 본다.
 */

const ROOT = join(import.meta.dirname, "..", "..");
const SOURCE_SUFFIXES = [".ts", ".tsx", ".mdx", ".css"];

function collectSources(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      collectSources(path, found);
    } else if (SOURCE_SUFFIXES.some((suffix) => entry.endsWith(suffix))) {
      found.push(path);
    }
  }
  return found;
}

describe("마루부리 서브셋", () => {
  const subset = new Set(readFileSync(join(ROOT, "src/fonts/maruburi-subset.txt"), "utf8"));

  it("저장소에 쓰인 글자를 모두 담고 있다", () => {
    const missing = new Set<string>();
    for (const path of collectSources(join(ROOT, "src"))) {
      for (const character of readFileSync(path, "utf8")) {
        // 공백·줄바꿈은 글리프가 필요 없고, 서브셋 목록에도 없다.
        if (/\s/.test(character)) continue;
        if (!subset.has(character)) missing.add(character);
      }
    }

    expect(
      [...missing].join(""),
      "서브셋에 없는 글자입니다. `python scripts/subset-maruburi.py`를 다시 돌리세요.",
    ).toBe("");
  });

  it("잘라 낸 파일이 통짜보다 확실히 작다", () => {
    // 원본은 Regular 424KB / Bold 441KB다. 스크립트를 돌리지 않고 통짜를 그대로
    // 커밋해 버리는 실수를 여기서 잡는다.
    for (const name of ["MaruBuri-Regular.woff2", "MaruBuri-Bold.woff2"]) {
      const bytes = statSync(join(ROOT, "src/fonts", name)).size;
      expect(bytes, `${name}가 너무 큽니다 — 서브셋을 거치지 않은 파일로 보입니다`).toBeLessThan(
        260 * 1024,
      );
    }
  });
});
