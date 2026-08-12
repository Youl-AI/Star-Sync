"use client";
import { useInView } from "@/hooks/useInView";
import type { Chart } from "@/lib/chart";
import { PLANET_BY_KEY, type PlanetKey } from "@/lib/planets";
import type { SynastryLine } from "@/lib/synastry-reading";

/**
 * 금실 — 두 별무리 사이를 잇는 선(스펙 §6.5).
 *
 * 별무리는 장식이 아니라 실제 차트다. 열 개의 별을 각자의 황경에 앉히고
 * `/natal`의 원반과 같은 각도 규약을 쓴다(상승궁 자리가 왼쪽, 황경이 늘수록
 * 반시계). 두 무리에 같은 규약을 쓰기 때문에, 각도를 맺은 두 별은 두 원에서
 * 같은 방향에 놓인다 — 실이 왜 거기서 거기로 가는지가 그림에 보인다.
 *
 * 실은 눌러 볼 수 없다. 열 가닥이 가운데서 겹치므로 누를 자리를 만들면 어느
 * 것을 누르는지 알 수 없다. 대신 아래 목록에 커서를 올리면 그 실이 밝아진다 —
 * 짚는 쪽이 겹치지 않는 곳에 있어야 한다.
 */

const WIDTH = 820;
const HEIGHT = 420;
const RADIUS = 104;
const LEFT = { x: 190, y: 200 };
const RIGHT = { x: 630, y: 200 };

function pointAt(center: { x: number; y: number }, longitude: number) {
  const angle = (180 + longitude) * (Math.PI / 180);
  return {
    x: center.x + Math.cos(angle) * RADIUS,
    y: center.y - Math.sin(angle) * RADIUS,
  };
}

function longitudesOf(chart: Chart): Record<PlanetKey, number> {
  return Object.fromEntries(chart.placements.map((p) => [p.planet, p.longitude])) as Record<
    PlanetKey,
    number
  >;
}

export function GoldThreads({
  mine,
  theirs,
  lines,
  activeId,
}: {
  mine: Chart;
  theirs: Chart;
  lines: SynastryLine[];
  /** 아래 목록에서 지금 짚고 있는 만남. 그 실만 밝아진다. */
  activeId: string | null;
}) {
  // 실도 화면에 들어올 때 그어진다. 마운트에 맞춰 그으면 스크롤로 내려오는 동안
  // 끝나 버려 아무도 그어지는 것을 보지 못한다.
  const [frame, drawn] = useInView<HTMLDivElement>(0.3);

  const myLongitudes = longitudesOf(mine);
  const theirLongitudes = longitudesOf(theirs);

  return (
    <div ref={frame} className="-mx-6 overflow-x-auto px-6 md:mx-0 md:px-0">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full min-w-[560px]"
        role="img"
        aria-label={`두 사람의 별 배치와 그 사이를 잇는 ${lines.length}개의 각도를 그린 그림. 같은 내용이 아래 목록에 글로 있습니다.`}
      >
        <Cluster center={LEFT} longitudes={myLongitudes} label="나" />
        <Cluster center={RIGHT} longitudes={theirLongitudes} label="그쪽" />

        {lines.map((line, index) => {
          const from = pointAt(LEFT, myLongitudes[line.mine.key]);
          const to = pointAt(RIGHT, theirLongitudes[line.theirs.key]);
          const isActive = activeId === line.id;
          // 실은 두 무리 사이 한가운데로 늘어진다. 가운데를 조금씩 다르게 잡아
          // 열 가닥이 한 줄로 겹치지 않게 한다.
          const sag = 40 + ((index % 5) - 2) * 34;
          const control = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 + sag };
          return (
            <path
              key={line.id}
              d={`M${from.x.toFixed(1)} ${from.y.toFixed(1)} Q${control.x.toFixed(1)} ${control.y.toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`}
              fill="none"
              pathLength={1}
              stroke={line.harmony < 0 ? "var(--color-starlight)" : "var(--color-gold)"}
              strokeOpacity={isActive ? 0.95 : line.harmony < 0 ? 0.34 : 0.45}
              strokeWidth={isActive ? 2.4 : 1.2}
              strokeDasharray={line.harmony < 0 ? "5 5" : undefined}
              // 마찰의 실은 점선이라 그어 넣을 수 없다 — dasharray 하나를 두 가지로
              // 쓸 수 없기 때문이다. 대신 같은 차례에 떠오른다.
              className={`transition-[stroke-opacity,stroke-width] duration-200 ${
                drawn ? (line.harmony < 0 ? "animate-node-rise" : "animate-thread-draw") : ""
              }`}
              style={drawn ? { animationDelay: `${200 + index * 110}ms` } : { opacity: 0 }}
            />
          );
        })}
      </svg>
    </div>
  );
}

/** 한 사람의 하늘. 열 개의 별이 각자의 황경에 앉는다. */
function Cluster({
  center,
  longitudes,
  label,
}: {
  center: { x: number; y: number };
  longitudes: Record<PlanetKey, number>;
  label: string;
}) {
  return (
    <g>
      <circle
        cx={center.x}
        cy={center.y}
        r={RADIUS}
        fill="none"
        stroke="var(--color-gold)"
        strokeOpacity="0.16"
      />
      <text
        x={center.x}
        y={center.y + RADIUS + 46}
        textAnchor="middle"
        className="font-display"
        fontSize="17"
        fill="var(--color-starlight-dim)"
      >
        {label}
      </text>
      {Object.entries(longitudes).map(([planet, longitude]) => {
        const point = pointAt(center, longitude);
        return (
          <g key={planet}>
            <circle cx={point.x} cy={point.y} r="3" fill="var(--color-gold-soft)" />
            <text
              x={point.x}
              y={point.y - 9}
              textAnchor="middle"
              className="astro-symbol"
              fontSize="13"
              fill="var(--color-starlight-dim)"
            >
              {PLANET_BY_KEY[planet as PlanetKey].symbol}
            </text>
          </g>
        );
      })}
    </g>
  );
}
