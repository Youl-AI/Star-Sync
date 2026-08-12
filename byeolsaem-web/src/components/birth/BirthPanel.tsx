"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { RitualForm, type RitualData } from "@/components/hero/RitualForm";
import { saveBirthProfile } from "@/lib/birth-profile";
import { OPEN_BIRTH_PANEL_EVENT, type BirthPanelRequest } from "@/lib/ritual";

/**
 * 출생 정보를 받는 패널. 사이트 어디서든 열린다.
 *
 * 왜 필요한가. 입력 의식은 메인 히어로 안에만 있었다. 그래서 `/natal`에서 정보가
 * 없으면 "메인으로 가세요"라고 링크를 걸어 돌려보냈다 — 보던 것이 사라지고,
 * 정보를 넣은 뒤 다시 찾아와야 했다. `/today`·`/yearly`·`/synastry`도 같은 정보를
 * 쓰므로 같은 일이 네 번 일어난다(RENEWAL_PLAN §11.4).
 *
 * 메인 히어로의 의식은 그대로 둔다. 처음 오는 사람에게는 그 3장면 연출이 이 사이트의
 * 첫인상이다. 이 패널은 **이미 사이트 안에 들어와 있는 사람**을 위한 것이다.
 *
 * 폼은 히어로가 쓰는 것과 같은 `RitualForm`이다. 두 벌로 나누면 검증이 어긋나는
 * 순간부터 어느 쪽이 맞는지 알 수 없게 된다.
 */
export function BirthPanel() {
  const [request, setRequest] = useState<BirthPanelRequest | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  /** 뒤로가기로 닫으려고 밀어 넣은 히스토리 항목이 아직 남아 있는지. */
  const pushedRef = useRef(false);
  const open = request !== null;

  const close = useCallback((fromPopstate = false) => {
    setRequest(null);
    // 뒤로가기로 닫힌 경우에는 브라우저가 이미 항목을 뺐다. 여기서 또 back()을
    // 부르면 한 칸을 더 물러나 사이트를 떠난다.
    if (pushedRef.current && !fromPopstate) history.back();
    pushedRef.current = false;
  }, []);

  useEffect(() => {
    const onOpen = (event: Event) => {
      openerRef.current = document.activeElement as HTMLElement | null;
      setRequest((event as CustomEvent<BirthPanelRequest>).detail ?? {});
    };
    window.addEventListener(OPEN_BIRTH_PANEL_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_BIRTH_PANEL_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;

    // 뒤로가기로 닫히게 한다. 모바일에서 이것이 없으면 패널을 연 사람이 뒤로가기를
    // 눌렀을 때 사이트를 통째로 떠난다 — 패널에서 가장 흔한 실수다.
    history.pushState({ byeolsaemPanel: true }, "");
    pushedRef.current = true;
    const onPopState = () => close(true);
    window.addEventListener("popstate", onPopState);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      // 포커스 가둠. 패널 밖으로 나가면 뒤 페이지를 조작하게 되는데, 화면은
      // 패널만 보이므로 어디를 누르고 있는지 알 수 없다.
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const visible = [...focusable].filter((el) => el.offsetParent !== null);
      if (!visible.length) return;
      const first = visible[0];
      const last = visible[visible.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  // 닫을 때 열었던 자리로 포커스를 되돌린다. 그러지 않으면 포커스가 body로 새서
  // 키보드로 쓰던 사람은 방금까지 있던 자리를 잃는다.
  useEffect(() => {
    if (open) return;
    const opener = openerRef.current;
    openerRef.current = null;
    if (opener?.isConnected) opener.focus();
  }, [open]);

  if (!open) return null;

  const title = request.title ?? "내 밤하늘 열기";
  const kicker = request.kicker ?? "YOUR SKY";

  const complete = (data: RitualData) => {
    if (request.onComplete) request.onComplete(data);
    // 관심사를 묻지 않은 폼은 내 프로필이 될 수 없다. 그런 요청은 언제나
    // onComplete와 함께 오므로 이 갈래로 오지 않지만, 조용히 깨진 프로필을
    // 저장하는 것보다 아무것도 하지 않는 편이 낫다.
    else if (data.concern !== null) saveBirthProfile({ ...data, concern: data.concern });
    close();
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/85 p-6 backdrop-blur-md motion-safe:animate-panel-in"
      // 이 층이 화면 전체를 덮으므로 그 아래에 따로 스크림을 깔아 봐야 클릭이
      // 닿지 않는다. 격자의 빈 칸(= 카드 바깥)을 눌렀는지 여기서 직접 가린다.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="birth-panel-title"
        className="relative w-full max-w-lg border border-gold/35 bg-ink-raised px-8 pb-10 pt-14 text-center shadow-[0_30px_90px_rgba(0,0,0,.6)] md:px-12"
      >
        <button
          type="button"
          onClick={() => close()}
          aria-label="닫기"
          className="absolute right-4 top-4 grid size-10 place-items-center rounded-full border border-gold/50 text-gold-soft transition-colors hover:border-gold hover:text-starlight"
        >
          <span aria-hidden>✕</span>
        </button>

        <p className="font-latin text-eyebrow tracking-[0.26em] text-gold">{kicker}</p>
        <h2 id="birth-panel-title" className="mt-3 break-keep font-display text-2xl text-starlight">
          {title}
        </h2>
        {request.description && (
          <p className="mx-auto mt-3 max-w-sm break-keep text-meta text-starlight-dim">
            {request.description}
          </p>
        )}

        <div className="mt-9">
          <RitualForm onComplete={complete} askConcern={request.askConcern ?? true} />
        </div>
      </div>
    </div>
  );
}
