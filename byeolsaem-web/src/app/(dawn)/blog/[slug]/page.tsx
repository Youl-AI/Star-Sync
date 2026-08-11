import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DawnDocument } from "@/components/dawn/Document";
import { POSTS, formatPublished, getPost } from "@/content/blog";

type Params = { slug: string };

/**
 * 주소가 한글이라 개발 서버와 내보내기가 서로 다른 형태를 요구한다.
 *
 * - `next dev`는 요청 경로를 **퍼센트 인코딩된 채로** 이 목록과 대조한다. 날것의
 *   한글을 돌려주면 대조에 실패해 글마다 500이 난다(실측: `Page "/(dawn)/blog/
 *   [slug]/page" is missing param`).
 * - `output: export`는 이 목록의 문자열을 **파일 이름으로 그대로 쓴다.** 인코딩된
 *   값을 돌려주면 `out/blog/%EC%88%98%EC%84%B1….html`이 만들어지는데(실측),
 *   정적 호스트는 들어온 주소를 먼저 디코딩해서 찾으므로 그 파일에 영영 닿지
 *   못한다.
 *
 * 둘을 동시에 만족시키는 하나의 값이 없어서 환경에 따라 갈랐다. 어느 쪽이든
 * 페이지가 받는 슬러그는 `decodeSlug`를 거치므로 뒤 코드는 신경 쓸 필요가 없다.
 */
export function generateStaticParams(): Params[] {
  const forDevServer = process.env.NODE_ENV === "development";
  return POSTS.map((post) => ({
    slug: forDevServer ? encodeURIComponent(post.slug) : post.slug,
  }));
}

/** params로 들어온 슬러그를 글 목록의 표기와 같은 형태로 되돌린다. */
function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    // 인코딩이 깨진 주소. 그런 글은 없으므로 그대로 흘려보내면 404가 된다.
    return slug;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(decodeSlug(slug));
  if (!post) return {};
  return {
    title: `${post.title} | 별샘 칼럼`,
    description: post.summary,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.summary,
      publishedTime: post.published,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = getPost(decodeSlug(slug));
  if (!post) notFound();

  // 본문은 .mdx 모듈이다. 정적 import라 빌드 시점에 이미 번들에 들어와 있고,
  // 여기서 꺼내는 것은 그 모듈의 기본 내보내기(컴포넌트)다.
  const { default: Body } = await post.load();

  const index = POSTS.findIndex((p) => p.slug === post.slug);
  const previous = POSTS[index + 1];
  const next = POSTS[index - 1];

  return (
    <DawnDocument
      chapter={post.category}
      title={post.title}
      updated={
        <>
          <time dateTime={post.published}>{formatPublished(post.published)}</time> · 읽는 데{" "}
          {post.readingMinutes}분
        </>
      }
    >
      <Body />

      {/* 글 끝의 CTA. 읽은 이야기를 자기 하늘에서 확인하게 하는 것이 이 글들의
          목적이다(스펙 §6.8). */}
      <div className="mt-16 border-t border-gold-dark/20 pt-10 text-center">
        <p className="break-keep leading-relaxed text-ink-dim">
          이 이야기가 당신의 하늘에서는 어떻게 놓여 있는지, 태어난 순간의 배치로
          확인할 수 있습니다.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block border-b border-gold-dark/50 pb-1 font-display text-lg text-gold-dark no-underline transition-colors hover:text-ink-text"
        >
          내 하늘에서 보기 →
        </Link>
      </div>

      <nav className="mt-16 flex flex-wrap justify-between gap-6 border-t border-gold-dark/15 pt-8 text-sm">
        {previous ? (
          <Link href={`/blog/${previous.slug}`} className="max-w-[45%] no-underline">
            <span className="block text-[11px] tracking-[0.2em] text-ink-dim">이전 글</span>
            <span className="mt-1 block break-keep text-ink-text">{previous.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/blog/${next.slug}`} className="max-w-[45%] text-right no-underline">
            <span className="block text-[11px] tracking-[0.2em] text-ink-dim">다음 글</span>
            <span className="mt-1 block break-keep text-ink-text">{next.title}</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <p className="mt-12 text-center text-sm">
        <Link href="/blog" className="text-ink-dim no-underline hover:text-ink-text">
          칼럼 목록으로
        </Link>
      </p>
    </DawnDocument>
  );
}
