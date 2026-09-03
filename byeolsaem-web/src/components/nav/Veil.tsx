"use client";
import { useEffect, useRef, useState } from "react";
import { Link } from "@/components/ui/Link";
import type { NavAmbient } from "@/lib/nav-ambient";
import { Wordmark } from "../brand/Wordmark";
import { AmbientLine } from "./AmbientLine";
import { BirthMenu } from "./BirthMenu";
import { DIRECT_LINKS, NAV_GROUPS, NAV_NEW } from "./nav-map";

const DAY_MS = 86400000;

/**
 * 머리글. 헤더에는 직통 셋(오늘·천궁도·궁합)만 두고, 나머지는 전부 전체화면
 * 오버레이 하나로 모은다(2026-08-23 IA 개편).
 *
 * 이전에는 데스크톱 인라인 목록과 모바일 오버레이가 서로 다른 목록·다른
 * 마크업을 썼다. 그래서 페이지가 늘 때마다 두 곳을 같이 고쳐야 했고, 실제로
 * /natal·/synastry·/today가 한쪽에서만 빠진 채 방치된 적이 있었다. 오버레이를
 * 전 해상도 공용으로 만들면 그 목록은 nav-map.ts 하나뿐이다.
 */
export function Veil({ ambient }: { ambient: NavAmbient }) {
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
        <nav aria-label="주요 메뉴" className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" aria-label="별샘 홈" onClick={() => setOpen(false)}>
            <Wordmark size="nav" />
          </Link>

          <div className="flex items-center gap-6">
            {/* 직통 셋. 나머지 전부는 오버레이 안 nav-map 그룹에 있다. */}
            <div className="flex items-center gap-5 max-md:hidden lg:gap-7">
              {DIRECT_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm text-starlight-dim transition-colors hover:text-starlight"
                >
                  {l.label}
                </Link>
              ))}
              {/* 저장된 정보가 있으면 여기가 메뉴가 된다(BirthMenu 주석 참고). */}
              <BirthMenu variant="nav" />
            </div>

            {/* 오버레이는 이제 전 해상도 공용이라 이 버튼도 md:hidden이 아니다. */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "닫기" : "메뉴"}
              aria-expanded={open}
              aria-controls="fullscreen-nav"
              className="flex items-center gap-2 text-sm text-starlight-dim transition-colors hover:text-starlight"
            >
              <span className="relative flex size-5 flex-col items-center justify-center gap-1.5">
                <span
                  className={`h-px w-5 bg-current transition-transform duration-300 ${
                    open ? "translate-y-[3.5px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`h-px w-5 bg-current transition-transform duration-300 ${
                    open ? "-translate-y-[3.5px] -rotate-45" : ""
                  }`}
                />
              </span>
              {open ? "닫기" : "메뉴"}
            </button>
          </div>
        </nav>
      </header>

      <div
        id="fullscreen-nav"
        inert={!open}
        aria-hidden={!open}
        className={`nebula-bg fixed inset-0 z-30 flex flex-col transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="h-16 flex-none" /> {/* 헤더 높이만큼 비운다 — 헤더는 위에 그대로 떠 있다 */}
        {/* items-center 금지 — 내용이 화면보다 길면 위쪽이 잘려 스크롤로도 못 닿는다.
            자식의 m-auto는 공간이 남을 때만 가운데로 오고, 넘치면 0으로 접힌다. */}
        <div className="flex flex-1 justify-center overflow-y-auto px-6 py-8">
          <div className="m-auto grid w-full max-w-4xl gap-10 md:grid-cols-3 md:gap-14">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="border-b border-gold/20 pb-2.5 text-meta tracking-[0.28em] text-gold-soft">
                  {group.label}
                </p>
                {group.links.map((link, i) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    tabIndex={open ? 0 : -1}
                    onClick={() => setOpen(false)}
                    style={{ transitionDelay: open ? `${60 + i * 60}ms` : "0ms" }}
                    className={`group mt-5 block transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:translate-y-0 ${
                      open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                    }`}
                  >
                    <span className="font-display text-xl text-starlight transition-colors group-hover:text-gold-soft">
                      {link.label}
                      {NAV_NEW.includes(link.href) && (
                        <span aria-hidden className="ml-1.5 align-super text-[0.55em] text-gold">●</span>
                      )}
                      {link.href === "/retrograde" && <RetroBadge retro={ambient.retro} />}
                    </span>
                    <span className="mt-0.5 block break-keep text-meta text-starlight-dim">{link.desc}</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex-none pb-7">
          <AmbientLine ambient={ambient} />
          <div className="mt-4 flex justify-center md:hidden">
            <BirthMenu variant="sheet" onNavigate={() => setOpen(false)} />
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * "역행" 링크 옆의 작은 배지 — 지금 역행 중이면 "역행 중", 아니면 가장 가까운
 * 시작까지 D-n. AmbientLine과 같은 계산이라 헬퍼를 nav-map이 아닌 여기 내부
 * 함수로 둔다(둘 다 이 파일 트리 안에서만 쓰인다).
 *
 * 서버 HTML은 오버레이가 항상 닫혀 있어 이 배지도 그려지지 않는다 — 그래서
 * AmbientLine과 같은 이유로, "지금"은 마운트 후에만 잰다(SSR 불일치 없음).
 */
function RetroBadge({ retro }: { retro: NavAmbient["retro"] }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  if (!now) return null;

  const t = now.getTime();
  const active = retro.find((r) => Date.parse(r.start) <= t && t < Date.parse(r.end));
  if (active) {
    return (
      <span className="ml-2 border border-gold/25 px-1.5 py-0.5 align-middle font-sans text-[0.6rem] tracking-[0.08em] text-gold">
        역행 중
      </span>
    );
  }

  const upcoming = retro
    .filter((r) => Date.parse(r.start) > t)
    .sort((a, b) => a.start.localeCompare(b.start))[0];
  if (!upcoming) return null;

  const dday = Math.ceil((Date.parse(upcoming.start) - t) / DAY_MS);
  return (
    <span className="ml-2 border border-gold/25 px-1.5 py-0.5 align-middle font-sans text-[0.6rem] tracking-[0.08em] text-gold">
      {`D-${dday}`}
    </span>
  );
}
