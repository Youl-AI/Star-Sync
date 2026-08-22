import type { CalendarEvent } from "./calendar-events";

/**
 * 달력 이벤트의 문구 — 화면(달력·위클리)과 ics 파일이 같은 문장을 쓴다.
 * 여기 문장이 곧 구독자의 캘린더에 뜨는 글자다.
 */
export function eventTitle(ev: CalendarEvent): string {
  switch (ev.kind) {
    case "new-moon": return `${ev.signKo} 신월`;
    case "full-moon": return `${ev.signKo} 보름`;
    case "retro-start": return `${ev.planetKo} 역행 시작`;
    case "retro-end": return `${ev.planetKo} 역행 끝`;
    case "ingress": return `태양, ${ev.signKo}로`;
  }
}

export function eventDescription(ev: CalendarEvent): string {
  switch (ev.kind) {
    case "new-moon": return "달이 태양과 겹치는 날 — 새로 시작하기 좋은 자리로 읽습니다.";
    case "full-moon": return "달이 가장 차는 날 — 신월에 세운 것을 확인하고 정리하는 자리로 읽습니다.";
    case "retro-start": return retroStartDesc(ev.planetKo);
    case "retro-end": return `${ev.planetKo}이 다시 앞으로 걷기 시작합니다. 미뤄 둔 결정을 꺼내기 좋은 때입니다.`;
    case "ingress": return `태양이 ${ev.signKo}의 방으로 들어섭니다. 한 달 동안 이 자리의 주제가 계절의 기본값이 됩니다.`;
  }
}

function retroStartDesc(planetKo: string): string {
  if (planetKo === "수성") return "말·계약·기기를 맡는 별이 되돌아갑니다. 보내기 전에 한 번 더 확인하는 시기입니다.";
  if (planetKo === "금성") return "사랑·돈·취향을 맡는 별이 되돌아갑니다. 새로 벌이기보다 되짚는 시기입니다.";
  return "실행과 추진을 맡는 별이 되돌아갑니다. 밀어붙이기보다 전열을 다듬는 시기입니다.";
}

export function eventHref(ev: CalendarEvent): string | null {
  if (ev.kind !== "retro-start" && ev.kind !== "retro-end") return null;
  if (ev.planet === "mercury") return "/retrograde";
  return `/retrograde/${ev.planet}`;
}
