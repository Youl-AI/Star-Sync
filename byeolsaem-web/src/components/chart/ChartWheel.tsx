import { ASPECT_TYPES, type Chart } from "@/lib/chart";
import { PLANET_BY_KEY } from "@/lib/planets";
import { ZODIAC_SIGNS } from "@/lib/zodiac";

/**
 * 천궁도 원반.
 *
 * 배치를 그대로 옮긴 그림이다. 바깥 띠는 열두 별자리, 그 안쪽은 하우스 경계,
 * 원 안의 선은 어스펙트다. 어느 것도 장식이 아니라 계산 결과다.
 *
 * 상승궁이 왼쪽(9시 방향)에 오도록 돌려 놓는다. 태어난 순간 동쪽 지평선에
 * 떠오르던 점이 상승궁이므로, 지평선을 가로선으로 놓으면 위가 하늘, 아래가
 * 땅이 된다. 황경은 그 지평선에서 반시계 방향으로 늘어난다 — 종이 위의 관습이
 * 아니라 하늘이 실제로 도는 방향이다.
 *
 * 태어난 시각을 모르면 상승궁이 없다. 그때는 양자리 0도를 왼쪽에 두고 하우스
 * 층을 통째로 비운다.
 */

const SIZE = 480;
const CENTER = SIZE / 2;
const OUTER = 232;
const SIGN_BAND = 26;
const HOUSE_RING = OUTER - SIGN_BAND - 8;
const PLANET_RING = HOUSE_RING - 26;
const ASPECT_RING = PLANET_RING - 26;

function pointAt(longitude: number, rotation: number, radius: number) {
  // 화면 각도: 상승궁이 180도(왼쪽)에 오고 황경이 늘수록 반시계로 간다.
  const angle = (180 + (longitude - rotation)) * (Math.PI / 180);
  return {
    x: CENTER + Math.cos(angle) * radius,
    y: CENTER - Math.sin(angle) * radius,
  };
}

export function ChartWheel({ chart }: { chart: Chart }) {
  const rotation = chart.ascendant ?? 0;
  const cusps = chart.houseCusps;

  // 같은 자리에 두 별이 겹치면 기호가 포개져 읽을 수 없다. 황경이 가까운 것부터
  // 묶어 반지름을 조금씩 벌린다.
  const sorted = [...chart.placements].sort((a, b) => a.longitude - b.longitude);
  const radii = new Map<string, number>();
  let cluster = 0;
  for (let i = 0; i < sorted.length; i += 1) {
    const previous = sorted[i - 1];
    const gap = previous ? sorted[i].longitude - previous.longitude : 999;
    cluster = gap < 9 ? cluster + 1 : 0;
    radii.set(sorted[i].planet, PLANET_RING - (cluster % 3) * 21);
  }

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="mx-auto w-full max-w-[min(92vw,480px)]"
      role="img"
      aria-label="태어난 순간의 행성 배치를 그린 천궁도 원반"
    >
      {/* 별자리 띠 */}
      <circle cx={CENTER} cy={CENTER} r={OUTER} fill="none" stroke="var(--color-gold)" strokeWidth="1" opacity=".5" />
      <circle cx={CENTER} cy={CENTER} r={OUTER - SIGN_BAND} fill="none" stroke="var(--color-gold)" strokeWidth="1" opacity=".35" />

      {ZODIAC_SIGNS.map((sign, i) => {
        const start = i * 30;
        const edge = pointAt(start, rotation, OUTER);
        const inner = pointAt(start, rotation, OUTER - SIGN_BAND);
        const label = pointAt(start + 15, rotation, OUTER - SIGN_BAND / 2);
        return (
          <g key={sign.key}>
            <line x1={edge.x} y1={edge.y} x2={inner.x} y2={inner.y} stroke="var(--color-gold)" strokeWidth=".7" opacity=".4" />
            <text
              x={label.x}
              y={label.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="11"
              fill="var(--color-gold-soft)"
              opacity=".85"
            >
              {sign.ko.replace("자리", "")}
            </text>
          </g>
        );
      })}

      {/* 하우스 경계. 시각을 모르면 이 층이 통째로 없다. */}
      {cusps && (
        <>
          <circle cx={CENTER} cy={CENTER} r={HOUSE_RING} fill="none" stroke="var(--color-starlight)" strokeWidth=".6" opacity=".2" />
          {cusps.map((cusp, i) => {
            const outer = pointAt(cusp, rotation, OUTER - SIGN_BAND);
            const inner = pointAt(cusp, rotation, ASPECT_RING);
            // 1하우스(상승궁)와 10하우스(중천)는 굵게. 이 둘이 차트의 축이다.
            const axis = i === 0 || i === 9;
            const number = pointAt(cusp + 15, rotation, HOUSE_RING - 11);
            return (
              <g key={cusp}>
                <line
                  x1={outer.x}
                  y1={outer.y}
                  x2={inner.x}
                  y2={inner.y}
                  stroke={axis ? "var(--color-gold)" : "var(--color-starlight)"}
                  strokeWidth={axis ? 1.3 : 0.5}
                  opacity={axis ? 0.75 : 0.18}
                />
                <text
                  x={number.x}
                  y={number.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="9"
                  fill="var(--color-starlight-dim)"
                >
                  {i + 1}
                </text>
              </g>
            );
          })}
        </>
      )}

      {/* 어스펙트. 두 별을 잇는 선이고, 정확한 각도에 가까울수록 진하다. */}
      {chart.aspects.slice(0, 14).map((aspect) => {
        const a = chart.placements.find((p) => p.planet === aspect.a)!;
        const b = chart.placements.find((p) => p.planet === aspect.b)!;
        const from = pointAt(a.longitude, rotation, ASPECT_RING);
        const to = pointAt(b.longitude, rotation, ASPECT_RING);
        const harmonious = aspect.type.harmony > 0;
        return (
          <line
            key={`${aspect.a}-${aspect.b}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={harmonious ? "var(--color-gold-soft)" : "var(--color-starlight-dim)"}
            strokeWidth={aspect.type.key === "conjunction" ? 0 : 0.9}
            opacity={0.15 + aspect.strength * 0.45}
          />
        );
      })}
      <circle cx={CENTER} cy={CENTER} r={ASPECT_RING} fill="none" stroke="var(--color-starlight)" strokeWidth=".5" opacity=".14" />

      {/* 열 개의 별 */}
      {chart.placements.map((placement) => {
        const radius = radii.get(placement.planet) ?? PLANET_RING;
        const at = pointAt(placement.longitude, rotation, radius);
        const tick = pointAt(placement.longitude, rotation, OUTER - SIGN_BAND - 3);
        const planet = PLANET_BY_KEY[placement.planet];
        return (
          <g key={placement.planet}>
            <line
              x1={tick.x}
              y1={tick.y}
              x2={at.x}
              y2={at.y}
              stroke="var(--color-gold)"
              strokeWidth=".5"
              opacity=".3"
            />
            <circle cx={at.x} cy={at.y} r="11" fill="var(--color-ink)" opacity=".85" />
            <text
              x={at.x}
              y={at.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="14"
              fill="var(--color-starlight)"
              className="astro-symbol"
            >
              {planet.symbol}
            </text>
            {placement.retrograde && (
              <text
                x={at.x + 11}
                y={at.y + 9}
                textAnchor="middle"
                fontSize="8"
                fill="var(--color-gold-soft)"
              >
                R
              </text>
            )}
          </g>
        );
      })}

      {/* 지평선의 두 끝. 왼쪽이 상승궁이다. */}
      {chart.ascendant !== null && (
        <text
          x={CENTER - OUTER - 2}
          y={CENTER - 8}
          textAnchor="start"
          fontSize="10"
          fill="var(--color-gold)"
          letterSpacing="1"
        >
          ASC
        </text>
      )}
    </svg>
  );
}

/** 원반 아래에 붙이는 범례. 기호만으로는 무엇인지 알 수 없다. */
export function ChartWheelLegend() {
  return (
    <div className="mt-6 space-y-2 text-center text-guide text-starlight">
      <p>
        {ASPECT_TYPES.filter((t) => t.key !== "conjunction").map((type, i) => (
          <span key={type.key}>
            {i > 0 && " · "}
            <span className={type.harmony > 0 ? "text-gold-soft" : "text-starlight-dim"}>
              {type.ko} {type.angle}도
            </span>
          </span>
        ))}
      </p>
      <p>금색 선은 힘이 흐르는 각도, 흐린 선은 마찰이 있는 각도입니다. R은 역행입니다.</p>
    </div>
  );
}
