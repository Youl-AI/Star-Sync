/**
 * 오늘의 하늘을 스레드에 한 편 올린다.
 *
 * 사이트가 이미 매일 계산하는 것과 같은 천문 데이터를 그대로 쓴다. 별도의
 * 문장 생성 모델을 두지 않은 이유는 두 가지다. 하나는 매일 도는 작업이라
 * 품질이 흔들리면 안 되고, 다른 하나는 여기서 말하는 날짜와 도수가 사이트가
 * 말하는 것과 정확히 같아야 하기 때문이다. 같은 계산에서 나오면 어긋날 수 없다.
 *
 * 실행: node --experimental-strip-types --import ./scripts/lib/register-ts-ext.mjs scripts/post-threads.mjs
 *   THREADS_ACCESS_TOKEN  장기 액세스 토큰(60일). 없으면 아무것도 하지 않는다.
 *   DRY_RUN=1             글만 만들어 보고 게시는 하지 않는다.
 *
 * 스레드 API는 두 번에 나눠 올린다 — 컨테이너를 만들고(1) 그것을 게시한다(2).
 * 중간에 잠깐 쉬는 것은 메타 문서의 권고다(컨테이너가 준비되기 전에 게시를
 * 부르면 실패한다).
 */

import { toJulianDay, planetPosition, sunPosition, norm180 } from "../src/lib/ephemeris.ts";
import { moonPosition } from "../src/lib/moon.ts";
import { signAtLongitude } from "../src/lib/zodiac.ts";
import { lunationsBetween } from "../src/lib/lunation.ts";

const API = "https://graph.threads.net/v1.0";
const SITE = "byeolsaem.com";

/** 글에 이름을 올리는 별들. 느린 별은 자리가 몇 달씩 그대로라 매일 말할 것이 없다. */
const VOICES = [
  { key: "mercury", ko: "수성" },
  { key: "venus", ko: "금성" },
  { key: "mars", ko: "화성" },
];

const KST = { timeZone: "Asia/Seoul" };

const KST_DAY = new Intl.DateTimeFormat("ko-KR", { ...KST, month: "long", day: "numeric", weekday: "long" });
const KST_DATE = new Intl.DateTimeFormat("ko-KR", { ...KST, month: "long", day: "numeric" });
const KST_TIME = new Intl.DateTimeFormat("ko-KR", { ...KST, hour: "numeric", minute: "2-digit", hour12: false });
/** 정렬 가능한 KST 날짜(YYYY-MM-DD). 며칠 뒤인지 세는 데만 쓴다. */
const KST_ISO = new Intl.DateTimeFormat("en-CA", { ...KST, year: "numeric", month: "2-digit", day: "2-digit" });

function kstTime(date) {
  // 자정 뒤 한 시간은 "00시"로 나온다. 읽는 글에서는 0시가 자연스럽다.
  return KST_TIME.format(date).replace(/^0(?=\d)/, "").replace(":", "시 ") + "분";
}

/** 두 순간이 KST 달력에서 며칠 떨어져 있는가. 같은 날이면 0, 내일이면 1. */
function kstDayGap(from, to) {
  const day = (d) => Date.parse(`${KST_ISO.format(d)}T00:00:00Z`);
  return Math.round((day(to) - day(from)) / 86400000);
}

/** 달의 위상 — 태양과 달의 황경 차 하나로 여덟 국면이 갈린다. */
function moonPhase(angle) {
  if (angle < 22.5 || angle >= 337.5) return { ko: "신월", note: "심는 국면입니다" };
  if (angle < 67.5) return { ko: "초승달", note: "막 시작한 것을 지키는 며칠입니다" };
  if (angle < 112.5) return { ko: "상현", note: "결정을 미루기 어려워지는 날입니다" };
  if (angle < 157.5) return { ko: "차오르는 달", note: "밀어붙이기 좋은 며칠입니다" };
  if (angle < 202.5) return { ko: "보름", note: "차오른 것이 드러나는 밤입니다" };
  if (angle < 247.5) return { ko: "이지러지는 달", note: "거두고 나누는 며칠입니다" };
  if (angle < 292.5) return { ko: "하현", note: "덜어내는 국면입니다" };
  return { ko: "그믐달", note: "다음 신월을 기다리며 비우는 며칠입니다" };
}

/** 역행 여부는 하루 뒤 황경과 비교해서 본다 — 뒤로 가면 역행이다. */
function isRetrograde(key, jd) {
  const a = planetPosition(key, jd).longitude;
  const b = planetPosition(key, jd + 1).longitude;
  return ((b - a + 540) % 360) - 180 < 0;
}

export function buildPost(now = new Date()) {
  const jd = toJulianDay(now);
  const sun = sunPosition(jd).longitude;
  const moon = moonPosition(jd).longitude;
  const phase = moonPhase(((moon - sun) % 360 + 360) % 360);

  const lines = [`${KST_DAY.format(now)}의 하늘.`, ""];

  lines.push(
    `달은 ${signAtLongitude(moon).ko}에 있습니다. ${phase.ko}을 지나는 중이라, ${phase.note}.`,
  );
  lines.push(`태양은 ${signAtLongitude(sun).ko} ${Math.floor(sun % 30)}도를 지납니다.`);

  // 역행하는 별이 있으면 그것이 그날의 소식이다. 없으면 굳이 만들지 않는다.
  const retro = VOICES.filter((v) => isRetrograde(v.key, jd));
  if (retro.length > 0) {
    const names = retro.map((v) => `${v.ko}`).join("과 ");
    lines.push("", `${names}이 역행 중입니다. 되돌아보는 자리에서는 서두르지 않는 편이 낫습니다.`);
  }

  // 다가오는 삭망 하나만 — 둘 다 적으면 달력이 되어 버린다.
  //
  // 오늘이나 내일 오는 삭망을 "다음 신월은 9월 11일…"이라고 쓰면, 바로 위에서
  // 이미 "신월을 지나는 중"이라고 말해 놓고 그것을 다시 앞날로 가리키게 된다.
  // 가까운 것은 날짜 대신 오늘·내일로 부르고, 그날의 정확한 시각을 준다.
  const soon = lunationsBetween(now, new Date(now.getTime() + 16 * 86400000))[0];
  if (soon) {
    const at = new Date(soon.date);
    const what = soon.kind === "new" ? "신월" : "보름";
    const gap = kstDayGap(now, at);
    if (gap <= 1) {
      lines.push("", `${gap === 0 ? "오늘" : "내일"} ${kstTime(at)}, ${soon.signKo}에서 ${what}이 옵니다.`);
    } else {
      lines.push("", `다음 ${what}은 ${KST_DATE.format(at)} ${kstTime(at)}, ${soon.signKo}입니다.`);
    }
  }

  lines.push("", `오늘의 하늘 전체 → ${SITE}/today`);
  return lines.join("\n");
}

async function callApi(path, params) {
  const url = new URL(`${API}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { method: "POST" });
  const body = await res.json();
  if (!res.ok) throw new Error(`${path} 실패 ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

async function main() {
  const text = buildPost();
  console.log("--- 게시할 글 ---");
  console.log(text);
  console.log(`--- ${[...text].length}자 ---`);

  if (process.env.DRY_RUN === "1") return;

  const token = process.env.THREADS_ACCESS_TOKEN;
  if (!token) {
    console.log("THREADS_ACCESS_TOKEN이 없어 게시하지 않는다.");
    return;
  }

  // 내 계정 ID는 토큰만 있으면 물어볼 수 있다 — 시크릿을 하나 더 두지 않는다.
  const meRes = await fetch(`${API}/me?fields=id,username&access_token=${token}`);
  const me = await meRes.json();
  if (!meRes.ok) throw new Error(`me 실패: ${JSON.stringify(me)}`);
  console.log(`계정: @${me.username}`);

  const container = await callApi(`${me.id}/threads`, {
    media_type: "TEXT",
    text,
    access_token: token,
  });

  // 컨테이너가 준비될 시간. 메타 문서가 권하는 최소 간격이다.
  await new Promise((r) => setTimeout(r, 30_000));

  const published = await callApi(`${me.id}/threads_publish`, {
    creation_id: container.id,
    access_token: token,
  });
  console.log(`게시 완료: ${published.id}`);
}

// 직접 실행할 때만 게시한다. 테스트와 미리보기는 buildPost만 가져다 쓴다.
if (import.meta.main) await main();
