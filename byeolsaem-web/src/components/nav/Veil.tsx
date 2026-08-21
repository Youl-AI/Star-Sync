"use client";
import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Wordmark } from "../brand/Wordmark";
import { BirthMenu } from "./BirthMenu";

// 모바일 오버레이가 md:hidden으로 사라지는 기준(Tailwind md)과 반드시 일치해야 한다.
const DESKTOP_MEDIA_QUERY = "(min-width: 768px)";

/**
 * 머리글의 길. 성격이 다른 두 무리로 나눈다.
 *
 *   도구  — 내 출생 정보가 있어야 말이 되는 곳
 *   읽을거리 — 누가 보든 같은 것이 나오는 곳
 *
 * 전에는 여기서 /natal·/synastry·/today가 빠져 있었다. 만들어지지 않은
 * 페이지였던 시절의 흔적인데, 그 사이 셋 다 생겼고 색인까지 열었다. 그래서
 * 구글에서 "천궁도"로 들어온 사람이 궁합이 있다는 것조차 알 길이 없었다 —
 * 유일한 통로가 메인의 세로 여정을 스크롤해 세 개의 문까지 내려가는 것이었다.
 *
 * 라벨은 줄인다. 페이지 안의 제목은 "오늘의 하늘"·"한 해의 하늘" 그대로 두되
 * 여기서는 "오늘"·"한 해"로 적는다 — 일곱 개가 한 줄에 서려면 글자가 짧아야
 * 하고, 문맥이 있는 자리에서는 짧은 쪽이 오히려 빨리 읽힌다.
 *
 * 소개는 뺐다. 바닥글에 이미 있어서 두 번 걸 이유가 없다.
 */
const TOOLS = [
  { href: "/natal", label: "천궁도" },
  { href: "/today", label: "오늘" },
  { href: "/yearly", label: "한 해" },
  { href: "/synastry", label: "궁합" },
];

const READS = [
  { href: "/sign", label: "별자리" },
  { href: "/retrograde", label: "수성 역행" },
  { href: "/blog", label: "칼럼" },
];

const LINKS = [...TOOLS, ...READS];

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

          <div className="hidden items-center gap-5 md:flex lg:gap-7">
            {TOOLS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-starlight-dim transition-colors hover:text-starlight"
              >
                {l.label}
              </Link>
            ))}
            {/* 두 무리를 가르는 금선. 일곱이 평평하게 늘어서면 무엇이 도구이고
                무엇이 읽을거리인지 구분이 사라진다. */}
            <span aria-hidden className="h-3.5 w-px bg-gold/25" />
            {READS.map((l) => (
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
            {/* 저장된 정보가 있으면 여기가 메뉴가 된다(BirthMenu 주석 참고). */}
            <BirthMenu variant="nav" />
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
          <Fragment key={l.href}>
            <Link
              href={l.href}
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
              style={{ transitionDelay: open ? `${i * 60}ms` : "0ms" }}
              className={`font-display text-2xl text-starlight transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:translate-y-0 ${
                open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
              }`}
            >
              {l.label}
            </Link>
            {/* 도구와 읽을거리 사이. 데스크톱의 금선과 같은 자리를 세로로 옮긴 것이다. */}
            {i === TOOLS.length - 1 && (
              <span aria-hidden className="h-px w-10 bg-gold/25" />
            )}
          </Fragment>
        ))}
        {/* 데스크톱의 금색 인장은 md:flex 안에 있어 모바일에서는 보이지 않았다.
            그래서 휴대폰으로 온 사람에게는 저장된 정보를 지울 길이 아예 없었다. */}
        <div
          style={{ transitionDelay: open ? `${LINKS.length * 60}ms` : "0ms" }}
          className={`mt-2 border-t border-gold/15 pt-8 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:translate-y-0 ${
            open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          <BirthMenu variant="sheet" onNavigate={() => setOpen(false)} />
        </div>
      </div>
    </>
  );
}
