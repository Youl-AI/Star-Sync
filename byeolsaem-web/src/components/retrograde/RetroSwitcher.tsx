import Link from "next/link";

/**
 * 역행 페이지 사이의 행성 전환기 (2026-08-22 사용자 제안).
 *
 * 형제 페이지(금성·화성)로 가는 길이 본문 맨 아래에만 있어서, 끝까지 내려간
 * 사람만 다른 행성의 역행이 있다는 것을 알았다. 이제 화면 좌우에 붙어
 * 스크롤을 따라다닌다 — 읽다가 언제든 옆 행성으로 건너간다.
 *
 * 좌우 레일은 넓은 화면 전용이다. 모바일은 본문과 겹칠 폭이 없으므로 제목
 * 아래의 행성 탭이 같은 일을 한다 — 어느 화면에서든 전환기는 하나는 보인다.
 *
 * 서버 컴포넌트 — 고정 위치 링크일 뿐이라 자바스크립트가 필요 없다.
 */

const PLANETS = [
  { key: "mercury", ko: "수성", symbol: "☿", href: "/retrograde" },
  { key: "venus", ko: "금성", symbol: "♀", href: "/retrograde/venus" },
  { key: "mars", ko: "화성", symbol: "♂", href: "/retrograde/mars" },
] as const;

type PlanetKey = (typeof PLANETS)[number]["key"];

function neighbors(current: PlanetKey) {
  const i = PLANETS.findIndex((p) => p.key === current);
  const n = PLANETS.length;
  return {
    prev: PLANETS[(i - 1 + n) % n],
    next: PLANETS[(i + 1) % n],
  };
}

function Rail({
  planet,
  side,
}: {
  planet: (typeof PLANETS)[number];
  side: "left" | "right";
}) {
  const arrow = side === "left" ? "‹" : "›";
  return (
    <Link
      href={planet.href}
      aria-label={`${planet.ko} 역행 보러 가기`}
      className={
        // 본문(max-w-3xl) 바깥의 빈 마당에 선다. xl부터만 — 그보다 좁으면
        // 본문과 겹치므로 아래 탭이 대신한다.
        "group fixed top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-2 " +
        "text-starlight-dim transition-colors hover:text-gold-soft xl:flex " +
        (side === "left" ? "left-6" : "right-6")
      }
    >
      <span aria-hidden className="font-display text-2xl leading-none text-gold-soft">
        {arrow}
      </span>
      <span aria-hidden className="astro-symbol text-lg text-gold-soft">
        {planet.symbol}
      </span>
      <span className="text-meta tracking-[0.14em] [writing-mode:vertical-rl]">
        {planet.ko} 역행
      </span>
    </Link>
  );
}

/** 화면 좌우를 따라다니는 두 레일. 이전 행성은 왼쪽, 다음 행성은 오른쪽. */
export function RetroRails({ current }: { current: PlanetKey }) {
  const { prev, next } = neighbors(current);
  return (
    <>
      <Rail planet={prev} side="left" />
      <Rail planet={next} side="right" />
    </>
  );
}

/** 제목 아래의 행성 탭 — 좁은 화면의 전환기이자, 셋이 형제라는 지도. */
export function RetroTabs({ current }: { current: PlanetKey }) {
  return (
    <nav aria-label="역행 행성 고르기" className="mt-6 flex justify-center gap-2">
      {PLANETS.map((planet) => {
        const active = planet.key === current;
        return (
          <Link
            key={planet.key}
            href={planet.href}
            aria-current={active ? "page" : undefined}
            className={
              "border-b px-3 pb-1.5 pt-1 text-meta tracking-[0.1em] transition-colors " +
              (active
                ? "border-gold text-gold-soft"
                : "border-transparent text-starlight-dim hover:border-gold/40 hover:text-starlight")
            }
          >
            <span aria-hidden className="astro-symbol mr-1.5">
              {planet.symbol}
            </span>
            {planet.ko}
          </Link>
        );
      })}
    </nav>
  );
}
