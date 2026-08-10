"use client";

export function TalismanChip({
  symbol,
  label,
  theme = "night",
  onClick,
}: {
  symbol: string;
  label: string;
  theme?: "night" | "dawn";
  onClick?: () => void;
}) {
  const cls =
    theme === "night"
      ? "border-gold/50 text-gold-soft"
      : "border-gold-dark/50 text-gold-dark bg-gold-dark/5";
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs tracking-wide transition-transform active:scale-[0.98] ${cls}`}
    >
      <span className="astro-symbol" aria-hidden>
        {symbol}
        {"︎"}
      </span>
      <span>{label}</span>
    </button>
  );
}
