"use client";
import { useEffect, useState } from "react";
import { getFortuneYear } from "@/lib/date";

// ThreeDoors는 정적 export되는 서버 컴포넌트라, 여기서 연도를 직접 렌더하면
// 빌드 시점 연도가 HTML에 영구히 박제된다(과거에 이미 한 번 발생한 버그).
// TodayDate.tsx와 동일한 패턴: useEffect 안에서만 값을 채워 마운트(=사용자의
// 실제 현재 시각) 이후에만 연도가 나타나게 하고, 최초 렌더는 항상 빈 값이라
// 하이드레이션 불일치도 생기지 않는다.
export function YearlyTagline() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    setLabel(`${getFortuneYear(new Date())}년, 흘러갈 열두 달`);
  }, []);

  // 여백·글자색·줄바꿈 규칙은 이 문구를 감싸는 Door의 설명 슬롯이 이미 갖고
  // 있다. 여기서는 값이 비어 있는 첫 프레임에도 높이가 무너지지 않게만 한다.
  return <span className="block min-h-[1.25em]">{label}</span>;
}
