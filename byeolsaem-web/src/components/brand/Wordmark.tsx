function Star({ className, fill }: { className?: string; fill: string }) {
  return (
    <svg viewBox="0 0 14 14" className={className} aria-hidden>
      <path d="M7 .5 8 4.6l4.5.6L9 8l1 4.5L7 9.9 4 12.5 5 8 1.5 5.2l4.5-.6Z" fill={fill} />
    </svg>
  );
}

/**
 * 별샘 워드마크. 획 사이에 별 하나가 떨어져 앉는다.
 *
 * tone은 놓이는 세계를 따른다. 밤에서는 옅은 금(`--gold-soft`)이 어두운 배경
 * 위에서 빛나지만, 새벽의 미색 종이 위에서는 같은 색이 흐려져 읽히지 않는다.
 * 그래서 새벽에서는 밝은 바탕용으로 어둡게 조정한 같은 계열(`--gold-dark`)을
 * 쓴다(스펙 §1.2).
 */
export function Wordmark({
  size = "nav",
  tone = "night",
}: {
  size?: "nav" | "hero";
  tone?: "night" | "dawn";
}) {
  const starFill = tone === "dawn" ? "var(--color-gold-dark)" : "var(--color-gold-soft)";

  const mark = (
    <span className={`font-display relative inline-block tracking-[0.1em] ${size === "hero" ? "text-5xl" : "text-xl"}`}>
      별샘
      <Star
        fill={starFill}
        className={size === "hero" ? "absolute -top-0.5 right-7 size-3.5" : "absolute top-0 right-3 size-2"}
      />
    </span>
  );
  if (size === "nav") return mark;
  return (
    <span className="inline-flex flex-col items-center">
      {mark}
      <svg viewBox="0 0 120 10" className="mt-0.5 h-2 w-28" aria-hidden>
        <path d="M4 5Q20 2 36 5T68 5T100 5T116 5" fill="none" stroke="var(--color-gold)" strokeOpacity=".55" strokeWidth=".8" />
      </svg>
      <span className="font-display -mt-1 scale-y-[-1] bg-gradient-to-t from-starlight to-transparent bg-clip-text text-5xl tracking-[0.1em] text-transparent opacity-10 blur-[0.6px]" aria-hidden>
        별샘
      </span>
    </span>
  );
}
