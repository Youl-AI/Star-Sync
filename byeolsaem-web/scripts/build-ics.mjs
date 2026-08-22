/**
 * 빌드 산출물에 /sky.ics를 넣는다 — 캘린더 앱이 구독하는 주소.
 * 향후 12개월 이벤트. 실행: postbuild (prefetch-chunks 다음).
 * TS를 그대로 물어오므로 --experimental-strip-types로 돈다(build-og.mjs와 동일).
 */
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { eventsBetween } from "../src/lib/calendar-events.ts";
import { buildIcs } from "../src/lib/ics.ts";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "out", "sky.ics");
const now = new Date();
const events = eventsBetween(now, new Date(now.getTime() + 365 * 86400000));
await writeFile(OUT, buildIcs(events), "utf-8");
console.log(`sky.ics — 이벤트 ${events.length}개, 12개월치`);
