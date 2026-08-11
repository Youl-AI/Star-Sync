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
  return (
    <svg ref={ref} viewBox="0 0 260 200" className={className} style={style} aria-hidden>
      <path
        d={sign.path}
        fill="none"
        stroke="var(--color-gold)"
        strokeWidth={strokeWidth ?? (lit ? 1.6 : 1)}
        className="transition-all duration-500"
        opacity={lit ? 0.95 : 0.3}
      />
      {sign.stars.map(([x, y]) => (
        <circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          r={starRadius ?? (lit ? 5 : 3.4)}
          fill="var(--color-starlight)"
          className="transition-all duration-500"
          opacity={lit ? 1 : 0.55}
        />
      ))}
    </svg>
  );
}
