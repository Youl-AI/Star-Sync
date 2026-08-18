"use client";
import { useEffect, useState } from "react";
import { loadKakao, shareToKakao } from "@/lib/kakao";

/**
 * 카카오톡 공유 버튼(스펙 §6.2). SaveCardButton과 같은 낮은 자세의 글자
 * 링크다 — 카드가 주인공이고 나가는 길은 그 아래 조용히 있다.
 *
 * 버튼이 서는 순간 SDK를 미리 싣는다. 클릭에서 처음 싣기 시작하면 그 사이에
 * 사용자 제스처가 만료돼 브라우저가 공유 팝업을 차단한다.
 */
export function KakaoShareButton({
  text,
  path,
  className = "",
}: {
  /** 말풍선에 실릴 글. 누르는 시점의 화면 내용과 같아야 한다. */
  text: string;
  /** 링크가 데려갈 이 사이트 안의 경로. 예: "/sign/libra" */
  path: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    loadKakao().catch(() => {
      // 여기서는 조용히 둔다. 광고 차단기가 SDK를 막는 환경이 실제로 있고,
      // 그 사람이 공유를 누르지 않는 한 알릴 일이 아니다.
    });
  }, []);

  const share = async () => {
    try {
      await shareToKakao({ text, path });
      setFailed(false);
    } catch {
      setFailed(true);
      window.setTimeout(() => setFailed(false), 2200);
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      aria-live="polite"
      className={`text-meta tracking-wide text-starlight-dim underline underline-offset-4 transition-colors hover:text-starlight ${className}`}
    >
      <span className="label-swap">
        <span data-on={String(!failed)}>카카오톡으로 공유</span>
        <span data-on={String(failed)}>공유하지 못했어요</span>
      </span>
    </button>
  );
}
