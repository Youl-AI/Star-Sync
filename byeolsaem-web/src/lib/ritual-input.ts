// 생년월일·시각 입력 칸이 타이핑을 따라가며 스스로 모양을 갖추게 하는 규칙.
// 화면 렌더링과 무관한 순수 문자열 변환이라 컴포넌트 밖에 둔다.

import { validateBirthDate } from "./birth";

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

interface DateSegments {
  year: string;
  month: string;
  day: string;
  /** 월이 몇 자리인지 확정됐는가. 아니면 월 뒤에 구분자를 찍지 않는다. */
  monthSettled: boolean;
  /** 두 읽기가 모두 실재하는 날짜인가. 그 경우 추측하지 않고 물어야 한다. */
  ambiguous: boolean;
}

/**
 * 숫자열을 연·월·일로 가른다. 0을 붙이지 않은 입력도 알아듣는 자리다.
 *
 * 자리를 고정하지 않고 첫 숫자로 판정한다 — 시각 칸이 쓰는 것과 같은 논리다.
 * 월의 첫 숫자가 2~9면 두 자리 월(20~92월)이 없으므로 그 자리에서 월이 끝나고,
 * 0이면 반드시 두 자리(01~09월)다. 1로 시작할 때만 갈림길이 생긴다:
 *
 *   1999 1 3…   다음 숫자가 3~9면 13~19월이 없으므로 월은 1로 확정.
 *   1999 11 2   전체가 일곱 자리면 두 읽기(1월 12일 / 11월 2일)를 달력에 대 본다.
 *               하나만 실재하면 그것으로 확정하고, 둘 다 실재하면 추측하지 않는다 —
 *               잘못 추측한 생일은 차트를 평생 틀리게 만든다.
 *
 * 여덟 자리는 언제나 연 4·월 2·일 2다. 0을 붙여 적는 사람(주민번호 습관)은
 * 이 갈림길을 아예 지나지 않는다.
 */
function segmentDate(digits: string): DateSegments {
  const year = digits.slice(0, 4);
  const rest = digits.slice(4);
  const none: DateSegments = { year, month: "", day: "", monthSettled: false, ambiguous: false };
  if (rest.length === 0) return none;

  const first = rest[0];

  // 2~9월: 한 자리로 확정.
  if (first >= "2") {
    return { year, month: first, day: rest.slice(1, 3), monthSettled: true, ambiguous: false };
  }
  // 0으로 시작: 두 자리 월.
  if (first === "0") {
    return {
      year,
      month: rest.slice(0, 2),
      day: rest.slice(2, 4),
      monthSettled: rest.length >= 2,
      ambiguous: false,
    };
  }

  // 1로 시작. 다음 숫자를 봐야 한다.
  if (rest.length === 1) return { year, month: "1", day: "", monthSettled: false, ambiguous: false };
  if (rest[1] >= "3") {
    // 13~19월은 없다. 월은 1이다.
    return { year, month: "1", day: rest.slice(1, 3), monthSettled: true, ambiguous: false };
  }

  // 10·11·12월일 수도, 1월 + 두 자리 일일 수도 있다.
  if (rest.length === 3) {
    // 일곱 자리 — 두 읽기를 실재하는 달력에 대 본다.
    const y = Number(year);
    const oneDigit = validateBirthDate(y, Number(rest[0]), Number(rest.slice(1, 3)));
    const twoDigit = validateBirthDate(y, Number(rest.slice(0, 2)), Number(rest[2]));
    if (oneDigit && !twoDigit) {
      return { year, month: "1", day: rest.slice(1, 3), monthSettled: true, ambiguous: false };
    }
    return {
      year,
      month: rest.slice(0, 2),
      day: rest.slice(2, 3),
      monthSettled: true,
      ambiguous: oneDigit && twoDigit,
    };
  }

  // 여덟 자리(또는 아직 여섯 자리)는 두 자리 월로 읽는다.
  return {
    year,
    month: rest.slice(0, 2),
    day: rest.slice(2, 4),
    monthSettled: true,
    ambiguous: false,
  };
}

/** 숫자만 받아 "1999 . 03 . 21" 모양으로 만든다. 자리가 확정되는 즉시 구분자가 붙는다. */
export function formatDateInput(raw: string, previous = ""): string {
  const digits = digitsAfterEdit(raw, previous).slice(0, 8);
  const { year, month, day, monthSettled } = segmentDate(digits);
  let out = year;
  if (digits.length >= 4) out += DATE_SEPARATOR;
  out += month;
  if (monthSettled) out += DATE_SEPARATOR;
  out += day;
  return out;
}

export type BirthDateParse =
  | { ok: true; y: number; mo: number; d: number }
  /** 두 읽기가 모두 실재한다. 화면이 두 날짜를 모두 말하고 8자리를 청해야 한다. */
  | { ok: false; ambiguous: { a: { mo: number; d: number }; b: { mo: number; d: number } } }
  | { ok: false; ambiguous?: undefined };

/**
 * 입력 칸의 표기를 생년월일로 읽는다. 실재하지 않는 날짜는 여기서 걸린다.
 *
 * 화면에 보이는 가름과 여기의 가름이 같은 함수에서 나온다 — 보이는 것과
 * 저장되는 것이 다르면 그보다 나쁜 폼이 없다.
 */
export function parseBirthDate(raw: string): BirthDateParse {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const { year, month, day, ambiguous } = segmentDate(digits);
  if (year.length < 4 || month === "" || day === "") return { ok: false };

  if (ambiguous) {
    const rest = digits.slice(4);
    return {
      ok: false,
      ambiguous: {
        a: { mo: Number(rest[0]), d: Number(rest.slice(1, 3)) },
        b: { mo: Number(rest.slice(0, 2)), d: Number(rest[2]) },
      },
    };
  }

  const y = Number(year);
  const mo = Number(month);
  const d = Number(day);
  if (!validateBirthDate(y, mo, d)) return { ok: false };
  return { ok: true, y, mo, d };
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
