/**
 * 공유 카드(OG 이미지)를 PNG 파일로 굽는다.
 *
 * 왜 스크립트인가. Next에는 `opengraph-image.tsx` 파일 규칙이 있고 실제로 잘
 * 돌아가지만, 그 결과물은 확장자가 없는 `/opengraph-image`로 나간다. 우리 호스트
 * (Cloudflare Workers Assets)는 파일 확장자로 content-type을 정하므로 그 주소는
 * **타입 헤더 없이** 서빙된다(2026-08-15 배포해서 실측). 카카오·X 같은 곳은
 * content-type을 보고 이미지를 그릴지 정하기 때문에, 그대로 두면 미리보기가
 * 뜨지 않는다.
 *
 * 그래서 `.png`로 구워 public/og/에 두고, 메타데이터가 그 주소를 직접 가리킨다.
 * 폰트 서브셋과 같은 취급이다 — 디자인이나 별자리 데이터가 바뀔 때만 다시 돌린다.
 *
 *   node --experimental-strip-types scripts/build-og.mjs
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { ImageResponse } from "next/og.js";
import { ZODIAC_SIGNS } from "../src/lib/zodiac.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "og");
const SIZE = { width: 1200, height: 630 };

const INK = "#0b1026";
const GOLD = "#e3c568";
const STARLIGHT = "#eef1fb";
const DIM = "#a9aec2";
const GROUND =
  "radial-gradient(1000px 560px at 50% 8%, #1a224a 0%, #0b1026 46%, #070a16 100%)";

const h = React.createElement;

/**
 * 배경의 별. 좌표를 박아 두어 빌드마다 같은 그림이 나온다 — 무작위로 흩뿌리면
 * 이미지가 매번 달라져 커밋 diff가 의미 없이 커진다.
 */
const STARS = [
  [80, 90, 2], [190, 480, 1.5], [300, 140, 2.5], [420, 560, 1.5], [520, 70, 2],
  [610, 300, 1.5], [700, 520, 2], [790, 130, 2.5], [880, 420, 1.5], [960, 220, 2],
  [1050, 540, 2.5], [1120, 100, 1.5], [150, 300, 1.5], [1010, 60, 1.5], [660, 600, 1.5],
];

function starLayer(exclude = null) {
  return STARS.filter(([x]) => exclude === null || x < exclude).map(([x, y, r], i) =>
    h("div", {
      key: `s${i}`,
      style: {
        position: "absolute", left: x, top: y,
        width: r * 2, height: r * 2, borderRadius: r,
        background: GOLD, opacity: 0.55,
      },
    }),
  );
}

function frame(children, extra = {}) {
  return h(
    "div",
    {
      style: {
        width: "100%", height: "100%", display: "flex",
        background: GROUND, fontFamily: "MaruBuri", position: "relative",
        ...extra,
      },
    },
    children,
  );
}

/** 사이트 공용 카드. 자기 카드가 없는 모든 경로가 이걸 쓴다. */
function defaultCard() {
  return frame([
    ...starLayer(),
    h("div", {
      key: "body",
      style: {
        display: "flex", flexDirection: "column",
        justifyContent: "center", padding: "0 96px", width: "100%",
      },
    }, [
      h("div", { key: "eyebrow", style: { display: "flex", fontSize: 26, letterSpacing: 10, color: GOLD } }, "BYEOLSAEM"),
      h("div", { key: "title", style: { display: "flex", marginTop: 26, fontSize: 92, color: STARLIGHT } }, "별샘"),
      h("div", { key: "sub", style: { display: "flex", marginTop: 30, fontSize: 40, color: DIM } },
        "당신이 태어난 밤, 하늘은 기억하고 있어요"),
    ]),
    h("div", {
      key: "rule",
      style: { position: "absolute", left: 96, bottom: 84, width: 148, height: 2, background: GOLD, opacity: 0.75 },
    }),
  ]);
}

/**
 * 별자리 카드 — 오른쪽에 그 자리의 성좌를 그린다.
 *
 * 좌표와 잇는 선은 화면의 진(陣)이 쓰는 것과 같은 데이터다(lib/zodiac.ts의
 * stars·path, 260×200 좌표계). 새로 그릴 것이 없고, 공유했을 때 열두 장이 서로
 * 다른 그림이 된다.
 */
function signCard(sign) {
  /**
   * 성좌마다 260×200 좌표계에서 실제로 쓰는 자리가 다르다 — 양자리는 오른쪽
   * 위 한 귀퉁이만 쓰고, 전갈자리는 아래로 길게 늘어진다. 좌표계를 그대로
   * 쓰면 어떤 자리는 카드 구석에 작게 몰린다. 그래서 그 자리가 실제로 차지하는
   * 범위를 재서 카드 안에 꽉 차게 맞춘다.
   */
  const BOX = { w: 430, h: 430 };
  const xs = sign.stars.map(([x]) => x);
  const ys = sign.stars.map(([, y]) => y);
  const span = {
    x: Math.min(...xs), y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs) || 1,
    h: Math.max(...ys) - Math.min(...ys) || 1,
  };
  const scale = Math.min(BOX.w / span.w, BOX.h / span.h);
  const offset = {
    x: (BOX.w - span.w * scale) / 2 - span.x * scale,
    y: (BOX.h - span.h * scale) / 2 - span.y * scale,
  };
  const place = ([x, y]) => [x * scale + offset.x, y * scale + offset.y];

  const dots = sign.stars.map((star, i) =>
    (() => {
      const [px, py] = place(star);
      const big = i === sign.brightest;
      const r = big ? 8 : 5;
      return h("div", {
        key: `d${i}`,
        style: {
          position: "absolute", left: px - r, top: py - r,
          width: r * 2, height: r * 2, borderRadius: 999,
          background: big ? "#fff6d8" : GOLD,
        },
      });
    })(),
  );

  // 별을 잇는 선. path의 M/L 세그먼트를 그대로 따라가며 두 점 사이에 가는 막대를 놓는다
  // (Satori는 SVG path를 그리지 못한다).
  const links = [];
  const segments = sign.path.split(/(?=M)/);
  for (const seg of segments) {
    const pts = [...seg.matchAll(/[ML]\s*([\d.]+)\s+([\d.]+)/g)].map((m) =>
      place([Number(m[1]), Number(m[2])]),
    );
    for (let i = 1; i < pts.length; i += 1) {
      const [x1, y1] = pts[i - 1];
      const [x2, y2] = pts[i];
      const len = Math.hypot(x2 - x1, y2 - y1);
      const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
      // 중점에 놓고 돌린다. transform-origin을 왼쪽 끝으로 옮기는 방법은 Satori가
      // 그 속성을 따르지 않아 선이 별에서 떨어져 나갔다(실측) — 중심 기준 회전은
      // 기본 동작이라 어디서든 같게 나온다.
      const [cx, cy] = [(x1 + x2) / 2, (y1 + y2) / 2];
      links.push(
        h("div", {
          key: `l${links.length}`,
          style: {
            position: "absolute", left: cx - len / 2, top: cy - 0.75,
            width: len, height: 1.5, background: GOLD, opacity: 0.45,
            transform: `rotate(${angle}deg)`,
          },
        }),
      );
    }
  }

  return frame([
    ...starLayer(620),
    h("div", {
      key: "body",
      style: {
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "0 0 0 96px", width: 640,
      },
    }, [
      h("div", { key: "eyebrow", style: { display: "flex", fontSize: 24, letterSpacing: 8, color: GOLD } }, "BYEOLSAEM"),
      h("div", { key: "name", style: { display: "flex", marginTop: 22, fontSize: 84, color: STARLIGHT } }, sign.ko),
      h("div", { key: "range", style: { display: "flex", marginTop: 14, fontSize: 30, color: GOLD } }, sign.range),
      h("div", { key: "tag", style: { display: "flex", marginTop: 26, fontSize: 32, color: DIM } }, sign.tagline),
    ]),
    h("div", {
      key: "sky",
      style: {
        position: "absolute", right: 72, top: (630 - BOX.h) / 2,
        width: BOX.w, height: BOX.h, display: "flex",
      },
    }, [...links, ...dots]),
  ]);
}

async function render(element, file, font) {
  const res = new ImageResponse(element, {
    ...SIZE,
    fonts: [{ name: "MaruBuri", data: font, style: "normal", weight: 700 }],
  });
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(join(OUT, file), buf);
  return buf.length;
}

const font = await readFile(join(ROOT, "src/fonts/MaruBuri-OG.ttf"));
await mkdir(join(OUT, "sign"), { recursive: true });

let total = await render(defaultCard(), "default.png", font);
console.log(`og/default.png  ${(total / 1024).toFixed(0)}KB`);

for (const sign of ZODIAC_SIGNS) {
  const bytes = await render(signCard(sign), `sign/${sign.key}.png`, font);
  total += bytes;
  console.log(`og/sign/${sign.key}.png`.padEnd(24), `${(bytes / 1024).toFixed(0)}KB`);
}
console.log(`\n합계 ${(total / 1024).toFixed(0)}KB / ${ZODIAC_SIGNS.length + 1}장`);
