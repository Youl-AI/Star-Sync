import Link from "next/link";
import { SEAL_CLIP } from "./goldStyles";

type GoldButtonProps = {
  variant?: "solid" | "outline";
  children: React.ReactNode;
} & (
  | { href: string; onClick?: never }
  | { href?: never; onClick?: () => void }
);

// 주 버튼 "각인": 모서리 두 곳을 비스듬히 벤 금색 인장. 보조 버튼 "별 사이":
// 명조 글자 링크 — 밑줄 앞부분만 금색이었다가 호버에 전체가 차오르고 화살표가
// 나아간다. 알약(rounded-full) 형태는 AI 산출물의 전형이라 버렸다(디자인
// 실험실 라운드에서 사용자 확정).
const SEAL =
  "inline-block bg-gold-soft px-7 py-3 text-sm font-semibold tracking-wide text-ink " +
  "transition-[background-color,transform] duration-300 hover:bg-[#f0d789] " +
  "hover:-translate-y-px active:translate-y-0 " +
  SEAL_CLIP;

const WORD_LINK =
  "group relative inline-block pb-1.5 font-display text-sm tracking-[0.12em] text-starlight " +
  "after:absolute after:bottom-0 after:left-0 after:h-px after:w-full " +
  "after:bg-[linear-gradient(90deg,var(--color-gold)_0_28%,color-mix(in_srgb,var(--color-gold)_22%,transparent)_28%)] " +
  "hover:after:bg-gold-soft";

export function GoldButton({
  variant = "solid",
  href,
  onClick,
  children,
}: GoldButtonProps) {
  const base = variant === "solid" ? SEAL : WORD_LINK;
  const content = (
    <>
      {children}
      {variant === "outline" && (
        <span
          aria-hidden
          className="ml-2.5 inline-block text-gold-soft transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1.5"
        >
          →
        </span>
      )}
    </>
  );
  return href ? (
    <Link href={href} className={base}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={base}>
      {content}
    </button>
  );
}
