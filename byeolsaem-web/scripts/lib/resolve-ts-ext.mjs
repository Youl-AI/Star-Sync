/**
 * Node의 `--experimental-strip-types`는 ESM 규칙 그대로 상대 경로 import에
 * 확장자가 있어야 찾는다(node/issues/61229). src/lib의 모듈들은 Next.js
 * 번들러(moduleResolution: "bundler") 기준으로 확장자 없이 서로를 import하므로,
 * `eventsBetween`처럼 여러 lib을 거쳐 가는 함수를 스크립트에서 그대로 물어오면
 * `./lunation` 같은 상대 경로를 Node가 못 찾는다.
 *
 * build-og.mjs·build-social.mjs는 이 문제를 겪지 않는다 — 둘 다 더 이상 아무것도
 * import하지 않는 잎 모듈(zodiac.ts)만 불러오기 때문이다. build-ics.mjs는
 * calendar-events.ts를 통해 lunation·ingress·retrograde·ephemeris·moon까지
 * 이어지는 체인을 실제로 실행해야 해서 이 로더가 필요하다.
 *
 * src/lib 소스 자체는 건드리지 않는다 — 확장자를 찾아 붙여 주기만 하는
 * 리졸버 훅이다.
 */
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const CANDIDATE_EXTENSIONS = [".ts", ".tsx", ".mjs", ".js"];

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.[a-zA-Z0-9]+$/.test(specifier)) {
    const basePath = fileURLToPath(new URL(specifier, context.parentURL));
    for (const ext of CANDIDATE_EXTENSIONS) {
      if (existsSync(basePath + ext)) {
        return nextResolve(specifier + ext, context);
      }
    }
  }
  return nextResolve(specifier, context);
}
