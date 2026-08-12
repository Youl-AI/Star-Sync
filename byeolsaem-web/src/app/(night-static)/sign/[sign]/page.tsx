import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SignArrival } from "@/components/sign/SignArrival";
import { CARD_WIDTH } from "@/components/sign/signMorph";
import { SignArchCard } from "@/components/ui/ArchCard";
import { GoldButton } from "@/components/ui/GoldButton";
import { LineDiamond } from "@/components/ui/LineDiamond";
import { ZODIAC_SIGNS } from "@/lib/zodiac";
import { getSignBySlug, getSignContent } from "@/lib/sign-content";

type Params = { sign: string };

// 정적 export라 열두 경로를 빌드 시점에 모두 만들어 둔다. 본문이 아직 없는
// 별자리도 경로는 존재해야 한다 — 진(陣)에서 링크가 걸려 있고, 없는 주소로
// 보내면 404가 뜬다.
export function generateStaticParams(): Params[] {
  return ZODIAC_SIGNS.map((s) => ({ sign: s.key }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { sign: slug } = await params;
  const sign = getSignBySlug(slug);
  if (!sign) return {};

  const content = getSignContent(slug);
  return {
    title: `${sign.ko} (${sign.range}) | 별샘`,
    description: content
      ? content.opening.slice(0, 150)
      : `${sign.ko}의 기간, 원소, 지배 행성. ${sign.range}.`,
    // 본문이 없는 페이지는 색인시키지 않는다. 얇은 페이지가 색인되면 사이트
    // 전체의 평가가 내려간다(RENEWAL_PLAN §2.4).
    robots: content ? undefined : { index: false, follow: true },
  };
}

export default async function SignPage({ params }: { params: Promise<Params> }) {
  const { sign: slug } = await params;
  const sign = getSignBySlug(slug);
  if (!sign) notFound();

  const content = getSignContent(slug);

  return (
    <SignArrival sign={sign.key}>
    <main className="mx-auto max-w-3xl px-6 pb-32 pt-28">
      <header className="text-center">
        <div data-morph-veil>
          <p className="font-latin text-eyebrow tracking-[0.28em] text-gold">{sign.range}</p>
          <h1 className="mt-4 break-keep font-display text-3xl text-starlight md:text-4xl">
            {sign.ko}
          </h1>
          <p className="mt-4 text-meta tracking-wide text-starlight-dim">
            {sign.element} · {sign.quality} · {sign.ruler}
          </p>
        </div>

        <div className="mt-12 flex justify-center">
          {/* 진에서 날아온 카드가 앉는 자리. 폭과 그림 크기는 진 쪽 오버레이와
              같은 상수를 읽는다 — 어긋나면 착지 순간 카드가 튄다. */}
          <div data-morph-card>
            {/* 성좌는 SignArchCard가 넣는다. 진에서 날아오는 그림과 선 굵기·별
                크기가 같아야 하므로 lit 기본값을 그대로 쓴다. */}
            <SignArchCard sign={sign} width={CARD_WIDTH} />
          </div>
        </div>

        <LineDiamond className="my-14" />
      </header>

      {content ? (
        <article data-morph-veil className="mx-auto max-w-[65ch] leading-[1.9] text-starlight">
          <p className="text-[17px]">{content.opening}</p>

          <Section title="이 자리의 성질">
            {content.nature.map((p, i) => (
              <p key={i} className="mt-4 first:mt-0">
                {p}
              </p>
            ))}
          </Section>

          <Section title="강점">
            <dl className="mt-1 space-y-6">
              {content.strengths.map((s) => (
                <div key={s.title}>
                  <dt className="font-display text-lg text-gold-soft">{s.title}</dt>
                  <dd className="mt-2">{s.body}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section title="그늘">
            <p className="mt-1 text-sm text-starlight-dim">
              약점이 아니라, 강점이 과할 때 생기는 그림자입니다.
            </p>
            <dl className="mt-5 space-y-6">
              {content.shadows.map((s) => (
                <div key={s.title}>
                  <dt className="font-display text-lg text-gold-soft">{s.title}</dt>
                  <dd className="mt-2">{s.body}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section title="관계에서">
            {content.inRelationships.map((p, i) => (
              <p key={i} className="mt-4 first:mt-0">
                {p}
              </p>
            ))}
          </Section>

          <Section title="일과 돈에서">
            {content.inWork.map((p, i) => (
              <p key={i} className="mt-4 first:mt-0">
                {p}
              </p>
            ))}
          </Section>

          <Section title="자주 오해받는 것">
            <dl className="mt-1 space-y-6">
              {content.misread.map((m) => (
                <div key={m.question}>
                  <dt className="font-display text-lg text-starlight">{m.question}</dt>
                  <dd className="mt-2 text-starlight-dim">{m.answer}</dd>
                </div>
              ))}
            </dl>
          </Section>
        </article>
      ) : (
        // 본문을 아직 쓰지 않은 별자리. 빈 껍데기를 내보내는 대신 상태를 밝힌다.
        <div data-morph-veil className="mx-auto max-w-md text-center">
          <p className="leading-relaxed text-starlight-dim">
            {sign.ko}의 풀이는 아직 쓰는 중입니다. 기간과 성질은 위에 있습니다.
          </p>
        </div>
      )}

      {/* 이번 달 트랜짓과 연간 요약은 실제 행성 위치 계산이 필요해 백엔드가
          연결된 뒤에 들어온다(RENEWAL_PLAN §6.1). 자리를 미리 잡아 두지 않고
          비워 둔다 — 빈 상자는 준비된 것처럼 보이기만 하고 아무것도 주지 않는다. */}

      {/* 이웃한 자리로 건너가는 길. 황도 순서를 따르고 물고기 다음은 다시 양이다.
          열두 페이지가 서로 이어져 있지 않으면 하나를 다 읽은 사람이 갈 곳이
          목록뿐이고, 검색엔진도 열두 페이지를 각각 떨어진 섬으로 본다. */}
      <SignNeighbors current={sign.key} />

      <div data-morph-veil className="mt-20 border-t border-gold/15 pt-12 text-center">
        <p className="break-keep leading-relaxed text-starlight-dim">
          태양이 {sign.ko}에 있다는 것은 당신 하늘의 한 조각입니다. 달과 상승궁까지
          넣으면 같은 {sign.ko}도 전혀 다르게 읽힙니다.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
          <GoldButton variant="solid" href="/">
            내 하늘 전체 보기
          </GoldButton>
          <GoldButton variant="outline" href="/sign">
            열두 개의 방으로
          </GoldButton>
        </div>
      </div>
    </main>
    </SignArrival>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="break-keep font-display text-xl text-starlight">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** 황도에서 앞뒤로 이웃한 두 자리. 정적 링크라 빌드된 HTML에 그대로 들어간다. */
function SignNeighbors({ current }: { current: string }) {
  const index = ZODIAC_SIGNS.findIndex((s) => s.key === current);
  const previous = ZODIAC_SIGNS[(index + 11) % 12];
  const next = ZODIAC_SIGNS[(index + 1) % 12];

  const side =
    "group flex min-w-0 flex-col gap-1 border-b border-transparent pb-1 transition-colors";
  const name = "truncate font-display text-lg text-starlight transition-colors group-hover:text-gold-soft";
  const label = "font-latin text-eyebrow tracking-[0.2em] text-starlight-dim";

  return (
    <nav
      data-morph-veil
      aria-label="이웃한 별자리"
      className="mt-20 flex items-baseline justify-between gap-8 border-t border-gold/15 pt-10"
    >
      <Link href={`/sign/${previous.key}`} className={`${side} text-left`}>
        <span className={label}>
          <span aria-hidden>← </span>앞의 자리
        </span>
        <span className={name}>{previous.ko}</span>
      </Link>
      <Link href={`/sign/${next.key}`} className={`${side} items-end text-right`}>
        <span className={label}>
          다음 자리<span aria-hidden> →</span>
        </span>
        <span className={name}>{next.ko}</span>
      </Link>
    </nav>
  );
}
