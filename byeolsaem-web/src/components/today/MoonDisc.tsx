import type { MoonPhaseKey } from "@/lib/moon";

/**
 * 오늘의 달. 카드 안 아치에 앉는다.
 *
 * 밝은 면의 비율을 그대로 그린다 — "보름달"이라고 쓰는 대신 실제로 그만큼 밝게
 * 그리면 글을 읽지 않아도 오늘이 어떤 밤인지 보인다.
 *
 * 초승과 그믐은 같은 비율이라도 밝은 쪽이 반대다. 위상 이름으로 어느 쪽인지
 * 가른다 — 비율만으로는 알 수 없다.
 */
const WAXING = new Set<MoonPhaseKey>([
  "new",
  "waxing-crescent",
  "first-quarter",
  "waxing-gibbous",
]);

export function MoonDisc({
  illumination,
  phase,
}: {
  /** 0(안 보임)~1(가득). */
  illumination: number;
  phase: MoonPhaseKey;
}) {
  const r = 46;
  // 밝은 부분의 안쪽 경계는 타원이다. 반달에서 폭이 0이 되고, 그 전후로 부호가
  // 뒤집히며 볼록에서 오목으로 바뀐다.
  const k = 1 - 2 * illumination;
  const rx = Math.abs(k) * r;
  // 스윕 방향: 차오르는 달은 오른쪽이 밝다.
  const outer = WAXING.has(phase) ? 1 : 0;
  // 명암 경계 타원의 방향. 초승(k>0)은 밝은 쪽으로 볼록해 실낱이 되고,
  // 보름 쪽(k<0)은 어두운 쪽으로 볼록해 반원 너머까지 차오른다. 이 부호가
  // 뒤집혀 있으면 96%가 실낱로, 보름이 빈 원으로 그려진다(2026-08-26 실측).
  const inner = k >= 0 ? 1 - outer : outer;

  return (
    <svg viewBox="0 0 120 120" className="mx-auto mt-4 w-[108px]" aria-hidden>
      {/* 달 전체의 자리. 그늘진 부분도 완전히 사라지지는 않는다. */}
      <circle cx="60" cy="60" r={r} fill="var(--color-nebula)" opacity=".55" />
      <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-gold)" strokeWidth=".8" opacity=".35" />

      {illumination > 0.01 && (
        <path
          d={`M 60 ${60 - r} A ${r} ${r} 0 0 ${outer} 60 ${60 + r} A ${rx} ${r} 0 0 ${inner} 60 ${60 - r} Z`}
          fill="var(--color-starlight)"
          opacity=".92"
        />
      )}

      {/* 가장자리 빛무리. 카드의 금빛과 이어지도록 아주 옅게. */}
      <circle
        cx="60"
        cy="60"
        r={r + 6}
        fill="none"
        stroke="var(--color-gold-soft)"
        strokeWidth="1"
        opacity=".14"
      />
    </svg>
  );
}
