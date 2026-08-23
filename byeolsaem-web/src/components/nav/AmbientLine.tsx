"use client";
import { useEffect, useState } from "react";
import type { NavAmbient } from "@/lib/nav-ambient";

const DAY_MS = 86400000;

/** 오버레이 하단의 한 줄 — 열릴 때의 '지금'으로 계산한다. 표는 서버가 만들었다. */
export function AmbientLine({ ambient }: { ambient: NavAmbient }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  if (!now) return null;

  const t = now.getTime();
  const moon = ambient.moonSegments.find((s) => Date.parse(s.until) > t);
  const nextLunation = ambient.lunations.find((l) => Date.parse(l.date) > t);
  const active = ambient.retro.find((r) => Date.parse(r.start) <= t && t < Date.parse(r.end));
  const upcoming = ambient.retro
    .filter((r) => Date.parse(r.start) > t)
    .sort((a, b) => a.start.localeCompare(b.start))[0];

  const parts: string[] = [];
  if (moon) parts.push(`오늘 달은 ${moon.signKo}`);
  if (nextLunation) {
    const dday = Math.ceil((Date.parse(nextLunation.date) - t) / DAY_MS);
    parts.push(`다음 ${nextLunation.kind === "new" ? "신월" : "보름"}까지 ${dday}일`);
  }
  if (active) parts.push(`${active.planetKo} 역행 중`);
  else if (upcoming) {
    const dday = Math.ceil((Date.parse(upcoming.start) - t) / DAY_MS);
    parts.push(`${upcoming.planetKo} 역행까지 ${dday}일`);
  }
  if (parts.length === 0) return null;

  return (
    <p className="text-center text-meta tracking-[0.1em] text-starlight-dim">
      {parts.join(" · ")}
    </p>
  );
}
