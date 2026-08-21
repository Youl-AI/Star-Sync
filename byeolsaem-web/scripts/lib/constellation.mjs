/**
 * 성좌 한 자리를 Satori가 그릴 수 있는 요소들로 바꾼다.
 *
 * 공유 카드(build-og.mjs)와 X 계정 이미지(build-social.mjs)가 같은 그림을 쓴다.
 * 두 곳에 베껴 두면 한쪽만 고쳐졌을 때 같은 별자리가 매체마다 다르게 나온다.
 *
 * Satori는 SVG path를 그리지 못하므로 별을 잇는 선도 두 점 사이에 놓은 가는
 * 막대로 만든다. 회전은 중점 기준이다 — transform-origin을 왼쪽 끝으로 옮기는
 * 방법은 Satori가 그 속성을 따르지 않아 선이 별에서 떨어져 나갔다(실측).
 */

/**
 * @param sign  lib/zodiac.ts의 ZodiacSign (stars·path·brightest를 읽는다)
 * @param box   {w, h} 이 성좌를 앉힐 상자. 자리마다 260×200 좌표계에서 쓰는
 *              범위가 달라(양자리는 한 귀퉁이, 전갈자리는 아래로 길게), 좌표계를
 *              그대로 쓰면 어떤 자리는 구석에 몰린다. 실제 범위를 재서 꽉 채운다.
 * @param opts  h        React.createElement
 *              gold     별과 선 색
 *              bright   가장 밝은 별의 색
 *              starR    보통 별의 반지름 (가장 밝은 별은 1.6배)
 *              lineW    선 굵기
 *              opacity  선의 불투명도
 */
export function constellation(sign, box, opts) {
  const { h, gold, bright, starR = 5, lineW = 1.5, opacity = 0.45 } = opts;

  const xs = sign.stars.map(([x]) => x);
  const ys = sign.stars.map(([, y]) => y);
  const span = {
    x: Math.min(...xs), y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs) || 1,
    h: Math.max(...ys) - Math.min(...ys) || 1,
  };
  const scale = Math.min(box.w / span.w, box.h / span.h);
  const offset = {
    x: (box.w - span.w * scale) / 2 - span.x * scale,
    y: (box.h - span.h * scale) / 2 - span.y * scale,
  };
  const place = ([x, y]) => [x * scale + offset.x, y * scale + offset.y];

  const links = [];
  for (const seg of sign.path.split(/(?=M)/)) {
    const pts = [...seg.matchAll(/[ML]\s*([\d.]+)\s+([\d.]+)/g)].map((m) =>
      place([Number(m[1]), Number(m[2])]),
    );
    for (let i = 1; i < pts.length; i += 1) {
      const [x1, y1] = pts[i - 1];
      const [x2, y2] = pts[i];
      const len = Math.hypot(x2 - x1, y2 - y1);
      const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
      const [cx, cy] = [(x1 + x2) / 2, (y1 + y2) / 2];
      links.push(
        h("div", {
          key: `l${links.length}`,
          style: {
            position: "absolute", left: cx - len / 2, top: cy - lineW / 2,
            width: len, height: lineW, background: gold, opacity,
            transform: `rotate(${angle}deg)`,
          },
        }),
      );
    }
  }

  const dots = sign.stars.map((star, i) => {
    const [px, py] = place(star);
    const big = i === sign.brightest;
    const r = big ? starR * 1.6 : starR;
    return h("div", {
      key: `d${i}`,
      style: {
        position: "absolute", left: px - r, top: py - r,
        width: r * 2, height: r * 2, borderRadius: 999,
        background: big ? bright : gold,
      },
    });
  });

  return [...links, ...dots];
}
