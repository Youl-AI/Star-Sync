"use client";
import { useId, useState } from "react";

/**
 * 점성술 용어에 붙이는 한 줄 정의.
 *
 * 검색으로 들어오는 사람 대부분은 이 어휘를 모른다. 그렇다고 새 창을 열면 읽던
 * 흐름이 끊기고, 본문에 괄호로 풀어 쓰면 아는 사람에게는 같은 설명이 계속
 * 걸리적거린다. 그래서 눌러야 펼쳐지는 형태로 둔다 — 모르는 사람만 한 번 열고,
 * 아는 사람은 그냥 지나간다(RENEWAL_PLAN §11.3).
 *
 * 점선 밑줄은 "눌러 볼 수 있다"는 표시다. 실선 밑줄은 이 사이트에서 링크의
 * 표시이므로 쓰지 않는다 — 눌렀는데 페이지가 바뀌지 않으면 그것도 배신이다.
 */
export function Term({ name }: { name: keyof typeof GLOSSARY }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const definition = GLOSSARY[name];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className={`border-b border-dashed pb-px transition-colors ${
          open ? "border-gold-soft text-gold-soft" : "border-gold/50 text-starlight hover:text-gold-soft"
        }`}
      >
        {name}
      </button>
      {/* 정의는 줄 사이에 끼우지 않고 아래로 내린다. 문장 가운데에 상자가 들어가면
          뒤따르는 조사가 밀려나 "상승궁 [정의] 은 남들이 처음 보는" 처럼 읽힌다.
          span에 block을 주는 것은 p·li 안에서도 유효하다. */}
      {/* 닫혀 있어도 DOM에 남는다 — 높이를 전환하려면 잴 것이 있어야 한다.
          대신 aria-hidden으로 접근성 트리에서는 빼 둔다. */}
      <span className="term-def" data-open={String(open)} aria-hidden={!open}>
        <span>
          <span
            id={id}
            className="mt-1.5 block border-l border-gold/40 pl-3 text-meta text-starlight-dim"
          >
            {definition}
          </span>
        </span>
      </span>
    </>
  );
}

/**
 * 정의는 한 문장으로 끝낸다. 두 문장이 되는 순간 본문 흐름을 끊는 분량이 되고,
 * 그럴 것이면 본문에 쓰는 편이 낫다.
 */
const GLOSSARY = {
  상승궁:
    "태어난 순간 동쪽 지평선에 막 떠오르던 별자리. 남들이 처음 보는 나의 겉모습을 말합니다.",
  하우스:
    "하늘을 열둘로 나눈 방. 별자리가 '어떻게'라면 하우스는 '어디서'입니다 — 일터인지 집인지 관계 안인지.",
  어스펙트:
    "두 별이 이루는 각도. 특정 각도에서 두 별의 작용이 서로 섞입니다.",
  오브: "정확한 각도에서 얼마나 벗어났는지. 작을수록 그 각도의 성질이 뚜렷합니다.",
  역행:
    "행성이 하늘에서 거꾸로 가는 것처럼 보이는 기간. 실제로 거꾸로 도는 것이 아니라, 지구가 안쪽 궤도에서 추월하며 생기는 착시입니다.",
  중천:
    "태어난 순간 하늘 꼭대기에 있던 지점. 사회에서 도달하려는 자리를 말합니다.",
  홀사인:
    "하우스를 나누는 방식 중 하나. 상승궁이 든 별자리 전체가 1하우스가 되고, 다음 별자리가 차례로 2, 3하우스가 됩니다.",
} as const;
