import { eventTitle } from "@/lib/calendar-copy";
import { monthEvents } from "@/lib/calendar-events";
import type { EphemerisRow } from "@/lib/ephemeris-table";
import { kstParts } from "@/lib/retrograde-clock";
import { ZODIAC_SIGNS } from "@/lib/zodiac";

/**
 * 자리 표기 ↔ 전체 이름 범례. 첫 글자만 쓰면 "물병자리/물고기자리"가 둘 다
 * "물"로 겹친다 — 두 글자(물병/물고)까지는 모든 자리가 서로 다르다.
 * 페이지 쪽 소개 아래 한 줄로 둔다(표 자체에는 안 싣는다).
 */
export const SIGN_LEGEND = ZODIAC_SIGNS.map((s) => `${s.ko.slice(0, 2)}=${s.ko}`).join(" · ");

/**
 * 천문력 표 렌더. 표가 화면보다 넓으므로 반드시 자기 컨테이너 안에서 가로
 * 스크롤한다(overflow-x-auto) — 페이지 몸통이 옆으로 밀리면 안 된다.
 * 숫자 열은 tabular-nums로 세로가 맞는다.
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
    <div className="mt-8 overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm [font-variant-numeric:tabular-nums]">
        <thead>
          <tr className="border-b border-gold/25 text-left">
            <th scope="col" className="py-2 pr-3 font-normal text-starlight-dim">날짜</th>
            {rows[0].cells.map((c) => (
              <th key={c.planet} scope="col" className="astro-symbol px-2 py-2 text-center font-normal text-gold-soft" title={c.planet}>
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
                    <span className="astro-symbol text-gold-soft">{c.signKo.slice(0, 2)}</span>{" "}
                    {c.degree}°{String(c.minute).padStart(2, "0")}′
                    {c.retrograde && <span className="ml-0.5 text-gold" aria-label="역행">℞</span>}
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
