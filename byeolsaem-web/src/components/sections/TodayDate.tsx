"use client";
import { useEffect, useState } from "react";

// 정적 export 빌드에서는 서버 렌더(빌드 시점) 결과가 그대로 HTML에 굳어버리므로,
// 여기서 new Date()를 곧장 렌더에 쓰면 "오늘"이 빌드한 날짜로 영구히 박제된다.
// useEffect 안에서만 값을 채워 넣어 마운트(=사용자의 실제 현재 시각) 이후에만
// 날짜가 나타나게 한다. 최초 렌더(서버/클라이언트 공통)는 항상 null이라
// 하이드레이션 불일치도 생기지 않는다.
export function TodayDate() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const formatted = new Intl.DateTimeFormat("ko-KR", {
      month: "long",
      day: "numeric",
      weekday: "long",
    }).format(new Date());
    setLabel(formatted);
  }, []);

  return (
    <p className="min-h-[1em] text-xs uppercase tracking-[0.3em] text-gold-soft">{label}</p>
  );
}
