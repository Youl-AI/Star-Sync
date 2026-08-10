import Link from "next/link";

// 세 개의 문에 쓰이는 미니 비주얼. Task 4~10의 미니 성좌 스타일(가는 금색 선 +
// 별점 원)을 재사용하되 문마다 다른 형상을 그린다 — 벤토 셀이 빈 카드로 보이지
// 않도록 하는 장치.
function NatalGlyph() {
  return (
    <svg viewBox="0 0 140 90" className="h-24 w-full max-w-[220px]" aria-hidden>
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
    <svg viewBox="0 0 140 64" className="h-16 w-full max-w-[220px]" aria-hidden>
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
    <svg viewBox="0 0 140 52" className="h-14 w-full max-w-[220px]" aria-hidden>
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

const DOOR_CELL =
  "nebula-bg group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gold/20 transition-colors hover:border-gold/50";

// 레이아웃 패밀리: 비대칭 벤토 (5열 그리드, 큰 문 col-span-3/row-span-2 + 작은
// 문 두 개 col-span-2 세로 스택). 모바일에서는 grid-cols-1로 접혀 세 문이
// 순서대로 쌓인다.
export function ThreeDoors() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-28 md:py-40">
      <h2 className="max-w-xl break-keep font-display text-3xl md:text-4xl">당신의 하늘로 통하는 세 개의 문</h2>

      <div className="mt-12 grid gap-4 md:grid-cols-5 md:grid-rows-2">
        <Link href="/natal" className={`${DOOR_CELL} p-8 md:col-span-3 md:row-span-2`}>
          <NatalGlyph />
          <div>
            <h3 className="break-keep font-display text-2xl text-starlight">천궁도</h3>
            <p className="mt-2 max-w-xs break-keep text-sm leading-relaxed text-starlight-dim">
              태어난 순간 하늘에 새겨진 나의 원형. 태양과 달, 열 개의 행성이 그리는 이야기.
            </p>
            <span className="mt-4 inline-block text-xs tracking-wide text-gold-soft group-hover:text-gold">
              자세히 보기 →
            </span>
          </div>
        </Link>

        <Link href="/synastry" className={`${DOOR_CELL} p-6 md:col-span-2`}>
          <SynastryGlyph />
          <div>
            <h3 className="font-display text-xl text-starlight">궁합</h3>
            <p className="mt-1.5 break-keep text-sm text-starlight-dim">두 하늘이 겹치는 자리</p>
          </div>
        </Link>

        <Link href="/yearly/2027" className={`${DOOR_CELL} p-6 md:col-span-2`}>
          <YearlyGlyph />
          <div>
            <h3 className="font-display text-xl text-starlight">연간 운세</h3>
            <p className="mt-1.5 break-keep text-sm text-starlight-dim">2027년, 흘러갈 열두 달</p>
          </div>
        </Link>
      </div>
    </section>
  );
}
