// 입력 의식의 필드들이 공유하는 형태. 상자가 아니라 한 줄 금선 위에 글씨가
// 놓이는 모양이라, 어두운 하늘 위에 UI가 얹힌 느낌을 최소로 줄인다.
// RitualForm의 텍스트 입력과 RitualCombobox의 검색 칸이 같은 줄로 보이도록
// 두 곳에서 함께 참조한다.
export const UNDERLINE_INPUT =
  "w-full border-0 border-b border-gold/60 bg-transparent px-1 py-2 text-center font-display text-2xl tracking-[0.02em] text-starlight caret-gold outline-none placeholder:text-starlight-dim/40 focus:border-gold-soft md:text-3xl";

export const SKIP_LINK =
  "text-[11px] tracking-wide text-starlight-dim underline underline-offset-4 transition-[color,transform] duration-150 hover:text-starlight active:scale-[0.97]";

export const NEXT_LINK =
  "text-xs tracking-[0.08em] text-gold-soft underline-offset-4 transition-[color,transform] duration-150 hover:text-starlight hover:underline active:scale-[0.97]";
