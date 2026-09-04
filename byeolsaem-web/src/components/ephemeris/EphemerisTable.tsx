import { eventTitle } from "@/lib/calendar-copy";
import { monthEvents } from "@/lib/calendar-events";
import type { EphemerisRow } from "@/lib/ephemeris-table";
import { kstParts } from "@/lib/retrograde-clock";

/**
 * 천문력 표 렌더. 표가 화면보다 넓으므로 반드시 자기 컨테이너 안에서 가로
 * 스크롤한다(overflow-x-auto) — 페이지 몸통이 옆으로 밀리면 안 된다.
 * 숫자 열은 tabular-nums로 세로가 맞는다.
 *
 * 그 스크롤 상자에는 tabIndex를 준다. 마우스 휠이나 손가락이 없는 사람은
 * 초점을 받은 요소만 방향키로 스크롤할 수 있어서, 초점이 안 가는 상자는
 * 넘치는 열을 영영 볼 수 없다(2026-09-04 axe: scrollable-region-focusable).
 */
export function EphemerisTable({ year, month, rows }: { year: number; month: number; rows: EphemerisRow[] }) {
  // 이 달의 사건(신월·보름·역행 경계·인그레스)을 날짜에 붙인다 — 표를 읽다가
  // "이 날 무슨 일이" 를 달력까지 안 가고 알 수 있게.
  const notes = new Map<number, string[]>();
  for (const ev of monthEvents(year, month)) {
    const p = kstParts(ev.date);
    if (p.month !== month) continue;
    (notes.get(p.day) ?? notes.set(p.day, []).get(p.day)!).push(eventTitle(ev));
  }

  return (
    <div
      className="mt-8 overflow-x-auto"
      tabIndex={0}
      role="region"
      aria-label={`${year}년 ${month}월 천문력 표`}
    >
      <table className="w-full min-w-[640px] border-collapse text-sm [font-variant-numeric:tabular-nums]">
        <thead>
          <tr className="border-b border-gold/25 text-left">
            <th scope="col" className="py-2 pr-3 font-normal text-starlight-dim">날짜</th>
            {rows[0].cells.map((c) => (
              <th key={c.planet} scope="col" className="astro-symbol px-2 py-2 text-center font-normal text-gold-soft">
                {c.symbol}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const day = Number(row.date.slice(8));
            const note = notes.get(day);
            return (
              <tr key={row.date} className="border-b border-gold/10">
                <th scope="row" className="whitespace-nowrap py-1.5 pr-3 text-left font-normal text-starlight-dim">
                  {day}일{note && <span className="ml-2 text-[0.7rem] text-gold">{note.join(" · ")}</span>}
                </th>
                {row.cells.map((c) => (
                  <td key={c.planet} className="whitespace-nowrap px-2 py-1.5 text-center text-starlight">
                    <span className="text-gold-soft">{c.signKo.slice(0, 2)}</span>{" "}
                    {c.degree}°{String(c.minute).padStart(2, "0")}′
                    {c.retrograde && (
                      <abbr title="역행" className="astro-symbol ml-0.5 text-gold no-underline">
                        ℞
                      </abbr>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-meta text-starlight-dim">자리 표기는 앞 두 글자입니다 — 전체 이름은 위 범례를 보세요.</p>
    </div>
  );
}
