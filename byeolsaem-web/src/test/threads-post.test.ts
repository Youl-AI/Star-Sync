import { describe, expect, it } from "vitest";
import { buildPost } from "../../scripts/post-threads.mjs";

/**
 * 스레드에 매일 나가는 글.
 *
 * 사람이 매번 읽어 보고 내보내는 글이 아니라서, 어색한 문장이 나와도 그대로
 * 올라간다. 그래서 문장이 깨지는 조건을 여기에 박아 둔다.
 */

const at = (iso: string) => new Date(iso);

describe("오늘의 하늘 게시글", () => {
  it("네 가지를 빠짐없이 담는다", () => {
    const post = buildPost(at("2026-09-04T07:30:00+09:00"));
    expect(post).toContain("9월 4일");
    expect(post).toMatch(/달은 .+자리에 있습니다/);
    expect(post).toMatch(/태양은 .+자리 \d+도를 지납니다/);
    expect(post).toContain("byeolsaem.com/today");
  });

  it("스레드 글자 수(500자) 안에 들어온다", () => {
    // 역행이 겹치는 날이 가장 길다 — 2026년 가을은 수성과 금성이 함께 역행한다.
    for (const day of ["2026-09-04", "2026-10-25", "2026-11-01", "2026-12-24"]) {
      const post = buildPost(at(`${day}T07:30:00+09:00`));
      expect([...post].length, `${day}: ${post.length}자`).toBeLessThan(500);
    }
  });

  /**
   * 신월 당일에 "신월을 지나는 중"이라고 써 놓고 같은 신월을 "다음 신월은
   * 9월 11일"이라고 다시 가리키던 문장을 고친 자리다(2026-09-04). 오늘이나
   * 내일 오는 삭망은 날짜 대신 오늘·내일로 부른다.
   */
  it("오늘 오는 삭망을 앞날로 가리키지 않는다", () => {
    // 9월 11일 12:28 처녀자리 신월. 워크플로가 도는 아침 시각에 만들어 본다.
    const post = buildPost(at("2026-09-11T07:30:00+09:00"));
    expect(post).toContain("오늘 12시 28분");
    expect(post).not.toContain("다음 신월");
  });

  it("내일 오는 삭망은 내일이라고 부른다", () => {
    const post = buildPost(at("2026-09-10T07:30:00+09:00"));
    expect(post).toContain("내일 12시 28분");
    expect(post).not.toMatch(/다음 신월은 9월 11일/);
  });

  it("먼 삭망은 날짜로 적는다", () => {
    const post = buildPost(at("2026-09-04T07:30:00+09:00"));
    expect(post).toContain("다음 신월은 9월 11일 12시 28분");
  });

  it("역행하는 별이 있는 날에만 그 문단이 붙는다", () => {
    // 10월 25일 — 수성과 금성이 함께 역행하는 구간이다.
    expect(buildPost(at("2026-10-25T07:30:00+09:00"))).toContain("역행 중입니다");
    // 9월 4일 — 셋 다 순행이다.
    expect(buildPost(at("2026-09-04T07:30:00+09:00"))).not.toContain("역행 중입니다");
  });
});
