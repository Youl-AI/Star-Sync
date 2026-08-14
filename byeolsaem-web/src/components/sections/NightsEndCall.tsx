"use client";
import { GoldButton } from "@/components/ui/GoldButton";
import { useBirthProfile } from "@/hooks/useBirthProfile";
import { openBirthPanel, requestRitual } from "@/lib/ritual";
import { scrollToId } from "@/lib/scroll";

/**
 * 밤의 끝 — 여정을 다 내려온 사람을 위한 마지막 초대.
 *
 * 열두 방 아래가 곧장 푸터라, 구경을 마친 사람이 할 일 없이 밤에서 떨어진다는
 * 피드백(2026-08-14)에서 시작했다. "맨 위로 돌려보내는" 대신 그 자리에서
 * 입력 패널을 연다 — 패널은 어디서든 뜨는 오버레이고, 입력이 끝나면
 * DeepResult가 심연의 결과로 자동 하강시키므로 위로 갈 이유가 없다.
 *
 * 서버 HTML에는 언제나 "입력 초대" 판이 들어간다(WithoutBirthProfile과 같은
 * 원칙 — 검색엔진과 첫 방문자가 보는 것이 그 HTML이다). 이미 정보를 남긴
 * 사람에게는 마운트 뒤에 문구가 바뀌어 심연의 자기 결과로 안내한다.
 */
export function NightsEndCall() {
  const { profile, ready } = useBirthProfile();
  const returning = ready && profile !== null;

  return (
    <section className="mx-auto max-w-5xl px-6 pb-8 pt-24 text-center">
      <p className="font-latin text-eyebrow tracking-[0.28em] text-gold">BEFORE DAWN</p>
      <h2 className="mt-4 break-keep font-display text-2xl text-starlight md:text-3xl">
        {returning ? "당신의 별은 이미 샘 아래에 떠 있습니다" : "이제, 당신의 하늘을 볼 차례입니다"}
      </h2>
      <p className="mx-auto mt-4 max-w-md break-keep leading-relaxed text-starlight-dim">
        {returning
          ? "남겨 둔 순간의 하늘이 심연에서 기다립니다. 다른 순간이 궁금하면 언제든 바꿔 넣을 수 있습니다."
          : "태어난 순간을 넣으면, 방금 지나온 샘 아래 밤하늘에서 당신의 별자리가 그려집니다. 계산은 이 브라우저 안에서 끝나며 어디로도 전송되지 않습니다."}
      </p>
      <div className="mt-9 flex flex-col items-center gap-5">
        {returning ? (
          <>
            <GoldButton variant="solid" onClick={() => scrollToId("deep-result")}>
              내 별 보러 가기
            </GoldButton>
            <button
              type="button"
              onClick={() => openBirthPanel()}
              className="text-meta tracking-wide text-starlight-dim underline underline-offset-4 transition-colors hover:text-starlight"
            >
              다른 정보로 입력하기
            </button>
          </>
        ) : (
          <GoldButton variant="solid" onClick={() => requestRitual()}>
            내 밤하늘 열기
          </GoldButton>
        )}
      </div>
    </section>
  );
}
