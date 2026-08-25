import { SignGlyph } from "@/components/sign/SignGlyph";
import { ART_WIDTH, CARD_WIDTH } from "@/components/sign/signMorph";
import { SIGN_SYMBOL, type ZodiacSign } from "@/lib/zodiac";
import { LineDiamond } from "./LineDiamond";

/**
 * 기본 카드 폭.
 *
 * 212였다. 그때는 아치 안이 비어 있어서 좁아도 티가 나지 않았는데, 성좌가
 * 들어오자 아래 글 덩어리(이름·라틴·기간·별칭)와 부딪혔다. 글의 높이는 타이포
 * 등급이 정하므로 카드가 작아져도 줄지 않는다 — 좁은 카드일수록 그림이 설 자리가
 * 사라진다는 뜻이다. 그래서 폭을 늘려 그림 쪽에 여유를 돌려준다.
 */
const DEFAULT_WIDTH = 240;

/**
 * 부적 카드. 위는 아치, 아래는 이름과 표기가 앉는 자리다.
 *
 * 카드 안에 무엇이 들어가는지는 스펙 §4가 정해 두었다 — 성좌, 이름, 영문과 날짜,
 * 선-다이아-선, 이탤릭 별칭. 자식을 부르는 쪽이 채우게 두었더니 실제로 두 곳
 * (히어로 결과 카드, ResultPreview)에서 성좌가 빠진 채 위쪽이 비어 나갔다.
 * 별자리 카드는 아래 SignArchCard로만 만든다 — 성좌가 기본으로 들어간다.
 *
 * 이쪽은 별자리가 아닌 카드(달의 위상 등)를 위한 일반형으로 남긴다.
 */
export function ArchCard({
  name,
  latin,
  tagline,
  /** 라틴 표기 아래 한 줄. `9. 23 - 10. 23`처럼. 없으면 줄 자체가 없다. */
  range,
  /** 선-다이아-선의 다이아 자리에 앉는 글리프(♌, ☽ 등). 없으면 다이아. */
  symbol,
  width = DEFAULT_WIDTH,
  children,
}: {
  name: string;
  latin: string;
  tagline: string;
  range?: string;
  symbol?: string;
  width?: number;
  children?: React.ReactNode;
}) {
  const h = width * 1.5,
    r = width / 2;
  return (
    <div
      style={{ width, height: h, borderRadius: `${r}px ${r}px 10px 10px` }}
      className="border border-gold/30 bg-gold/5 p-[7px]"
    >
      <div
        style={{
          borderRadius: `${r - 7}px ${r - 7}px 6px 6px`,
          boxShadow: `0 0 44px 6px color-mix(in srgb, var(--color-gold) 12%, transparent), inset 0 1px 0 color-mix(in srgb, var(--color-starlight) 7%, transparent)`,
        }}
        className="relative h-full overflow-hidden border border-gold/60 bg-gradient-to-b from-nebula/90 to-ink"
      >
        <svg viewBox="0 0 14 14" className="absolute left-1/2 top-2.5 size-3 -translate-x-1/2" aria-hidden>
          <path d="M7 .5 8 4.6l4.5.6L9 8l1 4.5L7 9.9 4 12.5 5 8 1.5 5.2l4.5-.6Z" fill="var(--color-gold-soft)" />
        </svg>
        {/* pt-8은 /sign의 모프가 성좌의 착지 좌표를 계산할 때 쓰는 값이다
            (signMorph.ts의 ART_OFFSET_Y). 바꾸면 착지 순간 그림이 튄다.
            data-morph-art: 진의 오버레이가 이 카드를 유령으로 그릴 때 성좌만
            숨기는 표식 — 성좌는 날아오는 복제가 대신 그린다(Astrolabe 참고). */}
        <div className="pt-8" data-morph-art>
          {children}
        </div>
        <div className="absolute inset-x-0 bottom-0 px-4 pb-4 text-center">
          <div className="font-display text-xl tracking-wide">{name}</div>
          <div className="mt-1.5 font-latin text-eyebrow uppercase tracking-[0.28em] text-starlight-dim">
            {latin}
          </div>
          {range && (
            <div className="mt-1 font-latin text-eyebrow tracking-[0.16em] text-gold/80">{range}</div>
          )}
          <LineDiamond className="my-2.5" symbol={symbol} />
          <div className="text-meta italic text-gold-soft">{tagline}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * 별자리 카드. 히어로 결과, `/sign/<별자리>`, 미리보기가 모두 이것을 쓴다.
 *
 * 성좌 폭은 카드 폭에 비례한다. `width`가 CARD_WIDTH일 때 정확히 ART_WIDTH가
 * 나오도록 맞춰 두었다 — /sign의 진에서 날아온 그림이 여기 앉을 때 크기가
 * 어긋나면 착지 순간 카드가 튀기 때문이다.
 */
export function SignArchCard({
  sign,
  width = DEFAULT_WIDTH,
  glyphRef,
}: {
  sign: ZodiacSign;
  width?: number;
  /** 모프가 이 그림의 화면 좌표를 재야 하는 경우에만. */
  glyphRef?: React.Ref<SVGSVGElement>;
}) {
  return (
    <ArchCard
      name={sign.card}
      latin={sign.latin}
      tagline={sign.tagline}
      range={sign.range}
      symbol={SIGN_SYMBOL[sign.key]}
      width={width}
    >
      <SignGlyph
        ref={glyphRef}
        sign={sign}
        lit
        className="mx-auto mt-3"
        style={{ width: Math.round(width * (ART_WIDTH / CARD_WIDTH)) }}
      />
    </ArchCard>
  );
}
