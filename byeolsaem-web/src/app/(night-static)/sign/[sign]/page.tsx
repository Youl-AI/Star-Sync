import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArchCard } from "@/components/ui/ArchCard";
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
    <main className="mx-auto max-w-3xl px-6 pb-32 pt-28">
      <header className="text-center">
        <p className="text-[11px] tracking-[0.28em] text-gold">{sign.range}</p>
        <h1 className="mt-4 break-keep font-display text-3xl text-starlight md:text-4xl">
          {sign.ko}
        </h1>
        <p className="mt-4 text-xs tracking-wide text-starlight-dim">
          {sign.element} · {sign.quality} · {sign.ruler}
        </p>

        <div className="mt-12 flex justify-center">
          <ArchCard name={sign.card} latin={sign.latin} tagline={sign.tagline}>
            {/* 부적 안에 그 별자리의 실제 성좌를 그린다. */}
            <svg viewBox="0 0 260 200" className="mx-auto mt-3 w-40" aria-hidden>
              <path d={sign.path} fill="none" stroke="var(--color-gold)" strokeWidth="1" opacity=".75" />
              {sign.stars.map(([x, y]) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="var(--color-starlight)" />
              ))}
            </svg>
          </ArchCard>
        </div>

        <LineDiamond className="my-14" />
      </header>

      {content ? (
        <article className="mx-auto max-w-[65ch] leading-[1.9] text-starlight">
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
        <div className="mx-auto max-w-md text-center">
          <p className="leading-relaxed text-starlight-dim">
            {sign.ko}의 풀이는 아직 쓰는 중입니다. 기간과 성질은 위에 있습니다.
          </p>
        </div>
      )}

      {/* 이번 달 트랜짓과 연간 요약은 실제 행성 위치 계산이 필요해 백엔드가
          연결된 뒤에 들어온다(RENEWAL_PLAN §6.1). 자리를 미리 잡아 두지 않고
          비워 둔다 — 빈 상자는 준비된 것처럼 보이기만 하고 아무것도 주지 않는다. */}

      <div className="mt-20 border-t border-gold/15 pt-12 text-center">
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
