// 사용자의 출생 정보. 사이트 전역에서 "한 번만 입력받는다"는 규칙의 저장소다.
// /natal, /today, /synastry, /yearly 등 모든 페이지가 이 값을 읽어 쓰고, 어느
// 페이지도 자기만의 입력 폼을 따로 두지 않는다.
export interface BirthProfile {
  /** ISO 날짜 "1999-03-21". 시간대 해석이 끼어들지 않도록 Date가 아닌 문자열로 둔다. */
  date: string;
  /** "21:44", 또는 모르는 경우 null. null은 "미입력"이 아니라 "본인이 모름"이라는 확정 상태다. */
  time: string | null;
  city: string;
  /** 마지막으로 고른 관심사. 정체성이 아니라 최근 선택이므로 언제든 덮어써도 된다. */
  concern: string;
}

// 키에 버전을 박아둔다. 스키마가 바뀌면 키를 v2로 올려서, 옛 구조가 담긴
// localStorage를 파싱하려다 깨지는 대신 그냥 "없음"으로 취급되게 한다.
const STORAGE_KEY = "byeolsaem.birth.v1";

/**
 * 같은 탭 안에서 프로필이 바뀐 것을 알리는 이벤트. 브라우저 기본 `storage`
 * 이벤트는 *다른* 탭에서만 발생하므로, 히어로에서 저장한 값을 같은 화면 아래쪽
 * 세 개의 문이 즉시 반영하려면 이 자체 이벤트가 필요하다.
 */
export const BIRTH_PROFILE_EVENT = "byeolsaem:birth-profile";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * localStorage는 사용자가 직접 편집할 수 있고 예전 버전의 값이 남아있을 수도
 * 있다. 읽어들인 값은 반드시 이 검사를 통과한 것만 신뢰한다.
 */
export function isBirthProfile(value: unknown): value is BirthProfile {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.date !== "string" || !DATE_PATTERN.test(v.date)) return false;
  if (v.time !== null && (typeof v.time !== "string" || !TIME_PATTERN.test(v.time))) return false;
  if (typeof v.city !== "string" || v.city.trim() === "") return false;
  if (typeof v.concern !== "string" || v.concern.trim() === "") return false;
  return true;
}

/**
 * 저장된 프로필을 읽는다. 서버 렌더링 중이거나, 값이 없거나, 값이 손상됐으면
 * null. 절대 예외를 던지지 않는다 — 저장소 하나 때문에 페이지가 죽으면 안 된다.
 */
export function loadBirthProfile(): BirthProfile | null {
  if (typeof globalThis.localStorage === "undefined") return null;
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isBirthProfile(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * 프로필을 저장하고 같은 탭에 변경을 알린다. 시크릿 모드나 용량 초과로 쓰기가
 * 실패해도 false를 돌려줄 뿐, 화면 흐름은 그대로 진행된다(저장은 편의 기능이지
 * 필수 경로가 아니다).
 */
export function saveBirthProfile(profile: BirthProfile): boolean {
  if (typeof globalThis.localStorage === "undefined") return false;
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    notifyProfileChange();
    return true;
  } catch {
    return false;
  }
}

/** 저장된 프로필을 지운다("다른 정보로 보기"). */
export function clearBirthProfile(): void {
  if (typeof globalThis.localStorage === "undefined") return;
  try {
    globalThis.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 지우기 실패는 무시한다. 다음 저장이 어차피 덮어쓴다.
  }
  notifyProfileChange();
}

function notifyProfileChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(BIRTH_PROFILE_EVENT));
}

/**
 * "1999-03-21" → "1999. 3. 21". 화면에 보여주기 위한 표기이며, 앞의 0을 떼서
 * 사람이 말하는 방식에 가깝게 만든다. Date 객체를 거치지 않으므로 사용자의
 * 시간대와 무관하게 항상 같은 결과가 나온다.
 */
export function formatBirthDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${m[1]}. ${Number(m[2])}. ${Number(m[3])}`;
}
