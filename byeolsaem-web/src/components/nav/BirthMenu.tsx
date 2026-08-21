"use client";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useBirthProfile } from "@/hooks/useBirthProfile";
import { clearBirthProfile, formatBirthDate } from "@/lib/birth-profile";
import { requestRitual } from "@/lib/ritual";
import { SEAL_CLIP_SM } from "../ui/goldStyles";

/**
 * 머리글의 "내 밤하늘" 자리. 저장된 정보가 있으면 메뉴가 된다.
 *
 * 왜 여기냐면, 지우는 길이 메인 히어로의 결과 화면 하나뿐이었기 때문이다.
 * 바꾸는 것은 어디서나 됐다(패널이 덮어쓴다). 지우는 것만 홈으로 돌아가
 * 세로 여정을 스크롤해 내려가야 했다 — 개인정보 문서가 "누르면 즉시
 * 지워집니다"라고 약속하면서 그 버튼이 어디 있는지는 말하지 않는 상태였다.
 *
 * 없던 자리를 새로 만들지 않고 이미 모든 페이지에 붙어 있는 버튼을 상태에 따라
 * 바꾼다. 정보가 없으면 지금까지와 똑같이 의식을 연다.
 *
 * 서버 HTML은 언제나 "정보 없음" 쪽으로 그린다(WithoutBirthProfile과 같은 원칙).
 * localStorage는 브라우저에서만 읽히므로, 저장된 값을 전제로 그리면 첫 그림과
 * 어긋난다.
 */
export function BirthMenu({
  variant,
  onNavigate,
}: {
  /** nav = 데스크톱 머리글의 금색 인장, sheet = 모바일 오버레이 */
  variant: "nav" | "sheet";
  /** 모바일에서는 무엇을 누르든 오버레이가 닫혀야 한다. */
  onNavigate?: () => void;
}) {
  const { profile, ready } = useBirthProfile();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const menuId = useId();

  // 메뉴를 닫을 때 확인 단계도 함께 되돌린다. 남겨 두면 다음에 열었을 때
  // 누르지도 않은 "정말 지울까요"가 펼쳐진 채로 나온다.
  const close = () => {
    setOpen(false);
    setConfirming(false);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const openRitual = () => {
    close();
    onNavigate?.();
    requestRitual();
  };

  // 정보가 없을 때(그리고 첫 그림에서)는 지금까지와 똑같다.
  if (!ready || !profile) {
    return (
      <button type="button" onClick={openRitual} className={triggerClass(variant)}>
        내 밤하늘
      </button>
    );
  }

  return (
    <div ref={box} className={variant === "nav" ? "relative" : "relative flex flex-col items-center"}>
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        className={triggerClass(variant)}
      >
        {formatBirthDate(profile.date)}
        {/* 펼침 표시. 저장소가 아코디언에서 쓰는 것과 같은 글자를 돌려 쓴다 —
            아래쪽 세모 같은 글자를 새로 들이면 제목 폰트 서브셋을 다시 구워야 한다
            (fonts.test.ts가 그 상태를 실패로 잡는다). */}
        <span
          aria-hidden
          className={`ml-1.5 inline-block text-[0.9em] transition-transform duration-200 ${
            open ? "-rotate-90" : "rotate-90"
          }`}
        >
          ›
        </span>
      </button>

      {/* 키프레임 대신 transition — 연타해도 진행 중인 지점에서 되돌아가고,
          닫힐 때도 뚝 끊기는 대신 같은 길로 나간다. inert가 닫힌 메뉴를
          포커스·보조기술에서 통째로 치운다(조건부 마운트가 하던 일). */}
      <div
        id={menuId}
        role="menu"
        inert={!open}
        className={
          "z-50 min-w-[13rem] border border-gold/25 bg-ink-raised/95 py-1.5 backdrop-blur-md " +
          "transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:translate-y-0 " +
          (open ? "translate-y-0 opacity-100 " : "pointer-events-none -translate-y-1.5 opacity-0 ") +
          // sheet는 흐름 안에 서므로 닫혀 있으면 자리도 내주면 안 된다. 오버레이
          // 전체가 함께 닫히는 맥락이라 sheet 쪽 exit 연출은 잃는 것이 없다.
          (variant === "nav" ? "absolute right-0 top-full mt-2" : open ? "relative mt-3" : "hidden")
        }
      >
          <Link
            href="/natal"
            role="menuitem"
            onClick={() => {
              close();
              onNavigate?.();
            }}
            className={itemClass}
          >
            내 천궁도 보기
          </Link>
          <button type="button" role="menuitem" onClick={openRitual} className={itemClass}>
            정보 바꾸기
          </button>

          <div className="my-1.5 border-t border-gold/15" />

          {confirming ? (
            // 히어로의 "다른 정보로 보기"와 같은 두 단계다. 이 값 하나를 사이트
            // 전체가 쓰므로, 잘못 눌러 놓고 알아챌 방법이 없다.
            <div className="px-3.5 py-1.5">
              <p className="text-meta leading-relaxed text-starlight-dim">
                지우면 되돌릴 수 없습니다.
              </p>
              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    clearBirthProfile();
                    close();
                    onNavigate?.();
                  }}
                  className="border-b border-gold-soft pb-px text-meta text-gold-soft transition-colors hover:text-starlight"
                >
                  지우기
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="text-meta text-starlight-dim transition-colors hover:text-starlight"
                >
                  그대로 두기
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              role="menuitem"
              onClick={() => setConfirming(true)}
              className={itemClass}
            >
              저장된 정보 지우기
            </button>
          )}
        </div>
    </div>
  );
}

/**
 * 방아쇠의 모양. 데스크톱은 지금까지의 금색 인장 그대로이고, 모바일 오버레이는
 * 그 안의 다른 항목들과 같은 결로 앉는다 — 시트 한가운데에 금색 덩어리가 하나
 * 놓이면 그것만 광고처럼 보인다.
 */
function triggerClass(variant: "nav" | "sheet"): string {
  return variant === "nav"
    ? `bg-gold-soft px-4 py-2 text-xs font-semibold tracking-wider text-ink transition-colors hover:bg-[#f0d789] ${SEAL_CLIP_SM}`
    : "font-display text-lg text-gold-soft transition-colors hover:text-starlight";
}

const itemClass =
  "block w-full px-3.5 py-2 text-left text-meta text-starlight transition-colors hover:bg-gold/10 hover:text-gold-soft";
