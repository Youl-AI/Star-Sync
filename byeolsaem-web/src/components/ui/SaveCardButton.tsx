"use client";
import { useState } from "react";
import { shareCard, type CardSpec } from "@/lib/share-card";

/**
 * 부적 카드를 이미지로 저장하는 버튼(스펙 §6.2·§6.3).
 *
 * 카드는 누르는 순간 그린다. 미리 그려 두면 화면의 카드가 바뀌었을 때(오늘이
 * 지났거나 정보를 고쳤거나) 낡은 그림이 나간다.
 */
export function SaveCardButton({
  spec,
  run,
  filename,
  idleLabel = "카드 이미지로 저장",
  busyLabel = "카드를 그리는 중…",
  className = "",
}: {
  /** 그릴 것을 함수로 받는다 — 누르는 시점의 값으로 그리기 위해서다. */
  spec?: () => CardSpec;
  /** 부적 카드가 아닌 다른 그림(원반 등)을 굽는 경우 — spec 대신 이것이 돈다. */
  run?: () => Promise<void>;
  filename: string;
  idleLabel?: string;
  busyLabel?: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "failed">("idle");

  const save = async () => {
    if (state === "busy") return;
    setState("busy");
    try {
      if (run) await run();
      else if (spec) await shareCard(spec(), filename);
      setState("done");
    } catch {
      setState("failed");
    }
    window.setTimeout(() => setState("idle"), 2200);
  };

  return (
    <button
      type="button"
      onClick={save}
      aria-live="polite"
      className={`text-meta tracking-wide text-starlight-dim underline underline-offset-4 transition-[color,transform] duration-150 hover:text-starlight active:scale-[0.97] ${className}`}
    >
      {/* 네 말이 같은 칸에 겹쳐 있다(globals.css의 .label-swap 주석 참고). */}
      <span className="label-swap">
        <span data-on={String(state === "idle")}>{idleLabel}</span>
        <span data-on={String(state === "busy")}>{busyLabel}</span>
        <span data-on={String(state === "done")}>저장했어요</span>
        <span data-on={String(state === "failed")}>저장하지 못했어요</span>
      </span>
    </button>
  );
}
