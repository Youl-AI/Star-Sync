import { LineDiamond } from "./LineDiamond";

export function ArchCard({
  name,
  latin,
  tagline,
  width = 212,
  children,
}: {
  name: string;
  latin: string;
  tagline: string;
  width?: number;
  children?: React.ReactNode;
}) {
  const h = width * 1.5,
    r = width / 2;
  return (
    <div
      style={{ width, height: h, borderRadius: `${r}px ${r}px 10px 10px` }}
      className="border border-gold/30 bg-gold/5 p-[7px]"
    >
      <div
        style={{
          borderRadius: `${r - 7}px ${r - 7}px 6px 6px`,
          boxShadow: `0 0 44px 6px color-mix(in srgb, var(--color-gold) 12%, transparent), inset 0 1px 0 color-mix(in srgb, var(--color-starlight) 7%, transparent)`,
        }}
        className="relative h-full overflow-hidden border border-gold/60 bg-gradient-to-b from-nebula/90 to-ink"
      >
        <svg viewBox="0 0 14 14" className="absolute left-1/2 top-2.5 size-3 -translate-x-1/2" aria-hidden>
          <path d="M7 .5 8 4.6l4.5.6L9 8l1 4.5L7 9.9 4 12.5 5 8 1.5 5.2l4.5-.6Z" fill="var(--color-gold-soft)" />
        </svg>
        <div className="pt-8">{children}</div>
        <div className="absolute inset-x-0 bottom-0 px-4 pb-4 text-center">
          <div className="font-display text-xl tracking-wide">{name}</div>
          <div className="mt-1 text-[9px] uppercase tracking-[0.32em] text-starlight-dim">{latin}</div>
          <LineDiamond className="my-2.5" />
          <div className="text-[11px] italic text-gold-soft">{tagline}</div>
        </div>
      </div>
    </div>
  );
}
