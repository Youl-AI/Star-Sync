/**
 * 페이지 전환 체감을 만드는 마지막 왕복을 없앤다.
 *
 * 정적 export에서 Next는 이동할 페이지의 데이터(RSC .txt)는 미리 받아 두지만,
 * 그 페이지를 그릴 JS 청크는 클릭한 뒤에야 요청한다 — 데이터가 도착해야 어떤
 * 청크가 필요한지 알게 되는 직렬 2왕복이라, 모든 내부 이동에 350~550ms가
 * 공통으로 얹혔다(2026-08-22 실측: 클릭 +187ms에 청크 4개 로드 시작).
 *
 * 각 페이지 HTML은 자기가 쓰는 청크를 <script src>로 이미 선언하고 있다.
 * 그래서 별도의 manifest 없이 — 헤더에서 갈 수 있는 페이지들의 HTML에서 청크
 * 목록을 긁어 합치고, 모든 페이지 <head>에 <link rel="prefetch">로 심는다.
 * 브라우저가 한가할 때 미리 받아 두므로 클릭 시점엔 캐시에 있다.
 *
 * npm run build 뒤에 자동으로 돈다(package.json의 postbuild).
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "out");

/** 헤더·주요 동선에서 갈 수 있는 페이지들 — 이들의 청크가 프리페치 대상이다. */
const NAV_TARGETS = [
  "index.html",
  "natal.html",
  "today.html",
  "yearly.html",
  "synastry.html",
  "sign.html",
  "retrograde.html",
  "calendar.html",
  "weekly.html",
  "solar-return.html",
  "blog.html",
];

const CHUNK_RE = /\/_next\/static\/chunks\/[^"']+\.js/g;

async function chunksOf(file) {
  const html = await readFile(join(OUT, file), "utf-8");
  return new Set(html.match(CHUNK_RE) ?? []);
}

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(full);
    else if (entry.name.endsWith(".html")) yield full;
  }
}

const union = new Set();
for (const target of NAV_TARGETS) {
  for (const chunk of await chunksOf(target)) union.add(chunk);
}

let patched = 0;
let injectedTotal = 0;
for await (const file of htmlFiles(OUT)) {
  let html = await readFile(file, "utf-8");
  if (html.includes('rel="prefetch"')) continue; // 두 번 돌려도 안전
  const own = new Set(html.match(CHUNK_RE) ?? []);
  const links = [...union]
    .filter((chunk) => !own.has(chunk))
    .map((chunk) => `<link rel="prefetch" href="${chunk}" as="script"/>`)
    .join("");
  if (!links) continue;
  html = html.replace("</head>", links + "</head>");
  await writeFile(file, html);
  patched += 1;
  injectedTotal += links.split("rel=").length - 1;
}

console.log(
  `내비 대상 청크 합집합 ${union.size}개 · HTML ${patched}장에 평균 ${(injectedTotal / Math.max(patched, 1)).toFixed(1)}개씩 주입`,
);
