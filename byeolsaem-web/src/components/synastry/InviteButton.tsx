"use client";
import { useState } from "react";
import type { BirthProfile } from "@/lib/birth-profile";
import { INVITE_CONSENT, inviteUrl } from "@/lib/invite";

/**
 * 초대 링크 보내기 — 모바일은 OS 공유 시트(받는 앱은 사용자가 고른다),
 * 데스크톱 등 navigator.share가 없으면 클립보드 폴백. 카카오 SDK는 쓰지
 * 않는다 — 사이트의 공유 관례: 이미지 카드는 카카오, 링크는 공유 시트.
 */
export function InviteButton({ profile }: { profile: BirthProfile }) {
  const [copied, setCopied] = useState(false);
  const url = inviteUrl({ date: profile.date, time: profile.time, city: profile.city });

  const send = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "별샘 궁합 초대",
          text: "두 하늘이 만나는 자리를 봐요",
          url,
        });
      } catch {
        // 사용자가 시트를 닫은 것(AbortError) — 아무 일도 아니다.
      }
      return;
    }
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="max-w-[52ch]">
      <p className="break-keep text-meta text-starlight-dim">{INVITE_CONSENT}</p>
      <button
        type="button"
        onClick={send}
        className="mt-3 border border-gold/25 px-4 py-2 text-meta tracking-[0.08em] text-gold-soft transition-colors hover:border-gold/50 hover:text-starlight motion-reduce:transition-none"
      >
        {copied ? "복사됐습니다" : "초대 링크 보내기"}
      </button>
    </div>
  );
}
