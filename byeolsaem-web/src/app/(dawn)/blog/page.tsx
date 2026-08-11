import type { Metadata } from "next";
import Link from "next/link";
import { POSTS, formatPublished } from "@/content/blog";

export const metadata: Metadata = {
  title: "칼럼 | 별샘",
  description:
    "점성술을 처음 읽는 사람을 위한 글. 하우스와 상승궁, 수성 역행, 달의 위상처럼 자주 묻는 것부터 차례로 다룹니다.",
};

export default function BlogIndexPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-32 pt-10">
      <header className="text-center">
        <p className="text-[11px] tracking-[0.28em] text-gold-dark">COLUMN</p>
        <h1 className="mt-4 break-keep font-display text-3xl leading-snug text-ink-text md:text-4xl">
          칼럼
        </h1>
        <p className="mx-auto mt-5 max-w-lg break-keep leading-relaxed text-ink-dim">
          별자리 하나로 설명되지 않는 것들을 하나씩 풀어 씁니다. 읽고 나서 자기
          하늘에서 확인할 수 있는 이야기만 싣습니다.
        </p>

        <div className="my-10 flex items-center justify-center gap-2" aria-hidden>
          <span className="h-px w-8 bg-gold-dark/40" />
          <span className="size-[3px] rotate-45 bg-gold-dark/70" />
          <span className="h-px w-8 bg-gold-dark/40" />
        </div>
      </header>

      {/*
        목록은 카드 격자가 아니라 세로 한 줄이다. 글이 다섯 편뿐이라 격자로
        늘어놓으면 빈칸이 생기고, 무엇보다 여기는 읽으러 온 사람의 자리라
        제목과 한 문장이 나란히 보이는 편이 고르기 쉽다.
      */}
      <ul className="mx-auto max-w-[65ch]">
        {POSTS.map((post) => (
          <li key={post.slug} className="border-t border-gold-dark/15 first:border-t-0">
            <Link href={`/blog/${post.slug}`} className="group block py-8">
              <p className="text-[11px] tracking-[0.22em] text-gold-dark">{post.category}</p>
              <h2 className="mt-3 break-keep font-display text-xl leading-snug text-ink-text transition-colors group-hover:text-gold-dark md:text-2xl">
                {post.title}
              </h2>
              <p className="mt-3 break-keep leading-relaxed text-ink-dim">{post.summary}</p>
              <p className="mt-4 text-xs text-ink-dim">
                <time dateTime={post.published}>{formatPublished(post.published)}</time> · 읽는 데{" "}
                {post.readingMinutes}분
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
