export function LineDiamond({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`} aria-hidden>
      <span className="h-px w-6 bg-gold/50" />
      <span className="size-[3px] rotate-45 bg-gold-soft/70" />
      <span className="h-px w-6 bg-gold/50" />
    </div>
  );
}
