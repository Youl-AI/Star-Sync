import { pairKey } from "@/content/atoms/aspects";
import {
  NO_CONTACT,
  PLANET_TOUCH,
  resonanceBand,
  SYNASTRY_ASPECTS,
  SYNASTRY_HIGHLIGHTS,
} from "@/content/atoms/synastry";
import type { Chart } from "./chart";
import { PLANET_BY_KEY, type Planet } from "./planets";
import { synastry, type CrossAspect } from "./synastry";

/**
 * 두 하늘의 만남을 글로 조립한다.
 *
 * 조립은 결정론이다. 같은 두 사람이면 몇 번을 열어도 같은 글이 나온다.
 */

export interface SynastryLine {
  /** 금실 하나를 이 항목과 잇는 열쇠. */
  id: string;
  mine: Planet;
  theirs: Planet;
  aspectKo: string;
  aspectSymbol: string;
  orb: number;
  /** 힘이 흐르는 각도인가, 마찰이 있는 각도인가. 0은 겹침. */
  harmony: number;
  /** "자기 자신으로 서 있는 자리와 마음이 놓이는 자리" */
  meeting: string;
  headline: string;
  body: string;
  /** 이름이 붙어 있는 조합이면 그 한 줄. 없으면 null. */
  highlight: string | null;
}

export interface SynastryReading {
  /** 이름이 붙어 있는 조합이 몇 개 맺혀 있는가. 화면 앞에 세우는 숫자다. */
  named: number;
  bandLabel: string;
  bandLine: string;
  flowing: number;
  friction: number;
  overlapping: number;
  /** 잡힌 각도의 총수. 화면에 세우는 것은 그중 열 개뿐이다. */
  total: number;
  /** 가장 정확한 각도의 오차. 각도가 하나도 없으면 null. */
  tightest: number | null;
  lines: SynastryLine[];
  /** 각도가 하나도 없을 때. 있으면 목록 대신 이것을 쓴다. */
  empty: string | null;
  chips: { symbol: string; label: string }[];
}

export function crossAspectId(aspect: CrossAspect): string {
  return `thread-${aspect.mine}-${aspect.theirs}-${aspect.type.key}`;
}

/** 화면에 세울 만남의 수. 이보다 아래는 오브가 넓어 이 관계만의 특징이라 하기 어렵다. */
const SHOWN = 10;

/**
 * 앞말에 받침이 있으면 '과', 없으면 '와'.
 *
 * "자리와 방식" · "방식과 자리" — 조합이 100가지라 어느 쪽이 앞에 올지 미리 알 수
 * 없다. '와(과)'로 도망가면 읽는 사람이 매번 괄호를 건너뛰어야 한다.
 */
function wa(word: string): string {
  const code = word.charCodeAt(word.length - 1);
  const isHangul = code >= 0xac00 && code <= 0xd7a3;
  return isHangul && (code - 0xac00) % 28 !== 0 ? "과" : "와";
}

function describe(aspect: CrossAspect): SynastryLine {
  const mine = PLANET_BY_KEY[aspect.mine];
  const theirs = PLANET_BY_KEY[aspect.theirs];
  const meaning = SYNASTRY_ASPECTS[aspect.type.key];

  return {
    id: crossAspectId(aspect),
    mine,
    theirs,
    aspectKo: aspect.type.ko,
    aspectSymbol: aspect.type.symbol,
    orb: aspect.orb,
    harmony: aspect.type.harmony,
    meeting: `내 ${PLANET_TOUCH[aspect.mine]}${wa(PLANET_TOUCH[aspect.mine])} 그쪽의 ${PLANET_TOUCH[aspect.theirs]}`,
    headline: meaning.headline,
    body: meaning.body,
    highlight: SYNASTRY_HIGHLIGHTS[pairKey(aspect.mine, aspect.theirs)] ?? null,
  };
}

export function synastryReading(mine: Chart, theirs: Chart): SynastryReading {
  const result = synastry(mine, theirs);
  // 이름 붙은 조합은 하나도 자르지 않는다. 앞에 세운 숫자가 그것을 센 값이고
  // 화면이 "아래 목록에서 그대로 세어 볼 수 있다"고 말하기 때문이다. 차례가 이미
  // 이름 붙은 것부터이므로 자를 자리만 뒤로 미루면 된다.
  const lines = result.aspects.slice(0, Math.max(SHOWN, result.named)).map(describe);
  const band = resonanceBand(result.named);

  return {
    named: result.named,
    bandLabel: band.label,
    bandLine: band.line,
    flowing: result.flowing,
    friction: result.friction,
    overlapping: result.overlapping,
    total: result.aspects.length,
    tightest: result.tightest,
    lines,
    empty: result.aspects.length === 0 ? NO_CONTACT : null,
    // 칩은 목록의 앞 세 개다. 따로 고르면 칩과 목록이 서로 다른 이야기를 한다.
    chips: lines.slice(0, 3).map((line) => ({
      symbol: line.mine.symbol,
      label: `내 ${line.mine.ko} ${line.aspectKo} 그쪽 ${line.theirs.ko}`,
    })),
  };
}
