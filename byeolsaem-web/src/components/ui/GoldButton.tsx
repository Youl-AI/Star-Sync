import Link from "next/link";
import { GOLD_OUTLINE_CLASSES } from "./goldStyles";

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
      : GOLD_OUTLINE_CLASSES;
  const base = `inline-block rounded-full px-6 py-3 text-sm tracking-wide transition-colors active:scale-[0.98] ${cls}`;
  return href ? (
    <Link href={href} className={base}>
      {children}
    </Link>
  ) : (
    <button type="button" className={base}>{children}</button>
  );
}
