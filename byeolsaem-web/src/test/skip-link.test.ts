import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * 건너뛰기 링크는 `#main`을 겨눈다(components/nav/SkipLink.tsx).
 *
 * 그 과녁은 페이지마다 자기 `<main>`이 갖는다. 새 페이지를 만들면서 `id`를
 * 빠뜨리면 링크는 그대로 보이는데 눌러도 아무 데도 가지 않는다 — 화면으로는
 * 차이가 없고, axe도 건너뛰기 링크 자체를 위반으로 잡지 않아 감사에도 안 걸린다.
 */

const SRC = join(import.meta.dirname, "..");

function collect(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) collect(path, found);
    else if (/\.tsx$/.test(entry)) found.push(path);
  }
  return found;
}

describe("건너뛰기 링크", () => {
  it("본문 요소는 모두 과녁을 갖는다", () => {
    const offenders = collect(SRC).filter((path) => {
      const source = readFileSync(path, "utf8");
      const opening = source.match(/<main[\s>]/g);
      if (!opening) return false;
      return !source.includes('<main id="main" tabIndex={-1}');
    });
    expect(offenders.map((path) => path.slice(SRC.length))).toEqual([]);
  });

  it("과녁 이름은 링크가 겨누는 것과 같다", () => {
    const link = readFileSync(join(SRC, "components", "nav", "SkipLink.tsx"), "utf8");
    expect(link).toContain('href="#main"');
  });
});
