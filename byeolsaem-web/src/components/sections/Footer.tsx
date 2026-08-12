import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";

// 레이아웃 패밀리: 좁은 중앙 스택이지만 위 세 섹션과 다르게 상단 구분선(border-t)을
// 두고 워드마크 → 링크 행 → 법적 고지 순으로 촘촘하게 쌓이는 "푸터 바" 구조다.
// Wordmark size="hero"는 물결선 + 반영이 이미 세로 공간을 차지하므로(brand/Wordmark.tsx
// 참고) 아래 링크 행과의 간격을 mt-8 정도로 좁혀 반영 뒤에 큰 빈틈이 생기지 않게 했다.
export function Footer() {
  return (
    <footer className="border-t border-gold/10 px-6 py-20 text-center md:py-28">
      <Wordmark size="hero" />

      <nav className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-starlight-dim">
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

      <p className="mx-auto mt-8 max-w-lg break-keep text-meta text-starlight-dim">
        이 사이트는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받을 수 있습니다.
      </p>
    </footer>
  );
}
