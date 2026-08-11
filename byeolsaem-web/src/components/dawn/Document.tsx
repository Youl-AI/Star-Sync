import type { ReactNode } from "react";

/**
 * 새벽 문서의 뼈대 — "밤의 서재"(스펙 §6.8).
 *
 * 장(章) 번호 · 중앙 제목 · 선-다이아-선, 그리고 65ch 한 칼럼. 정책 문서는
 * 같은 템플릿에서 장식(장 번호·드롭캡)을 뺀 판을 쓴다. `ornament={false}`가
 * 그 스위치다.
 *
 * 본문 폭을 65ch로 묶은 것은 취향이 아니라 가독성 기준이다. 한 줄이 그보다
 * 길어지면 눈이 다음 줄의 첫 글자를 놓친다.
 */
export function DawnDocument({
  chapter,
  title,
  lead,
  updated,
  ornament = true,
  children,
}: {
  /** 장 번호 표기 — "I", "II". 정책 문서에서는 생략한다. */
  chapter?: string;
  title: string;
  /** 제목 아래 한 줄 요약. */
  lead?: string;
  /** "2026. 8. 12. 개정" 같은 갱신 표기. */
  updated?: string;
  ornament?: boolean;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-32 pt-10">
      <header className="text-center">
        {ornament && chapter && (
          <p className="text-[11px] tracking-[0.28em] text-gold-dark">{chapter}</p>
        )}
        <h1 className="mt-4 break-keep font-display text-3xl leading-snug text-ink-text md:text-4xl">
          {title}
        </h1>
        {lead && (
          <p className="mx-auto mt-5 max-w-lg break-keep leading-relaxed text-ink-dim">{lead}</p>
        )}
        {updated && (
          <p className="mt-6 text-[11px] tracking-wide text-ink-dim">{updated}</p>
        )}

        {/* 선-다이아-선. 밤의 LineDiamond와 같은 형태를 새벽 배색으로 옮긴 것. */}
        <div className="my-10 flex items-center justify-center gap-2" aria-hidden>
          <span className="h-px w-8 bg-gold-dark/40" />
          <span className="size-[3px] rotate-45 bg-gold-dark/70" />
          <span className="h-px w-8 bg-gold-dark/40" />
        </div>
      </header>

      <div
        className={`mx-auto max-w-[65ch] leading-[1.9] text-ink-text ${
          ornament ? "dawn-prose dawn-dropcap" : "dawn-prose"
        }`}
      >
        {children}
      </div>
    </main>
  );
}

/** 문서 안의 절(節). 제목과 본문 사이 간격을 한 곳에서 관리한다. */
export function DawnSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-12 first:mt-0">
      <h2 className="break-keep font-display text-xl text-ink-text">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
