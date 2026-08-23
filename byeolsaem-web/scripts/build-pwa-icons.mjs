/**
 * PWA 아이콘 — build-og와 같은 satori 파이프라인이라 수작업 에셋이 없다.
 * 잉크 바탕에 금색 별 하나 + "별샘". maskable은 안전 영역(중앙 80%) 안에 그린다.
 *
 * 별은 "✦" 글자가 아니라 원+선으로 직접 그린다(build-og.mjs의 MOTIFS 방식과 같은
 * 발상). MaruBuri-OG.ttf는 scripts/subset-maruburi.py의 OG_EXTRA에 있는 글자와
 * 한글 음절만 남기는데 "✦"는 그 목록에 없어 satori가 빈 칸을 그린다(실측 —
 * 512 아이콘을 눈으로 확인해 확정).
 *
 * 아이콘이 바뀔 일이 생기면 이 스크립트를 고치고 다시 돌린다:
 *   node --experimental-strip-types scripts/build-pwa-icons.mjs
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { ImageResponse } from "next/og.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "pwa");
const h = React.createElement;
const INK = "#0b1026";
const GOLD = "#e3c568";

// 폰트 로드: build-og.mjs와 같은 MaruBuri-OG.ttf(공유 카드용 서브셋)를 그대로 쓴다.
// "별샘"은 subset-maruburi.py의 OG_EXTRA에 이미 있어 이 폰트로 그려진다.
const font = await readFile(join(ROOT, "src/fonts/MaruBuri-OG.ttf"));

/** 별 자리 — 중심 원 하나 + 십자로 겹치는 막대 둘. build-og MOTIFS와 같은 발상. */
function star(size) {
  const barThick = Math.round(size * 0.16);
  const dot = Math.round(size * 0.34);
  return h(
    "div",
    { style: { position: "relative", width: size, height: size, display: "flex" } },
    [
      h("div", {
        key: "h",
        style: {
          position: "absolute", left: 0, top: (size - barThick) / 2,
          width: size, height: barThick, borderRadius: barThick / 2, background: GOLD,
        },
      }),
      h("div", {
        key: "v",
        style: {
          position: "absolute", left: (size - barThick) / 2, top: 0,
          width: barThick, height: size, borderRadius: barThick / 2, background: GOLD,
        },
      }),
      h("div", {
        key: "dot",
        style: {
          position: "absolute", left: (size - dot) / 2, top: (size - dot) / 2,
          width: dot, height: dot, borderRadius: dot / 2, background: GOLD,
        },
      }),
    ],
  );
}

function icon(size, maskable) {
  const scale = maskable ? 0.72 : 0.92; // maskable은 원형 마스크 안쪽에 들어가야 한다
  const starSize = Math.round(size * 0.34 * scale);
  const fontSize = Math.round(size * 0.22 * scale);
  return h("div", {
    style: {
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", background: INK,
      fontFamily: "MaruBuri", gap: Math.round(size * 0.04),
    },
  }, [
    star(starSize),
    h("div", { key: "name", style: { display: "flex", color: GOLD, fontSize, letterSpacing: Math.round(size * 0.02) } }, "별샘"),
  ]);
}

await mkdir(OUT, { recursive: true });
for (const [name, size, maskable] of [["icon-192.png", 192, false], ["icon-512.png", 512, false], ["icon-512-maskable.png", 512, true]]) {
  const res = new ImageResponse(icon(size, maskable), {
    width: size, height: size,
    fonts: [{ name: "MaruBuri", data: font, style: "normal" }],
  });
  await writeFile(join(OUT, name), Buffer.from(await res.arrayBuffer()));
  console.log(`pwa/${name}`);
}
