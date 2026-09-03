"use client";
import { Link } from "@/components/ui/Link";
import type { ReactNode } from "react";
import { useBirthProfile } from "@/hooks/useBirthProfile";
import { formatBirthDate } from "@/lib/birth-profile";
import { requestRitual } from "@/lib/ritual";

// "무경계 성좌" 문(디자인 실험실 C안, 사용자 확정): 카드라는 상자를 버리고
// 하늘 위에 성좌와 글이 그대로 놓인다. 위쪽 가는 금선 하나가 영역을 가르고,
// 호버하면 그 선이 왼쪽부터 금빛으로 차오른다. 상자가 없으므로 클릭 영역은
// 블록 전체(padding 포함)가 담당한다.
const DOOR_FIELD =
  "group relative block border-t border-gold/25 px-2 pb-8 pt-7 " +
  "transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 " +
  "before:absolute before:-top-px before:left-0 before:h-px before:w-0 before:bg-gold-soft " +
  "before:transition-[width] before:duration-700 before:ease-[cubic-bezier(0.16,1,0.3,1)] " +
  "hover:before:w-full";

interface DoorProps {
  href: string;
  /** 별지도 도판처럼 붙는 차례 표기 — "I", "II", "III". */
  numeral: string;
  title: string;
  description: ReactNode;
  glyph: ReactNode;
  /**
   * 입력을 마친 사람에게 보여줄 안내의 종류. 문자열이 아니라 종류인 이유:
   * 문구에 저장된 생일이 들어가는데 그 값은 클라이언트(Door)만 알고, 부모
   * ThreeDoors는 서버 컴포넌트라 함수를 넘길 수도 없다.
   *
   * - natal: 그 사람의 출생 하늘 그 자체로 가는 문 → 생일을 그대로 쓴다.
   * - synastry: 두 하늘을 겹치는 문 → 내 날짜 하나만 가리키면 틀린 말이 된다.
   *   "한쪽 하늘은 준비됐다"로, 나머지 한쪽이 남아 있음을 알린다.
   * - yearly: 다가올 해를 보는 문 → 태어난 날짜로 "가는" 것이 아니다.
   * - solar-return: 생일의 하늘을 보는 문 → 날짜가 아니라 "내 생일"이 축이다.
   */
  hint: "natal" | "synastry" | "yearly" | "solar-return";
}

const READY_HINTS = {
  natal: (birth: string) => `${birth}의 하늘로 →`,
  synastry: () => "한쪽 하늘은 준비됐어요 →",
  yearly: () => "나의 한 해 미리 보기 →",
  "solar-return": () => "내 생일의 하늘 보기 →",
} as const;

/**
 * 세 개의 문 중 하나. 출생 정보를 이미 입력한 사람과 아직 입력하지 않은 사람에게
 * 서로 다른 안내를 준다.
 *
 * 마크업은 두 경우 모두 동일한 `<Link>`다. 링크로 고정한 이유는 두 가지다.
 * (1) 서버는 저장소를 볼 수 없으므로 서버/클라이언트 첫 렌더가 반드시 같아야 하고,
 * (2) JS가 죽어도 문은 열려 있어야 한다(그 페이지는 실제로 존재한다).
 * 출생 정보가 없다는 걸 확인한 뒤에만 클릭을 가로채서, 새 입력 폼을 띄우는 대신
 * 히어로의 입력 의식으로 되돌려 보낸다 — 입력 지점은 사이트 전체에서 하나다.
 *
 * 등장 모션은 세 문을 감싼 격자가 통째로 담당한다(ThreeDoors 참고).
 */
export function Door({ href, numeral, title, description, glyph, hint }: DoorProps) {
  const { profile, ready } = useBirthProfile();
  const needsBirthData = ready && profile === null;

  return (
    <Link
      href={href}
      data-door
      className={DOOR_FIELD}
      onClick={(e) => {
        if (!needsBirthData) return;
        e.preventDefault();
        requestRitual();
      }}
    >
      <span className="block font-latin text-eyebrow tracking-[0.22em] text-gold" aria-hidden>
        {numeral}
      </span>
      <div className="mt-5 opacity-80 transition-opacity duration-500 group-hover:opacity-100">
        {glyph}
      </div>
      <h3 className="mt-6 break-keep font-display text-xl text-starlight">{title}</h3>
      <div className="mt-2 break-keep text-sm leading-relaxed text-starlight-dim">
        {description}
      </div>
      {/* 안내 문구 자리는 `ready` 이전에도 높이를 차지해야 한다. 나중에 글자가
          채워지면서 아래 내용이 밀리는 레이아웃 이동을 막기 위함이다. */}
      <span
        className={`mt-5 block min-h-5 text-meta tracking-wide text-gold-soft transition-colors group-hover:text-gold ${
          ready ? "opacity-100" : "opacity-0"
        }`}
      >
        {profile ? READY_HINTS[hint](formatBirthDate(profile.date)) : "밤하늘을 먼저 열어주세요"}
      </span>
    </Link>
  );
}
