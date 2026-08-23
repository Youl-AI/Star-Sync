/**
 * 궁합 초대 링크 — 내 출생 정보를 URL fragment에 담아 보낸다.
 *
 * fragment(#)인 이유: # 뒤는 브라우저 밖으로 나가지 않는다. 서버 로그도, Web
 * Analytics도, 리퍼러도 이 값을 보지 못한다. 정적 사이트라 서버에 맡길 수도
 * 없고, 맡길 필요도 없다.
 *
 * 받는 쪽에서 이 데이터는 화면 상태까지만 간다 — localStorage에 저장하지
 * 않는다(SynastryReading의 "상대 정보는 저장하지 않는다" 원칙 그대로).
 *
 * 링크를 가진 사람은 담긴 정보를 해독할 수 있다. 그래서 만들기 버튼이 동의
 * 문구(INVITE_CONSENT)를 항상 먼저 보여준다.
 */
export interface InvitePayload {
  date: string;
  time: string | null;
  city: string;
}

export const INVITE_CONSENT =
  "링크에는 내 생년월일시와 출생지가 담깁니다. 궁합을 보고 싶은 사람에게만 보내세요.";

// birth-profile.ts와 같은 수준의 검증 — 변조된 링크가 계산기까지 내려가면 안 된다.
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function isPayload(v: unknown): v is InvitePayload {
  if (typeof v !== "object" || v === null) return false;
  const p = v as Record<string, unknown>;
  if (typeof p.date !== "string" || !DATE_PATTERN.test(p.date)) return false;
  if (p.time !== null && (typeof p.time !== "string" || !TIME_PATTERN.test(p.time))) return false;
  if (typeof p.city !== "string" || p.city.trim() === "") return false;
  return true;
}

/** UTF-8 안전 base64url. atob/btoa는 라틴만 다루므로 바이트로 오간다. */
export function encodeInvite(p: InvitePayload): string {
  const bytes = new TextEncoder().encode(JSON.stringify(p));
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export function decodeInvite(raw: string): InvitePayload | null {
  if (!raw) return null;
  try {
    const binary = atob(raw.replaceAll("-", "+").replaceAll("_", "/"));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return isPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function inviteUrl(p: InvitePayload): string {
  return `https://byeolsaem.com/synastry#i=${encodeInvite(p)}`;
}

export function readInviteFromHash(hash: string): InvitePayload | null {
  if (!hash.startsWith("#i=")) return null;
  return decodeInvite(hash.slice(3));
}
