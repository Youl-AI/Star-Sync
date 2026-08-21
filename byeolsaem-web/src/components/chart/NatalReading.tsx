"use client";
import { useState } from "react";
import { useBirthProfile } from "@/hooks/useBirthProfile";
import { formatBirthDate } from "@/lib/birth-profile";
import { formatPlacement } from "@/lib/chart";
import type { PlanetKey } from "@/lib/planets";
import { describeElements, type ReadingPlacement } from "@/lib/reading";
import { requestRitual } from "@/lib/ritual";
import { GoldButton } from "@/components/ui/GoldButton";
import { ToneBadge } from "@/components/ui/ToneBadge";
import { ExampleSky } from "./ExampleSky";
import { ChartLoading, UnknownPlace } from "./NoProfile";
import { Term } from "./Term";
import { useChart } from "./useChart";
import { WheelFigure } from "./WheelFigure";

/**
 * 천궁도 전체 — 태어난 순간의 하늘을 계산하고 아톰으로 조립해 읽어 준다.
 *
 * 계산도 조립도 이 브라우저 안에서 끝난다. 어디에도 출생 정보를 보내지 않고,
 * 같은 정보를 넣으면 언제 다시 열어도 같은 글이 나온다.
 *
 * 배치는 §11.4에서 정한 시안 B다. 히어로만 가운데에 두고 읽는 구간은 좌측으로
 * 내렸다. 수상작을 열어 세어 보니 긴 글은 예외 없이 좌측이었고, 가운데 정렬은
 * 줄마다 시작점이 달라져 눈이 다음 줄 머리를 찾는 데 시간을 쓴다 — 줄바꿈이 잦은
 * 한국어에서 더 크게 나타난다.
 *
 * 왼쪽 기둥은 스크롤을 따라오며 누구의 하늘을 보고 있는지 계속 말한다. 예전에는
 * 그 정보가 맨 위에 한 줄 있다가 사라졌다.
 */
export function NatalReading() {
  const { profile, ready } = useBirthProfile();
  const state = useChart(profile);
  /** 사전 섹션에서 지금 펼쳐져 있는 별. 원반에서 골라도 열린다.
      이른 return들보다 앞에 서야 한다 — 훅 순서 규칙. */
  const [openPlanet, setOpenPlanet] = useState<PlanetKey | null>(null);

  if (!ready) return <ChartLoading />;
  // 정보가 없으면 요구부터 하지 않는다 — 예시 하늘을 먼저 보여준다(ExampleSky 주석 참고).
  if (!profile) return <ExampleSky />;
  if (state?.status === "unknown-place") return <UnknownPlace city={profile.city} />;
  if (state?.status !== "ready") return <ChartLoading />;

  const { chart, reading } = state;
  const { core } = reading;
  // 관심사에 걸린 별은 자기 섹션으로, 나머지는 사전 섹션으로 갈라 세운다.
  const highlighted = reading.lens ? reading.placements.filter((p) => p.highlighted) : [];
  const rest = highlighted.length > 0
    ? reading.placements.filter((p) => !p.highlighted)
    : reading.placements;

  // 원반에서 별을 누르면: 사전 섹션의 접힌 별이면 펼치고, 그 자리로 데려간다.
  const selectPlanet = (planet: PlanetKey) => {
    if (rest.some((item) => item.planet.key === planet)) setOpenPlanet(planet);
    requestAnimationFrame(() => scrollToPlacement(planet));
  };

  return (
    <div className="grid items-start gap-10 md:grid-cols-[150px_minmax(0,1fr)] md:gap-12">
      <BirthRail
        date={formatBirthDate(profile.date)}
        time={profile.time}
        city={profile.city}
        concern={reading.lens?.label}
      />

      <div className="min-w-0">
        {/* 당신을 한 줄로 — 전체를 관통하는 요약이 맨 앞에 선다(B안, 2026-08-14 승인). */}
        <div>
          <p className="font-latin text-eyebrow tracking-[0.28em] text-gold">당신을 한 줄로</p>
          <p className="mt-3 max-w-[44ch] break-keep font-display text-2xl leading-normal text-starlight">
            {reading.oneLiner}
          </p>
        </div>

        {/* 이 화면을 읽는 법. 볼 것이 많은 화면이라, 무엇이 중요하고 어떤 순서로
            읽으면 되는지 먼저 말해 준다 — 태양·달·상승궁을 모르는 채로
            "천칭자리 10도"를 읽으면 그냥 낯선 문자열이다(§11.3). */}
        <section className="mt-12 border-l-2 border-gold/40 pl-5 text-guide text-starlight">
          <p className="font-display text-lg text-starlight">이 화면을 읽는 순서</p>
          <ul className="mt-3 space-y-2">
            <li>
              <b className="font-normal text-gold-soft">① 세 기둥부터.</b> 태양은 무엇을
              향해 가는 사람인지, 달은 혼자 있을 때 어떤 사람인지,{" "}
              <Term name="상승궁" />은 남들이 처음 보는 나입니다. 이 셋이 하늘의
              뼈대이고 나머지는 살입니다.
            </li>
            {reading.lens && (
              <li>
                <b className="font-normal text-gold-soft">
                  ② 당신이 궁금해한 {reading.lens.label}.
                </b>{" "}
                그 영역에 해당하는 별만 골라 아래에 따로 모아 두었습니다.
              </li>
            )}
            <li>
              <b className="font-normal text-gold-soft">
                {reading.lens ? "③" : "②"} 나머지는 사전처럼.
              </b>{" "}
              별 열 개를 한 번에 다 읽을 필요는 없습니다. 원반의 별 기호를 누르면 그
              별의 설명으로 데려갑니다.
            </li>
          </ul>
        </section>

        {/* 세 줄 요약. 이 셋을 모르면 나머지는 배경이다. */}
        <section className="mt-12 space-y-6">
          <CoreLine
            symbol="☉"
            label="태양"
            value={formatPlacement(core.sun.placement)}
            text={core.sun.inSign}
          />
          <CoreLine
            symbol="☽"
            label="달"
            value={formatPlacement(core.moon.placement)}
            text={core.moon.inSign}
          />
          {core.ascendant ? (
            <CoreLine
              symbol="ASC"
              label="상승궁"
              value={core.ascendant.sign.ko}
              text={core.ascendant.text}
            />
          ) : (
            <div className="border-t border-gold/15 pt-5 text-guide text-starlight-dim">
              상승궁은 태어난 시각을 알아야 정해집니다. 시각이 4분 어긋나면 1도가
              움직이므로, 모르는 채로 채워 넣지 않습니다.
            </div>
          )}
        </section>

        {/* 원반과 그 원반을 읽는 법을 나란히 둔다. 예전에는 그림이 가운데 있고
            설명이 아래에 있어서, 설명을 읽는 동안 그림이 눈에서 벗어났다.
            넓은 화면에서는 잠시 붙박여 태양 → 달 → 상승궁을 차례로 밝힌다. */}
        <WheelFigure
          chart={chart}
          ascendantSignKo={core.ascendant?.sign.ko}
          onSelectPlanet={selectPlanet}
        />

        <Section title="하늘 전체의 무게">
          <p className="break-keep leading-relaxed text-starlight">
            {describeElements(reading.elements)}
          </p>
          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-meta text-starlight-dim">
            {reading.elements.map((entry) => (
              <li key={entry.element}>
                {entry.element} {entry.count}
              </li>
            ))}
          </ul>
        </Section>

        {/* 관심사에 걸린 별은 자기 섹션을 갖는다. 목록 정렬만으로는 "이게 내가
            물어본 것에 대한 답"이라는 것이 전해지지 않았다(B안). */}
        {reading.lens && highlighted.length > 0 && (
          <Section title={`당신이 궁금해한 ${reading.lens.label}`}>
            <p className="max-w-[52ch] break-keep leading-relaxed text-starlight-dim">
              {reading.lens.summary}
            </p>
            <ul className="mt-8 space-y-8">
              {highlighted.map((item) => (
                <PlacementRow key={item.planet.key} item={item} />
              ))}
            </ul>
          </Section>
        )}

        {reading.lifework && (
          <Section title="평생의 과제 하나">
            <p className="max-w-[52ch] break-keep leading-relaxed text-starlight">
              {reading.lifework.text}
            </p>
            <p className="mt-2 max-w-[52ch] break-keep text-guide text-starlight-dim">
              {reading.lifework.basis}
            </p>
          </Section>
        )}

        <Section title={highlighted.length > 0 ? "나머지 별들" : "열 개의 별"}>
          {/* 전부 펼쳐 두면 텍스트 벽이 된다(가시성 점검, 2026-08-14). 사전이라
              말한 대로 사전처럼 — 제목만 보이고, 누르거나 원반에서 고른 것만 열린다. */}
          <p className="max-w-[52ch] break-keep text-meta text-starlight-dim">
            눌러서 펼치기 — 별 이름 옆에 그 별이 놓인 삶의 자리를 적어 두었습니다.
          </p>
          <ul className="mt-4">
            {rest.map((item) => (
              <PlacementAccordionRow
                key={item.planet.key}
                item={item}
                open={openPlanet === item.planet.key}
                onToggle={() =>
                  setOpenPlanet(openPlanet === item.planet.key ? null : item.planet.key)
                }
              />
            ))}
          </ul>
        </Section>

        {reading.aspects.length > 0 && (
          <Section title="별과 별 사이">
            <p className="max-w-[52ch] break-keep text-guide text-starlight">
              두 별이 특정한 각도로 만나면 서로의 작용이 섞입니다. 이것을{" "}
              <Term name="어스펙트" />라고 합니다. 당신 고유의 이야기가 진하게 걸린 것부터{" "}
              {reading.aspects.length}개를 골랐습니다.
            </p>
            <ul className="mt-8 space-y-8">
              {reading.aspects.map((item) => (
                <li key={`${item.a.key}-${item.b.key}`} className="border-t border-gold/12 pt-6">
                  <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-display text-lg text-starlight">
                      <span className="astro-symbol">{item.a.symbol}</span> {item.a.ko}
                      <span className="mx-2 astro-symbol text-gold-soft">{item.aspect.type.symbol}</span>
                      <span className="astro-symbol">{item.b.symbol}</span> {item.b.ko}
                    </span>
                    <span className="text-meta text-starlight-dim">
                      {item.aspect.type.ko} · <Term name="오브" /> {item.aspect.orb.toFixed(1)}도 · {item.strengthKo}
                    </span>
                    <ToneBadge harmony={item.aspect.type.harmony} />
                  </p>
                  <p className="mt-3 text-guide text-gold-soft">
                    {item.theme} — {item.headline}
                  </p>
                  <p className="mt-2 break-keep leading-relaxed text-starlight-dim">{item.body}</p>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {reading.timeUnknown && (
          <div className="mt-16 border-t border-gold/15 pt-8">
            <p className="max-w-[52ch] break-keep text-guide text-starlight-dim">
              태어난 시각을 남기지 않으셔서 상승궁과 하우스는 비워 두었습니다. 달의
              위치도 하루 사이에 13도까지 움직이므로 위 값은 정오를 기준으로 한
              것입니다. 시각을 찾으시면{" "}
              <button
                type="button"
                onClick={() => requestRitual()}
                className="border-b border-gold/40 pb-0.5 text-gold-soft transition-colors hover:text-starlight"
              >
                다시 남겨
              </button>{" "}
              주세요.
            </p>
          </div>
        )}

        <div className="mt-20 border-t border-gold/15 pt-12">
          <p className="max-w-[52ch] break-keep leading-relaxed text-starlight-dim">
            이 배치가 지금 하늘과 어떻게 만나는지는 날마다 달라집니다.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <GoldButton variant="solid" href="/today">
              오늘의 하늘 보기
            </GoldButton>
            <GoldButton variant="outline" href="/yearly">
              올해의 흐름 보기
            </GoldButton>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 왼쪽 붙박이 기둥. 누구의 하늘을 보고 있는지 스크롤 내내 말해 준다.
 *
 * 데스크톱에서는 오른쪽에 금선을 세우고 오른쪽 정렬로 붙여 본문 쪽 가장자리를
 * 만든다. 모바일에서는 세로로 세울 자리가 없으므로 위쪽 가로줄로 눕힌다.
 */
function BirthRail({
  date,
  time,
  city,
  concern,
}: {
  date: string;
  time: string | null;
  city: string;
  concern?: string;
}) {
  return (
    <aside
      className="border-b border-gold/18 pb-5 md:sticky md:top-24 md:border-b-0 md:border-r md:pb-0 md:pr-5 md:text-right"
      aria-label="이 하늘의 출생 정보"
    >
      <p className="font-latin text-eyebrow tracking-[0.2em] text-gold">BORN</p>
      <p className="mt-2 text-meta text-starlight-dim">{date}</p>
      <p className="text-meta text-starlight-dim">{time ?? "시각 모름"}</p>
      <p className="text-meta text-starlight-dim">{city}</p>
      {concern && <p className="mt-3 text-meta text-gold-soft">{concern}</p>}
      <button
        type="button"
        onClick={() => requestRitual()}
        className="mt-4 border-b border-gold/40 pb-0.5 text-meta text-gold-soft transition-colors hover:text-starlight"
      >
        고치기
      </button>
    </aside>
  );
}

/** 좌측 정렬 섹션. 제목 오른쪽으로 금선이 뻗어 읽는 폭의 끝을 표시한다. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-16">
      <h2 className="mb-6 flex items-center gap-4 break-keep font-display text-xl text-starlight">
        {title}
        <span aria-hidden className="h-px flex-1 bg-gold/25" />
      </h2>
      {children}
    </section>
  );
}

function CoreLine({
  symbol,
  label,
  value,
  text,
}: {
  symbol: string;
  label: string;
  value: string;
  text: string;
}) {
  return (
    <div className="grid grid-cols-[30px_minmax(0,1fr)] gap-x-3 border-t border-gold/15 pt-5">
      <span className="astro-symbol text-lg leading-snug text-gold-soft" aria-hidden>
        {symbol}
        {"︎"}
      </span>
      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-3">
          <span className="text-meta tracking-[0.2em] text-starlight-dim">{label}</span>
          <span className="font-display text-lg text-starlight">{value}</span>
        </p>
        <p className="mt-2 max-w-[52ch] break-keep leading-relaxed text-starlight-dim">{text}</p>
      </div>
    </div>
  );
}

/** 원반의 기호를 누르면 그 별의 설명이 있는 자리로 데려간다. */
function placementDomId(planet: PlanetKey): string {
  return `placement-${planet}`;
}

/**
 * 원반에서 별을 누르면 아래 본문의 그 자리로 간다.
 *
 * §11.4에서는 여기에 패널을 열기로 했지만, 아래 본문이 이미 열 개의 별을 전부
 * 설명하고 있다. 패널을 띄우면 같은 글을 두 곳에 두게 되고 둘이 갈릴 여지가
 * 생긴다 — 데려가는 편이 짧고, 그 김에 앞뒤 별까지 눈에 들어온다.
 */
function scrollToPlacement(planet: PlanetKey): void {
  const target = document.getElementById(placementDomId(planet));
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  // 스크롤만 하면 열 개가 비슷하게 생겨 어느 것을 보러 왔는지 놓친다.
  target.animate(
    [{ backgroundColor: "color-mix(in srgb, var(--color-gold) 14%, transparent)" }, { backgroundColor: "transparent" }],
    { duration: 1600, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
  );
}

function PlacementRow({ item }: { item: ReadingPlacement }) {
  return (
    <li
      id={placementDomId(item.planet.key)}
      className={`scroll-mt-28 border-t pt-6 ${
        item.highlighted ? "border-gold/40" : "border-gold/12"
      }`}
    >
      <PlacementHead item={item} />
      <PlacementBody item={item} />
    </li>
  );
}

/**
 * 사전 섹션의 접힌 별 한 줄. 제목 줄에 별 이름과 삶의 자리(하우스)를 함께 적어,
 * 훑기만 해도 목차가 되게 한다. 여닫기는 YearEventRows와 같은 grid-rows 전환.
 */
function PlacementAccordionRow({
  item,
  open,
  onToggle,
}: {
  item: ReadingPlacement;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <li
      id={placementDomId(item.planet.key)}
      className="scroll-mt-28 border-t border-gold/12"
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-baseline gap-x-3 py-4 text-left"
      >
        <span
          aria-hidden
          className={`flex-none text-meta text-gold transition-transform duration-300 ${
            open ? "rotate-90" : ""
          }`}
        >
          ›
        </span>
        <span className="min-w-0 flex-1">
          <PlacementHead item={item} plain />
        </span>
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pb-6 pl-6">
            <PlacementBody item={item} />
          </div>
        </div>
      </div>
    </li>
  );
}

/**
 * plain: 아코디언 헤더는 그 자체가 button이라, 안에 또 button을 만드는
 * Term 툴팁을 쓸 수 없다(HTML 중첩 금지 + 하이드레이션 오류). 헤더에서는
 * 맨글자로 적고, 용어 설명은 펼친 본문 쪽 Term들이 맡는다.
 */
function PlacementHead({ item, plain = false }: { item: ReadingPlacement; plain?: boolean }) {
  // span인 이유: 아코디언에서는 button 안에 서는데, p는 button의 콘텐츠 모델
  // (phrasing)에 어긋나 하이드레이션 경고가 난다.
  return (
    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="font-display text-lg text-starlight">
        <span className="astro-symbol">{item.planet.symbol}{"︎"}</span> {item.planet.ko} ·{" "}
        {formatPlacement(item.placement)}
      </span>
      {item.house && (
        <span className="text-meta text-starlight-dim">
          {item.house.number}하우스 · {item.house.domain}
        </span>
      )}
      {item.placement.retrograde && (
        <span className="text-meta text-gold-soft">
          {plain ? "역행" : <Term name="역행" />}
        </span>
      )}
    </span>
  );
}

function PlacementBody({ item }: { item: ReadingPlacement }) {
  return (
    <>
      <p className="mt-3 max-w-[52ch] break-keep leading-relaxed text-starlight">{item.inSign}</p>
      {item.inHouse && (
        <p className="mt-2 max-w-[52ch] break-keep leading-relaxed text-starlight-dim">
          {item.inHouse}
        </p>
      )}
      {item.planet.tier === "generational" && (
        <p className="mt-2 max-w-[52ch] break-keep text-meta text-starlight-dim">
          {item.planet.ko}은 한 별자리에 {item.planet.dwell} 머뭅니다. 같은 무렵에
          태어난 사람이 모두 같은 자리를 가지므로, 이 별은 개인보다 세대를 말합니다.
        </p>
      )}
    </>
  );
}
