// 생년월일·시각 입력 칸이 타이핑을 따라가며 스스로 모양을 갖추게 하는 규칙.
// 화면 렌더링과 무관한 순수 문자열 변환이라 컴포넌트 밖에 둔다.

const DATE_SEPARATOR = " . ";
const TIME_SEPARATOR = " : ";

/**
 * 지우기 동작을 자연스럽게 만든다.
 *
 * 자동으로 찍힌 구분자 위에서 백스페이스를 누르면 구분자만 사라지는데, 다음
 * 렌더에서 그 구분자가 곧바로 다시 찍히므로 화면상 아무 일도 일어나지 않는다.
 * 글자가 줄었는데 숫자 개수는 그대로인 경우가 정확히 그 상황이므로, 숫자를 한
 * 칸 더 지워 사용자가 의도한 만큼 실제로 지워지게 한다.
 */
function digitsAfterEdit(raw: string, previous: string): string {
  const digits = raw.replace(/\D/g, "");
  const shrank = raw.length < previous.length;
  const sameDigitCount = digits.length === previous.replace(/\D/g, "").length;
  return shrank && sameDigitCount ? digits.slice(0, -1) : digits;
}

/** 숫자만 받아 "1999 . 03 . 21" 모양으로 만든다. 자리가 채워지는 즉시 구분자가 붙는다. */
export function formatDateInput(raw: string, previous = ""): string {
  const digits = digitsAfterEdit(raw, previous).slice(0, 8);
  let out = digits.slice(0, 4);
  if (digits.length >= 4) out += DATE_SEPARATOR;
  out += digits.slice(4, 6);
  if (digits.length >= 6) out += DATE_SEPARATOR;
  out += digits.slice(6, 8);
  return out;
}

/**
 * 숫자만 받아 "21 : 44" 모양으로 만든다.
 *
 * 시가 한 자리인지 두 자리인지는 첫 숫자로 갈린다. 24시간제에서 3~9로 시작하는
 * 두 자리 시각은 없으므로, 첫 숫자가 3 이상이면 그 자리에서 시가 끝난 것으로
 * 보고 바로 구분자를 찍는다("9 : 30"). 0~2로 시작하면 한 자리를 더 기다린다.
 */
export function formatTimeInput(raw: string, previous = ""): string {
  const all = digitsAfterEdit(raw, previous);
  if (all === "") return "";
  const hourLength = Number(all[0]) >= 3 ? 1 : 2;
  const digits = all.slice(0, hourLength + 2);
  let out = digits.slice(0, hourLength);
  if (digits.length >= hourLength) out += TIME_SEPARATOR;
  out += digits.slice(hourLength);
  return out;
}

/** "1999 . 03 . 21" 같은 표기에서 연·월·일을 뽑는다. 구분자 모양은 가리지 않는다. */
export function parseDate(raw: string): { y: number; mo: number; d: number } | null {
  const m = raw.trim().match(/^(\d{4})\D*(\d{1,2})\D*(\d{1,2})\D*$/);
  if (!m) return null;
  return { y: Number(m[1]), mo: Number(m[2]), d: Number(m[3]) };
}

/**
 * 시각을 "HH:MM"으로 정규화한다. 빈 값은 "모름"이라는 확정된 답이므로 null이며,
 * 형식이 틀린 경우(ok: false)와 구분된다.
 */
export function parseTime(raw: string): { ok: true; value: string | null } | { ok: false } {
  const trimmed = raw.trim();
  if (trimmed === "") return { ok: true, value: null };
  const m = trimmed.match(/^([01]?\d|2[0-3])\D*([0-5]\d)$/);
  if (!m) return { ok: false };
  return { ok: true, value: `${m[1].padStart(2, "0")}:${m[2]}` };
}
