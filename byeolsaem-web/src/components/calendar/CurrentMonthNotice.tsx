"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * 허브는 빌드 시점의 달로 구워진다. 배포가 묵어 실제 달이 넘어갔으면, 그리드를
 * 속이는 대신 진짜 이번 달로 가는 길을 한 줄 얹는다 — 월별 12장은 이미 정적으로
 * 존재하므로 링크만으로 정직해진다(최종 리뷰 I-1). 순수 날짜 산술이라 엔진이
 * 클라이언트에 실리지 않는다.
 *
 * 주의: 지금 달이 빌드의 12개월 창(이전 1 + 당월 + 이후 10)을 벗어났으면(빌드가
 * 11개월 이상 방치) 아래 링크가 404일 수 있다 — 그 시점엔 어차피 전면 재빌드가
 * 필요한 상태이고, 이 링크는 그 전까지 낼 수 있는 최선의 안내다.
 */
export function CurrentMonthNotice({
  builtYear,
  builtMonth,
  hrefBase = "/calendar",
}: {
  builtYear: number;
  builtMonth: number;
  // 천문력 허브도 같은 어긋남 안내를 쓴다 — 목적지 베이스만 다르다.
  hrefBase?: string;
}) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  if (!now) return null;
  const kst = new Date(now.getTime() + 9 * 3600000);
  const year = kst.getUTCFullYear();
  const month = kst.getUTCMonth() + 1;
  if (year === builtYear && month === builtMonth) return null;
  return (
    <p className="mb-6 border border-gold/25 bg-ink-raised/60 px-4 py-3 text-center text-guide text-starlight-dim">
      이 판은 {builtMonth}월에 구워졌습니다 — 지금은 {month}월입니다.{" "}
      <Link
        href={`${hrefBase}/${year}/${String(month).padStart(2, "0")}`}
        className="border-b border-gold/40 pb-px text-gold-soft transition-colors hover:text-starlight"
      >
        {month}월 달력 보러 가기 →
      </Link>
    </p>
  );
}
