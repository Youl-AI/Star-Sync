"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { UNDERLINE_INPUT } from "./ritualStyles";

interface RitualComboboxProps {
  /** sr-only 레이블. 화면에는 나오지 않지만 스크린리더가 이 칸의 이름으로 읽는다. */
  label: string;
  placeholder: string;
  value: string | null;
  onSelect: (value: string) => void;
  /** 검색어를 받아 후보를 돌려준다. 별칭 처리 규칙이 목록마다 다르므로 밖에서 준다. */
  search: (query: string) => string[];
  autoFocus?: boolean;
  emptyText?: string;
}

/**
 * 검색이 되는 선택 칸.
 *
 * 브라우저 기본 `<datalist>`를 쓰지 않는 이유는 두 가지다. 하나는 목록의 생김새를
 * 전혀 손댈 수 없어 어두운 성소 분위기 위에 밝은 시스템 위젯이 그대로 떠버린다는
 * 것이고, 다른 하나는 그 목록이 입력 칸 오른쪽으로 삐져나와 붙는다는 것이다.
 * 여기서는 목록을 칸 바로 아래 중앙에 두고 색과 테두리를 토큰으로 맞춘다.
 *
 * 접근성은 WAI-ARIA의 편집 가능 combobox 패턴을 따른다. 입력 칸이 combobox이고,
 * 목록이 listbox이며, 지금 짚고 있는 항목은 포커스를 옮기는 대신
 * aria-activedescendant로 가리킨다(포커스를 옮기면 타이핑이 끊긴다).
 */
export function RitualCombobox({
  label,
  placeholder,
  value,
  onSelect,
  search,
  autoFocus = false,
  emptyText = "찾는 곳이 없어요",
}: RitualComboboxProps) {
  const inputId = useId();
  const listId = `${inputId}-list`;
  const [query, setQuery] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  /**
   * 목록이 방금 열렸는가. 스태거 진입은 열리는 순간에만 어울린다 — 글자를
   * 칠 때마다 결과가 바뀌며 재생되면 목록이 출렁인다(모션 감사 2026-08-22).
   * 열리고 잠시 뒤부터는 항목 교체를 무연출로 둔다.
   */
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!open) {
      setSettled(false);
      return;
    }
    const t = setTimeout(() => setSettled(true), 400);
    return () => clearTimeout(t);
  }, [open]);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // 목록을 이미 고른 값 그대로 두면 후보가 하나로 좁혀져, 다시 열었을 때 다른
  // 곳을 고를 수 없다. 고른 값과 검색어가 정확히 같을 때는 검색어가 없는 것으로
  // 보고 전체를 보여준다.
  const results = useMemo(
    () => search(query === value ? "" : query),
    [search, query, value]
  );

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // 짚고 있는 항목이 스크롤 영역 밖으로 나가면 따라 움직인다. 키보드만 쓰는
  // 사용자가 목록의 아래쪽 항목으로 내려갈 때 화면에서 놓치지 않게 한다.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const commit = (next: string) => {
    onSelect(next);
    setQuery(next);
    setOpen(false);
  };

  const close = () => {
    setOpen(false);
    // 고르지 않고 빠져나가면 검색어 조각이 남아 "고른 값"처럼 보인다. 마지막으로
    // 확정된 값으로 되돌린다.
    setQuery(value ?? "");
  };

  // 목록을 닫는 기준을 입력 칸의 blur로 두면 안 된다. 목록의 스크롤바를 잡아
  // 끄는 순간에도 포커스는 입력 칸에서 빠져나가므로, 드래그를 시작하자마자
  // 목록이 사라져 스크롤이 불가능해진다. 그래서 blur 대신 "이 컴포넌트 바깥을
  // 눌렀는가"로 판단한다. 키보드로 빠져나가는 경우(Tab)와 Escape는 아래
  // handleKeyDown이 따로 처리한다.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
    // close는 value에만 의존하며, value가 바뀌면 새 리스너로 교체된다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(0);
        return;
      }
      if (results.length === 0) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((i) => (i + step + results.length) % results.length);
      return;
    }

    if (e.key === "Home" && open) {
      e.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (e.key === "End" && open) {
      e.preventDefault();
      setActiveIndex(Math.max(0, results.length - 1));
      return;
    }

    if (e.key === "Enter") {
      // 목록에서 무언가를 짚고 있는 동안의 Enter는 "이 항목을 고른다"는 뜻이므로
      // 폼 제출로 새어나가지 않게 막는다. 목록이 닫혀 있으면 막지 않고 흘려보내
      // 바깥 폼이 다음 단계로 넘어가게 둔다.
      if (open && results.length > 0) {
        e.preventDefault();
        commit(results[activeIndex]);
      }
      return;
    }

    if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        close();
      }
      return;
    }

    // Tab은 막지 않는다. 포커스는 다음 칸으로 넘어가되 목록만 접는다.
    if (e.key === "Tab" && open) close();
  };

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && results.length > 0 ? `${listId}-${activeIndex}` : undefined
        }
        autoComplete="off"
        enterKeyHint="next"
        placeholder={placeholder}
        className={UNDERLINE_INPUT}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActiveIndex(0);
        }}
        onFocus={() => setOpen(true)}
        // 항목을 고른 뒤에도 포커스는 이 칸에 남아 있다. 그래서 다시 누를 때는
        // focus 이벤트가 오지 않으므로 click으로도 열어줘야 한다.
        onClick={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label}
          // Lenis가 휠 이벤트를 가로채 문서 스크롤로 돌려버리기 때문에, 이 표시가
          // 없으면 목록 위에 마우스를 올리고 굴려도 목록은 그대로이고 페이지가
          // 내려간다. 이 안에서는 브라우저 기본 스크롤을 그대로 쓰게 한다.
          data-lenis-prevent
          // 칸 바로 아래 같은 너비로 붙는다. 목록이 뜬 동안 아래 내용이 밀리지
          // 않도록 absolute로 띄우고, 별하늘 위에서도 글씨가 읽히도록 배경을
          // 거의 불투명하게 깐다.
          //
          // 사방을 두른 테두리 대신 위쪽 금선 하나만 남긴다. 입력 칸의 밑줄이
          // 그대로 이어져 "선이 열리며 목록이 흘러나오는" 모양이 되고, 상자
          // 하나가 새로 얹힌 느낌을 주지 않는다.
          className={`${settled ? "list-settled " : ""}thin-scroll absolute inset-x-0 top-full z-20 max-h-56 overflow-y-auto border-t border-gold/45 bg-ink/95 py-1 text-center shadow-[0_22px_44px_-26px_rgba(0,0,0,0.95)] backdrop-blur-md motion-safe:animate-list-open`}
        >
          {results.length === 0 && (
            <li className="px-4 py-3 text-center text-meta text-starlight-dim">{emptyText}</li>
          )}
          {results.map((option, i) => (
            <li
              key={option}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={option === value}
              // 항목을 누르는 순간 입력 칸이 blur되면 다음 칸으로 넘어갈 때 포커스
              // 맥락이 끊긴다. 기본 동작을 막아 포커스를 붙잡아 두고 click에서
              // 확정한다. 스크롤바는 항목이 아니라 목록 자체에서 눌리므로 이
              // 처리에 걸리지 않고, 브라우저 기본 드래그가 그대로 동작한다.
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => commit(option)}
              // 항목이 차례로 따라 들어온다. 지연을 상한 없이 index에 비례시키면
              // 31개짜리 목록(경기도)의 마지막 항목이 반 초 넘게 비어 있게 되므로
              // 상한을 둔다. 어차피 화면에 한 번에 보이는 것은 예닐곱 개다.
              style={{ animationDelay: `${Math.min(i * 18, 150)}ms` }}
              className={`relative cursor-pointer px-4 py-2 text-sm transition-colors motion-safe:animate-list-item-in ${
                i === activeIndex ? "text-starlight" : "text-starlight-dim"
              }`}
            >
              {option}
              {/* 지금 짚고 있는 항목 아래 짧은 금선. 글자가 가운데 정렬이라
                  왼쪽 표식은 축이 어긋나 보이고, 배경색 변화만으로는 어두운
                  화면에서 구분이 약하다. 선 하나가 두 문제를 함께 푼다. */}
              <span
                aria-hidden
                className={`absolute inset-x-0 bottom-1 mx-auto h-px w-8 transition-opacity ${
                  i === activeIndex ? "bg-gold/70 opacity-100" : "opacity-0"
                }`}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
