import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { POSTS, formatPublished, getPost } from "../content/blog";

const CONTENT_DIR = join(process.cwd(), "src/content/blog");

describe("칼럼 목록", () => {
  it("주소가 겹치지 않는다", () => {
    const slugs = POSTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("주소에 슬래시나 공백이 없다", () => {
    for (const post of POSTS) {
      expect(post.slug, post.title).not.toMatch(/[/\s?#]/);
    }
  });

  it("최신 글이 앞에 온다", () => {
    for (let i = 1; i < POSTS.length; i += 1) {
      expect(
        POSTS[i - 1].published >= POSTS[i].published,
        `${POSTS[i - 1].slug}가 ${POSTS[i].slug}보다 뒤에 나온다`,
      ).toBe(true);
    }
  });

  it("발행일이 YYYY-MM-DD다", () => {
    for (const post of POSTS) {
      expect(post.published, post.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(post.published)), post.slug).toBe(false);
    }
  });

  /**
   * 요약은 목록에도 나가고 검색 결과의 설명으로도 나간다. 너무 짧으면 클릭할
   * 이유가 없고, 너무 길면 검색 결과에서 잘린다.
   */
  it("요약이 검색 결과에 실릴 만한 길이다", () => {
    for (const post of POSTS) {
      expect(post.summary.length, post.slug).toBeGreaterThan(40);
      expect(post.summary.length, post.slug).toBeLessThan(160);
      expect(post.title.length, post.slug).toBeLessThan(60);
    }
  });

  it("슬러그로 글을 찾는다", () => {
    expect(getPost("수성역행-생존-가이드")?.title).toContain("수성 역행");
    expect(getPost("없는-글")).toBeUndefined();
  });

  it("발행일을 사람이 읽는 형태로 적는다", () => {
    expect(formatPublished("2026-03-14")).toBe("2026. 3. 14");
  });
});

describe("칼럼 본문", () => {
  const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));

  it("목록에 걸리지 않은 본문 파일이 남아 있지 않다", () => {
    // 파일만 만들고 목록에 올리지 않으면 아무 데서도 닿을 수 없는 글이 된다.
    expect(files.length).toBe(POSTS.length);
  });

  it("모든 본문이 실려 있고 분량이 있다", () => {
    for (const file of files) {
      const body = readFileSync(join(CONTENT_DIR, file), "utf8");
      expect(body.replace(/\s/g, "").length, file).toBeGreaterThan(700);
      expect(body, file).toContain("## ");
    }
  });

  /**
   * CommonMark는 닫는 `**` 바로 앞이 문장부호이고 뒤가 글자면 강조를 닫지
   * 못한다. 한국어에서는 `**'가면'**이자`처럼 아주 흔한 모양이라 그대로 두면
   * 별표가 화면에 그대로 나온다(실측). 그런 자리는 <strong>으로 쓴다.
   */
  it("한국어 조사에 막혀 열린 채로 끝나는 강조가 없다", () => {
    for (const file of files) {
      const body = readFileSync(join(CONTENT_DIR, file), "utf8");
      const broken = [...body.matchAll(/\*\*(.+?)\*\*(.)/g)].filter(
        ([, inner, after]) => /['"’”)\]}.,!?-]$/.test(inner) && /[\p{L}\p{N}]/u.test(after),
      );
      expect(broken.map((m) => m[0]), file).toEqual([]);
    }
  });
});
