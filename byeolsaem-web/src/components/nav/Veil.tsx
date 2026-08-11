"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Wordmark } from "../brand/Wordmark";
import { SEAL_CLIP_SM } from "../ui/goldStyles";

// 모바일 오버레이가 md:hidden으로 사라지는 기준(Tailwind md)과 반드시 일치해야 한다.
const DESKTOP_MEDIA_QUERY = "(min-width: 768px)";

const LINKS = [
  { href: "/today", label: "오늘의 하늘" },
  { href: "/natal", label: "천궁도" },
  { href: "/synastry", label: "궁합" },
  { href: "/blog", label: "칼럼" },
];

export function Veil() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  // 스크롤 상태: addEventListener('scroll') 대신 상단 센티넬을 관찰하는 IntersectionObserver 사용
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // 뷰포트가 데스크톱 폭(md)으로 전환되면 오버레이(md:hidden)가 사라지므로
  // open 상태와 body scroll lock도 함께 정리한다 (기기 회전/창 크기 조절 대응).
  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // 오버레이가 열려 있는 동안: Escape로 닫기 + 배경 스크롤 잠금
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <div ref={sentinel} className="absolute top-0 h-6 w-px" aria-hidden />
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-colors duration-500 ${
          scrolled
            ? "border-b border-gold/20 bg-ink-raised/75 backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" aria-label="별샘 홈" onClick={() => setOpen(false)}>
            <Wordmark size="nav" />
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-starlight-dim transition-colors hover:text-starlight"
              >
                {l.label}
              </Link>
            ))}
            {/* #hero-ritual은 HeroSequence가 "arrival" 장면을 벗어난 뒤에만 마운트되는
                id라 첫 진입 시(가장 흔한 경우) 걸어두면 클릭해도 아무 일도 안 일어나는
                깨진 링크가 된다. 항상 존재하는 히어로 섹션 자체(#hero)로 스크롤시켜
                사용자를 실제 CTA("나의 밤하늘 보기")가 보이는 위치로 되돌려보낸다. */}
            <a
              href="#hero"
              className={`bg-gold-soft px-4 py-2 text-xs font-semibold tracking-wider text-ink transition-colors hover:bg-[#f0d789] ${SEAL_CLIP_SM}`}
            >
              내 밤하늘
            </a>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="메뉴"
            aria-expanded={open}
            aria-controls="mobile-nav-overlay"
            className="relative flex size-10 flex-col items-center justify-center gap-1.5 md:hidden"
          >
            <span
              className={`h-px w-5 bg-starlight transition-transform duration-300 ${
                open ? "translate-y-[3.5px] rotate-45" : ""
              }`}
            />
            <span
              className={`h-px w-5 bg-starlight transition-transform duration-300 ${
                open ? "-translate-y-[3.5px] -rotate-45" : ""
              }`}
            />
          </button>
        </nav>
      </header>

      <div
        id="mobile-nav-overlay"
        className={`nebula-bg fixed inset-0 z-30 flex flex-col items-center justify-center gap-8 transition-opacity duration-300 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
      >
        {LINKS.map((l, i) => (
          <Link
            key={l.href}
            href={l.href}
            tabIndex={open ? 0 : -1}
            onClick={() => setOpen(false)}
            style={{ transitionDelay: open ? `${i * 60}ms` : "0ms" }}
            className={`font-display text-2xl text-starlight transition-all duration-300 ${
              open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </>
  );
}
