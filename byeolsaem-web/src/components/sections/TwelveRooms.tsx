import Link from "next/link";
import { ZODIAC_SIGNS } from "@/lib/zodiac";

// 별자리 기호는 유니코드 점성 기호를 쓴다 — SVG를 12개 그리는 것보다 가볍고,
// 이 사이트는 이미 ☉(TalismanChip)·☿(수성 역행)를 같은 방식으로 쓰고 있다.
// 뒤에 붙은 ︎(텍스트 표현 선택자)가 없으면 Windows가 컬러 이모지로
// 그려 버려 금색 대신 보라 네모가 나온다 — 실측으로 확인한 문제.
const GLYPHS: Record<string, string> = {
  aries: "♈︎",
  taurus: "♉︎",
  gemini: "♊︎",
  cancer: "♋︎",
  leo: "♌︎",
  virgo: "♍︎",
  libra: "♎︎",
  scorpio: "♏︎",
  sagittarius: "♐︎",
  capricorn: "♑︎",
  aquarius: "♒︎",
  pisces: "♓︎",
};

/**
 * 문 너머, 열두 개의 방 — 메인 여정의 마지막 섹션.
 *
 * 세 개의 문 바로 아래가 푸터라 여정이 뚝 끊긴다는 피드백(2026-08-14)에서
 * 시작했다. 서사로는 문을 지나면 방이 나오는 순서고(/sign의 제목이 이미
 * "열두 개의 방"이다), 기능으로는 검색 유입의 핵심인 /sign 12페이지로 가는
 * 내부 링크가 메인에 처음 생기는 것이다 — 색인을 앞당기는 실질적인 통로.
 *
 * 생김새는 세 개의 문과 같은 "무경계" 문법을 따른다: 상자 없이 위쪽 금선
 * 하나로만 칸을 나눈다. 새벽 직전 페이즈에 앉아 여명 전 마지막 별들처럼 보인다.
 */
export function TwelveRooms() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-28">
      <header className="text-center">
        <p className="font-latin text-eyebrow tracking-[0.28em] text-gold">TWELVE ROOMS</p>
        <h2 className="mt-4 break-keep font-display text-2xl text-starlight md:text-3xl">
          문 너머에는 열두 개의 방이 있습니다
        </h2>
        <p className="mx-auto mt-4 max-w-md break-keep leading-relaxed text-starlight-dim">
          태양은 한 해에 걸쳐 이 방들을 차례로 지납니다. 당신이 태어난 날 태양이
          머물던 방부터 열어 보세요.
        </p>
      </header>

      <ul className="mt-14 grid grid-cols-3 gap-x-6 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
        {ZODIAC_SIGNS.map((s) => (
          <li key={s.key}>
            <Link
              href={`/sign/${s.key}`}
              className="group flex flex-col items-center gap-1.5 border-t border-gold/15 pt-5 transition-colors hover:border-gold/50"
            >
              <span
                aria-hidden
                className="text-xl text-gold-soft/80 transition-colors group-hover:text-gold-soft"
              >
                {GLYPHS[s.key]}
              </span>
              <span className="font-display text-sm text-starlight">{s.ko}</span>
              <span className="font-latin text-eyebrow tracking-wide text-starlight-dim">
                {s.range}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
