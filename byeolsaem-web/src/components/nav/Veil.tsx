"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Wordmark } from "../brand/Wordmark";
import { SEAL_CLIP_SM } from "../ui/goldStyles";
import { requestRitual } from "@/lib/ritual";

// 모바일 오버레이가 md:hidden으로 사라지는 기준(Tailwind md)과 반드시 일치해야 한다.
const DESKTOP_MEDIA_QUERY = "(min-width: 768px)";

/**
 * 실제로 존재하는 페이지만 건다.
 *
 * 여기 있던 /today · /natal · /synastry는 아직 만들어지지 않은 페이지였고,
 * 이 머리글은 사이트 전체에 붙으므로 모든 페이지가 404로 가는 링크를 세 개씩
 * 달고 다니던 셈이다. 천궁도와 궁합으로 가는 길은 메인의 "세 개의 문"이 이미
 * 맡고 있으니 잃는 것도 없다. 그 페이지들이 생기면 그때 다시 올린다.
 */
const LINKS = [
  { href: "/sign", label: "별자리" },
  { href: "/retrograde", label: "수성 역행" },
  { href: "/blog", label: "칼럼" },
  { href: "/about", label: "소개" },
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
            {/* 예전에는 #hero로 가는 앵커였다. 히어로가 있는 메인에서는 맞았지만
                /sign·/retrograde·/natal에는 그 자리가 없어 눌러도 아무 일도
                일어나지 않았다. requestRitual이 히어로가 있으면 그리로 데려가고,
                없으면 패널을 연다(RENEWAL_PLAN §11.4). */}
            <button
              type="button"
              onClick={() => requestRitual()}
              className={`bg-gold-soft px-4 py-2 text-xs font-semibold tracking-wider text-ink transition-colors hover:bg-[#f0d789] ${SEAL_CLIP_SM}`}
            >
              내 밤하늘
            </button>
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
