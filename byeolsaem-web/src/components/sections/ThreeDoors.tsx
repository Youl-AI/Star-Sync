import type { CSSProperties } from "react";
import { Door } from "./Door";
import { DoorsPin } from "./DoorsPin";
import { YearlyTagline } from "./YearlyTagline";

// 세 개의 문에 쓰이는 미니 비주얼. 가는 금색 선 + 별점 원으로 문마다 다른
// 형상을 그린다. 서버에서 그려져 Door(클라이언트)에 슬롯으로 넘어간다.
function NatalGlyph() {
  return (
    <svg viewBox="0 0 140 90" className="h-20 w-full max-w-[200px]" aria-hidden>
      <path
        d="M18 68 L50 26 L84 44 L118 16 M50 26 L70 64 L118 16"
        fill="none"
        stroke="var(--color-gold)"
        strokeWidth=".7"
        opacity=".65"
      />
      {[[18, 68], [50, 26], [84, 44], [118, 16], [70, 64]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.2" fill="var(--color-starlight)" />
      ))}
    </svg>
  );
}

function SynastryGlyph() {
  return (
    <svg viewBox="0 0 140 64" className="h-20 w-full max-w-[200px]" aria-hidden>
      <path
        d="M8 32 C 36 4, 56 60, 84 32 S 132 4, 132 32"
        fill="none"
        stroke="var(--color-gold-soft)"
        strokeWidth=".8"
        opacity=".8"
      />
      <path
        d="M8 32 C 36 60, 56 4, 84 32 S 132 60, 132 32"
        fill="none"
        stroke="var(--color-gold)"
        strokeWidth=".55"
        opacity=".5"
      />
    </svg>
  );
}

function YearlyGlyph() {
  return (
    <svg viewBox="0 0 140 52" className="h-20 w-full max-w-[200px]" aria-hidden>
      <path
        d="M4 36 Q 22 10 40 30 T 76 26 T 112 16 T 136 30"
        fill="none"
        stroke="var(--color-gold)"
        strokeWidth=".8"
        opacity=".7"
      />
      {[22, 58, 94, 128].map((x) => (
        <circle key={x} cx={x} cy="26" r="1.6" fill="var(--color-gold-soft)" />
      ))}
    </svg>
  );
}

// "무경계 성좌"(디자인 실험실 C안): 카드 상자 없이 세 영역이 나란히 놓이고,
// 각 영역은 위쪽 금선 하나로만 구분된다. 상자가 사라졌으므로 벤토(크기 차등)
// 대신 동일한 세 칸이 하나의 지평선을 이룬다.
export function ThreeDoors() {
  return (
    <DoorsPin>
      <h2
        data-reveal
        style={{ "--reveal-i": 0 } as CSSProperties}
        className="max-w-xl break-keep font-display text-3xl md:text-4xl"
      >
        당신의 하늘로 통하는 세 개의 문
      </h2>

      {/* 세 문은 한 지평선 위에 있으므로 함께 들어온다. 문마다 따로 표시하면
          하나의 구성이 세 조각으로 쪼개져 보인다. */}
      <div
        data-reveal
        style={{ "--reveal-i": 1 } as CSSProperties}
        className="mt-16 grid grid-cols-1 gap-x-10 gap-y-4 md:grid-cols-3"
      >
        <Door
          href="/natal"
          numeral="I"
          hint="natal"
          glyph={<NatalGlyph />}
          title="천궁도"
          description="태어난 순간 하늘에 새겨진 나의 원형. 태양과 달, 열 개의 행성이 그리는 이야기."
        />

        <Door
          href="/synastry"
          numeral="II"
          hint="synastry"
          glyph={<SynastryGlyph />}
          title="궁합"
          description="두 하늘이 겹치는 자리"
        />

        {/* 링크는 연도 없는 경로로 둔다: 정적 export라 연도가 붙은 라우트를
            빌드 시점에 박제하면 해가 바뀌는 순간 죽은 링크가 된다(URL은 재빌드
            없이는 절대 바뀌지 않으므로 텍스트보다 더 심각한 하드코딩이다).
            /yearly 페이지가 실제 구현될 때 그 안에서 getFortuneYear로 연도를
            해석하게 한다. 화면에 보이는 연도 문구만 YearlyTagline에서 클라이언트
            마운트 시점에 채운다(TodayDate.tsx와 동일 패턴). */}
        <Door
          href="/yearly"
          numeral="III"
          hint="yearly"
          glyph={<YearlyGlyph />}
          title="연간 운세"
          description={<YearlyTagline />}
        />
      </div>
    </DoorsPin>
  );
}
