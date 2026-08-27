"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { computeChart } from "@/lib/chart";
import { coordinatesFor, KOREA_UTC_OFFSET_HOURS } from "@/lib/coordinates";
import { eventDescription, eventHref, eventTitle } from "@/lib/calendar-copy";
import { kstParts } from "@/lib/retrograde-clock";
import { requestRitual } from "@/lib/ritual";
import { kstWeekStart, weeklyData, weeklyPersonal, type WeeklyData } from "@/lib/weekly-reading";
import { useBirthProfile } from "@/hooks/useBirthProfile";
import { WeekPath } from "./WeekPath";

const DOW_KO = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * 이번 주 카드. 서버 HTML은 빌드 시점의 주를 담고(크롤러가 본문을 본다),
 * 마운트 후 방문자의 "지금"으로 다시 계산한다 — 주가 바뀌어 있으면 새 주가 뜬다.
 */
export function WeeklyCard({ initial, builtAt }: { initial: WeeklyData; builtAt: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  const { profile, ready } = useBirthProfile();
  // 별길의 첫 등장 연출 — 마운트 두 프레임 뒤에 페이드인.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    return () => cancelAnimationFrame(raf);
  }, []);

  const data = useMemo(() => (now ? weeklyData(now) : initial), [now, initial]);

  const touches = useMemo(() => {
    if (!profile) return null;
    const coordinates = coordinatesFor(profile.city);
    if (!coordinates) return null;
    const natal = computeChart({
      date: profile.date,
      time: profile.time,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      timezoneOffsetHours: KOREA_UTC_OFFSET_HOURS,
    });
    return weeklyPersonal(kstWeekStart(now ?? new Date(builtAt)), natal);
  }, [profile, now, builtAt]);

  const start = kstParts(data.weekStart);
  const endDate = new Date(Date.parse(data.weekStart) + 6 * 86400000 + 9 * 3600000);

  return (
    <section className="border border-gold/20 bg-ink-raised/60 px-7 py-9 md:px-10">
      <p className="text-meta tracking-[0.12em] text-gold-soft">
        {start.month}월 {start.day}일 – {endDate.getUTCMonth() + 1}월 {endDate.getUTCDate()}일
      </p>
      <h2 className="mt-3 break-keep font-display text-2xl text-starlight">{data.headline}</h2>
      <p className="mt-3 max-w-[52ch] break-keep text-guide text-starlight-dim">{data.summary}</p>

      <div className="mt-8">
        <WeekPath
          weekStart={data.weekStart}
          events={data.events}
          touches={touches}
          now={now}
          entered={entered}
        />
      </div>

      <ul className="mt-8 border-t border-gold/10">
        {data.events.length === 0 && (
          <li className="py-5 text-guide text-starlight-dim">
            일곱 날 모두 큰 이동이 없습니다. 이런 주는 벌여 둔 것을 마저 하는 주입니다.
          </li>
        )}
        {data.events.map((ev) => {
          const p = kstParts(ev.date);
          const dow = DOW_KO[new Date(Date.parse(ev.date) + 9 * 3600000).getUTCDay()];
          const href = eventHref(ev);
          return (
            <li key={ev.kind + ev.date} className="flex gap-5 border-b border-gold/10 py-4 last:border-b-0">
              <span className="w-20 flex-none pt-0.5">
                <span className="text-sm text-gold-soft">{dow}요일</span>
                <span className="block text-meta text-starlight-dim">{p.month}/{p.day}</span>
              </span>
              <div>
                <p className="text-starlight">{eventTitle(ev)}</p>
                <p className="mt-0.5 max-w-[44ch] break-keep text-meta leading-relaxed text-starlight-dim">
                  {eventDescription(ev)}
                  {href && (
                    <>
                      {" "}
                      <Link href={href} className="text-gold-soft hover:text-starlight">자세히 →</Link>
                    </>
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 border-l-2 border-gold pl-5">
        {ready && !profile && (
          <p className="break-keep text-guide text-starlight-dim">
            태어난 순간을 넣어 두면, 이 주의 이동이 당신의 별과 닿는 각도가 여기에 덧붙습니다.{" "}
            <button
              type="button"
              onClick={() => requestRitual()}
              className="border-b border-gold/40 pb-px text-gold-soft transition-colors hover:text-starlight"
            >
              내 밤하늘 만들기
            </button>
          </p>
        )}
        {profile && touches && touches.length > 0 && (
          <>
            <p className="font-display text-lg text-gold-soft">내 차트에는</p>
            <ul className="mt-2 space-y-1.5">
              {touches.map((t) => (
                <li key={t.text} className="break-keep text-guide text-starlight-dim">{t.text}</li>
              ))}
            </ul>
          </>
        )}
        {profile && touches && touches.length === 0 && (
          <p className="break-keep text-guide text-starlight-dim">
            이번 주는 당신의 별에 1도 이내로 닿는 각도가 없습니다. 하늘이 조용히 지나가는 주입니다.
          </p>
        )}
        {profile && touches === null && (
          <p className="break-keep text-guide text-starlight-dim">
            &lsquo;{profile.city}&rsquo;의 좌표를 찾지 못해 내 차트와 겹쳐 볼 수 없습니다.
          </p>
        )}
      </div>
    </section>
  );
}
