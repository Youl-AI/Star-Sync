"use client";
import { useEffect, useMemo, useState } from "react";
import { m } from "motion/react";
import { CONCERN_LENSES } from "@/content/atoms/concerns";
import { LENS_INTRO, RESONANCE_NOTE } from "@/content/atoms/synastry";
import { useBirthProfile } from "@/hooks/useBirthProfile";
import { useInView } from "@/hooks/useInView";
import type { RitualData } from "@/components/hero/RitualForm";
import { formatBirthDate } from "@/lib/birth-profile";
import { computeChart, type Chart } from "@/lib/chart";
import { coordinatesFor, KOREA_UTC_OFFSET_HOURS } from "@/lib/coordinates";
import { Link } from "@/components/ui/Link";
import { SIGN_SYMBOL, getSunSign } from "@/lib/zodiac";
import { signArt } from "@/lib/share-card";
import { firstSentence } from "@/lib/text";
import { openBirthPanel, requestRitual } from "@/lib/ritual";
import { consumeInviteHash, type InvitePayload } from "@/lib/invite";
import {
  synastryReading,
  type LensView,
  type SynastryLine,
  type SynastryReading as SynastryReadingData,
} from "@/lib/synastry-reading";
import { ChartLoading, UnknownPlace } from "@/components/chart/NoProfile";
import { CompositeSection } from "./CompositeSection";
import { ExampleMeeting } from "./ExampleMeeting";
import { GoldButton } from "@/components/ui/GoldButton";
import { InviteButton } from "./InviteButton";
import { KakaoShareButton } from "@/components/ui/KakaoShareButton";
import { SaveCardButton } from "@/components/ui/SaveCardButton";
import { MotionScope } from "@/components/ui/MotionScope";
import { TalismanChip } from "@/components/ui/TalismanChip";
import { ToneBadge } from "@/components/ui/ToneBadge";
import { GoldThreads } from "./GoldThreads";

/**
 * 두 하늘의 만남.
 *
 * 상대의 정보는 저장하지 않는다. 내 출생 정보는 이 사이트를 쓰는 내내 같지만
 * 상대는 그렇지 않고, 무엇보다 **내 브라우저에 남의 생년월일을 남길 이유가
 * 없다.** 새로고침하면 사라지며, 화면에도 그렇게 적어 둔다.
 *
 * 입력은 같은 패널을 두 번째로 쓴다(RENEWAL_PLAN §11.4). 폼을 하나 더 만들면
 * 검증이 갈리는 순간부터 어느 쪽이 맞는지 알 수 없게 된다. onComplete만 바꿔
 * 끼우면 결과가 저장소 대신 이 화면의 상태로 간다.
 */
export function SynastryReading() {
  const { profile, ready } = useBirthProfile();
  const [partner, setPartner] = useState<RitualData | null>(null);
  /** 아래 목록에서 짚고 있는 만남. 그림의 실 한 가닥이 이것을 따라 밝아진다. */
  const [activeId, setActiveId] = useState<string | null>(null);
  /** 이름 없는 만남 중 지금 펼쳐져 있는 것. 이름 붙은 조합(✦)은 늘 펼쳐져 있다. */
  const [openLineId, setOpenLineId] = useState<string | null>(null);
  /**
   * 이 관계의 무엇을 볼 것인가.
   *
   * 저장된 관심사를 첫 값으로 쓰되 **저장하지는 않는다.** 저장된 값은 "나에 대해
   * 무엇이 궁금한가"이고 여기서 고르는 것은 "이 사람과의 무엇이 궁금한가"다.
   * 다른 질문이라, 궁합을 보려고 잠깐 재물운으로 바꾼 것이 `/natal`의 천궁도까지
   * 바꿔 놓으면 안 된다. 게다가 상대 정보조차 저장하지 않으면서 그 사람과의
   * 렌즈만 저장하는 것은 앞뒤가 맞지 않는다.
   */
  const [concern, setConcern] = useState<string | null>(null);
  const chosen = concern ?? profile?.concern ?? null;
  /** 초대 링크로 왔는가. 화면 상태까지만 간다 — localStorage에는 남기지 않는다. */
  const [invited, setInvited] = useState<InvitePayload | null>(null);

  const myChart = useChartOf(profile);
  const theirChart = useChartOf(partner);

  const reading = useMemo(
    () => (myChart && theirChart ? synastryReading(myChart, theirChart, chosen) : null),
    [myChart, theirChart, chosen],
  );

  // 초대 링크로 왔는가 — fragment는 마운트 후에만 읽을 수 있다(SSR엔 없다).
  // 레이아웃의 스크럽 스크립트가 GA보다 먼저 주소에서 걷어 두므로(invite.ts
  // M-1 주석 참고) 여기서는 그 결과를 consumeInviteHash로 읽기만 한다.
  // 그 대가로 새로고침하면 초대가 사라진다 — 받은 링크를 다시 열면 된다.
  useEffect(() => {
    const payload = consumeInviteHash();
    if (payload) {
      setInvited(payload);
      setPartner({ ...payload, concern: null });
    }
  }, []);

  const askPartner = () => {
    openBirthPanel({
      kicker: "THEIR SKY",
      title: "상대의 밤하늘",
      description:
        "상대의 정보는 저장하지 않습니다. 이 화면을 떠나거나 새로고침하면 사라집니다.",
      // 배너가 초대가 아닌 상대 위에 남으면 거짓말이 된다 — 단, 취소하면(패널을
      // 닫기만 하면) 초대 상태는 그대로 둔다. 실제로 입력을 마쳤을 때만 지운다.
      onComplete: (d) => {
        setInvited(null);
        setPartner(d);
      },
      // 관심사는 묻지 않는다. 그 사람의 운세를 보는 것이 아니라 두 하늘이 만나는
      // 자리를 보는 것이라 상대의 관심사로는 할 일이 없다. 이 관계의 무엇을 볼지는
      // 결과 화면에서 내가 고른다.
      askConcern: false,
    });
  };

  if (!ready) return <ChartLoading />;
  // 정보가 없으면 요구부터 하지 않는다 — 예시 궁합을 먼저 보여준다(ExampleMeeting 주석 참고).
  // 단, 초대를 받아 온 것이라면 예시로 빠지지 않는다 — 상대의 하늘이 이미 와 있다.
  if (!profile) return invited ? <InvitedIntro invited={invited} /> : <ExampleMeeting />;
  if (!myChart)
    return (
      <>
        {invited && <InviteBanner invited={invited} />}
        <UnknownPlace city={profile.city} />
      </>
    );

  return (
    <div className="grid items-start gap-10 md:grid-cols-[150px_minmax(0,1fr)] md:gap-12">
      <aside
        className="border-b border-gold/18 pb-5 md:sticky md:top-24 md:border-b-0 md:border-r md:pb-0 md:pr-5 md:text-right"
        aria-label="이 궁합의 두 사람"
      >
        <p className="font-latin text-eyebrow tracking-[0.2em] text-gold">TWO SKIES</p>
        <p className="mt-2 text-meta text-starlight-dim">나</p>
        <p className="text-meta text-gold-soft">{formatBirthDate(profile.date)}</p>
        <button
          type="button"
          onClick={() => requestRitual()}
          className="mt-1 border-b border-gold/40 pb-0.5 text-meta text-gold-soft transition-colors hover:text-starlight"
        >
          고치기
        </button>

        <p className="mt-5 text-meta text-starlight-dim">그쪽</p>
        {partner ? (
          <>
            <p className="text-meta text-gold-soft">{formatBirthDate(partner.date)}</p>
            <button
              type="button"
              onClick={askPartner}
              className="mt-1 border-b border-gold/40 pb-0.5 text-meta text-gold-soft transition-colors hover:text-starlight"
            >
              다른 사람으로
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={askPartner}
            className="border-b border-gold/40 pb-0.5 text-meta text-gold-soft transition-colors hover:text-starlight"
          >
            정보 넣기
          </button>
        )}
      </aside>

      <div className="min-w-0">
        {invited && <InviteBanner invited={invited} />}
        {!partner && <AskPartner onAsk={askPartner} />}
        {!partner && (
          <div className="mt-10">
            <InviteButton profile={profile} />
          </div>
        )}
        {partner && !theirChart && (
          <div className="py-8">
            <UnknownPlace city={partner.city} />
          </div>
        )}
        {partner && theirChart && reading && (
          <>
            {/* 두 사람의 한 줄 — 숫자보다 먼저, 이 관계가 어떤 짝인지부터(B안). */}
            {reading.oneLiner && (
              <div className="mb-12">
                <p className="font-latin text-eyebrow tracking-[0.28em] text-gold">
                  두 사람의 한 줄
                </p>
                <p className="mt-3 max-w-[44ch] break-keep font-display text-2xl leading-normal text-starlight">
                  {reading.oneLiner}
                </p>
                {reading.advice && (
                  <div className="mt-6 max-w-[52ch] border-l-2 border-gold/45 bg-gold/[0.06] py-4 pl-5 pr-4">
                    <p className="break-keep text-guide">
                      <b className="font-normal text-gold-soft">해 볼 것</b>{" "}
                      <span className="text-starlight-dim">{reading.advice.try}</span>
                    </p>
                    <p className="mt-2 break-keep text-guide">
                      <b className="font-normal text-gold-soft">버릴 것</b>{" "}
                      <span className="text-starlight-dim">{reading.advice.hold}</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            <Resonance reading={reading} />

            <div className="mt-12">
              <GoldThreads
                mine={myChart}
                theirs={theirChart}
                lines={reading.lines}
                activeId={activeId}
              />
            </div>

            {reading.empty ? (
              <p className="mt-10 max-w-[52ch] break-keep leading-relaxed text-starlight">
                {reading.empty}
              </p>
            ) : (
              <>
                <div className="mt-10 flex flex-wrap gap-2.5">
                  {reading.chips.map((chip) => (
                    <TalismanChip key={chip.label} symbol={chip.symbol} label={chip.label} />
                  ))}
                </div>

                <LensSection lens={reading.lens} chosen={chosen} onPick={setConcern} />

                <section className="mt-16">
                  <h2 className="mb-6 flex items-center gap-4 break-keep font-display text-xl text-starlight">
                    두 하늘이 닿는 자리
                    <span aria-hidden className="h-px flex-1 bg-gold/25" />
                  </h2>
                  <p className="max-w-[52ch] break-keep text-guide text-starlight-dim">
                    {chosen ? `${chosen}에 걸리는 것을 앞에 두고, ` : ""}이름이 붙어 있는
                    조합과 무게가 실린 것부터 {reading.lines.length}개입니다. 이름 붙은
                    조합(✦)은 펼쳐 두었고 나머지는 눌러서 엽니다. 한 줄에 커서를 올리면
                    위 그림에서 그 실이 밝아집니다.
                  </p>
                  <ul className="mt-8">
                    {reading.lines.map((line) =>
                      line.highlight ? (
                        <LineRow
                          key={line.id}
                          line={line}
                          onEnter={() => setActiveId(line.id)}
                          onLeave={() => setActiveId(null)}
                        />
                      ) : (
                        <CollapsedLineRow
                          key={line.id}
                          line={line}
                          open={openLineId === line.id}
                          onToggle={() =>
                            setOpenLineId(openLineId === line.id ? null : line.id)
                          }
                          onEnter={() => setActiveId(line.id)}
                          onLeave={() => setActiveId(null)}
                        />
                      ),
                    )}
                  </ul>
                </section>
              </>
            )}

            <CompositeSection mine={myChart} theirs={theirChart} />

            {/* 궁합 결과도 밖으로 나갈 통로가 있어야 한다(정찰 ⑧). 그림은 내
                태양 별자리 성좌 — 상대의 정보는 카드에도 남기지 않는다. */}
            {reading.oneLiner && (
              <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-gold/15 pt-8">
                <SaveCardButton
                  filename={`byeolsaem-synastry-${profile.date.replaceAll("-", "")}.png`}
                  spec={() => ({
                    name: "두 사람의 하늘",
                    latin: "TWO SKIES",
                    range: formatBirthDate(profile.date),
                    symbol: SIGN_SYMBOL[getSunSign(profile.date).key],
                    tagline: firstSentence(reading.oneLiner!),
                    art: signArt(getSunSign(profile.date)),
                  })}
                />
                <KakaoShareButton
                  text={`두 사람의 하늘 — ${firstSentence(reading.oneLiner)}`}
                  path="/synastry"
                  imagePath="/og/synastry.png"
                />
              </div>
            )}

            <div className="mt-8">
              <InviteButton profile={profile} />
            </div>

            {/* 상대의 생년월일을 방금 받았으니 그 사람의 태양궁을 이미 안다.
                일반 메뉴 대신 그 자리로 보낸다 — 열두 장을 이미 써 두었고,
                "그 사람은 어떤 사람인가"가 궁합 다음에 오는 물음이다. */}
            <PartnerRoom date={partner.date} />

            <p className="mt-14 max-w-[52ch] break-keep text-meta text-starlight-dim">
              상대의 정보는 어디에도 저장되지 않았습니다. 계산은 이 브라우저 안에서
              끝났고, 새로고침하면 사라집니다.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/** 궁합을 다 읽은 사람이 다음에 궁금해하는 것 — 상대의 자리. */
function PartnerRoom({ date }: { date: string }) {
  const sign = getSunSign(date);
  return (
    <div className="mt-16 border-t border-gold/15 pt-10">
      <p className="max-w-[52ch] break-keep leading-relaxed text-starlight-dim">
        상대의 태양은 <span className="text-starlight">{sign.ko}</span>에 있습니다.
        각도가 둘 사이의 일이라면, 그 자리는 그 사람 혼자서도 그런 사람인 부분입니다.
      </p>
      <Link
        href={`/sign/${sign.key}`}
        className="mt-4 inline-block border-b border-gold/40 pb-0.5 text-gold-soft transition-colors hover:border-gold-soft hover:text-starlight"
      >
        {sign.ko} 읽어 보기
        <span aria-hidden> →</span>
      </Link>
    </div>
  );
}

/** 출생 정보 한 벌에서 차트를. 좌표를 찾지 못하면 null이다. */
function useChartOf(data: RitualData | null): Chart | null {
  return useMemo(() => {
    if (!data) return null;
    const coordinates = coordinatesFor(data.city);
    if (!coordinates) return null;
    return computeChart({
      date: data.date,
      time: data.time,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      timezoneOffsetHours: KOREA_UTC_OFFSET_HOURS,
    });
  }, [data]);
}

/** 초대 링크로 왔다는 것을 알리는 띠 — 상대가 이미 보내 둔 하늘. */
function InviteBanner({ invited }: { invited: InvitePayload }) {
  return (
    <p className="mb-8 border border-gold/25 bg-ink-raised/60 px-4 py-3 break-keep text-guide text-starlight-dim">
      누군가 궁합을 청했습니다 · {formatBirthDate(invited.date)}의 하늘이 도착해 있어요.
    </p>
  );
}

/**
 * 초대 링크로 왔지만 아직 내 하늘을 열지 않은 상태 — ExampleMeeting 대신 이
 * 화면을 보여준다. 예시로 흘려보내면 이미 도착해 있는 상대의 하늘이 묻힌다.
 * 내 정보를 넣으면(useBirthProfile 갱신) 다음 렌더에서 곧장 결과로 넘어간다.
 */
function InvitedIntro({ invited }: { invited: InvitePayload }) {
  return (
    <div className="mx-auto max-w-[52ch] py-16">
      <InviteBanner invited={invited} />
      <p className="break-keep leading-relaxed text-starlight">
        받은 것은 상대의 하늘입니다. 당신의 순간을 넣으면 두 하늘이 만나는 자리가 곧장
        열립니다.
      </p>
      <div className="mt-8">
        <GoldButton variant="solid" onClick={() => requestRitual()}>
          내 밤하늘 열기
        </GoldButton>
      </div>
    </div>
  );
}

function AskPartner({ onAsk }: { onAsk: () => void }) {
  return (
    <div className="max-w-[52ch]">
      <p className="break-keep leading-relaxed text-starlight">
        당신의 하늘은 준비됐습니다. 상대가 태어난 순간을 넣으면 두 하늘이 서로의 어디를
        건드리는지 계산합니다.
      </p>
      <p className="mt-3 break-keep text-guide text-starlight-dim">
        상대의 정보는 <b className="font-normal text-gold-soft">저장하지 않습니다.</b> 이
        화면을 떠나거나 새로고침하면 사라집니다 — 남의 생년월일을 내 브라우저에 남길
        이유가 없습니다.
      </p>
      <div className="mt-8">
        <GoldButton variant="solid" onClick={onAsk}>
          상대의 하늘 넣기
        </GoldButton>
      </div>
    </div>
  );
}

/**
 * 앞에 세우는 숫자 — 이름이 붙어 있는 조합이 몇 개 맺혀 있는가.
 *
 * 숫자보다 그 숫자가 무엇인지가 먼저다. 궁합 점수로 읽히면 이 페이지는 계산이
 * 아니라 점괘가 된다 — 그래서 세는 방법을 숫자 바로 옆에 붙여 둔다. 아래 목록에서
 * 직접 세어 보면 같은 값이 나온다.
 */
function Resonance({ reading }: { reading: SynastryReadingData }) {
  const [frame, started] = useInView<HTMLDivElement>(0.5);
  const shown = useCountUp(reading.named, started);

  return (
    <div ref={frame} className="flex flex-wrap items-start gap-x-10 gap-y-6">
      <div className="flex-none">
        <p className="font-latin text-eyebrow tracking-[0.24em] text-gold">RESONANCE</p>
        <p className="mt-1 font-display text-6xl tabular-nums text-starlight">
          {shown}
          <span className="ml-1 font-display text-2xl text-starlight-dim">{" / 12"}</span>
        </p>
        <p className="mt-1 font-display text-lg text-gold-soft">{reading.bandLabel}</p>
      </div>
      <div className="min-w-0 flex-1 basis-72">
        <p className="max-w-[52ch] break-keep leading-relaxed text-starlight">{reading.bandLine}</p>
        <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-meta text-starlight-dim">
          <li>맺힌 각도 모두 {reading.total}</li>
          <li>흐르는 각도 {reading.flowing}</li>
          <li>부딪히는 각도 {reading.friction}</li>
          <li>겹치는 각도 {reading.overlapping}</li>
          {reading.tightest !== null && <li>가장 정확한 오차 {reading.tightest.toFixed(1)}도</li>}
        </ul>
        <p className="mt-5 max-w-[52ch] break-keep text-meta text-starlight-dim">
          {RESONANCE_NOTE}
        </p>
      </div>
    </div>
  );
}

/**
 * 이 관계의 무엇을 볼 것인가, 그리고 그 영역에서 두 사람이 어떻게 만나는가.
 *
 * 각도는 어떤 힘이 만나는지만 말한다. 어느 영역인지를 말하는 것은 방(하우스)이고,
 * "그 사람과 금전운"이라는 물음에 실제로 답하는 것도 방이다 — 재물운은 2하우스
 * (내가 버는 것)와 8하우스(남과 얽힌 돈)를 본다.
 *
 * 관심사를 바꾸면 이 자리와 아래 목록의 차례가 즉시 바뀐다. 계산은 이미 브라우저
 * 안에 다 있어서 다시 물을 것이 없다.
 */
function LensSection({
  lens,
  chosen,
  onPick,
}: {
  lens: LensView | null;
  chosen: string | null;
  onPick: (concern: string) => void;
}) {
  return (
    <section className="mt-16">
      <h2 className="mb-6 flex items-center gap-4 break-keep font-display text-xl text-starlight">
        {lens ? `${lens.label}으로 본다면` : "무엇을 볼까요"}
        <span aria-hidden className="h-px flex-1 bg-gold/25" />
      </h2>

      <MotionScope>
      <div role="group" aria-label="이 관계에서 볼 영역" className="flex flex-wrap gap-2.5">
        {CONCERN_LENSES.map((option) => {
          const active = option.label === chosen;
          return (
            <m.button
              key={option.key}
              type="button"
              onClick={() => onPick(option.label)}
              aria-pressed={active}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className={`rounded-full border px-4 py-2 text-xs tracking-wide transition-colors ${
                active
                  ? "border-gold bg-gold/12 text-starlight"
                  : "border-gold/30 text-starlight-dim hover:border-gold/60 hover:text-starlight"
              }`}
            >
              {option.label}
            </m.button>
          );
        })}
      </div>
      </MotionScope>

      {!lens ? (
        <p className="mt-6 max-w-[52ch] break-keep text-guide text-starlight-dim">
          하나를 고르면 그 영역에서 두 사람이 어디서 만나는지를 봅니다. 여기서 고른
          것은 이 화면 안에서만 쓰이고 저장되지 않습니다.
        </p>
      ) : (
        <>
          <p className="mt-6 max-w-[52ch] break-keep text-guide text-starlight">{lens.summary}</p>
          <p className="mt-2 max-w-[52ch] break-keep text-meta text-starlight-dim">{LENS_INTRO}</p>

          {lens.noHouses ? (
            <p className="mt-6 max-w-[52ch] break-keep leading-relaxed text-starlight-dim">
              {lens.noHouses}
            </p>
          ) : (
            <>
              <ul className="mt-8 space-y-8">
                {lens.rooms.map((room) => (
                  <li key={room.number} className="border-t border-gold/15 pt-6">
                    <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-display text-lg text-starlight">
                        내 {room.ko}
                      </span>
                      <span className="text-meta text-starlight-dim">
                        {room.number}번째 방 · {room.domain}
                      </span>
                    </p>
                    {room.visitors.length === 0 ? (
                      <p className="mt-3 max-w-[52ch] break-keep text-guide text-starlight-dim">
                        이 방에 드는 상대의 별은 없습니다.
                      </p>
                    ) : (
                      <ul className="mt-4 space-y-3">
                        {room.visitors.map((visitor) => (
                          <li
                            key={visitor.planet.key}
                            className="grid grid-cols-[30px_minmax(0,1fr)] gap-x-3"
                          >
                            <span className="astro-symbol text-lg leading-snug text-gold-soft" aria-hidden>
                              {visitor.planet.symbol}
                              {"︎"}
                            </span>
                            <p className="max-w-[52ch] break-keep leading-relaxed text-starlight">
                              그쪽의 {visitor.planet.ko} — {visitor.line}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>

              {lens.noVisitors && (
                <p className="mt-8 max-w-[52ch] break-keep leading-relaxed text-starlight-dim">
                  {lens.noVisitors}
                </p>
              )}
              {lens.partnerTimeUnknown && (
                <p className="mt-6 max-w-[52ch] break-keep text-meta text-starlight-dim">
                  {lens.partnerTimeUnknown}
                </p>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}

/** 0에서 그 값까지 올라간다. 화면에 들어온 뒤에 시작해야 눈에 보인다. */
function useCountUp(target: number, run: boolean): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!run) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    const DURATION = 1100;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      // 끝에서 부드럽게 멎는다. 일정한 속도로 세면 마지막에 뚝 끊긴다.
      setValue(Math.round(target * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, run]);

  return value;
}

/*
 * 탭 순서에는 넣지 않는다. 커서를 올리면 위 그림의 실이 밝아지지만 그것뿐이고,
 * 키보드로 들를 자리로 만들면 아무 일도 일어나지 않는 정거장이 열 개 생긴다 —
 * 화면 낭독기에는 "이 항목으로 무엇을 할 수 있다"는 신호로 들린다. 실이 밝아지는
 * 것은 커서를 쓰는 사람을 위한 덤이고, 내용은 이미 이 줄에 다 적혀 있다.
 */
function LineRow({
  line,
  onEnter,
  onLeave,
}: {
  line: SynastryLine;
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <li
      className={`border-t py-6 ${line.harmony > 0 ? "border-gold/40" : "border-gold/12"}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <LineHead line={line} />
      <p className="mt-3 max-w-[52ch] break-keep text-guide text-gold-soft">
        {line.meeting} — {line.headline}
      </p>
      <p className="mt-2 max-w-[52ch] break-keep leading-relaxed text-starlight-dim">{line.body}</p>
      {line.highlight && (
        <p className="mt-3 max-w-[52ch] break-keep border-l-2 border-gold/40 pl-4 leading-relaxed text-starlight">
          {line.highlight}
        </p>
      )}
    </li>
  );
}

function LineHead({ line }: { line: SynastryLine }) {
  // span인 이유: 접힌 줄에서는 button 안에 서는데, p는 button의 콘텐츠 모델에
  // 어긋나 하이드레이션 경고가 난다(natal PlacementHead와 같은 사정).
  return (
    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      {line.highlighted && (
        <span className="text-meta tracking-[0.16em] text-gold" aria-hidden>
          ✦
        </span>
      )}
      <span className="font-display text-lg text-starlight">
        내 <span className="astro-symbol">{line.mine.symbol}</span> {line.mine.ko}
        <span className="mx-2 astro-symbol text-gold-soft">{line.aspectSymbol}</span>그쪽{" "}
        <span className="astro-symbol">{line.theirs.symbol}</span> {line.theirs.ko}
      </span>
      <span className="text-meta text-starlight-dim">
        {line.aspectKo} · 오차 {line.orb.toFixed(1)}도
      </span>
      <ToneBadge harmony={line.harmony} />
      {line.highlighted && <span className="sr-only">고른 관심사에 걸리는 항목입니다.</span>}
    </span>
  );
}

/**
 * 이름 없는 만남 — 접혀 있다. 제목 줄의 별 표기 아래에 두 자리가 만나는 생활
 * 문장(meeting)을 주석처럼 남겨, 접힌 채로 훑어도 지도가 되게 한다.
 */
function CollapsedLineRow({
  line,
  open,
  onToggle,
  onEnter,
  onLeave,
}: {
  line: SynastryLine;
  open: boolean;
  onToggle: () => void;
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <li
      className={`border-t ${line.harmony > 0 ? "border-gold/40" : "border-gold/12"}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-baseline gap-x-3 py-4 text-left"
      >
        <span
          aria-hidden
          className={`flex-none text-meta text-gold transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            open ? "rotate-90" : ""
          }`}
        >
          ›
        </span>
        <span className="min-w-0 flex-1">
          <LineHead line={line} />
          <span className="mt-1 block max-w-[52ch] break-keep text-meta text-starlight-dim">
            — {line.meeting}
          </span>
        </span>
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="max-w-[52ch] pb-6 pl-6">
            <p className="break-keep text-guide text-gold-soft">{line.headline}</p>
            <p className="mt-2 break-keep leading-relaxed text-starlight-dim">{line.body}</p>
          </div>
        </div>
      </div>
    </li>
  );
}
