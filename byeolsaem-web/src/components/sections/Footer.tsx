import { Link } from "@/components/ui/Link";
import { Wordmark } from "@/components/brand/Wordmark";

// 레이아웃 패밀리: 좁은 중앙 스택이지만 위 세 섹션과 다르게 상단 구분선(border-t)을
// 두고 워드마크 → 링크 행 → 법적 고지 순으로 촘촘하게 쌓이는 "푸터 바" 구조다.
// Wordmark size="hero"는 물결선 + 반영이 이미 세로 공간을 차지하므로(brand/Wordmark.tsx
// 참고) 아래 링크 행과의 간격을 mt-8 정도로 좁혀 반영 뒤에 큰 빈틈이 생기지 않게 했다.
export function Footer() {
  return (
    <footer className="border-t border-gold/10 px-6 py-20 text-center md:py-28">
      <Wordmark size="hero" />

      <nav aria-label="사이트 정보" className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-starlight-dim">
        {/* 별길·문에 못 실은 셋 — 읽을거리와 참조 도구는 푸터가 맡는다(안 B). */}
        <Link href="/blog" className="transition-colors hover:text-starlight">
          칼럼
        </Link>
        <Link href="/ephemeris" className="transition-colors hover:text-starlight">
          천문력
        </Link>
        <Link href="/retrograde" className="transition-colors hover:text-starlight">
          수성 역행
        </Link>
        <Link href="/about" className="transition-colors hover:text-starlight">
          소개
        </Link>
        <Link href="/privacy" className="transition-colors hover:text-starlight">
          개인정보처리방침
        </Link>
        <a href="mailto:hayoul1999@gmail.com" className="transition-colors hover:text-starlight">
          문의
        </a>
      </nav>

      {/* 제휴 고지가 있었는데 정작 제휴 링크가 사이트에 하나도 없었다. 하지 않는
          활동을 모든 페이지에서 알리고 있던 셈이라 내렸다. 쿠팡 파트너스에 실제로
          가입하고 링크를 붙이는 날 이 자리에 되살린다 — 그때는 표시광고법상 필수다. */}
    </footer>
  );
}
