import { eventDescription, eventHref, eventTitle } from "./calendar-copy";
import type { CalendarEvent } from "./calendar-events";
import { kstParts } from "./retrograde-clock";

/**
 * iCalendar 생성 — 캘린더 앱이 구독하는 /sky.ics의 본문.
 *
 * UID는 내용 기반(kind + KST 날짜 + 행성)이다. 무작위나 시각 기반이면 재배포마다
 * 새 이벤트로 보여 구독자 캘린더에 같은 신월이 겹겹이 쌓인다.
 * 종일 이벤트로 낸다 — 정확한 시각은 DESCRIPTION과 링크된 페이지가 말한다.
 * 줄은 RFC 5545대로 CRLF, 75바이트 넘는 줄은 접는다.
 */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 73) return line;
  // 한글이 잘리지 않게 글자 단위로 접는다.
  const out: string[] = [];
  let current = "";
  for (const ch of line) {
    if (new TextEncoder().encode(current + ch).length > 70) {
      out.push(current);
      current = " " + ch; // 이어지는 줄은 공백 하나로 시작
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out.join("\r\n");
}

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

function uidOf(ev: CalendarEvent): string {
  const p = kstParts(ev.date);
  const ymd = `${p.year}${String(p.month).padStart(2, "0")}${String(p.day).padStart(2, "0")}`;
  const planet = "planet" in ev ? `-${ev.planet}` : "";
  return `${ev.kind}${planet}-${ymd}@byeolsaem.com`;
}

export function buildIcs(events: CalendarEvent[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//byeolsaem//sky-calendar//KO",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:별샘 — 하늘의 달력",
    "X-WR-TIMEZONE:Asia/Seoul",
    "REFRESH-INTERVAL;VALUE=DURATION:P1D",
  ];
  for (const ev of events) {
    const p = kstParts(ev.date);
    const ymd = `${p.year}${String(p.month).padStart(2, "0")}${String(p.day).padStart(2, "0")}`;
    const href = eventHref(ev);
    const desc = eventDescription(ev) + (href ? ` https://byeolsaem.com${href}` : " https://byeolsaem.com/calendar");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uidOf(ev)}`,
      `DTSTAMP:${ymd}T000000Z`,
      `DTSTART;VALUE=DATE:${ymd}`,
      fold(`SUMMARY:${escapeText(eventTitle(ev))}`),
      fold(`DESCRIPTION:${escapeText(desc)}`),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
