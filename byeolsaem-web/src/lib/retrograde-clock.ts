/**
 * 이미 계산된 역행 구간을 읽는 쪽. 천문 계산은 한 줄도 없다.
 *
 * 나뉘어 있는 이유는 번들이다. 구간을 구하는 `retrograde.ts`는 천문력 계산을
 * 통째로 끌고 오는데, 브라우저에서 필요한 것은 "지금이 그 구간 안인가"뿐이다.
 * 상태 표시 컴포넌트가 계산 모듈을 건드리면 궤도 요소와 케플러 풀이가 전부
 * 클라이언트 번들에 실린다 — 아무도 쓰지 않는 채로.
 */

export interface RetrogradePeriod {
  /** 역행 시작(유) 시각. UTC ISO 문자열. */
  start: string;
  /** 역행 종료(유) 시각. UTC ISO 문자열. */
  end: string;
  /** 멈춰 선 자리의 황경(도). 역행은 여기서 시작해 뒤로 물러난다. */
  startLongitude: number;
  /** 되짚어 간 끝의 황경(도). */
  endLongitude: number;
  /** 며칠짜리 역행인가. */
  days: number;
  /** 되짚어 간 각도. 보통 10도 안팎이다. */
  arc: number;
}

export type RetrogradeStatus =
  | { state: "retrograde"; period: RetrogradePeriod; daysLeft: number }
  | { state: "direct"; next: RetrogradePeriod; daysUntil: number }
  | { state: "unknown" };

const DAY_MS = 86400000;

/**
 * 지금이 역행 중인가, 아니면 다음 역행까지 며칠 남았는가.
 *
 * 남은 날은 올림한다. "3.2일 남음"은 사람이 쓰는 말이 아니고, 오늘이 다 지나야
 * 하루가 줄어드는 편이 카운트다운의 상식에 맞는다.
 */
export function retrogradeStatus(periods: RetrogradePeriod[], now: Date): RetrogradeStatus {
  const t = now.getTime();
  for (const period of periods) {
    const start = Date.parse(period.start);
    const end = Date.parse(period.end);
    if (t > end) continue;
    if (t >= start) {
      return { state: "retrograde", period, daysLeft: Math.ceil((end - t) / DAY_MS) };
    }
    return { state: "direct", next: period, daysUntil: Math.ceil((start - t) / DAY_MS) };
  }
  // 계산해 둔 범위를 지났다. 없는 날짜를 지어내느니 모른다고 말한다.
  return { state: "unknown" };
}

/**
 * 한국 시간대(UTC+9)의 날짜 조각.
 *
 * `Intl`이나 지역 시간대 함수를 쓰지 않는 이유는 빌드하는 기계와 방문자의
 * 브라우저가 서로 다른 시간대에 있어도 같은 글자가 나와야 하기 때문이다.
 * 9시간을 더하고 UTC로 읽으면 어디서 불려도 한국 날짜가 된다.
 */
export function kstParts(iso: string) {
  const shifted = new Date(Date.parse(iso) + 9 * 3600000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  };
}

/** "2026. 3. 20" */
export function formatKstDate(iso: string): string {
  const { year, month, day } = kstParts(iso);
  return `${year}. ${month}. ${day}`;
}

/** "3. 20" — 같은 해 안에서 구간을 적을 때. */
export function formatKstMonthDay(iso: string): string {
  const { month, day } = kstParts(iso);
  return `${month}. ${day}`;
}

/** "2026. 3. 20. 15:24" */
export function formatKstDateTime(iso: string): string {
  const { hour, minute } = kstParts(iso);
  return `${formatKstDate(iso)}. ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
