import type { LoopSample } from "@/lib/retrograde";
import { formatKstDate, type RetrogradePeriod } from "@/lib/retrograde-clock";

/**
 * 역행 고리 — 별을 배경으로 수성이 실제로 그리는 길.
 *
 * 장식이 아니라 계산 결과의 그림이다. 좌표는 `retrogradeLoop`이 하루 간격으로
 * 뽑은 겉보기 황경·황위이고, 여기서는 그 점들을 이어 붙이기만 한다. 가로세로에
 * 같은 각도 배율을 써서 하늘에서 보이는 비율을 그대로 지킨다 — 한쪽을 늘리면
 * 고리가 실제보다 통통하거나 납작해져 "이렇게 생겼다"는 말이 거짓말이 된다.
 *
 * 순행 구간은 가늘고 흐리게, 역행 구간은 굵고 밝게. 눈이 먼저 닿아야 하는 것은
 * 되짚어 가는 부분이다.
 */

const VIEW_WIDTH = 1000;
/** 여백. 양 끝의 점이 잘리지 않을 만큼만. */
const PAD = 46;

export function RetrogradeLoop({
  samples,
  period,
}: {
  samples: LoopSample[];
  period: RetrogradePeriod;
}) {
  const base = samples[0].longitude;
  // 황경은 360도에서 한 바퀴 돌기 때문에 그대로 빼면 구간 중간에 값이 튄다.
  // 첫 표본을 기준으로 -180~180 안에 접어 넣어 이어진 하나의 축으로 만든다.
  const points = samples.map((s) => ({
    x: (((s.longitude - base + 540) % 360) - 180),
    y: s.latitude,
    retrograde: s.retrograde,
  }));

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const spanX = maxX - minX;
  const midY = (Math.min(...ys) + Math.max(...ys)) / 2;
  // 황위 폭이 좁은 해에는 고리가 실 한 가닥처럼 눌린다. 세로로만 늘리는 대신
  // 그릴 범위를 넓혀 잡아, 배율은 가로세로 같게 유지하면서 높이를 확보한다.
  const spanY = Math.max(Math.max(...ys) - Math.min(...ys), spanX / 3.2);

  const scale = (VIEW_WIDTH - PAD * 2) / spanX;
  const viewHeight = spanY * scale + PAD * 2;
  const toX = (x: number) => PAD + (x - minX) * scale;
  const toY = (y: number) => viewHeight / 2 - (y - midY) * scale;

  const path = points.map((p, i) => `${i ? "L" : "M"}${toX(p.x).toFixed(1)} ${toY(p.y).toFixed(1)}`).join(" ");
  const firstRetro = points.findIndex((p) => p.retrograde);
  const lastRetro = points.length - 1 - [...points].reverse().findIndex((p) => p.retrograde);
  const retroPath = points
    .slice(firstRetro, lastRetro + 1)
    .map((p, i) => `${i ? "L" : "M"}${toX(p.x).toFixed(1)} ${toY(p.y).toFixed(1)}`)
    .join(" ");

  const start = points[firstRetro];
  const end = points[lastRetro];

  return (
    <figure className="mx-auto max-w-3xl">
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${viewHeight.toFixed(1)}`}
        className="w-full"
        role="img"
        aria-label={`수성이 ${formatKstDate(period.start)}부터 ${formatKstDate(
          period.end,
        )}까지 하늘에 그리는 역행 고리. 황경 ${period.arc.toFixed(1)}도를 되짚는다.`}
      >
        {/* 황도(황위 0도). 고리가 이 선을 어떻게 넘나드는지가 고리의 폭을 만든다. */}
        <line
          x1={0}
          y1={toY(0)}
          x2={VIEW_WIDTH}
          y2={toY(0)}
          stroke="var(--color-gold)"
          strokeWidth="1"
          strokeDasharray="3 9"
          opacity=".22"
        />

        {/* 전체 경로 — 순행으로 다가오고 물러나는 부분까지. */}
        <path d={path} fill="none" stroke="var(--color-starlight)" strokeWidth="1.4" opacity=".28" />
        {/* 되짚어 가는 구간. */}
        <path
          d={retroPath}
          fill="none"
          stroke="var(--color-gold-soft)"
          strokeWidth="2.6"
          strokeLinecap="round"
          opacity=".95"
        />

        {/* 하루치 발자국. 유 근처에서 점이 촘촘해지는 것이 곧 "멈춘다"는 뜻이다. */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={toX(p.x)}
            cy={toY(p.y)}
            r={p.retrograde ? 2.6 : 2}
            fill={p.retrograde ? "var(--color-starlight)" : "var(--color-starlight-dim)"}
            opacity={p.retrograde ? 0.9 : 0.45}
          />
        ))}

        {/* 두 번의 유. */}
        {[
          { p: start, label: formatKstDate(period.start) },
          { p: end, label: formatKstDate(period.end) },
        ].map(({ p, label }) => {
          // 유는 거의 항상 가로 범위의 양 끝에 선다. 글자를 바깥쪽으로 붙이면
          // 그대로 그림 밖으로 나가 잘리므로(실측: 날짜가 "14"만 남았다) 늘
          // 그림 안쪽을 향하게 한다.
          const cx = toX(p.x);
          const inward = cx > VIEW_WIDTH / 2 ? -1 : 1;
          return (
            <g key={label}>
              <circle
                cx={cx}
                cy={toY(p.y)}
                r="6"
                fill="none"
                stroke="var(--color-gold)"
                strokeWidth="1.4"
              />
              <text
                x={cx + inward * 13}
                y={toY(p.y) - 13}
                textAnchor={inward > 0 ? "start" : "end"}
                fill="var(--color-gold-soft)"
                fontSize="21"
                letterSpacing="1"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      <figcaption className="mt-5 text-center text-xs leading-relaxed text-starlight-dim">
        점 하나가 하루입니다. 점이 촘촘해지는 두 곳이 수성이 멈춰 서는 순간이고,
        그 사이의 밝은 길이 되짚어 가는 구간입니다. 되짚는 동안 황위가 방향을
        바꾸면 길이 스스로 교차해 고리가 되고, 한쪽으로만 움직이면 지그재그가
        남습니다 — 역행마다 모양이 다른 것은 이 때문입니다. 가로는 황경, 세로는
        황위이며 두 축의 배율은 같습니다.
      </figcaption>
    </figure>
  );
}
