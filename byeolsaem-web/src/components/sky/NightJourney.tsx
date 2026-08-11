"use client";
import { useEffect, useState } from "react";

/**
 * 밤의 여정 — 스크롤 위치에 따라 배경의 시간대가 흘러간다.
 *
 * 히어로의 초저녁에서 시작해 자정에 가장 깊어지고, 푸터에서 여명의 온기가
 * 스민다. 페이지 전체가 하나의 성운 배경이던 것을 시간의 흐름으로 바꾸는
 * 장치다. 어디까지 내려왔는지가 색만으로 읽힌다.
 *
 * 구현: 화면을 덮는 그라디언트 레이어를 시간대 수만큼 겹쳐두고 현재 구간의
 * 것만 opacity 1로 둔다. 레이어를 옮기거나 다시 그리지 않고 투명도만
 * 교차시키므로 레이아웃 계산이 없고, 브라우저가 합성만으로 처리한다.
 *
 * 위치 판정은 스크롤 이벤트가 아니라 IntersectionObserver로 한다. 스크롤
 * 프레임마다 실행되는 리스너는 이 프로젝트에서 금지돼 있고, 어차피 필요한 것은
 * "지금 어느 구간인가" 하나뿐이다.
 *
 * 관찰 대상은 구간 전체를 감싸는 영역이지 경계선이 아니다. 처음에는 1px짜리
 * 표식을 화면 정중앙(rootMargin -50%/-50%)에서 잡으려 했는데, 그 설정은 관찰
 * 기준 영역의 높이를 0으로 만들어 어떤 요소와도 교차 면적이 생기지 않는다 —
 * 옵저버가 한 번도 발화하지 않았다. 기준을 얇은 띠로 되돌리더라도 1px 표식은
 * 빠른 스크롤에서 한 프레임 만에 띠를 건너뛸 수 있다. 반대로 두면 안전하다:
 * 기준 띠는 얇게, 관찰 대상은 구간만큼 크게. 수백 px짜리 영역은 어떤 속도로
 * 스크롤해도 화면 중앙을 지나칠 때 반드시 걸린다.
 *
 * 별하늘(SkyCanvas)은 이 레이어 아래에 그대로 있다. 그라디언트가 반투명이라
 * 별이 계속 비쳐 보이되, 자정 구간에서는 배경이 가장 어두워 별이 가장 또렷해진다.
 */

/** 시간대 순서 = 페이지를 내려가는 순서. */
const PHASES = [
  {
    key: "dusk",
    // 초저녁: 지금의 성운 그대로. 히어로에서 보던 인상을 그대로 유지한다.
    background:
      "radial-gradient(ellipse 60% 50% at 62% 38%, rgba(109, 90, 207, 0.16), transparent 70%), linear-gradient(160deg, #0d1020 0%, #14163a 55%, #241f4e 100%)",
  },
  {
    key: "deep-night",
    // 깊은 밤: 보라가 빠지고 푸르게 가라앉는다.
    background: "linear-gradient(170deg, #131a35 0%, #0d1428 60%, #0a1020 100%)",
  },
  {
    key: "midnight",
    // 자정: 가장 어두운 구간. 별이 가장 또렷하게 보이는 자리다.
    background: "linear-gradient(180deg, #080b16 0%, #05070f 60%, #04060d 100%)",
  },
  {
    key: "before-dawn",
    // 새벽 직전: 바닥에서 미세한 청록 기운이 올라온다.
    background:
      "linear-gradient(0deg, rgba(18, 48, 54, 0.55), transparent 62%), linear-gradient(180deg, #05070f 0%, #060c14 100%)",
  },
  {
    key: "dawn",
    // 여명: 아래에서 금빛 온기. 푸터 워드마크의 반사와 이어진다.
    background:
      "radial-gradient(ellipse 90% 60% at 50% 108%, rgba(201, 162, 39, 0.20), transparent 68%), linear-gradient(180deg, #070a14 0%, #14101c 100%)",
  },
] as const;

export function NightJourney() {
  const [bandPhase, setBandPhase] = useState(0);
  const [atEnd, setAtEnd] = useState(false);

  // 페이지 끝에 닿으면 마지막 시간대로 확정한다. 관찰 띠만으로는 마지막 구간이
  // 영영 켜지지 않을 수 있기 때문이다 — 푸터는 짧아서, 끝까지 내려도 그 위쪽
  // 모서리가 띠에 닿기 전에 스크롤이 멈춘다(실측: 최대 스크롤에서 19px 모자람).
  // 띠를 아래로 내려 지금 화면 비율에서는 해결되지만, 뷰포트가 더 높아지면 같은
  // 일이 다시 생긴다. 이 감지가 그 부류의 문제를 통째로 막는다.
  const phase = atEnd ? PHASES.length - 1 : bandPhase;

  useEffect(() => {
    const regions = Array.from(
      document.querySelectorAll<HTMLElement>("[data-night-phase]")
    );
    if (regions.length === 0) return;

    // 화면 아래쪽 60% 지점을 가로지르는 얇은 띠(뷰포트 높이의 2%)에 걸린 구간이
    // 곧 "지금 보고 있는 구간"이다. 구간끼리 맞닿아 있어 경계에서 잠깐 둘이 함께
    // 걸리는데, 그때는 더 아래 구간을 택해 색이 앞서 준비되게 한다.
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .map((e) => Number(e.target.getAttribute("data-night-phase")))
          .filter((n) => !Number.isNaN(n));
        if (hit.length > 0) setBandPhase(Math.max(...hit));
      },
      { rootMargin: "-59% 0px -39% 0px", threshold: 0 }
    );
    regions.forEach((r) => io.observe(r));

    const end = document.querySelector<HTMLElement>("[data-night-end]");
    // 바닥 감지는 기준 영역이 화면 전체라 1px짜리 표식이어도 안전하다. 한 번
    // 들어오면 계속 걸려 있어, 빠른 스크롤에 건너뛸 여지가 없다.
    const endIo = end
      ? new IntersectionObserver(
          ([e]) => {
            // 한 화면에 다 들어오는 짧은 페이지에서 처음부터 여명이 켜지지 않도록,
            // 실제로 스크롤할 거리가 있는 문서에서만 적용한다.
            const scrollable =
              document.documentElement.scrollHeight > window.innerHeight * 1.5;
            setAtEnd(e.isIntersecting && scrollable);
          },
          { threshold: 0 }
        )
      : null;
    if (end && endIo) endIo.observe(end);

    return () => {
      io.disconnect();
      endIo?.disconnect();
    };
  }, []);

  return (
    <div className="absolute inset-0" aria-hidden>
      {PHASES.map((p, i) => (
        <div
          key={p.key}
          // 감소 모드에서는 globals.css의 전역 규칙이 이 전환도 즉시 끝내므로,
          // 색이 튀지 않고 그냥 해당 구간 색으로 바뀐다.
          className={`absolute inset-0 transition-opacity duration-[1600ms] ease-linear ${
            i === phase ? "opacity-100" : "opacity-0"
          }`}
          style={{ background: p.background }}
        />
      ))}
    </div>
  );
}

/**
 * 한 시간대가 이어지는 구간. 감싼 내용이 화면 중앙을 지나는 동안 배경이 그
 * 시간대를 유지한다. 자기 자신은 아무 스타일도 갖지 않아 레이아웃에 영향이 없다.
 */
export function NightPhase({
  index,
  children,
}: {
  index: number;
  children: React.ReactNode;
}) {
  return <div data-night-phase={index}>{children}</div>;
}

/**
 * 페이지의 맨 끝을 알리는 표식. 여기에 닿으면 마지막 시간대(여명)로 확정된다.
 * 문서의 마지막 요소로 두어야 한다.
 */
export function NightEnd() {
  return <div data-night-end className="h-px w-full" aria-hidden />;
}

export const NIGHT_PHASE_COUNT = PHASES.length;
