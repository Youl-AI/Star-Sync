import Link from "next/link";

export function GoldButton({
  variant = "solid",
  href,
  children,
}: {
  variant?: "solid" | "outline";
  href?: string;
  children: React.ReactNode;
}) {
  const cls =
    variant === "solid"
      ? "bg-gold text-ink font-bold hover:bg-gold-soft"
      : "border border-gold/60 text-gold-soft hover:border-gold";
  const base = `inline-block rounded-full px-6 py-3 text-sm tracking-wide transition-colors active:scale-[0.98] ${cls}`;
  return href ? (
    <Link href={href} className={base}>
      {children}
    </Link>
  ) : (
    <button className={base}>{children}</button>
  );
}
