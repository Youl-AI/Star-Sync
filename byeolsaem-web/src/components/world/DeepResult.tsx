"use client";
import { useEffect, useRef, useState } from "react";
import { useBirthProfile } from "@/hooks/useBirthProfile";
import { BIRTH_PROFILE_EVENT, loadBirthProfile } from "@/lib/birth-profile";
import { SIGN_SYMBOL, getSunSign } from "@/lib/zodiac";
import { MockChart } from "@/components/hero/MockChart";
import { SignArchCard } from "@/components/ui/ArchCard";
import { TalismanChip } from "@/components/ui/TalismanChip";
import { SaveCardButton } from "@/components/ui/SaveCardButton";
import { KakaoShareButton } from "@/components/ui/KakaoShareButton";
import { GoldButton } from "@/components/ui/GoldButton";
import { openBirthPanel } from "@/lib/ritual";
import { scrollToId } from "@/lib/scroll";
import { signArt } from "@/lib/share-card";

/**
 * 심연의 결과 모먼트 — "샘 아래 밤하늘에서 당신의 별을 찾았습니다".
 *
 * 수직 세계에서 히어로의 3장면 의식이 사라지면서, 입력을 마친 사람이 결과를
 * 만나는 자리가 비었다. 세계관이 답을 준다: 당신의 하늘은 샘 아래에 있으므로,
 * 입력이 끝나면 심연으로 데려가 거기서 별자리가 그려진다.
 *
 * - 프로필이 없으면 아무것도 그리지 않는다 (처음 온 사람은 ResultPreview가 안내).
 * - 이 페이지에서 방금 입력을 마친 순간(프로필 없음→생김)에는 심연으로
 *   부드럽게 하강한다 — 여정을 대신 내려가 주는 연출.
 */
export function DeepResult() {
  const { profile, ready } = useBirthProfile();
  const [chartDrawn, setChartDrawn] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // 하강 트리거는 "프로필 값의 변화"가 아니라 **저장 이벤트**다. 값 비교로 하면
  // 이미 프로필이 있던 사람이 다시 입력했을 때(값이 같든 다르든) 하강하지 않는
  // 구멍이 생긴다 — 실사용에서 발견된 버그. 입력 의식을 마친 모든 경우에
  // 결과로 데려가고, 페이지 로드만으로는 절대 움직이지 않는다(납치 방지).
  useEffect(() => {
    const onSaved = () => {
      if (!loadBirthProfile()) return; // 삭제 알림이면 무시
      // 하강은 세 상대와 경쟁한다: 네이티브 scrollIntoView를 무시하는 Lenis
      // (→ scrollToId로 위임), BirthPanel이 닫히며 부르는 history.back()의 스크롤
      // 복원, 그리고 환경마다 다른 그 타이밍. 한 번의 지연으로 피하는 대신
      // 도착을 실측하고 밀려났으면 다시 내려간다 — 마지막에 이기는 쪽이 우리다.
      const attempt = (triesLeft: number) => {
        scrollToId("deep-result", () => {
          const el = sectionRef.current;
          if (!el || triesLeft <= 0) return;
          // scroll-mt-14(56px) 목표 대비 크게 어긋나 있으면 복원에 밀린 것
          if (Math.abs(el.getBoundingClientRect().top - 56) > 150) {
            window.setTimeout(() => attempt(triesLeft - 1), 300);
          }
        });
      };
      window.setTimeout(() => attempt(3), 700);
    };
    window.addEventListener(BIRTH_PROFILE_EVENT, onSaved);
    return () => window.removeEventListener(BIRTH_PROFILE_EVENT, onSaved);
  }, []);

  // 프로필이 지워지면 다음 드로잉을 처음부터 다시 하도록 되돌린다.
  useEffect(() => {
    if (ready && profile === null) setChartDrawn(false);
  }, [ready, profile]);

  if (!ready || !profile) return null;
  const sign = getSunSign(profile.date);

  return (
    <section
      ref={sectionRef}
      id="deep-result"
      // 짧은 화면(813px 노트북)에서도 도착 시 제목·별자리·카드 상단이 한 화면에
      // 들어오도록 세로 간격을 조인다. 카드 아래 버튼들은 살짝 스크롤하면 보인다.
      className="relative z-10 flex min-h-[100vh] scroll-mt-14 flex-col items-center justify-center gap-5 px-6 py-[8vh] text-center"
    >
      <div>
        <p className="font-latin text-eyebrow tracking-[0.26em] text-gold">YOUR STAR</p>
        <h2 className="mt-3 break-keep font-display text-2xl text-starlight md:text-3xl">
          샘 아래 밤하늘에서, 당신의 별을 찾았습니다
        </h2>
      </div>

      {/* 물속 별들 사이에서 당신의 별자리가 이어 그려진다 */}
      <MockChart sign={sign} onDrawn={() => setChartDrawn(true)} />

      <div
        className={`flex flex-col items-center gap-6 transition-opacity duration-700 ${
          chartDrawn ? "opacity-100" : "opacity-0"
        }`}
        inert={!chartDrawn}
      >
        <SignArchCard sign={sign} />
        <div className="flex flex-wrap justify-center gap-2.5">
          <TalismanChip symbol="☉" label={`태양 ${sign.ko}`} />
          {profile.concern && <TalismanChip symbol="✦" label={profile.concern} />}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <SaveCardButton
            filename={`byeolsaem-${sign.key}.png`}
            spec={() => ({
              name: sign.card,
              latin: sign.latin,
              range: sign.range,
              symbol: SIGN_SYMBOL[sign.key],
              tagline: sign.tagline,
              art: signArt(sign),
            })}
          />
          <KakaoShareButton
            text={`나의 태양은 ${sign.ko} — ${sign.tagline}`}
            path={`/sign/${sign.key}`}
            imagePath={`/og/sign/${sign.key}.png`}
          />
        </div>
        <GoldButton variant="solid" href="/natal">
          천궁도 자세히 보기
        </GoldButton>
        <button
          type="button"
          onClick={() => openBirthPanel()}
          className="text-meta tracking-wide text-starlight-dim underline underline-offset-4 transition-colors hover:text-starlight"
        >
          다른 정보로 입력하기
        </button>
      </div>
    </section>
  );
}
