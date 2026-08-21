/**
 * X 계정 이미지(프로필·배너)를 PNG로 굽는다.
 *
 * 사이트에 서빙되지 않는다 — X에 직접 올리는 파일이라 public/이 아니라
 * social/에 둔다. 공유 카드(build-og.mjs)와 같은 폰트·색·성좌를 쓴다:
 * 타임라인에서 본 그림과 링크를 눌러 들어온 화면이 같아야 한다.
 *
 *   node --experimental-strip-types scripts/build-social.mjs
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { ImageResponse } from "next/og.js";
import { ZODIAC_SIGNS } from "../src/lib/zodiac.ts";
import { constellation } from "./lib/constellation.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "social");

const GOLD = "#e3c568";
const STARLIGHT = "#eef1fb";
const DIM = "#a9aec2";
const BRIGHT = "#fff6d8";

const h = React.createElement;

/**
 * 프로필 사진 (400×400).
 *
 * X는 이걸 원으로 잘라 타임라인에서 32px로 줄인다. 그 크기에서 성좌는 점 몇
 * 개로 뭉개지므로 이름 두 글자만 남긴다 — 한글 두 자는 32px에서도 읽힌다.
 * 금색이 아니라 흰색으로 쓰는 이유도 같다: 먹빛 바닥에서 대비가 더 크다.
 *
 * 모서리는 잘려 나가므로 장식은 안쪽 원 안에만 둔다.
 */
function avatar() {
  return h("div", {
    style: {
      width: "100%", height: "100%", display: "flex",
      alignItems: "center", justifyContent: "center", position: "relative",
      fontFamily: "MaruBuri",
      background: "radial-gradient(300px 300px at 50% 32%, #1e2757 0%, #0b1026 58%, #070a16 100%)",
    },
  }, [
    // 인장처럼 두르는 금선. 잘리는 바깥 원보다 안쪽에 둔다.
    h("div", {
      key: "ring",
      style: {
        position: "absolute", left: 32, top: 32, width: 336, height: 336,
        borderRadius: 999, border: `2px solid ${GOLD}`, opacity: 0.5,
      },
    }),
    h("div", {
      key: "name",
      style: { display: "flex", fontSize: 112, color: STARLIGHT, marginTop: 14 },
    }, "별샘"),
    // 이름 아래 짧은 금선. 공유 카드가 쓰는 것과 같은 마감이라 두 그림이
    // 나란히 놓였을 때 한 손에서 나온 것으로 보인다.
    h("div", {
      key: "rule",
      style: {
        position: "absolute", left: 160, top: 278, width: 80, height: 2,
        background: GOLD, opacity: 0.7,
      },
    }),
  ]);
}

/**
 * 배너 (1500×500).
 *
 * 두 가지가 화면을 먹는다: 프로필 사진이 왼쪽 아래를 덮고, 모바일은 좌우를
 * 잘라낸다. 그래서 글은 y 150~340 띠 안에만 두고, 성좌는 오른쪽에 옅게 깐다
 * — 잘려도 아쉽지 않은 것만 가장자리에 둔다.
 */
function banner() {
  const BOX = { w: 380, h: 300 };
  const sign = ZODIAC_SIGNS.find((s) => s.key === "scorpio");

  return h("div", {
    style: {
      width: "100%", height: "100%", display: "flex", position: "relative",
      fontFamily: "MaruBuri",
      background: "radial-gradient(1100px 620px at 30% 0%, #1c2450 0%, #0b1026 52%, #070a16 100%)",
    },
  }, [
    h("div", {
      key: "sky",
      style: {
        position: "absolute", right: 120, top: 100,
        width: BOX.w, height: BOX.h, display: "flex", opacity: 0.55,
      },
    }, constellation(sign, BOX, { h, gold: GOLD, bright: BRIGHT, starR: 4, lineW: 1.25 })),
    h("div", {
      key: "body",
      style: {
        position: "absolute", left: 110, top: 150,
        display: "flex", flexDirection: "column",
      },
    }, [
      h("div", { key: "e", style: { display: "flex", fontSize: 22, letterSpacing: 9, color: GOLD } }, "BYEOLSAEM"),
      h("div", { key: "t", style: { display: "flex", marginTop: 22, fontSize: 46, color: STARLIGHT } },
        "당신이 태어난 밤, 하늘은 기억하고 있어요"),
      h("div", { key: "u", style: { display: "flex", marginTop: 20, fontSize: 26, color: DIM } },
        "byeolsaem.com"),
    ]),
  ]);
}

async function render(element, file, size, font) {
  const res = new ImageResponse(element, {
    ...size,
    fonts: [{ name: "MaruBuri", data: font, style: "normal", weight: 700 }],
  });
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(join(OUT, file), buf);
  console.log(`social/${file}`.padEnd(26), `${(buf.length / 1024).toFixed(0)}KB`);
}

const font = await readFile(join(ROOT, "src/fonts/MaruBuri-OG.ttf"));
await mkdir(OUT, { recursive: true });

await render(avatar(), "x-avatar.png", { width: 400, height: 400 }, font);
await render(banner(), "x-banner.png", { width: 1500, height: 500 }, font);
