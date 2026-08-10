"use client";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { useBirthProfile } from "@/hooks/useBirthProfile";
import { formatBirthDate } from "@/lib/birth-profile";
import { requestRitual } from "@/lib/ritual";

// 셀 배경은 반투명해야 뒤의 WebGL 별하늘이 실제로 비쳐 보인다(.nebula-bg는
// 완전 불투명 + 보라 레이어라 재사용 금지 — 스펙 §1.1).
const DOOR_CELL =
  "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gold/20 bg-ink-raised/40 backdrop-blur-[2px] transition-colors hover:border-gold/50 hover:bg-ink-raised/50";

interface DoorProps {
  href: string;
  title: string;
  description: ReactNode;
  glyph: ReactNode;
  /** 큰 문 하나는 설명이 길고 여백이 넉넉하다. 작은 문 둘은 한 줄 태그라인만. */
  size: "lg" | "sm";
  /** 스크롤 등장 순서. globals.css의 [data-reveal] 규칙이 이 값만큼 지연시킨다. */
  revealIndex?: number;
  className?: string;
}

/**
 * 세 개의 문 중 하나. 출생 정보를 이미 입력한 사람과 아직 입력하지 않은 사람에게
 * 서로 다른 안내를 준다.
 *
 * 마크업은 두 경우 모두 동일한 `<Link>`다. 링크로 고정한 이유는 두 가지다.
 * (1) 서버는 저장소를 볼 수 없으므로 서버/클라이언트 첫 렌더가 반드시 같아야 하고,
 * (2) JS가 죽어도 문은 열려 있어야 한다(그 페이지는 실제로 존재한다).
 * 출생 정보가 없다는 걸 확인한 뒤에만 클릭을 가로채서, 새 입력 폼을 띄우는 대신
 * 히어로의 입력 의식으로 되돌려 보낸다 — 입력 지점은 사이트 전체에서 하나다.
 */
export function Door({
  href,
  title,
  description,
  glyph,
  size,
  revealIndex = 0,
  className = "",
}: DoorProps) {
  const { profile, ready } = useBirthProfile();
  const needsBirthData = ready && profile === null;

  return (
    <Link
      href={href}
      data-reveal
      style={{ "--reveal-i": revealIndex } as CSSProperties}
      className={`${DOOR_CELL} ${size === "lg" ? "p-8" : "p-6"} ${className}`}
      onClick={(e) => {
        if (!needsBirthData) return;
        e.preventDefault();
        requestRitual();
      }}
    >
      {glyph}
      <div>
        <h3
          className={`break-keep font-display text-starlight ${
            size === "lg" ? "text-2xl" : "text-xl"
          }`}
        >
          {title}
        </h3>
        <div
          className={`break-keep text-sm text-starlight-dim ${
            size === "lg" ? "mt-2 max-w-xs leading-relaxed" : "mt-1.5"
          }`}
        >
          {description}
        </div>
        {/* 안내 문구 자리는 `ready` 이전에도 높이를 차지해야 한다. 나중에 글자가
            채워지면서 카드가 밀려 올라가는 레이아웃 이동을 막기 위함이다. */}
        <span
          className={`mt-4 block min-h-4 text-xs tracking-wide text-gold-soft transition-colors group-hover:text-gold ${
            ready ? "opacity-100" : "opacity-0"
          }`}
        >
          {profile ? `${formatBirthDate(profile.date)}의 하늘로 →` : "밤하늘을 먼저 열어주세요"}
        </span>
      </div>
    </Link>
  );
}
