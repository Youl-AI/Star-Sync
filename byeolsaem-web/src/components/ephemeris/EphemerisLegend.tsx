import { PLANETS } from "@/lib/planets";
import { ZODIAC_SIGNS } from "@/lib/zodiac";

/**
 * 표 읽는 법.
 *
 * 이 상자에 담기는 넷은 성격이 다르다. 행성 기호는 사전이고, 자리 표기는
 * 규칙이고, ℞와 시각 기준은 한 줄 설명이다. 예전에는 넷을 불릿 하나에 나란히
 * 눕혀 두어서, 열 쌍짜리 사전과 한 줄짜리 설명이 같은 무게로 읽혔다.
 *
 * 그래서 천궁도 범례(ChartWheelLegend)와 같은 문법으로 바꾼다 — 왼쪽에 무엇을
 * 가리키는지, 오른쪽에 그것이 뜻하는 바. 사전 성격이므로 목록이 아니라 정의
 * 목록이다.
 *
 * 자리 표기는 짝을 열두 줄 늘어놓지 않는다. 표에 나가는 두 글자가 이름의 앞
 * 두 글자 그대로라, 이름에서 그 두 글자만 금색으로 짚으면 규칙이 곧 보기가
 * 된다(물병자리 → 물병, 물고기자리 → 물고).
 */
export function EphemerisLegend() {
  return (
    <section
      aria-labelledby="ephemeris-legend"
      className="border border-gold/15 bg-ink-raised/40 px-5 py-4 text-meta"
    >
      <h2 id="ephemeris-legend" className="font-display text-base text-starlight">
        표 읽는 법
      </h2>
      <dl className="mt-3 grid gap-x-5 gap-y-3 sm:grid-cols-[4.5rem_minmax(0,1fr)]">
        <Term>행성 기호</Term>
        <dd className="m-0 flex flex-wrap gap-x-4 gap-y-1 text-starlight-dim">
          {PLANETS.map((planet) => (
            <span key={planet.key} className="whitespace-nowrap">
              <span className="astro-symbol text-gold-soft">{planet.symbol}</span> {planet.ko}
            </span>
          ))}
        </dd>

        <Term>자리 표기</Term>
        <dd className="m-0 text-starlight-dim">
          <span className="break-keep">이름의 앞 두 글자만 적습니다.</span>
          <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {ZODIAC_SIGNS.map((sign) => (
              <span key={sign.ko} className="whitespace-nowrap">
                <span className="text-gold-soft">{sign.ko.slice(0, 2)}</span>
                {sign.ko.slice(2)}
              </span>
            ))}
          </span>
        </dd>

        <Term>
          <span className="astro-symbol">℞</span>
        </Term>
        <dd className="m-0 break-keep text-starlight-dim">
          그 날 그 행성이 역행 중이라는 뜻입니다.
        </dd>

        <Term>시각</Term>
        <dd className="m-0 break-keep text-starlight-dim">
          모든 값은 한국 시간(KST) 자정 기준입니다.
        </dd>
      </dl>
    </section>
  );
}

function Term({ children }: { children: React.ReactNode }) {
  return <dt className="font-display text-starlight">{children}</dt>;
}
