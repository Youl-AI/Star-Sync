import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * 내부 링크는 `@/components/ui/Link`를 거친다.
 *
 * 거기서 프리페치를 꺼 두었기 때문이다(그 파일의 주석 참고 — 정적 export에서
 * 프리페치가 전부 404로 떨어진다). 새 컴포넌트를 쓰면서 무심코 `next/link`를
 * 직접 가져오면 그 링크만 404를 다시 뱉기 시작하는데, 화면으로는 아무 차이가
 * 없어 알아채기 어렵다. 그래서 여기서 막는다.
 */

const SRC = join(import.meta.dirname, "..");
const ALLOWED = join("components", "ui", "Link.tsx");
/** 찾는 문자열을 쪼개서 만든다 — 통째로 적으면 이 파일이 자기 자신에게 걸린다. */
const NEEDLE = 'from "next/' + 'link"';

function collect(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) collect(path, found);
    else if (/\.tsx?$/.test(entry)) found.push(path);
  }
  return found;
}

describe("내부 링크", () => {
  it("next/link를 직접 가져오는 곳은 래퍼 하나뿐이다", () => {
    const offenders = collect(SRC)
      .filter((path) => !path.endsWith(ALLOWED))
      .filter((path) => readFileSync(path, "utf8").includes(NEEDLE));
    expect(offenders.map((path) => path.slice(SRC.length))).toEqual([]);
  });
});
