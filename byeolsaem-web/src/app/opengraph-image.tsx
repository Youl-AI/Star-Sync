import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * 사이트 공용 공유 카드.
 *
 * 링크를 카카오톡·X·커뮤니티에 붙였을 때 뜨는 그림이다. 이것이 없으면 미리보기가
 * 이미지 없는 맨 주소로 나가고, 우리가 만들어 둔 카카오 공유 버튼도 빈 카드를
 * 보낸다(2026-08-15 실측: 사이트 전체에 og 태그가 하나도 없었다).
 *
 * 여기서 만든 그림은 자기 것을 따로 두지 않은 모든 경로가 물려받는다. 별자리
 * 상세만 예외로 자기 성좌를 그린다.
 *
 * Satori로 그리므로 flexbox와 일부 CSS만 쓸 수 있고, 폰트는 woff2를 읽지 못한다
 * — scripts/subset-maruburi.py가 이 용도로 ttf를 따로 굽는다.
 */
// 정적 export라 빌드 시점에 PNG로 구워야 한다. robots.ts·sitemap.ts와 같은 이유다.
export const dynamic = "force-static";

export const alt = "별샘 — 당신이 태어난 밤, 하늘은 기억하고 있어요";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** 화면의 별하늘을 대신하는 점들. 좌표를 박아 두어 빌드마다 같은 그림이 나온다. */
const STARS: [number, number, number][] = [
  [80, 90, 2], [190, 480, 1.5], [300, 140, 2.5], [420, 560, 1.5], [520, 70, 2],
  [610, 300, 1.5], [700, 520, 2], [790, 130, 2.5], [880, 420, 1.5], [960, 220, 2],
  [1050, 540, 2.5], [1120, 100, 1.5], [150, 300, 1.5], [1010, 60, 1.5], [660, 600, 1.5],
];

export default async function Image() {
  const maruburi = await readFile(join(process.cwd(), "src/fonts/MaruBuri-OG.ttf"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background:
            "radial-gradient(1000px 560px at 50% 8%, #1a224a 0%, #0b1026 46%, #070a16 100%)",
          fontFamily: "MaruBuri",
          position: "relative",
        }}
      >
        {STARS.map(([x, y, r], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: r * 2,
              height: r * 2,
              borderRadius: r,
              background: "#e3c568",
              opacity: 0.55,
            }}
          />
        ))}

        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: 10,
            color: "#e3c568",
          }}
        >
          BYEOLSAEM
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 26,
            fontSize: 92,
            color: "#eef1fb",
          }}
        >
          별샘
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 30,
            fontSize: 40,
            lineHeight: 1.45,
            color: "#a9aec2",
          }}
        >
          당신이 태어난 밤, 하늘은 기억하고 있어요
        </div>

        {/* 아래 금선 — 사이트의 구분선과 같은 결 */}
        <div
          style={{
            position: "absolute",
            left: 96,
            bottom: 84,
            width: 148,
            height: 2,
            background: "#e3c568",
            opacity: 0.75,
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "MaruBuri", data: maruburi, style: "normal", weight: 700 }],
    },
  );
}
