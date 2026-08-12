"use client";
import { useEffect, useState } from "react";
import {
  formatKstDate,
  retrogradeStatus,
  type RetrogradePeriod,
  type RetrogradeStatus,
} from "@/lib/retrograde-clock";

/**
 * "지금은 순행 중" / "역행 중, 종료까지 N일".
 *
 * 이 사이트는 정적으로 내보내지므로 페이지 안의 모든 글자는 빌드하던 날의
 * 것이다. 나머지는 상관없지만 이 한 줄만은 오늘을 알아야 한다 — 그래서 여기만
 * 클라이언트다.
 *
 * 처음 그릴 때는 빌드 시점의 답(`initial`)을 그대로 쓴다. 서버가 만든 HTML과
 * 글자가 같아야 하이드레이션이 어긋나지 않기 때문이다. 붙고 난 뒤에 오늘 날짜로
 * 다시 계산해 필요하면 갈아 끼운다. 대개 두 답은 같고, 빌드가 오래됐을 때만
 * 눈에 띄게 바뀐다.
 */
export function RetrogradeStatusBand({
  periods,
  initial,
}: {
  periods: RetrogradePeriod[];
  initial: RetrogradeStatus;
}) {
  const [status, setStatus] = useState(initial);

  useEffect(() => {
    setStatus(retrogradeStatus(periods, new Date()));
  }, [periods]);

  if (status.state === "unknown") {
    return (
      <p className="text-center leading-relaxed text-starlight-dim">
        계산해 둔 일정의 끝을 지났습니다. 아래 표가 비어 있다면 알려 주세요 —
        지어낸 날짜를 보여 주는 것보다 낫습니다.
      </p>
    );
  }

  const retro = status.state === "retrograde";
  const period = retro ? status.period : status.next;
  const days = retro ? status.daysLeft : status.daysUntil;

  return (
    <div className="text-center">
      <p
        className={`font-display text-2xl md:text-3xl ${
          retro ? "text-gold-soft" : "text-starlight"
        }`}
      >
        {retro ? "지금은 역행 중입니다" : "지금은 순행 중입니다"}
      </p>

      <p className="mt-6 text-eyebrow tracking-[0.22em] text-starlight-dim">
        {retro ? "역행이 끝나기까지" : "다음 역행까지"}
      </p>
      <p className="mt-2 font-display text-5xl text-gold md:text-6xl">
        {days}
        <span className="ml-2 align-baseline text-lg text-gold-soft">일</span>
      </p>

      <p className="mt-6 text-sm text-starlight-dim">
        {formatKstDate(period.start)} — {formatKstDate(period.end)}
      </p>
    </div>
  );
}
