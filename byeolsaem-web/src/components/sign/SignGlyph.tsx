import type { CSSProperties, Ref } from "react";
import type { ZodiacSign } from "@/lib/zodiac";

/**
 * 성좌 하나의 그림. 진 위에서도, 날아가는 동안에도, 카드 안에서도 같은 그림이
 * 쓰인다 — 모프 도중 선 굵기나 별 크기가 바뀌면 다른 물건으로 갈아 끼운 것처럼
 * 보이므로 한 곳에서 그린다.
 */
export function SignGlyph({
  sign,
  lit = false,
  className,
  strokeWidth,
  starRadius,
  style,
  ref,
}: {
  sign: ZodiacSign;
  /** 점등 상태. 선이 굵어지고 별이 커진다. */
  lit?: boolean;
  className?: string;
  strokeWidth?: number;
  starRadius?: number;
  style?: CSSProperties;
  /** 모프가 이 그림의 실제 화면 좌표를 재야 해서 밖으로 내준다. */
  ref?: Ref<SVGSVGElement>;
}) {
  const [shiftX, shiftY] = centeringShift(sign);

  return (
    <svg
      ref={ref}
      viewBox="0 0 260 200"
      className={className}
      style={style}
      aria-hidden
    >
      {/* 별을 통째로 옮겨 상자 한가운데에 놓는다. 좌표는 각 자리의 실제 배치를
          옮긴 것이라 어떤 자리는 상자 위쪽에, 어떤 자리는 왼쪽에 몰려 있다.
          양자리처럼 짧은 활은 카드 위쪽에만 걸리고 아래가 비었다.

          옮기기만 하고 키우지는 않는다. 자리마다 다른 배율로 키우면 진 위에
          늘어선 열두 성좌의 크기가 제각각이 되고, 진에서 카드로 날아가는 모프도
          같은 그림을 쓰지 못한다. 평행이동은 열두 자리에 똑같이 적용되므로 그
          둘 다 그대로다. */}
      <g transform={`translate(${shiftX.toFixed(1)} ${shiftY.toFixed(1)})`}>
        <path
          d={sign.path}
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth={strokeWidth ?? (lit ? 1.6 : 1)}
          className="transition-all duration-500"
          opacity={lit ? 0.95 : 0.3}
        />
        {sign.stars.map(([x, y], index) => {
          const r = starRadius ?? (lit ? 5 : 3.4);
          return (
            <g key={`${x}-${y}`}>
              {/* 최밝성만 이중 링을 두른다(스펙 §4). 별 하나가 다른 별보다 밝다는
                것을 크기로 말하면 그림이 뒤뚱거리므로, 크기는 그대로 두고 둘레에
                고리를 건다 — 성좌의 균형을 건드리지 않으면서 눈이 먼저 간다. */}
              {index === sign.brightest && (
                <circle
                  cx={x}
                  cy={y}
                  r={r * 2.2}
                  fill="none"
                  stroke="var(--color-gold-soft)"
                  strokeWidth={r * 0.22}
                  className="transition-all duration-500"
                  opacity={lit ? 0.75 : 0.28}
                />
              )}
              <circle
                cx={x}
                cy={y}
                r={r}
                fill="var(--color-starlight)"
                className="transition-all duration-500"
                opacity={lit ? 1 : 0.55}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

/** 그림의 상자 크기. zodiac.ts의 좌표가 이 안에 그려져 있다. */
const VIEW_WIDTH = 260;
const VIEW_HEIGHT = 200;

/** 별 묶음의 한가운데를 상자 한가운데로 가져가는 평행이동. */
function centeringShift(sign: ZodiacSign): [number, number] {
  const xs = sign.stars.map(([x]) => x);
  const ys = sign.stars.map(([, y]) => y);
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
  return [VIEW_WIDTH / 2 - centerX, VIEW_HEIGHT / 2 - centerY];
}
