import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { ReadingProgress } from "@/components/dawn/ReadingProgress";

/**
 * 새벽 — 읽는 페이지의 세계. 블로그와 정책 문서가 여기 산다.
 *
 * 밤의 반대편이다. 오래 읽는 글은 어두운 배경에서 눈이 빨리 지치므로 미색 종이에
 * 남색 먹으로 뒤집는다(스펙 §1.2). Three.js도 부드러운 스크롤도 싣지 않는다 —
 * 글을 읽는 데 필요하지 않고, 번들만 무거워진다.
 */
export default function DawnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-paper text-ink-text">
      {/*
        html 배경까지 바꾼다. 스크롤을 끝까지 당겼을 때 튕겨 나오는 여백에는
        body가 아니라 html의 색이 보이므로, 이걸 두지 않으면 밝은 글 위아래로
        밤하늘 색이 번쩍인다. 최상위 레이아웃은 어느 라우트가 열렸는지 알 수
        없어서 거기서는 처리할 수 없다.
      */}
      <style>{`html{background:var(--color-paper)}`}</style>

      <ReadingProgress />

      {/* 밤의 "얇은 베일"에 대응하는 새벽의 머리글. 읽는 것을 방해하지 않도록
          장식을 걷어내고 이름과 돌아가는 길만 남긴다. */}
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-7">
        <Link href="/" aria-label="별샘 홈으로">
          <Wordmark size="nav" tone="dawn" />
        </Link>
        <Link
          href="/"
          className="border-b border-gold-dark/40 pb-0.5 text-meta tracking-wide text-ink-dim transition-colors hover:text-ink-text"
        >
          밤하늘로 돌아가기
        </Link>
      </header>

      {children}
    </div>
  );
}
