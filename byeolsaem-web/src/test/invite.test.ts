import { describe, expect, it } from "vitest";
import {
  decodeInvite, encodeInvite, INVITE_CONSENT, inviteUrl, readInviteFromHash,
} from "@/lib/invite";

const P = { date: "1995-07-14", time: "09:30", city: "서울특별시" };

describe("invite 왕복", () => {
  it("encode→decode가 동일하다 (time null 포함)", () => {
    expect(decodeInvite(encodeInvite(P))).toEqual(P);
    const noTime = { ...P, time: null };
    expect(decodeInvite(encodeInvite(noTime))).toEqual(noTime);
  });
  it("인코딩 결과는 URL-안전 문자뿐이다 (한글 도시 포함)", () => {
    expect(encodeInvite(P)).toMatch(/^[A-Za-z0-9_-]+$/);
  });
  it("변조·깨짐은 전부 null", () => {
    expect(decodeInvite("!!!not-base64!!!")).toBeNull();
    expect(decodeInvite("")).toBeNull();
    // 형식 위반: 날짜 아님
    expect(decodeInvite(encodeInvite({ ...P, date: "9999-99" } as never))).toBeNull();
    // 필드 누락
    const partial = btoa(JSON.stringify({ date: "1995-07-14" }))
      .replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
    expect(decodeInvite(partial)).toBeNull();
  });
  it("inviteUrl은 fragment를 쓴다", () => {
    expect(inviteUrl(P)).toMatch(/^https:\/\/byeolsaem\.com\/synastry#i=[A-Za-z0-9_-]+$/);
  });
  it("readInviteFromHash — #i= 접두를 벗기고 읽는다, 아니면 null", () => {
    const url = inviteUrl(P);
    expect(readInviteFromHash(url.slice(url.indexOf("#")))).toEqual(P);
    expect(readInviteFromHash("#other=1")).toBeNull();
    expect(readInviteFromHash("")).toBeNull();
  });
  it("동의 문구 원문이 스펙과 같다", () => {
    expect(INVITE_CONSENT).toBe(
      "링크에는 내 생년월일시와 출생지가 담깁니다. 궁합을 보고 싶은 사람에게만 보내세요.",
    );
  });
  it("consumeInviteHash — 스크럽이 옮겨 둔 해시를 우선 읽는다", async () => {
    const { consumeInviteHash } = await import("@/lib/invite");
    (globalThis as { window?: unknown }).window = {
      __inviteHash: `#i=${encodeInvite(P)}`,
      location: { hash: "" },
    };
    expect(consumeInviteHash()).toEqual(P);
    delete (globalThis as { window?: unknown }).window;
  });
});
