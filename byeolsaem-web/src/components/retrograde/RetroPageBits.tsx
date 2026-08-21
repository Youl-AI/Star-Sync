/**
 * 역행 페이지들의 공용 조각 — 수성에서 시작한 페이지가 금성·화성으로 늘며
 * 세 페이지가 같은 표·체크리스트·문답 형태를 쓰게 되어 여기로 올렸다.
 * 서버 컴포넌트 — 자바스크립트 없이 렌더된다.
 */

export function CheckItem({ what, children }: { what: string; children: React.ReactNode }) {
  return (
    <li className="border-l border-gold/25 pl-4">
      <strong className="font-display text-lg text-starlight">{what}</strong>
      <p className="mt-1 break-keep text-guide text-starlight-dim">{children}</p>
    </li>
  );
}

export function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-gold/10 pb-2">
      <dt className="shrink-0 text-meta text-starlight-dim">{label}</dt>
      <dd className="text-right text-starlight">{value}</dd>
    </div>
  );
}

/**
 * 문답 하나 — 네이티브 details라 자바스크립트 없이 접히고, 검색엔진은 답까지
 * 그대로 읽는다. 문답을 전부 펼쳐 두면 본문 아래가 텍스트 벽이 된다는
 * 가시성 점검(2026-08-14)에서 접는 쪽으로 바꿨다.
 */
export function Faq({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <details className="group border-t border-gold/12 pt-4 first:border-t-0 first:pt-0">
      <summary className="flex cursor-pointer list-none items-baseline gap-3 [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden
          className="flex-none text-meta text-gold transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-open:rotate-90"
        >
          ›
        </span>
        <span className="break-keep font-display text-lg text-starlight">{question}</span>
      </summary>
      <div className="mt-2 pl-6 text-starlight-dim">{children}</div>
    </details>
  );
}
