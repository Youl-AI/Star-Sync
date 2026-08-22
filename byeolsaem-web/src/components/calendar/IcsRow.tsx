"use client";
import { useState } from "react";

/**
 * 캘린더 구독 안내 — 구석의 선택 기능. 직접 쓰는 사람은 소수라는 것을 알고
 * 만들었다(2026-08-23 결정). 페이지 가치의 본체는 달력 자체다.
 */
export function IcsRow() {
  const [copied, setCopied] = useState(false);
  const url = "https://byeolsaem.com/sky.ics";
  return (
    <div className="mt-14 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gold/10 pt-6">
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(url).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          });
        }}
        className="border border-gold/25 px-4 py-2 text-meta tracking-[0.08em] text-gold-soft transition-colors hover:border-gold/50 hover:text-starlight motion-reduce:transition-none"
      >
        {copied ? "복사됐습니다" : "🗓 캘린더 구독 주소 복사"}
      </button>
      <a href="webcal://byeolsaem.com/sky.ics" className="text-meta text-gold-soft underline-offset-4 hover:underline">
        애플 캘린더로 바로 구독
      </a>
      <p className="w-full break-keep text-meta text-starlight-dim sm:w-auto">
        구글 캘린더는 설정 → 캘린더 추가 → URL로 추가에 붙여 넣으세요. 신월·보름·역행이 캘린더에 나타납니다.
      </p>
    </div>
  );
}
